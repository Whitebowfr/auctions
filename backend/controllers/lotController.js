const db = require('../db');

/**
 * Get all lots for an enchere
 */
const getLotsForEnchere = async (req, res) => {
  const { enchereId } = req.params;
  const lots = db
    .getAll('lots')
    .filter(l => l.enchere_id === Number(enchereId))
    // sort by custom number if present (supports 9bis, 9ter)
    .sort((a, b) => {
      const parse = (val, fallback) => {
        const raw = (val ?? fallback ?? '').toString().trim();
        if (!raw) return { base: 0, suffixOrder: 0 };
        const match = raw.match(/^(\d+)([a-zA-Z]*)$/);
        if (!match) return { base: 0, suffixOrder: 0 };
        const base = parseInt(match[1], 10);
        const suffix = match[2].toLowerCase();
        const map = { bis: 1, ter: 2, quater: 3 };
        return { base, suffixOrder: map[suffix] || 0 };
      };
      const aParsed = parse(a.number, a.id);
      const bParsed = parse(b.number, b.id);
      if (aParsed.base !== bParsed.base) return aParsed.base - bParsed.base;
      return aParsed.suffixOrder - bParsed.suffixOrder;
    });
  res.json(lots);
};

/**
 * Get a single lot by ID
 */
const getLotById = async (req, res) => {
  const { id } = req.params;
  const lot = db.getById('lots', id);
  if (!lot) return res.status(404).json({ message: 'Lot not found' });
  res.json(lot);
};

/**
 * Create a new lot
 */
const createLot = async (req, res) => {
  const { enchereId } = req.params;
  const { name, starting_price, number } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required' });

  const enchere = db.getById('encheres', enchereId);
  if (!enchere) return res.status(404).json({ message: 'Enchere not found' });

  const record = db.insert('lots', {
    enchere_id: Number(enchereId),
    name,
    number: number || null,
    starting_price:
      starting_price !== undefined && starting_price !== null
        ? Number(starting_price)
        : null,
    sold_price: null,
    sold_to: null
  });
  res.status(201).json(record);
};

/**
 * Update an existing lot
 */
const updateLot = async (req, res) => {
  const { id } = req.params;
  const { name, starting_price, number } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required' });

  const existing = db.getById('lots', id);
  if (!existing) return res.status(404).json({ message: 'Lot not found' });

  const updated = db.update('lots', id, {
    name,
    number: number || existing.number || null,
    starting_price:
      starting_price !== undefined && starting_price !== null
        ? Number(starting_price)
        : existing.starting_price ?? null
  });
  res.json(updated);
};

/**
 * Delete a lot
 */
const deleteLot = async (req, res) => {
  const { id } = req.params;
  const ok = db.remove('lots', id);
  if (!ok) return res.status(404).json({ message: 'Lot not found' });
  res.json({ message: 'Lot deleted successfully' });
};

/**
 * Mark a lot as sold
 */
const markLotAsSold = async (req, res) => {
  const { id } = req.params;
  const { clientId, soldPrice } = req.body;
  if (!clientId || soldPrice === undefined) return res.status(400).json({ message: 'Participant ID and sold price are required' });

  const lot = db.getById('lots', id);
  if (!lot) return res.status(404).json({ message: 'Lot not found' });

  // verify participant registered
  const participation = db.getAll('participation').find(p => p.enchere_id === lot.enchere_id && p.client_id === Number(clientId));
  if (!participation) return res.status(400).json({ message: 'Participant is not registered for this enchere' });

  const updated = db.update('lots', id, { sold_to: Number(clientId), sold_price: Number(soldPrice) });
  const client = db.getById('clients', clientId) || {};
  updated.sold_to_name = client.name;
  res.json(updated);
};

/**
 * Get all images for a lot
 */
// images removed in lightweight JSON backend

module.exports = {
  getLotsForEnchere,
  getLotById,
  createLot,
  updateLot,
  deleteLot,
  markLotAsSold,
};
 