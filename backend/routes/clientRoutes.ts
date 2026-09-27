import express from 'express';
const router = express.Router();
export default router;

import { asyncHandler } from '../middleware/asyncHandler.ts';
import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient
} from '../controllers/clientController.ts';

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
