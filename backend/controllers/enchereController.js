const db = require('../db');

/**
 * Get all encheres (auctions)
 */
const getAllEncheres = async (req, res) => {
  const encheres = db.getAll('encheres').sort((a,b) => new Date(b.date) - new Date(a.date));
  res.json(encheres);
};

/**
 * Get all encheres with their participants, lots, and sales (aggregated view)
 */
const getAllEncheresWithDetails = async (req, res) => {
  const encheres = db.getAll('encheres').sort((a,b) => new Date(b.date) - new Date(a.date));
  const lots = db.getAll('lots');
  const participations = db.getAll('participation');
  const clients = db.getAll('clients');

  const result = encheres.map((enchere) => {
    const enchereLots = lots.filter(l => l.enchere_id === Number(enchere.id));
    const enchereParticipations = participations.filter(p => p.enchere_id === Number(enchere.id));

    const participants = enchereParticipations.map(p => {
      const client = clients.find(c => c.id === p.client_id) || {};
      return {
        id: client.id,
        participation_id: p.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address,
        local_number: p.local_number,
        registered_at: p.registered_at
      };
    });

    const sales = enchereLots
      .filter(l => l.sold_to)
      .map(l => {
        const participation = enchereParticipations.find(p => p.client_id === l.sold_to) || {};
        const client = clients.find(c => c.id === l.sold_to) || {};
        return {
          bundleId: l.id,
          bundleName: l.name,
          starting_price: l.starting_price,
          finalPrice: l.sold_price,
          participantId: client.id,
          participantName: client.name,
          bidderNumber: participation.local_number || ''
        };
      });

    return {
      ...enchere,
      bundles: enchereLots,
      participants,
      sales
    };
  });

  res.json(result);
};

/**
 * Get a single enchere by ID with all related data
 */
const getEnchereById = async (req, res) => {
  const { id } = req.params;
  
  // Get basic enchere data
  const enchere = db.getById('encheres', id);
  if (!enchere) return res.status(404).json({ message: 'Enchere not found' });

  // Bundles
  enchere.bundles = db.getAll('lots').filter(l => l.enchere_id === Number(id)).sort((a,b) => a.id - b.id);

  // Participants (join participation + clients)
  const participations = db.getAll('participation').filter(p => p.enchere_id === Number(id));
  enchere.participants = participations.map(p => {
    const client = db.getById('clients', p.client_id) || {};
    return {
      id: client.id,
      participation_id: p.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
      local_number: p.local_number,
      registered_at: p.registered_at
    };
  });

  // Sales: lots with sold_to
  enchere.sales = db.getAll('lots')
    .filter(l => l.enchere_id === Number(id) && l.sold_to)
    .map(l => {
      const participation = db.getAll('participation').find(p => p.enchere_id === l.enchere_id && p.client_id === l.sold_to) || {};
      const client = db.getById('clients', l.sold_to) || {};
      return {
        bundleId: l.id,
        bundleName: l.name,
        starting_price: l.starting_price,
        finalPrice: l.sold_price,
        participantId: client.id,
        participantName: client.name,
        bidderNumber: participation.local_number || ''
      };
    });

  res.json(enchere);
};

/**
 * Create a new enchere
 */
const createEnchere = async (req, res) => {
  const { name, date, address } = req.body;
  if (!name || !date) return res.status(400).json({ message: 'Name and date are required' });

  const record = db.insert('encheres', { name, date, address: address || '' });
  res.status(201).json(record);
};

/**
 * Update an existing enchere
 */
const updateEnchere = async (req, res) => {
  const { id } = req.params;
  const { name, date, address, metadata } = req.body;
  if (!name || !date) return res.status(400).json({ message: 'Name and date are required' });

  const existing = db.getById('encheres', id);
  if (!existing) return res.status(404).json({ message: 'Enchere not found' });

  const updates = { name, date, address: address || '' };
  if (metadata) updates.metadata = metadata;
  const updated = db.update('encheres', id, updates);
  res.json(updated);
};

/**
 * Delete an enchere
 */
const deleteEnchere = async (req, res) => {
  const { id } = req.params;
  const ok = db.remove('encheres', id);
  if (!ok) return res.status(404).json({ message: 'Enchere not found' });
  // Also remove lots and participations for that enchere
  const data = db.loadData();
  data.lots = data.lots.filter(l => l.enchere_id !== Number(id));
  data.participation = data.participation.filter(p => p.enchere_id !== Number(id));
  db.saveData(data);
  res.json({ message: 'Enchere deleted successfully' });
};

module.exports = {
  getAllEncheres,
  getAllEncheresWithDetails,
  getEnchereById,
  createEnchere,
  updateEnchere,
  deleteEnchere
};