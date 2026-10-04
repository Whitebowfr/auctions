import db from '../db.ts'
import { Enchere, ApiError } from '../../types.ts'
import { Request, Response } from 'express'

/**
 * Get all encheres (auctions)
 */
export const getEncheresList = async (_: any, res: Response<any[]>) => {
  // Return a lightweight list for initial loading (id, name, date, address)
  const encheres = db.getAll('encheres')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(e => ({ id: e.id, name: e.name, date: e.date, address: e.address || '' }));
  res.json(encheres);
};

/**
 * Get all encheres with their participants, lots, and sales (aggregated view)
 */
export const getAllEncheres = async (_: any, res: Response<Enchere[]>) => {
  const encheres = db.getAll('encheres').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  res.json(encheres);
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
