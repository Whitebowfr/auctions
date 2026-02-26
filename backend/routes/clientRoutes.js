const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/asyncHandler');
const { 
  getAllClients, 
  getClientById, 
  createClient, 
  updateClient, 
  deleteClient 
} = require('../controllers/clientController');
const {
  deleteClientWithParticipations,
} = require('../controllers/participationController');

// GET /api/clients
router.get('/', asyncHandler(getAllClients));

// GET /api/clients/:id
router.get('/:id', asyncHandler(getClientById));

// POST /api/clients
router.post('/', asyncHandler(createClient));

// PUT /api/clients/:id
router.put('/:id', asyncHandler(updateClient));

// DELETE /api/clients/:id
router.delete('/:id', asyncHandler(deleteClient));

module.exports = router;