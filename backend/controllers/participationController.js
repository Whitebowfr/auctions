const db = require('../db');

/**
 * Get all participants for an enchere
 */
const getParticipants = async (req, res) => {
  const { enchereId } = req.params;

  const parts = db.getAll('participation').filter(p => p.enchere_id === Number(enchereId));

  const formatted = parts.map(p => {
    const c = db.getById('clients', p.client_id) || {};
    return {
      id: c.id,
      participation_id: p.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      address: c.address,
      local_number: p.local_number,
      registered_at: p.registered_at,
      paid: p.paid !== undefined ? p.paid : null
    };
  });
  res.json(formatted);
};

/**
 * Add a participant to an enchere
 */
const addParticipant = async (req, res) => {
  const { enchereId } = req.params;
  const { clientId, localNumber, participationId } = req.body;
  if (!clientId) return res.status(400).json({ message: 'Client ID is required' });

  const enchere = db.getById('encheres', enchereId);
  if (!enchere) return res.status(404).json({ message: 'Enchere not found' });

  const client = db.getById('clients', clientId);
  if (!client) return res.status(404).json({ message: 'Client not found' });

  const existing = db.getAll('participation').find(p => p.enchere_id === Number(enchereId) && p.client_id === Number(clientId));
  if (existing) return res.status(409).json({ message: 'Client is already a participant' });

  // Allow providing an explicit participation ID for transfer operations
  const insertObj = { enchere_id: Number(enchereId), client_id: Number(clientId), local_number: localNumber || '' };
  if (participationId !== undefined && participationId !== null) insertObj.id = Number(participationId);
  const record = db.insert('participation', insertObj);
  const response = {
    id: client.id,
    participation_id: record.id,
    name: client.name,
    email: client.email,
    phone: client.phone,
    address: client.address,
    local_number: record.local_number,
    registered_at: record.created_at
  };
  res.status(201).json(response);
};

/**
 * Update a participant's details (local number)
 */
const updateParticipant = async (req, res) => {
  const { enchereId, clientId } = req.params;
  const { localNumber } = req.body;
  const participation = db.getAll('participation').find(p => p.enchere_id === Number(enchereId) && p.client_id === Number(clientId));
  if (!participation) return res.status(404).json({ message: 'Participant not found' });

  const updated = db.update('participation', participation.id, { local_number: localNumber || '' });
  const client = db.getById('clients', clientId) || {};
  const response = {
    id: client.id,
    participation_id: updated.id,
    name: client.name,
    email: client.email,
    phone: client.phone,
    address: client.address,
    local_number: updated.local_number,
    registered_at: updated.created_at
  };
  res.json(response);
};

/**
 * Remove a participant from an enchere
 */
const removeParticipant = async (req, res) => {
  const { enchereId, clientId } = req.params;

  const lotsBought = db.getAll('lots').filter(l => l.enchere_id === Number(enchereId) && l.sold_to === Number(clientId)).length;

  if (lotsBought > 0) {
    console.log('[participationController:removeParticipant] aborting: participant has purchased lots');
    return res.status(400).json({ message: 'Cannot remove participant who has purchased lots', lotsBought });
  }

  const participation = db.getAll('participation').find(p => p.enchere_id === Number(enchereId) && p.client_id === Number(clientId));

  if (!participation) {
    console.log('[participationController:removeParticipant] aborting: participant not found');
    return res.status(404).json({ message: 'Participant not found' });
  }

  db.remove('participation', participation.id);

  res.json({ message: 'Participant removed successfully' });
};

/**
 * Delete a client and all their participations.
 * Optionally blocks if the client has purchased any lots.
 *
 * Intended route: DELETE /api/clients/:clientId
 */
const deleteClientWithParticipations = async (req, res) => {
  const { clientId } = req.params;
  const numericClientId = Number(clientId);

  console.log('[participationController:deleteClientWithParticipations] called with clientId:', clientId);

  const client = db.getById('clients', numericClientId);
  if (!client) {
    console.log('[participationController:deleteClientWithParticipations] client not found');
    return res.status(404).json({ message: 'Client not found' });
  }

  // Optional: mirror removeParticipant behaviour – do not allow delete if lots purchased
  const lotsBought = db
    .getAll('lots')
    .filter((l) => l.sold_to === numericClientId).length;

  if (lotsBought > 0) {
    console.log('[participationController:deleteClientWithParticipations] aborting, client has purchased lots:', lotsBought);
    return res
      .status(400)
      .json({ message: 'Cannot delete client who has purchased lots', lotsBought });
  }

  // Delete all participations for this client
  const allParticipations = db.getAll('participation');
  const clientParticipations = allParticipations.filter(
    (p) => p.client_id === numericClientId
  );


  clientParticipations.forEach((p) => {
    db.remove('participation', p.id);
  });

  // Finally delete the client record itself
  db.remove('clients', numericClientId);

  return res.json({
    message: 'Client and all participations deleted successfully',
    deletedParticipations: clientParticipations.length
  });
};

/**
 * Get all participations
 */
const getAllParticipations = (req, res) => {
  res.json(db.getAll('participation'));
};

/**
 * Get a participation by ID
 */
const getParticipationById = (req, res) => {
  const record = db.getById('participation', req.params.id);
  if (!record) return res.status(404).json({ message: 'Participation not found' });
  res.json(record);
};

/**
 * DELETE /api/participation/:id
 * Optional query param: ?force=true to bypass "lotsBought" protection
 */
const deleteParticipationById = (req, res) => {
  const { id } = req.params;
  const force = req.query.force === 'true' || req.query.force === true;

  const participation = db.getById('participation', id);
  if (!participation) return res.status(404).json({ message: 'Participation not found' });

  const clientId = participation.client_id;
  const enchereId = participation.enchere_id;

  const lotsBought = db.getAll('lots').filter(l => l.enchere_id === Number(enchereId) && l.sold_to === Number(clientId)).length;

  if (lotsBought > 0 && !force) {
    return res.status(400).json({ message: 'Cannot remove participant who has purchased lots', lotsBought });
  }

  db.remove('participation', participation.id);
  res.json({ message: 'Participation removed successfully' });
};

/**
 * PATCH /api/participation/:id/payment
 * body: { paid: true | false | null }
 * null  = reset (no bill generated)
 * false = bill generated, not yet paid
 * true  = paid
 */
const updatePaymentStatus = (req, res) => {
  const { id } = req.params;
  const { paid } = req.body;

  const existing = db.getById('participation', id);
  if (!existing) return res.status(404).json({ message: 'Participation not found' });

  // explicitly store null so "no bill" is distinguishable from false
  const updated = db.update('participation', id, { paid: paid === undefined ? null : paid });
  res.json(updated);
};

module.exports = {
  getParticipants,
  addParticipant,
  updateParticipant,
  removeParticipant,
  deleteClientWithParticipations,
  updatePaymentStatus,
  getAllParticipations,
  getParticipationById,
  deleteParticipationById
};
