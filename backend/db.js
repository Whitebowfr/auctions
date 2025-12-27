const fs = require('fs');
const path = require('path');

// Simple JSON file-based DB for offline use
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default structure
const DEFAULT_DB = {
  clients: [],
  encheres: [],
  lots: [],
  participation: []
};

// Load or create DB file
const loadData = () => {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DB, null, 2));
    return JSON.parse(JSON.stringify(DEFAULT_DB));
  }

  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw || JSON.stringify(DEFAULT_DB));
  } catch (e) {
    console.error('Failed to read DB file, recreating:', e.message);
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DB, null, 2));
    return JSON.parse(JSON.stringify(DEFAULT_DB));
  }
};

const saveData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// Utility to get next id for a table
const nextId = (items) => {
  if (!items || items.length === 0) return 1;
  return Math.max(...items.map(i => i.id || 0)) + 1;
};

// Core API
const getAll = (table) => {
  const db = loadData();
  return db[table] || [];
};

const getById = (table, id) => {
  const items = getAll(table);
  return items.find(i => i.id === Number(id));
};

const findBy = (table, field, value) => {
  const items = getAll(table);
  return items.filter(i => i[field] == value);
};

const insert = (table, obj) => {
  const db = loadData();
  const items = db[table] || [];
  const id = nextId(items);
  const now = new Date().toISOString();
  const record = { id, ...obj, created_at: now };
  items.push(record);
  db[table] = items;
  saveData(db);
  return record;
};

const update = (table, id, updates) => {
  const db = loadData();
  const items = db[table] || [];
  const idx = items.findIndex(i => i.id === Number(id));
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...updates };
  db[table] = items;
  saveData(db);
  return items[idx];
};

const remove = (table, id) => {
  const db = loadData();
  const items = db[table] || [];
  const idx = items.findIndex(i => i.id === Number(id));
  if (idx === -1) return false;
  items.splice(idx, 1);
  db[table] = items;
  saveData(db);
  return true;
};

module.exports = {
  loadData,
  saveData,
  getAll,
  getById,
  findBy,
  insert,
  update,
  remove,
  DATA_FILE
};