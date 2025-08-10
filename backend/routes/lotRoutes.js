const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/asyncHandler');
const { upload } = require('../middleware/upload');
const {
  getLotsForEnchere,
  getLotById,
  createLot,
  updateLot,
  deleteLot,
  markLotAsSold,
  getLotImages
} = require('../controllers/lotController');
const { uploadLotImage } = require('../controllers/imageController');

// GET /api/lots/:id
router.get('/:id', asyncHandler(getLotById));

// PUT /api/lots/:id/sell
router.post('/:id/sell', asyncHandler(markLotAsSold));

// PUT /api/lots/:id
router.put('/:id', asyncHandler(updateLot));

// DELETE /api/lots/:id
router.delete('/:id', asyncHandler(deleteLot));

// GET /api/lots/:lotId/images
router.get('/:lotId/images', asyncHandler(getLotImages));

// POST /api/lots/:lotId/images
router.post('/:lotId/images', upload.single('image'), asyncHandler(uploadLotImage));

module.exports = router;