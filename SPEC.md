# POS Desktop — SPEC (100% Local)

> Electron + React + Vite + SQLite. App de escritorio para punto de venta, **sin conexión al backend**. Todos los datos viven en SQLite local.

## 1. Concepto y Visión

App de escritorio que funciona **100% offline** — sin internet, sin servidor externo. El POS guarda ventas, productos y clientes en SQLite local. Para gerar facturas CFDI se puede hacer desde el backend de Hetzner cuando haya conexión.

Tech stack: **Electron + Vite + React + sql.js (SQLite embebido en WASM)**

---

## 2. Diseño

- **UI:** mismo diseño que el frontend web existente (colores #667eea / #764ba2, cards con border-radius)
- **Fuente:** system-ui / Inter / Arial
- **Layout:** sidebar navigation (Dashboard, POS, Productos, Clientes, Ventas, Config)
- **Tema:** claro, profesional

---

## 3. Arquitectura

```
┌─────────────────────────────────────────────┐
│  Electron Main Process                       │
│  ├── SQLite (sql.js / WASM) — TODO local   │
│  ├── IPC handlers                          │
│  └── Auto-updater                          │
├─────────────────────────────────────────────┤
│  Renderer (React + Vite)                   │
│  ├── Pages: Dashboard, POS, Products,       │
│  │   Clients, Sales, Config               │
│  └── Services: sqlite.js (IPC to main)      │
└─────────────────────────────────────────────┘
```

**Sin sync** — todos los datos son locales. No hay cola de sincronización.

---

## 4. Módulos

### 4.1 POS (Punto de Venta)
- Catálogo de productos desde SQLite local
- Carrito con cálculo de IVA 16%
- quick-add product modal (crear producto inline)
- Selección de cliente (o "PÚBLICO EN GENERAL")
- Método / forma de pago
- Registrar venta en SQLite

### 4.2 Productos
- CRUD completo en SQLite
- Campos: nombre, sku, descripcion, precioVenta, categoria, claveSAT, activo

### 4.3 Clientes
- CRUD en SQLite
- RFC + nombre + usoCFDI

### 4.4 Ventas
- Lista de ventas locales
- Ver detalle

### 4.5 Configuración
- Printer config (receipt width 58mm / 80mm)
- Reiniciar base de datos (opcional)

---

## 5. Base de datos SQLite (sql.js / WASM)

### Tablas locales

```sql
CREATE TABLE products (
  id           TEXT PRIMARY KEY,
  nombre       TEXT NOT NULL,
  sku          TEXT,
  descripcion  TEXT,
  precioVenta  REAL NOT NULL DEFAULT 0,
  precioUnitario REAL,
  categoria    TEXT DEFAULT 'General',
  claveProdServ TEXT DEFAULT '01010101',
  claveUnidad  TEXT DEFAULT 'E48',
  unidad       TEXT DEFAULT 'Pieza',
  activo       INTEGER DEFAULT 1,
  updated_at   TEXT DEFAULT (datetime('now'))
);

CREATE TABLE clients (
  id           TEXT PRIMARY KEY,
  nombre       TEXT NOT NULL,
  rfc          TEXT DEFAULT 'XAXX010101000',
  usoCFDI      TEXT DEFAULT 'G03',
  regimenFiscal TEXT,
  email        TEXT,
  telefono     TEXT,
  updated_at   TEXT DEFAULT (datetime('now'))
);

CREATE TABLE sales (
  id            TEXT PRIMARY KEY,
  folio         TEXT,
  customer_id   TEXT,
  customer_name TEXT,
  customer_rfc  TEXT,
  items         TEXT,
  subtotal      REAL,
  total         REAL,
  total_impuestos REAL,
  metodoPago    TEXT DEFAULT 'PUE',
  formaPago     TEXT DEFAULT '01',
  status        TEXT DEFAULT 'completed',
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE config (
  key   TEXT PRIMARY KEY,
  value TEXT
);
```

---

## 6. IPC del main process

```
db:products:list      → [{...}]
db:products:upsert    → {ok, id}
db:products:delete    → {ok}
db:clients:list       → [{...}]
db:clients:upsert     → {ok, id}
db:sales:create       → {ok, id}
db:sales:list         → [{...}]
db:sales:get          → {...}
config:get            → {...}
config:set            → {ok}
app:getVersion        → string
```

---

## 7. Build

- **electron-vite** (vite + electron)
- **electron-builder** → `.exe` (Windows), `.AppImage` (Linux)
- App name: `NefeshPOS`
- Output: `dist/`

---

## 8. Validación

- App abre sin errores
- POS permite agregar/quitar productos
- Las ventas se guardan en SQLite
- Productos y clientes persisten al cerrar y reabrir
- No requiere conexión a internet
