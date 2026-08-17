/**
 * sync.js — Background sync service
 * Lee la sync_queue y envía ventas pendientes al backend
 */
const log = require('electron-log');
const db = require('./database');

let syncTimer = null;
let isOnline = true;

function start(backendUrl) {
  log.info('[Sync] Starting, backend:', backendUrl);
  runSync(backendUrl).catch(e => log.error('[Sync] runSync error:', e));
  // poll every syncInterval
  syncTimer = setInterval(() => {
    runSync(backendUrl).catch(e => log.error('[Sync] runSync error:', e));
  }, 5 * 60 * 1000); // 5 min
}

function stop() {
  if (syncTimer) { clearInterval(syncTimer); syncTimer = null; }
  log.info('[Sync] Stopped');
}

async function runSync(backendUrl) {
  const queue = db.getSyncQueue();
  if (queue.length === 0) {
    log.info('[Sync] Empty queue, skipping');
    return { synced: 0 };
  }

  log.info(`[Sync] Processing ${queue.length} item(s)`);
  let synced = 0;

  for (const item of queue) {
    try {
      if (item.entity === 'sale') {
        const payload = JSON.parse(item.payload);
        const url = `https://${backendUrl}/api/sales`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok || res.status === 409) {
          // 409 = already exists, consider it synced
          db.markSaleSynced(payload.id);
          db.removeSyncQueueItem(item.id);
          synced++;
          log.info(`[Sync] Sale ${payload.id} synced`);
        } else {
          throw new Error(`HTTP ${res.status}`);
        }
      }
    } catch (err) {
      log.warn(`[Sync] Item ${item.id} failed: ${err.message}`);
      db.incrementSyncRetries(item.id, err.message);
      if (item.retries >= 5) {
        db.run(`UPDATE sales SET sync_status='error' WHERE id=?`, [item.entity_id]);
        db.saveDB();
      }
    }
  }

  log.info(`[Sync] Done. Synced: ${synced}`);
  return { synced };
}

async function syncProducts(backendUrl) {
  try {
    const res = await fetch(`https://${backendUrl}/api/products?limit=500&activo=true`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const products = json.data?.products || json.data || [];
    for (const p of products) {
      db.upsertProduct({ ...p, synced_at: new Date().toISOString() });
    }
    log.info(`[Sync] Products: synced ${products.length}`);
    return { ok: true, count: products.length };
  } catch (err) {
    log.warn('[Sync] Products sync failed:', err.message);
    return { ok: false, error: err.message };
  }
}

async function syncClients(backendUrl) {
  try {
    const res = await fetch(`https://${backendUrl}/api/clients?limit=500`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const clients = json.data?.clients || json.data || [];
    for (const c of clients) {
      db.upsertClient({ ...c, synced_at: new Date().toISOString() });
    }
    log.info(`[Sync] Clients: synced ${clients.length}`);
    return { ok: true, count: clients.length };
  } catch (err) {
    log.warn('[Sync] Clients sync failed:', err.message);
    return { ok: false, error: err.message };
  }
}

async function triggerSync(backendUrl) {
  // Immediate full sync
  const [saleResult, productResult, clientResult] = await Promise.all([
    runSync(backendUrl),
    syncProducts(backendUrl),
    syncClients(backendUrl),
  ]);
  return { saleResult, productResult, clientResult };
}

module.exports = { start, stop, triggerSync, syncProducts, syncClients };
