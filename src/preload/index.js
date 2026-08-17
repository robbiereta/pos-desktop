const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  listProducts:  () => ipcRenderer.invoke('db:products:list'),
  getProduct:    (id) => ipcRenderer.invoke('db:products:get', id),
  upsertProduct: (p) => ipcRenderer.invoke('db:products:upsert', p),
  deleteProduct: (id) => ipcRenderer.invoke('db:products:delete', id),

  listClients:  () => ipcRenderer.invoke('db:clients:list'),
  upsertClient: (c) => ipcRenderer.invoke('db:clients:upsert', c),

  createSale: (sale) => ipcRenderer.invoke('db:sales:create', sale),
  listSales:  () => ipcRenderer.invoke('db:sales:list'),
  getSale:    (id) => ipcRenderer.invoke('db:sales:get', id),

  getConfig:  () => ipcRenderer.invoke('config:get'),
  setConfig:  (k, v) => ipcRenderer.invoke('config:set', { key: k, value: v }),

  getVersion: () => ipcRenderer.invoke('app:getVersion'),
});
