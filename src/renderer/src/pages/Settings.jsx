import React, { useState, useEffect } from 'react';
export default function Settings() {
  const [cfg, setCfg] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  useEffect(() => { window.api.getConfig().then(c => setCfg(c||{})); }, []);
  const save = async (key, value) => {
    await window.api.setConfig(key, value);
    setCfg(prev => ({...prev, [key]: value}));
    setMsg('✓ Guardado');
    setTimeout(()=>setMsg(''), 2000);
  };
  return (
    <div>
      <div className="page-title">⚙️ Configuración</div>
      {msg && <div style={{background:'#d1fae5',color:'#065f46',padding:'8px 14px',borderRadius:8,marginBottom:16,fontWeight:600}}>{msg}</div>}
      <div className="card" style={{marginBottom:16}}>
        <div className="card-title">🌐 Conexión al Backend</div>
        <div className="form-group">
          <label className="input-label">URL del backend</label>
          <div style={{display:'flex',gap:8}}>
            <input className="input" value={cfg.backendUrl||''} onChange={e=>setCfg(c=>({...c,backendUrl:e.target.value}))} placeholder="cfdis.nefeshapps.site" />
            <button className="btn btn-primary" onClick={()=>save('backendUrl',cfg.backendUrl)}>Guardar</button>
          </div>
          <small style={{color:'#718096',marginTop:4,display:'block'}}>Dirección del servidor Hetzner (sin https://)</small>
        </div>
      </div>
      <div className="card" style={{marginBottom:16}}>
        <div className="card-title">🔄 Sync</div>
        <div className="form-group">
          <label className="input-label">Intervalo de sync (ms)</label>
          <div style={{display:'flex',gap:8}}>
            <input className="input" type="number" value={cfg.syncIntervalMs||300000} onChange={e=>setCfg(c=>({...c,syncIntervalMs:e.target.value}))} />
            <button className="btn btn-primary" onClick={()=>save('syncIntervalMs',cfg.syncIntervalMs)}>Guardar</button>
          </div>
          <small style={{color:'#718096',marginTop:4,display:'block'}}>Por defecto 300000ms (5 min)</small>
        </div>
      </div>
      <div className="card" style={{marginBottom:16}}>
        <div className="card-title">🖨️ Impresora</div>
        <div className="form-group">
          <label className="input-label">Ancho del ticket</label>
          <select className="input" value={cfg.receiptWidth||'58mm'} onChange={e=>save('receiptWidth',e.target.value)} style={{maxWidth:200}}>
            <option value="58mm">58mm</option>
            <option value="80mm">80mm</option>
          </select>
        </div>
      </div>
      <div className="card">
        <div className="card-title">📋 Acciones</div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          <button className="btn btn-secondary" onClick={()=>window.api.triggerSync().then(()=>setMsg('✓ Sync completo'))}>🔄 Forzar sync ahora</button>
          <button className="btn btn-secondary" onClick={()=>window.api.syncProducts().then(()=>setMsg('✓ Productos sincronizados'))}>☁️ Sync productos</button>
          <button className="btn btn-secondary" onClick={()=>window.api.syncClients().then(()=>setMsg('✓ Clientes sincronizados'))}>👥 Sync clientes</button>
        </div>
      </div>
    </div>
  );
}
