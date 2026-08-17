# POS Desktop — SPEC

> Electron + React + Vite + SQLite (sql.js). App de escritorio para punto de venta con base de datos local y sync bidireccional con el backend de Hetzner.

## 1. Concepto y Visión

Una app de escritorio que corre 100% offline — el POS funciona sin internet, guarda todo en SQLite local, y cuando hay conexión sincroniza con `nefapi-cfdis` en Hetzner. El usuario tiene su sistema de siempre (ventas, productos, clientes, facturas) en una app nativa instalada en su máquina, sin depender del navegador.

Tech stack: **Electron + Vite + React + sql.js (SQLite embebido en WASM)**

---

## 2. Diseño

- **UI:** mismo diseño que el frontend web existente (colores #667eea / #764ba2, cards con border-radius)
- **Fuente:** system-ui / Inter / Arial
- **Layout:** sidebar navigation (Dashboard, POS, Productos, Clientes, Ventas, Facturas, Config) + contenido principal
- **Tema:** claro,勿

---

## 3. Arquitectura

```
┌─────────────────────────────────────────────┐
│  Electron Main Process                      │
│  ├── SQLite (sql.js / WASM)                │
│  ├── API sync service                      │
│  ├── Auto-updater                          │
│  └── IPC handlers                          │
├─────────────────────────────────────────────┤
│  Renderer (React + Vite)                   │
│  ├── Pages: Dashboard, POS, Products,       │
│  │   Clients, Sales, Invoices, Settings    │
│  ├── Services: sqlite.js (IPC to main)      │
│  └── Services: api.js (backend proxy)       │
└─────────────────────────────────────────────┘
```

**Sync strategy:**
- Ventas → se crean localmente en SQLite, se encolan para sync
- Productos / Clientes → se leen de SQLite (offline-first), sync cada 5 min o al reconnect
- Cola de sync: tabla `sync_queue` en SQLite, se vacía cuando la API responde OK
- Conflictos: gana el servidor (timestamp más reciente)

---

## 4. Módulos

### 4.1 POS (Punto de Venta)
- Catálogo de productos desde SQLite
- Carrito con cálculo de IVA 16%
- quick-add product modal (crear producto inline)
- Selección de cliente
- Método / forma de pago
- Al registrar venta: guardar en SQLite + encolar para sync
- Impresión de ticket térmico (ventana de impresión del SO)
- Si hay conexión: registrar venta en el backend inmediatamente

### 4.2 Productos
- CRUD completo local en SQLite
- Sync con `GET /api/products` del backend
- Campos: nombre, sku, descripcion, precioVenta, categoria, claveSAT, activo
- Búsqueda inline por nombre / SKU

### 4.3 Clientes
- CRUD local en SQLite
- Sync con `GET /api/clients`
- RFC + nombre + usoCFDI + email

### 4.4 Ventas
- Lista de ventas locales
- Estado: `pending_sync` | `synced` | `error`
- Reintento manual de sync
- Ver detalle de venta

### 4.5 Facturas (Cfdis)
- Lista de facturas timbradas desde el backend
- Generar factura desde una venta (copiar datos SAT)
- Ver PDF del CFDI

### 4.6 Configuración
- URL del backend (por defecto: `https://cfdis.nefeshapps.site`)
- Puerto del servidor local (default 5002)
- Printer config (receipt width 58mm / 80mm)
- Sync interval
- Ver estado de sync

---

## 5. Base de datos SQLite

### Tablas locales

```sql
-- Productos
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  sku TEXT,
  descripcion TEXT,
  precioVenta REAL NOT NULL,
  precioUnitario REAL,
  categoria TEXT,
  claveProdServ TEXT DEFAULT '01010101',
  claveUnidad TEXT DEFAULT 'E48',
  unidad TEXT DEFAULT 'Pieza',
  activo INTEGER DEFAULT 1,
  synced_at TEXT,
  updated_at TEXT
);

-- Clientes
CREATE TABLE clients (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  rfc TEXT,
  usoCFDI TEXT DEFAULT 'G03',
  regimenFiscal TEXT,
  email TEXT,
  telefono TEXT,
  synced_at TEXT,
  updated_at TEXT
);

-- Ventas
CREATE TABLE sales (
  id TEXT PRIMARY KEY,
  folio TEXT,
  customer_id TEXT,
  customer_name TEXT,
  customer_rfc TEXT,
  items TEXT,  -- JSON
  subtotal REAL,
  total REAL,
  total_impuestos REAL,
  metodoPago TEXT,
  formaPago TEXT,
  status TEXT DEFAULT 'completed',
  sync_status TEXT DEFAULT 'pending_sync',  -- pending_sync | synced | error
  synced_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Sync queue
CREATE TABLE sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity TEXT,   -- 'sale'
  entity_id TEXT,
  action TEXT,   -- 'create'
  payload TEXT,  -- JSON
  retries INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
```

---

## 6. API del main process (IPC)

```
db:products:list      → [{...}]
db:products:get       → {...}
db:products:upsert    → {ok, id}
db:products:delete    → {ok}

db:clients:list       → [{...}]
db:clients:upsert     → {ok, id}

db:sales:create       → {ok, id}
db:sales:list         → [{...}]
db:sales:get          → {...}

sync:trigger          → {queued, count}
sync:status           → {pending, errors, lastSync}

config:get            → {...}
config:set            → {ok}
```

---

## 7. Build

- **electron-vite** (vite + electron, HMR en dev)
- **electron-builder** para generar `.exe` (Windows), `.dmg` (macOS), `.AppImage` (Linux)
- App name: `NefeshPOS`
- Output: `dist/` (carpeta distribuible)

---

## 8. Validación

- App abre sin errores
- POS permite agregar productos al carrito
- Las ventas se guardan en SQLite
- Sync queue tiene elementos cuando no hay conexión
- Config permite cambiar URL del backend
