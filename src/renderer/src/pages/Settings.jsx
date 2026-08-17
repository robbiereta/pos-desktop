import React, { useState, useEffect } from 'react';
export default function Settings() {
  const [cfg, setCfg] = useState({});
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
        <div className="card-title">🖨️ Impresora</div>
        <div className="form-group">
          <label className="input-label">Ancho del ticket</label>
          <select className="input" value={cfg.receiptWidth||'58mm'} onChange={e=>save('receiptWidth',e.target.value)} style={{maxWidth:200}}>
            <option value="58mm">58mm</option>
            <option value="80mm">80mm</option>
          </select>
        </div>
      </div>
      <div className="card" style={{marginBottom:16}}>
        <div className="card-title">📋 Datos</div>
        <p style={{fontSize:13,color:'#718096',marginBottom:12}}>Todos los datos se guardan localmente en SQLite. No requieren conexión a internet.</p>
        <p style={{fontSize:13,color:'#718096'}}>Los productos y clientes se crean desde el POS o la página de Productos/Clientes.</p>
      </div>
      <div className="card">
        <div className="card-title">ℹ️ Acerca de</div>
        <p style={{fontSize:13}}><strong>NefeshPOS</strong> v1.0</p>
        <p style={{fontSize:12,color:'#718096',marginTop:4}}>Electron + React + SQLite. 100% offline.</p>
      </div>
    </div>
  );
}
