const express = require('express');
const router = express.Router();
const pool = require('../../config/db');
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');

/**
 * @swagger
 * /api/admin/wallet/users/{id}/wallet:
 *   get:
 *     summary: View user's wallet (Admin only)
 *     tags: [Admin Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User wallet details
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */


router.get('/users/:id/wallet', auth, roleCheck('admin'), async (req, res) => {
    try {
        const { id: userId } = req.params;

        const [users] = await pool.query(
            `SELECT user_id, email, first_name, last_name, phone, wallet_balance, wallet_frozen
             FROM users
             WHERE user_id = ?`,
             [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = users[0];

        const [transactions] = await pool.query(
            `SELECT txn_id, amount, type, reason, adjusted_by, ref, created_at
             FROM wallet_transactions
             WHERE user_id = ?
             ORDER BY created_at DESC
             LIMIT 50`,
             [userId]
        );

        return res.status(200).json({
            success: true,
                user: {
                   user_id: user.user_id,
                   email: user.email,
                   name: `${user.first_name} ${user.last_name}`,
                   phone: user.phone,
                   wallet_balance: user.wallet_balance,
                   wallet_frozen: user.wallet_frozen
                },
                transactions: transactions,
                transaction_count: transactions.length
        });
    } catch (error) {
        console.error('Get user wallet error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch wallet details',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/admin/wallet/transactions/{txnId}:
 *   get:
 *     summary: Get transaction details by ID (Admin only)
 *     tags: [Admin Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: txnId
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction details
 *       403:
 *         description: Access denied
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Server error
 */
router.get('/transactions/:txnId', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { txnId } = req.params;

    const [txns] = await pool.query(
      `SELECT wt.txn_id, wt.user_id, u.email, u.first_name, u.last_name,
              wt.amount, wt.type, wt.reason, wt.ref, 
              wt.adjusted_by, wt.created_at
       FROM wallet_transactions wt
       JOIN users u ON wt.user_id = u.user_id
       WHERE wt.txn_id = ?`,
      [txnId]
    );

    if (txns.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Transaction not found' 
      });
    }

    const txn = txns[0];

    let adjustedByUser = null;
    if (txn.adjusted_by) {
        const [adminRows] = await pool.query(
            'SELECT first_name, last_name FROM users WHERE user_id = ?',
            [txn.adjusted_by]
        );
        if (adminRows.length > 0) {
            adjustedByUser = `${adminRows[0].first_name} ${adminRows[0].last_name}`;
        }
    }

    return res.status(200).json({
      success: true,
      data: {
        txn_id: txn.txn_id,
        user: {
          user_id: txn.user_id,
          email: txn.email,
          name: `${txn.first_name} ${txn.last_name}`
        },
        amount: txn.amount,
        type: txn.type,
        reason: txn.reason,
        ref: txn.ref,
        adjusted_by_user: adjustedByUser,
        created_at: txn.created_at
      }
    });
 } catch (error) {
    console.error('Get transaction error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch transaction',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/admin/wallet/users/{userId}/wallet/adjust:
 *   post:
 *     summary: Adjust user's wallet balance (Admin only)
 *     tags: [Admin Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, reason]
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount to adjust (positive/negative)
 *               reason:
 *                 type: string
 *                 description: Reason for adjustment
 *     responses:
 *       200:
 *         description: Wallet adjusted successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/users/:userId/wallet/adjust', auth, roleCheck('admin'), async (req, res) => {
  const { amount, reason } = req.body;
  const { userId } = req.params;
  const adminId = req.user.user_id;  // ← admin ที่ปรับ (ตัวเอง)

  // Validate input
  if (!amount || !reason) {
    return res.status(400).json({
      success: false,
      message: 'amount and reason are required'
    });
  }

  if (typeof amount !== 'number' || amount === 0) {
    return res.status(400).json({
      success: false,
      message: 'amount must be a non-zero number'
    });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [users] = await conn.query(
      'SELECT wallet_balance FROM users WHERE user_id = ?',
      [userId]
    );

    if (users.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const currentBalance = users[0].wallet_balance;
    await conn.query(
      'UPDATE users SET wallet_balance = wallet_balance + ? WHERE user_id = ?',
      [amount, userId]
    );

    const ref = `ADJUST${Date.now()}${Math.floor(Math.random() * 1000)}`;
    await conn.query(
      `INSERT INTO wallet_transactions 
       (user_id, amount, type, reason, adjusted_by, ref) 
       VALUES (?, ?, 'adjust', ?, ?, ?)`,
      [userId, Math.abs(amount), reason, adminId, ref]
    );

    await conn.commit();

    const [updatedUsers] = await pool.query(
      'SELECT wallet_balance FROM users WHERE user_id = ?',
      [userId]
    );

    return res.status(200).json({
      success: true,
      message: 'Wallet adjusted successfully',
      ref,
      previous_balance: currentBalance,
      adjustment_amount: amount,
      new_balance: updatedUsers[0].wallet_balance,
      reason
    });

  } catch (error) {
    await conn.rollback();
    console.error('Adjust wallet error:', error);
    return res.status(500).json({
        success: false,
      message: 'Failed to adjust wallet',
      error: error.message
    });
  } finally {
    conn.release();
  }
});





/**
 * @swagger
 * /api/admin/wallet/users/{userId}/wallet/freeze:
 *   patch:
 *     summary: Freeze or unfreeze user wallet (Admin only)
 *     tags: [Admin Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: ['freeze', 'unfreeze']
 *     responses:
 *       200:
 *         description: Wallet frozen/unfrozen
 *       400:
 *         description: Invalid action
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 */
router.patch('/users/:userId/wallet/freeze', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { action } = req.body;

     if (!action || !['freeze', 'unfreeze'].includes(action)) {
      return res.status(400).json({ success: false,
  message: 'action must be "freeze" or "unfreeze"'});
     }

    const frozenValue = action === 'freeze' ? 1 : 0;

    const [result] = await pool.query(
      'UPDATE users SET wallet_frozen = ? WHERE user_id = ?',
      [frozenValue, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' });
    }

    const [users] = await pool.query(
      'SELECT wallet_frozen  FROM users WHERE user_id = ?',
      [userId]
    );

    return res.status(200).json({
      success: true,
      message: `Wallet ${action}ed successfully`,
      user_id: userId,
      wallet_frozen: users[0].wallet_frozen  
    });

  } catch (error) {
    console.error('Freeze wallet error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to freeze wallet',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/wallet/transactions:
 *   get:
 *     summary: Get all wallet transactions with filter and pagination (Admin only)
 *     tags: [Admin Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: Filter by user ID (optional)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [topup, deduct, refund, adjust]
 *         description: Filter by transaction type (optional)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *     responses:
 *       200:
 *         description: List of transactions with pagination
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/transactions', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { user_id, type, page = 1 } = req.query;
    const limit = 20;
    const offset = (parseInt(page) - 1) * limit;

    
    let whereConditions = [];
    let queryParams = [];

    if (user_id) { whereConditions.push('wt.user_id = ?'); queryParams.push(user_id); }

    if (type) { whereConditions.push('wt.type = ?'); queryParams.push(type); }
    
    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';


    
    const [transactions] = await pool.query(
      `SELECT wt.txn_id, wt.user_id, u.email, u.first_name, u.last_name,
              wt.amount, wt.type, wt.reason, wt.ref, wt.adjusted_by, wt.created_at
       FROM wallet_transactions wt
       JOIN users u ON wt.user_id = u.user_id
       ${whereClause}
       ORDER BY wt.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM wallet_transactions wt ${whereClause}`,
      queryParams
    );

    
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        current_page: parseInt(page),
        per_page: limit,
        total: total,
        total_pages: totalPages
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/wallet/summary:
 *   get:
 *     summary: Get wallet summary statistics (Admin only)
 *     tags: [Admin Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet summary statistics
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/summary', auth, roleCheck('admin'), async (req, res) => {
  try {
    const { from_date, to_date } = req.query;

    let dateCondition = '';
    const dateParams = [];
    if (from_date) {
      dateCondition += ' AND created_at >= ?';
      dateParams.push(new Date(from_date + 'T00:00:00'));
    }
    if (to_date) {
      dateCondition += ' AND created_at <= ?';
      dateParams.push(new Date(to_date + 'T23:59:59'));
    }

    const [[summary]] = await pool.query(
      `SELECT
         SUM(CASE WHEN type = 'topup' THEN amount ELSE 0 END) as total_topup,
         SUM(CASE WHEN type = 'deduct' THEN amount ELSE 0 END) as total_deduct,
         SUM(CASE WHEN type = 'refund' THEN amount ELSE 0 END) as total_refund,
         SUM(CASE WHEN type = 'adjust' THEN amount ELSE 0 END) as total_adjust,
         COUNT(*) as total_transactions
       FROM wallet_transactions
       WHERE 1=1${dateCondition}`,
      dateParams
    );

    const [[frozenCount]] = await pool.query(
      'SELECT COUNT(*) as frozen_wallets FROM users WHERE wallet_frozen = 1'
    );

    const [[balanceSum]] = await pool.query(
      'SELECT SUM(wallet_balance) as total_wallet_balance FROM users'
    );

    return res.status(200).json({
      success: true,
      summary: {
        total_topup: summary?.total_topup || 0,
        total_deduct: summary?.total_deduct || 0,
        total_refund: summary?.total_refund || 0,
        total_adjust: summary?.total_adjust || 0,
        total_transactions: summary?.total_transactions || 0,
        frozen_wallets_count: frozenCount?.frozen_wallets || 0,
        total_wallet_balance: balanceSum?.total_wallet_balance || 0
      }
    });

  } catch (error) {
    console.error('Get wallet summary error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet summary',
      error: error.message
    });
  }
});

module.exports = router;
