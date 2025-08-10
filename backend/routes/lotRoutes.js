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

// GET /api/lots (from an enchere)
router.get('/enchere/:enchereId', asyncHandler(getLotsForEnchere));

// GET /api/lots/:id
router.get('/:id', asyncHandler(getLotById));

// POST /api/lots (create for an enchere)
router.post('/enchere/:enchereId', asyncHandler(createLot));

// PUT /api/lots/:id
router.put('/:id', asyncHandler(updateLot));

// DELETE /api/lots/:id
router.delete('/:id', asyncHandler(deleteLot));

// PUT /api/lots/:id/sell
router.put('/:id/sell', asyncHandler(markLotAsSold));

// GET /api/lots/:lotId/images
router.get('/:lotId/images', asyncHandler(getLotImages));

// POST /api/lots/:lotId/images
router.post('/:lotId/images', upload.single('image'), asyncHandler(uploadLotImage));

module.exports = router;