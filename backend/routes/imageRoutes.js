const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/asyncHandler');
const { deleteImage } = require('../controllers/imageController');

// DELETE /api/images/:id
router.delete('/:id', asyncHandler(deleteImage));

module.exports = router;