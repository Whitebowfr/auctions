import db from '../db.ts'
import { Enchere, ApiError } from '../../types.ts'
import { Request, Response } from 'express'

/**
 * Get all encheres (auctions)
 */
export const getEncheresList = async (_: any, res: Response<Enchere[]>) => {
  const encheres = db.getAll('encheres').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json(encheres);
};

/**
 * Get all encheres with their participants, lots, and sales (aggregated view)
 */
export const getAllEncheres = async (_: any, res: Response<Enchere[]>) => {
  const encheres = db.getAll('encheres').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const lots = db.getAll('lots');
  const participations = db.getAll('participation');
  const clients = db.getAll('clients');

  const result = encheres.map((enchere) => {
    const enchereLots = lots.filter(l => l.enchereId === Number(enchere.id));
    const enchereParticipations = participations.filter(p => p.enchereId === Number(enchere.id));

    const participants = enchereParticipations.map(p => {
      const client = clients.find(c => c.id === p.client.id);
      return {
        id: client.id,
        participation_id: p.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address,
        local_number: p.localNumber,
        paid: p.paid !== undefined ? p.paid : null

      };
    });

    const sales = enchereLots
      .filter(l => l.soldTo)
      .map(l => {
        const participation = enchereParticipations.find(p => p.client.id === l.soldTo.id);
        const client = clients.find(c => c.id === l.soldTo.id);
        return {
          bundleId: l.id,
          bundleName: l.name,
          starting_price: l.startingPrice,
          finalPrice: l.finalPrice,
          participantId: client.id,
          participantName: client.name,
          bidderNumber: participation.localNumber || ''
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
export const getEnchereById = async (req: Request<{ id: number }>, res: Response<Enchere | ApiError>) => {
  const { id } = req.params;

  // Get basic enchere data
  const enchere = db.getById('encheres', id);

  if (!enchere) return res.status(404).json({ message: 'Enchere not found' });

  // Bundles
  enchere.bundles = db.getAll('lots').filter(l => l.enchereId === Number(id)).sort((a, b) => a.id - b.id);

  res.json(enchere);
};

/**
 * Create a new enchere
 */
export const createEnchere = async (req: Request<{ name: string, date: string, address: string }>, res: Response<Enchere | ApiError>) => {
  const { name, date, address } = req.body;
  if (!name || !date) return res.status(400).json({ message: 'Name and date are required' });

  const record = db.insert('encheres', { name, date, address: address || '' });
  res.status(201).json(record);
};

/**
 * Update an existing enchere
 */
export const updateEnchere = async (req: Request<{ id: number }>, res: Response<Enchere | ApiError>) => {
  const { id } = req.params;
  const { name, date, address } = req.body;
  if (!name || !date) return res.status(400).json({ message: 'Name and date are required' });

  const existing = db.getById('encheres', id);
  if (!existing) return res.status(404).json({ message: 'Enchere not found' });

  const updates = { name, date, address: address || '' };
  const updated = db.update('encheres', id, updates);
  res.json(updated);
};

export const deleteEnchere = async (req: Request<{ id: number }>, res: Response<ApiError>) => {
  const { id } = req.params;
  const ok = db.remove('encheres', id);
  if (!ok) return res.status(404).json({ message: 'Enchere not found' });
  // Also remove lots and participations for that enchere
  const data = db.loadData();
  data.lots = data.lots.filter(l => l.enchereId !== Number(id));
  data.participation = data.participation.filter(p => p.enchereId !== Number(id));
  db.saveData(data);
  res.json({ message: 'Enchere deleted successfully' });
};
