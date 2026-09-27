import { PaymentStatus, Participation, Lot, ApiError } from "../../types.ts";
import { Request, Response } from "express"
import db from '../db.ts'

type GetParticipantsParams = { enchereId: number };
export const getParticipants = async (req: Request<GetParticipantsParams>, res: Response<Participation[] | ApiError>) => {
  const { enchereId } = req.params;

  const parts: Participation[] = db.getAll('participation').filter((p: Participation) => p.enchereId === enchereId);

  res.json(parts);
};

type AddParticipantParams = { enchereId: number, clientId: number, localNumber: number, participationId?: number };
export const addParticipant = async (req: Request<AddParticipantParams>, res: Response<Participation | ApiError>) => {
  const { enchereId } = req.params;
  const { clientId, localNumber, participationId } = req.body;
  if (!clientId) return res.status(400).json({ message: 'Client ID is required' });

  const enchere = db.getById('encheres', enchereId);
  if (!enchere) return res.status(404).json({ message: 'Enchere not found' });

  const client = db.getById('clients', clientId);
  if (!client) return res.status(404).json({ message: 'Client not found' });

  const existing = db.getAll('participation').find((p: Participation) => p.enchereId === enchereId && p.client.id === clientId);
  if (existing) return res.status(409).json({ message: 'Client is already a participant' });

  // Allow providing an explicit participation ID for transfer operations
  const insertObj: Partial<Participation> = { client, localNumber, enchereId, paid: PaymentStatus.Unpaid };
  if (participationId !== undefined && participationId !== null) insertObj.id = Number(participationId);

  const record = db.insert('participation', insertObj);

  res.status(201).json(record);
};

export const updateParticipant = async (req: Request<{ enchereId: number, clientId: number }>, res: Response<Participation | ApiError>) => {
  const { enchereId, clientId } = req.params;
  const { localNumber } = req.body;
  const participation = db.getAll('participation').find((p: Participation) => p.enchereId === enchereId && p.client.id === clientId);
  if (!participation) return res.status(404).json({ message: 'Participant not found' } satisfies ApiError);

  const updated = db.update('participation', participation.id, { local_number: localNumber || '' });
  res.json(updated);
};

export const removeParticipant = async (req: Request<{ enchereId: number, clientId: number }>, res: Response<{ message: string } | ApiError>) => {
  const { enchereId, clientId } = req.params;

  const lotsBought = db.getAll('lots').filter((l: Lot) => l.enchereId === Number(enchereId) && l.soldTo.id === Number(clientId)).length;

  if (lotsBought > 0) {
    console.log('[participationController:removeParticipant] aborting: participant has purchased lots');
    return res.status(400).json({ message: 'Cannot remove participant who has purchased lots' } satisfies ApiError);
  }

  const participation = db.getAll('participation').find((p: Participation) => p.enchereId === Number(enchereId) && p.client.id === Number(clientId));

  if (!participation) {
    console.log('[participationController:removeParticipant] aborting: participant not found');
    return res.status(404).json({ message: 'Participant not found' } satisfies ApiError);
  }

  db.remove('participation', participation.id);

  res.json({ message: 'Participant removed successfully' });
};

export const deleteClientWithParticipations = async (req: Request<{ clientId: number }>, res: Response<{ message: string, deletedParticipations: number } | ApiError>) => {
  const { clientId } = req.params;
  const numericClientId = Number(clientId);

  console.log('[participationController:deleteClientWithParticipations] called with clientId:', clientId);

  const client = db.getById('clients', numericClientId);
  if (!client) {
    console.log('[participationController:deleteClientWithParticipations] client not found');
    return res.status(404).json({ message: 'Client not found' } satisfies ApiError);
  }

  // Optional: mirror removeParticipant behaviour – do not allow delete if lots purchased
  const lotsBought = db
    .getAll('lots')
    .filter((l: Lot) => l.soldTo.id === numericClientId).length;

  if (lotsBought > 0) {
    console.log('[participationController:deleteClientWithParticipations] aborting, client has purchased lots:', lotsBought);
    return res
      .status(400)
      .json({ message: 'Cannot delete client who has purchased lots' } satisfies ApiError);
  }

  // Delete all participations for this client
  const allParticipations: Participation[] = db.getAll('participation');
  const clientParticipations = allParticipations.filter(
    (p) => p.client.id === numericClientId
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


export const deleteParticipationById = (req: Request<{ id: number }>, res: Response<{ message: string } | ApiError>) => {
  const { id } = req.params;
  const force = req.query.force === 'true'

  const participation = db.getById('participation', id);
  if (!participation) return res.status(404).json({ message: 'Participation not found' });

  const clientId = participation.client.id;
  const enchereId = participation.enchereId;

  const lotsBought = db.getAll('lots').filter(l => l.enchereId === Number(enchereId) && l.soldTo.id === Number(clientId)).length;

  if (lotsBought > 0 && !force) {
    return res.status(400).json({ message: 'Cannot remove participant who has purchased lots' });
  }

  db.remove('participation', participation.id);
  res.json({ message: 'Participation removed successfully' });
};

export const updatePaymentStatus = (req: Request<{ id: number }>, res: Response<Participation | ApiError>) => {
  const { id } = req.params;
  const { paid } = req.body;

  const existing = db.getById('participation', id);
  if (!existing) return res.status(404).json({ message: 'Participation not found' });

  // explicitly store null so "no bill" is distinguishable from false
  const updated = db.update('participation', id, { paid: paid === undefined ? null : paid });
  res.json(updated);
};
