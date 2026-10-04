import { Client, Participation, Enchere, Lot } from "../types.ts";
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(import.meta.dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');
const BACKUP_FILE = path.join(DATA_DIR, 'db.backup.json');

const DB_VERSION = 2.2;

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

type ClientRow = Client & {
  created_at?: string;
};

type EnchereRow = Enchere & {
  created_at?: string;
  metadata?: string;
};

type LotRow = Lot & {
  created_at?: string;
  description?: string;
  category?: string;
  notes?: string;
  soldPrice?: number | null;
  image_url?: string;
};

type ParticipationRow = Partial<Participation> & {
  created_at?: string;
  participationId?: number;
};

interface db_tables {
  clients: ClientRow[];
  encheres: EnchereRow[];
  lots: LotRow[];
  participation: ParticipationRow[];
}

type db_row<K extends keyof db_tables> = db_tables[K][number];

interface raw_db_struct {
  version: number;
  clients: any[];
  encheres: any[];
  lots: any[];
  participation: any[];
}

interface db_struct {
  version: number;
  clients: ClientRow[];
  encheres: EnchereRow[];
  lots: LotRow[];
  participation: ParticipationRow[];
}

interface migrated_db_struct extends db_struct {
  version: number;
}

const DEFAULT_DB: raw_db_struct = {
  version: DB_VERSION,
  clients: [],
  encheres: [],
  lots: [],
  participation: []
};

let cachedMtimeMs = 0;
let cachedDb: migrated_db_struct | null = null;

const cloneRow = <T,>(row: T): T => ({ ...row });

const cloneDb = (db: db_struct): db_struct => ({
  version: db.version,
  clients: db.clients.map(cloneRow),
  encheres: db.encheres.map(cloneRow),
  lots: db.lots.map(cloneRow),
  participation: db.participation.map(cloneRow)
});

const toNumber = (value: any, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const getValue = (source: any, camelKey: string, snakeKey: string) => source?.[camelKey] ?? source?.[snakeKey];

const normalizeClient = (client: any): ClientRow => ({
  id: toNumber(client?.id),
  name: client?.name || '',
  email: client?.email,
  address: client?.address,
  phone: client?.phone,
  notes: client?.notes,
  created_at: client?.created_at
});

const normalizeEnchere = (enchere: any): EnchereRow => ({
  id: toNumber(enchere?.id),
  name: enchere?.name || '',
  date: enchere?.date instanceof Date ? enchere.date : new Date(enchere?.date),
  address: enchere?.address,
  managementFeeRate: enchere?.managementFeeRate,
  created_at: enchere?.created_at,
  metadata: enchere?.metadata,
});

const resolveClient = (clientValue: any, clientById: Map<number, ClientRow>) => {
  if (clientValue == null) return undefined;
  if (typeof clientValue === 'object') return normalizeClient(clientValue);
  return clientById.get(toNumber(clientValue));
};

const normalizeLot = (lot: any): LotRow => {
  return {
    id: toNumber(lot?.id),
    enchereId: toNumber(getValue(lot, 'enchereId', 'enchere_id')),
    name: lot?.name || '',
    number: lot?.number || String(lot?.id ?? ''),
    startingPrice: toNumber(getValue(lot, 'startingPrice', 'starting_price')),
    finalPrice: getValue(lot, 'finalPrice', 'sold_price') != null ? toNumber(getValue(lot, 'finalPrice', 'sold_price')) : undefined,
    soldToId: lot?.sold_to,
    created_at: lot?.created_at,
    description: lot?.description,
    category: lot?.category,
    notes: lot?.notes,
    soldPrice: getValue(lot, 'soldPrice', 'sold_price') != null ? toNumber(getValue(lot, 'soldPrice', 'sold_price')) : undefined,
    image_url: lot?.image_url
  };
};

const normalizeParticipation = (participation: any, clientById: Map<number, ClientRow>): ParticipationRow => {
  const client = resolveClient(getValue(participation, 'client', 'client'), clientById) || clientById.get(toNumber(getValue(participation, 'clientId', 'client_id')));
  return {
    id: toNumber(participation?.id),
    enchereId: toNumber(getValue(participation, 'enchereId', 'enchere_id')),
    client: client || normalizeClient(getValue(participation, 'client', 'client')),
    localNumber: toNumber(getValue(participation, 'localNumber', 'local_number')),
    paid: participation?.paid,
    created_at: participation?.created_at,
    participationId: toNumber(getValue(participation, 'participationId', 'participation_id') ?? 0) || undefined
  };
};

const ensureProperDatabase = (db: db_struct): db_struct => {
  db.encheres.map(enchere => enchere.participantAmount = db.participation.filter(x => x.enchereId === enchere.id).length)
  db.encheres.map(enchere => enchere.bundleAmount = db.lots.filter(x => x.enchereId === enchere.id).length)

  db.lots.filter(lot => db.encheres.some(enchere => enchere.id === lot.enchereId))
  db.lots.filter(lot => db.clients.some(client => client.id === lot.soldToId))

  db.participation.filter(participation => db.clients.some(client => client.id === participation.clientId))
  db.participation.filter(participation => db.encheres.some(enchere => enchere.id === participation.enchereId))

  return db
}

const normalizeDb = (data: raw_db_struct): db_struct => {
  const clients = (data.clients || []).map(normalizeClient);
  const clientById = new Map<number, ClientRow>(clients.map(client => [client.id, client]));

  return ensureProperDatabase({
    version: data.version ?? DB_VERSION,
    clients,
    encheres: (data.encheres || []).map(normalizeEnchere),
    lots: (data.lots || []).map(lot => normalizeLot(lot)),
    participation: (data.participation || []).map(participation => normalizeParticipation(participation, clientById))
  });
};

const needsMigration = (version: number | undefined) => version !== DB_VERSION;

const migrateDbFile = () => {
  if (!fs.existsSync(DATA_FILE)) {
    console.log("Database missing, recreating...")
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DB, null, 2));
  }

  if (!fs.existsSync(BACKUP_FILE)) {
    console.log("Backup file not found, recreating...")
    cloneFileAsBackup();
  }

  const raw = readBackupDb();
  if (!needsMigration(raw.version)) {
    console.log("Found DB with version" + raw.version)
    return;
  }
  console.log(`Migrating DB from version ${raw.version} to ${DB_VERSION}`)
  const normalized = normalizeDb(raw);
  const migrated: migrated_db_struct = {
    ...normalized,
    version: DB_VERSION
  };

  fs.writeFileSync(BACKUP_FILE, JSON.stringify(migrated, null, 2));
  cachedDb = migrated;
  cachedMtimeMs = fs.statSync(BACKUP_FILE).mtimeMs;
};

const cloneFileAsBackup = (sourceFile: string = DATA_FILE, backupFile: string = BACKUP_FILE) => {
  if (!fs.existsSync(sourceFile)) {
    return false;
  }

  fs.copyFileSync(sourceFile, backupFile);
  return true;
};

const ensureBackupExists = () => {
  if (!fs.existsSync(BACKUP_FILE)) {
    if (!cloneFileAsBackup()) {
      fs.writeFileSync(BACKUP_FILE, JSON.stringify(DEFAULT_DB, null, 2));
    }
  }
};

const readBackupDb = () => {
  ensureBackupExists();
  const raw = fs.readFileSync(BACKUP_FILE, 'utf8');
  return JSON.parse(raw || JSON.stringify(DEFAULT_DB)) as raw_db_struct;
};

const loadData = () => {
  try {
    migrateDbFile();
    const stats = fs.statSync(BACKUP_FILE);
    if (cachedDb && cachedMtimeMs === stats.mtimeMs) {
      return cloneDb(cachedDb);
    }

    const raw = readBackupDb();
    cachedDb = raw as migrated_db_struct;
    cachedMtimeMs = fs.statSync(BACKUP_FILE).mtimeMs;
    return cloneDb(cachedDb);
  } catch (e: any) {
    console.error('Failed to read DB backup, recreating:', e.message);
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(DEFAULT_DB, null, 2));
    cachedDb = { ...normalizeDb(DEFAULT_DB), version: DB_VERSION };
    cachedMtimeMs = fs.statSync(BACKUP_FILE).mtimeMs;
    return cloneDb(cachedDb);
  }
};

const saveData = (data: db_struct) => {
  const migrated: migrated_db_struct = {
    ...cloneDb(data),
    version: DB_VERSION
  };
  fs.writeFileSync(BACKUP_FILE, JSON.stringify(migrated, null, 2));
  cachedDb = cloneDb(migrated) as migrated_db_struct;
  cachedMtimeMs = fs.statSync(BACKUP_FILE).mtimeMs;
};

const nextId = (items: any[]) => {
  if (!items || items.length === 0) return 1;
  return Math.max(...items.map(i => i.id || 0)) + 1;
};

const getAll = <K extends keyof db_tables>(table: K): db_tables[K] => {
  const db = loadData();
  return (db[table] || []) as db_tables[K];
};

const getById = <K extends keyof db_tables>(table: K, id: number): db_row<K> | undefined => {
  const items = getAll(table);
  return items.find(i => i.id === Number(id));
};

const findBy = <K extends keyof db_tables>(table: K, field: string, value: any) => {
  const items = getAll(table);
  return items.filter(i => i[field] == value).map(cloneRow);
};

const insert = <K extends keyof db_tables>(table: K, obj: any): db_row<K> => {
  const db = loadData();
  const items = getAll(table);
  let id: number;

  if (obj && obj.id !== undefined && obj.id !== null) {
    const requested = Number(obj.id);
    id = items.some(i => i.id === requested) ? nextId(items) : requested;
  } else {
    id = nextId(items);
  }

  const now = new Date().toISOString();
  let record: any;

  if (table === 'clients') {
    record = normalizeClient({ id, ...obj, created_at: now });
  } else if (table === 'encheres') {
    record = normalizeEnchere({ id, ...obj, created_at: now });
  } else if (table === 'lots') {
    record = normalizeLot({ id, ...obj, created_at: now });
  } else {
    record = normalizeParticipation({ id, ...obj, created_at: now }, new Map(db.clients.map(client => [client.id, client])));
  }

  items.push(record);
  db[table] = items as db_struct[K];
  saveData(db);
  return cloneRow(record) as db_row<K>;
};

const update = <K extends keyof db_tables>(table: K, id: number, updates: any): db_row<K> | null => {
  const db = loadData();
  const items = getAll(table);
  const idx = items.findIndex(i => i.id === Number(id));
  if (idx === -1) return null;

  const merged = { ...items[idx], ...updates, id: Number(id) };

  if (table === 'clients') {
    items[idx] = normalizeClient(merged) as db_row<K>;
  } else if (table === 'encheres') {
    items[idx] = normalizeEnchere(merged) as db_row<K>;
  } else if (table === 'lots') {
    items[idx] = normalizeLot(merged) as db_row<K>;
  } else {
    items[idx] = normalizeParticipation(merged, new Map(db.clients.map(client => [client.id, client]))) as db_row<K>;
  }

  db[table] = items as db_struct[K];
  saveData(db);
  return cloneRow(items[idx]) as db_row<K>;
};

const remove = <K extends keyof db_tables>(table: K, id: number) => {
  const db = loadData();
  const items = getAll(table);
  const idx = items.findIndex(i => i.id === Number(id));
  if (idx === -1) return false;
  items.splice(idx, 1);
  db[table] = items as db_struct[K];
  saveData(db);
  return true;
};

export default {
  loadData,
  saveData,
  cloneFileAsBackup,
  getAll,
  getById,
  findBy,
  insert,
  update,
  remove,
  DATA_FILE,
  BACKUP_FILE
};
