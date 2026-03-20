const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/asyncHandler');
const {
  getParticipants,
  addParticipant,
  updateParticipant,
  removeParticipant,
  updatePaymentStatus,
  deleteParticipationById
} = require('../controllers/participationController');

// GET /api/encheres/:enchereId/participants
router.get('/encheres/:enchereId/participants', asyncHandler(getParticipants));

// POST /api/encheres/:enchereId/participants
router.post('/encheres/:enchereId/participants', asyncHandler(addParticipant));

// PUT /api/encheres/:enchereId/participants/:clientId
router.put('/encheres/:enchereId/participants/:clientId', asyncHandler(updateParticipant));

// DELETE /api/encheres/:enchereId/participants/:clientId
router.delete('/encheres/:enchereId/participants/:clientId', asyncHandler(removeParticipant));

// Delete a participation by its internal id (optionally force to bypass lots check)
router.delete('/participation/:id', asyncHandler(deleteParticipationById));

router.patch('/participation/:id/payment', updatePaymentStatus);

module.exports = router;