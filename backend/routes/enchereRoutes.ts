import express from 'express'
const router = express.Router();
import { asyncHandler } from '../middleware/asyncHandler.ts';
import {
  getAllEncheres,
  getEnchereById,
  createEnchere,
  updateEnchere,
  deleteEnchere,
  getEncheresList
} from '../controllers/enchereController.ts';
import { getLotsForEnchere, createLot } from '../controllers/lotController.ts';

// GET /api/encheres
router.get('/', asyncHandler(getEncheresList));

// GET /api/encheres/with-details (aggregated view)
router.get('/all', asyncHandler(getAllEncheres));

// GET /api/encheres/:id
router.get('/:id', asyncHandler(getEnchereById));

// POST /api/encheres
router.post('/', asyncHandler(createEnchere));

// PUT /api/encheres/:id
router.put('/:id', asyncHandler(updateEnchere));

// DELETE /api/encheres/:id
router.delete('/:id', asyncHandler(deleteEnchere));


// GET /api/lots (from an enchere)
router.get('/:enchereId/lots', asyncHandler(getLotsForEnchere));


// POST /api/lots (create for an enchere)
router.post('/:enchereId/lots', asyncHandler(createLot));

module.exports = router;
