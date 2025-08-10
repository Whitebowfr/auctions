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

module.exports = router;