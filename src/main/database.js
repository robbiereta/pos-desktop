const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const log = require('electron-log');

let db = null;

const DB_PATH = () => path.join(app.getPath('userData'), 'npos.db');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS products (
  id             TEXT PRIMARY KEY,
  nombre         TEXT NOT NULL,
  sku            TEXT,
  descripcion    TEXT,
  precioVenta    REAL NOT NULL DEFAULT 0,
  precioUnitario REAL,
  categoria      TEXT DEFAULT 'General',
  claveProdServ  TEXT DEFAULT '01010101',
  claveUnidad    TEXT DEFAULT 'E48',
  unidad         TEXT DEFAULT 'Pieza',
  activo        INTEGER DEFAULT 1,
  updated_at     TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS clients (
  id             TEXT PRIMARY KEY,
  nombre         TEXT NOT NULL,
  rfc            TEXT DEFAULT 'XAXX010101000',
  usoCFDI        TEXT DEFAULT 'G03',
  regimenFiscal  TEXT DEFAULT '616',
  email          TEXT,
  telefono       TEXT,
  updated_at     TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sales (
  id               TEXT PRIMARY KEY,
  folio            TEXT,
  customer_id      TEXT,
  customer_name    TEXT,
  customer_rfc     TEXT,
  items            TEXT,
  subtotal         REAL,
  total            REAL,
  total_impuestos  REAL,
  metodoPago       TEXT DEFAULT 'PUE',
  formaPago        TEXT DEFAULT '01',
  status           TEXT DEFAULT 'completed',
  created_at       TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS config (
  key   TEXT PRIMARY KEY,
  value TEXT
);
`;

async function initDB() {
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();
  const dbPath = DB_PATH();
  log.info('[DB] Initializing at', dbPath);

  let raw;
  if (fs.existsSync(dbPath)) {
    raw = fs.readFileSync(dbPath);
    log.info('[DB] Loading existing database');
  }

  db = new SQL.Database(raw);
  db.run(SCHEMA);

  if (!fs.existsSync(dbPath)) {
    saveDB();
    log.info('[DB] Created new database');
  }

  // Default config
  const defaults = { receiptWidth: '58mm' };
  for (const [k, v] of Object.entries(defaults)) {
    const row = db.exec(`SELECT value FROM config WHERE key = ?`, [k]);
    if (row.length === 0 || row[0].values.length === 0) {
      db.run(`INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)`, [k, v]);
    }
  }
  saveDB();
  log.info('[DB] Ready');
  return db;
}

function saveDB() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH(), Buffer.from(data));
}

// Products
function listProducts() {
  const rows = db.exec(`SELECT * FROM products WHERE activo = 1 ORDER BY nombre`);
  return rowsToObjects(rows);
}
function getProduct(id) {
  const rows = db.exec(`SELECT * FROM products WHERE id = ?`, [id]);
  const arr = rowsToObjects(rows);
  return arr[0] || null;
}
function upsertProduct(p) {
  const existing = getProduct(p.id);
  if (existing) {
    db.run(`
      UPDATE products SET
        nombre=?, sku=?, descripcion=?, precioVenta=?, precioUnitario=?,
        categoria=?, claveProdServ=?, claveUnidad=?, unidad=?, activo=?,
        updated_at=datetime('now')
      WHERE id=?`,
      [p.nombre, p.sku||null, p.descripcion||null, p.precioVenta,
       p.precioUnitario||null, p.categoria||'General', p.claveProdServ||'01010101',
       p.claveUnidad||'E48', p.unidad||'Pieza', p.activo!==false?1:0, p.id]);
  } else {
    db.run(`
      INSERT INTO products (id,nombre,sku,descripcion,precioVenta,precioUnitario,categoria,claveProdServ,claveUnidad,unidad,activo)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [p.id, p.nombre, p.sku||null, p.descripcion||null, p.precioVenta||0,
       p.precioUnitario||null, p.categoria||'General', p.claveProdServ||'01010101',
       p.claveUnidad||'E48', p.unidad||'Pieza', p.activo!==false?1:0]);
  }
  saveDB();
  return { ok: true, id: p.id };
}
function deleteProduct(id) {
  db.run(`UPDATE products SET activo=0, updated_at=datetime('now') WHERE id=?`, [id]);
  saveDB();
  return { ok: true };
}

// Clients
function listClients() {
  const rows = db.exec(`SELECT * FROM clients ORDER BY nombre`);
  return rowsToObjects(rows);
}
function upsertClient(c) {
  const existing = db.exec(`SELECT id FROM clients WHERE id=?`, [c.id]);
  if (existing.length > 0 && existing[0].values.length > 0) {
    db.run(`
      UPDATE clients SET nombre=?, rfc=?, usoCFDI=?, regimenFiscal=?, email=?, telefono=?,
        updated_at=datetime('now')
      WHERE id=?`,
      [c.nombre, c.rfc||'XAXX010101000', c.usoCFDI||'G03', c.regimenFiscal||'616',
       c.email||null, c.telefono||null, c.id]);
  } else {
    db.run(`
      INSERT INTO clients (id,nombre,rfc,usoCFDI,regimenFiscal,email,telefono)
      VALUES (?,?,?,?,?,?,?)`,
      [c.id, c.nombre, c.rfc||'XAXX010101000', c.usoCFDI||'G03',
       c.regimenFiscal||'616', c.email||null, c.telefono||null]);
  }
  saveDB();
  return { ok: true, id: c.id };
}

// Sales
function createSale(sale) {
  db.run(`
    INSERT INTO sales (id,folio,customer_id,customer_name,customer_rfc,items,subtotal,total,total_impuestos,metodoPago,formaPago,status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [sale.id, sale.folio||null, sale.customerId||null, sale.customerName||'PUBLICO EN GENERAL',
     sale.customerRfc||'XAXX010101000', JSON.stringify(sale.items||[]),
     sale.subtotal||0, sale.total||0, sale.totalImpuestos||0,
     sale.metodoPago||'PUE', sale.formaPago||'01', sale.status||'completed']);
  saveDB();
  return { ok: true, id: sale.id };
}
function listSales() {
  const rows = db.exec(`SELECT * FROM sales ORDER BY created_at DESC`);
  return rowsToObjects(rows);
}
function getSale(id) {
  const rows = db.exec(`SELECT * FROM sales WHERE id=?`, [id]);
  const arr = rowsToObjects(rows);
  if (!arr[0]) return null;
  const s = arr[0];
  s.items = JSON.parse(s.items || '[]');
  return s;
}

// Config
function getConfig() {
  const rows = db.exec(`SELECT key, value FROM config`);
  const obj = {};
  for (const row of rowsToObjects(rows)) obj[row.key] = row.value;
  return obj;
}
function setConfig(key, value) {
  db.run(`INSERT OR REPLACE INTO config (key, value) VALUES (?,?)`, [key, String(value)]);
  saveDB();
  return { ok: true };
}

// Helpers
function rowsToObjects(rows) {
  if (!rows || rows.length === 0) return [];
  const cols = rows[0].columns;
  return rows[0].values.map(v => {
    const o = {};
    cols.forEach((c, i) => { o[c] = v[i]; });
    return o;
  });
}

module.exports = {
  initDB, saveDB,
  listProducts, getProduct, upsertProduct, deleteProduct,
  listClients, upsertClient,
  createSale, listSales, getSale,
  getConfig, setConfig,
};
