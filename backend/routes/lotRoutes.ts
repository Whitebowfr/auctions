const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/asyncHandler.ts');
const {
  getLotsForEnchere,
  getLotById,
  createLot,
  updateLot,
  deleteLot,
  markLotAsSold
} = require('../controllers/lotController.ts');

// GET /api/lots/:id
router.get('/:id', asyncHandler(getLotById));

// PUT /api/lots/:id/sell
router.post('/:id/sell', asyncHandler(markLotAsSold));

// PUT /api/lots/:id
router.put('/:id', asyncHandler(updateLot));

// DELETE /api/lots/:id
router.delete('/:id', asyncHandler(deleteLot));

module.exports = router;