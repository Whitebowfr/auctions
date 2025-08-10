const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/asyncHandler');
const {
  getAllEncheres,
  getEnchereById,
  createEnchere,
  updateEnchere,
  deleteEnchere
} = require('../controllers/enchereController');
const { getLotsForEnchere, createLot } = require('../controllers/lotController');

// GET /api/encheres
router.get('/', asyncHandler(getAllEncheres));

// GET /api/encheres/:id
router.get('/:id', asyncHandler(getEnchereById));

// POST /api/encheres
router.post('/', asyncHandler(createEnchere));

// PUT /api/encheres/:id
router.put('/:id', asyncHandler(updateEnchere));

// DELETE /api/encheres/:id
router.delete('/:id', asyncHandler(deleteEnchere));


// GET /api/lots (from an enchere)
router.get('/:id/lots', asyncHandler(getLotsForEnchere));


// POST /api/lots (create for an enchere)
router.post('/:id/lots', asyncHandler(createLot));

module.exports = router;