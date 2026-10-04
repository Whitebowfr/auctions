import express from 'express';
const router = express.Router();
import { asyncHandler } from '../middleware/asyncHandler.ts';
import {
  getLotsForEnchere,
  getLotById,
  createLot,
  updateLot,
  deleteLot,
  markLotAsSold
} from '../controllers/lotController.ts';

// GET /api/lots/:id
router.get('/:id', asyncHandler(getLotById));

// PUT /api/lots/:id/sell
router.post('/:id/sell', asyncHandler(markLotAsSold));

// PUT /api/lots/:id
router.put('/:id', asyncHandler(updateLot));

// DELETE /api/lots/:id
router.delete('/:id', asyncHandler(deleteLot));

module.exports = router;
