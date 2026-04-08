const express = require('express');
const Log = require('../../models/Log');
const { auth, roleCheck } = require('../../middleware/auth');

const router = express.Router();
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