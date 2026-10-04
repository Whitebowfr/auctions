export interface Lot {
  id: number;
  enchereId: number;
  name: string;
  number: string;
  startingPrice: number;
  finalPrice?: number;
  soldTo?: Client;
  soldToId: number;
}

export interface Enchere {
  id: number;
  name: string;
  date: Date;
  address?: string;
  bundles?: Lot[];
  participants?: Participation[];
  managementFeeRate?: number;
  participantAmount?: number;
  bundleAmount?: number;
}

export interface Client {
  id: number;
  name: string;
  email?: string;
  address?: string;
  phone?: string;
  notes?: string;
}

export enum PaymentStatus {
  Unpaid,
  Paid,
  PaidByCard,
  PaidByCash,
  PaidByCheck
}

export interface Participation {
  client?: Client;
  clientId: number;
  enchereId: number;
  id: number;
  localNumber: number;
  paid: PaymentStatus;
}


export type ApiError = { message: string };
