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
      registered_at: p.registered_at
    };
  });
  res.json(formatted);
};

/**
 * Add a participant to an enchere
 */
const addParticipant = async (req, res) => {
  const { enchereId } = req.params;
  const { clientId, localNumber } = req.body;
  if (!clientId) return res.status(400).json({ message: 'Client ID is required' });

  const enchere = db.getById('encheres', enchereId);
  if (!enchere) return res.status(404).json({ message: 'Enchere not found' });

  const client = db.getById('clients', clientId);
  if (!client) return res.status(404).json({ message: 'Client not found' });

  const existing = db.getAll('participation').find(p => p.enchere_id === Number(enchereId) && p.client_id === Number(clientId));
  if (existing) return res.status(409).json({ message: 'Client is already a participant' });

  const record = db.insert('participation', { enchere_id: Number(enchereId), client_id: Number(clientId), local_number: localNumber || '' });
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
  if (lotsBought > 0) return res.status(400).json({ message: 'Cannot remove participant who has purchased lots', lotsBought });

  const participation = db.getAll('participation').find(p => p.enchere_id === Number(enchereId) && p.client_id === Number(clientId));
  if (!participation) return res.status(404).json({ message: 'Participant not found' });

  db.remove('participation', participation.id);
  res.json({ message: 'Participant removed successfully' });
};

module.exports = {
  getParticipants,
  addParticipant,
  updateParticipant,
  removeParticipant
};