const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/asyncHandler');
const { 
  getEnchereStats, 
  getClientPurchases, 
  getEnchereReport 
} = require('../controllers/analyticsController');

// GET /api/encheres/:enchereId/stats
router.get('/encheres/:enchereId/stats', asyncHandler(getEnchereStats));

// GET /api/encheres/:enchereId/clients/:clientId/purchases
router.get('/encheres/:enchereId/clients/:clientId/purchases', asyncHandler(getClientPurchases));

// GET /api/encheres/:enchereId/report
router.get('/encheres/:enchereId/report', asyncHandler(getEnchereReport));

module.exports = router;