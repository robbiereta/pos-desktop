const { ipcMain } = require('electron');
const db = require('./database');
const sync = require('./sync');

function register(backendUrlGetter) {
  ipcMain.handle('db:products:list', () => db.listProducts());
  ipcMain.handle('db:products:get', (_, id) => db.getProduct(id));
  ipcMain.handle('db:products:upsert', (_, p) => db.upsertProduct(p));
  ipcMain.handle('db:products:delete', (_, id) => db.deleteProduct(id));
  ipcMain.handle('db:clients:list', () => db.listClients());
  ipcMain.handle('db:clients:upsert', (_, c) => db.upsertClient(c));
  ipcMain.handle('db:sales:create', (_, sale) => db.createSale(sale));
  ipcMain.handle('db:sales:list', () => db.listSales());
  ipcMain.handle('db:sales:get', (_, id) => db.getSale(id));
  ipcMain.handle('sync:trigger', async () => { const url = backendUrlGetter(); return sync.triggerSync(url); });
  ipcMain.handle('sync:status', () => db.getSyncStats());
  ipcMain.handle('sync:products', async () => { const url = backendUrlGetter(); return sync.syncProducts(url); });
  ipcMain.handle('sync:clients', async () => { const url = backendUrlGetter(); return sync.syncClients(url); });
  ipcMain.handle('config:get', () => db.getConfig());
  ipcMain.handle('config:set', (_, { key, value }) => db.setConfig(key, value));
  ipcMain.handle('app:getVersion', () => { const { app } = require('electron'); return app.getVersion(); });
}
module.exports = { register };
