const express = require('express');
const Log = require('../../models/Log');
const auth = require('../../middleware/auth');
const roleCheck = require('../../middleware/roleCheck');

const router = express.Router();

/** 
 * @swagger 
 * /api/admin/logs:
 *  get:
 *    summary: Get all logs (Admin only)
 *    tags: [Admin]
 *    security:
 *      - bearerAuth: []
 *    responses:
 *      200:
 *        description: List of logs
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  type: boolean
 *                count:
 *                  type: integer
 *                data:
 *                  type: array
 *         403:
 *           description: Access denied
 *         500:
 *           description: Server error
 */





/**
 * @swagger
 * /api/admin/logs/{type}:
 *   get:
 *     summary: Get logs by status code (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: integer
 *         description: HTTP status code (e.g., 200, 404, 500)
 *         example: 500
 *     responses:
 *       200:
 *         description: List of logs with specified status code
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 statusCode:
 *                   type: string
 *                 data:
 *                   type: array
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/:type', auth, roleCheck('admin'), async (req, res) => {
  // ...
});


















/// GET /api/admin/logs. lalla
router.get('/', auth, roleCheck('admin'), async (req, res) => {
  try {
    const logs = await Log.find()
                        .limit(100)
                        .sort({ createdAt: -1 });
    res.json({
        success: true,
        count: logs.length,
        data: logs
    });
  } catch (error) {
    res.status(500).json({
        success: false,
        message: 'Failed to fetch logs',
        error: error.message
    });
  }
});
///  GET /api/admin/logs/:type lalla
router.get('/:type', auth, roleCheck('admin'), async (req, res) => {
    try {
        const { type } = req.params;

        const logs = await Log.find({ statusCode: parseInt(type) })
                              .limit(100)
                              .sort({ createdAt: -1 });
        res.json({
            success: true,
            count: logs.length,
            statusCode: type,
            data: logs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch logs',
            error: error.message
        });
    }
});
module.exports = router;