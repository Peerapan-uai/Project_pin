const express = require('express')
const router = express.Router()
const pool = require('../../config/db')
const roleCheck = require('../../middleware/roleCheck')
const auth = require('../../middleware/auth')

router.get('/', auth, roleCheck('admin'), async (req, res) => {
    try {
    const status = req.query.status || 'pending'
    const [rows] = await pool.query(` select rr.request_id ,  rr.user_id ,	rr.reason	,rr.image_url ,	rr.status , rr.reviewed_by , p.payment_id , 
    p.amount , p.method ,  u.first_name , u.last_name , u.email 
    from refund_requests rr
    join payments p on rr.payment_id = p.payment_id
    join users u  on rr.user_id = u.user_id
    where rr.status = ?
    order by rr.created_at DESC`, [status])

     return res.json({ refund_request: rows })
   } catch (err) {
     console.error('GET /api/admin/refunds error:', err)
     return res.status(500).json({ message: 'Server error' })
    }
})


router.post('/:requestId/approve', auth, roleCheck('admin'), async (req, res) => {
    const { requestId } = req.params
    const adminId = req.user.user_id
    
    try {
        const [rows] = await pool.query(
            `select rr.*, p.amount
            from refund_requests rr
            join payments p on rr.payment_id = p.payment_id
            where rr.request_id = ?`, [requestId]
        )
        if (rows.length === 0) return res.status(404).json({ message: 'ไม่พบคำขอ' })
        if (rows[0].status !== 'pending') return res.status(400).json({ message: `ดำเนินการไปแล้ว (${rows[0].status})` })
        
        const rr = rows[0]
        const conn = await pool.getConnection()
        try {
            await conn.beginTransaction()
            await conn.query(
                `update refund_requests set  status='approved', reviewed_by=?, reviewed_at=now() where request_id=?`, [adminId, requestId]
            )
            await conn.query(
                `update payments set status='refunded' where payment_id = ?`,[rr.payment_id]
            )
            await conn.query(
                `update users set wallet_balance = wallet_balance + ? where user_id = ?`, [rr.amount, rr.user_id]
            )
            await conn.query(
                `insert into wallet_transactions (user_id, amount, type, ref)
                values (?, ?, 'refund', ?)`,
                [rr.user_id, rr.amount, `refund_request_${requestId}`]
            )
            await conn.query(
                `insert into notifications (user_id, title, message, type)
                values (?, 'คำขอคืนเงินอนุมัติแล้ว', ?, 'payment')`,
                [rr.user_id, `คำขอคืนเงิน ${rr.amount} บาท ได้รับการอนุมัติแล้วเงินเข้า wallet แล้ว`]
            )
            await conn.commit()
            return res.json({ message: 'อนุมัติสำเร็จ', refunded_amount: rr.amount })
          } catch (err) {
            await conn.rollback()
            throw err
          } finally {
            conn.release()
          }
        } catch (err) {
            console.error('approve error:', err)
            return res.status(500).json({ message: 'Server error' })
        }
})

router.post('/:requestId/reject', auth, roleCheck('admin'), async (req, res) => {
    const { requestId } = req.params
    const adminId = req.user.user_id
    const { reason } = req.body

    try {
        const [ rows ] = await pool.query(
            `select * from refund_requests where request_id = ?`, [requestId]
        )
        if (rows.length === 0) return res.status(404).json({ message: 'ไม่พบคำขอ' })
        if (rows[0].status !== 'pending') return res.status(400).json({ message: `ดำเนินการไปแล้ว (${rows[0].status})` })
        
        const rr = rows[0]
        const message = reason
            ? `คำขอคืนเงินไม่ได้รับการอนุมัติ เหตุผล: ${reason}`
            : 'คำขอคืนเงินของคุณไม่ได้รับการอนุมัติ'
        await pool.query(
            `update refund_requests set status='rejected',
            reviewed_by=?, reviewed_at=NOW() where request_id=?`,[adminId, requestId]
        )
        await pool.query (
            `insert into notifications (user_id, title, message, type)
            values (?, 'คำขอคืนเงินถูกปฏิเสธ', ?, 'payment')`,[rr.user_id, message]
        )
        return res.json({ message: 'ปฏิเสธคำขอแล้ว' })
    }   catch (err) {
        console.error('reject error:', err)
        return res.status(500).json({ message: 'server err' })
    }
})

module.exports = router


