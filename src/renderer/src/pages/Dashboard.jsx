import React, { useEffect, useState } from 'react';
export default function Dashboard({ onNav }) {
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState({ pending: 0, errors: 0, lastSync: null });
  const [cfg, setCfg] = useState({});
  useEffect(() => {
    window.api.listSales().then(s => setSales(s||[]));
    window.api.syncStatus().then(st => setStats(st));
    window.api.getConfig().then(c => setCfg(c));
  }, []);
  const today = ((sales||[]).filter(s => { const d=new Date(s.created_at),n=new Date(); return d.toDateString()===n.toDateString(); }));
  const totalToday = today.reduce((a,s)=>a+(parseFloat(s.total)||0),0);
  const totalAll = (sales||[]).reduce((a,s)=>a+(parseFloat(s.total)||0),0);
  return (
    <div>
      <div className="page-title">📊 Dashboard</div>
      <div className="stats-grid">
        <div className="stat-card"><div className="label">Ventas hoy</div><div className="value">{today.length}</div><div className="sub">${totalToday.toFixed(2)} MXN</div></div>
        <div className="stat-card"><div className="label">Total local</div><div className="value">{(sales||[]).length}</div><div className="sub">${totalAll.toFixed(2)} MXN</div></div>
        <div className="stat-card"><div className="label">Pendiente sync</div><div className="value" style={{color:(stats.pending||0)>0?'#f6ad55':'#10b981'}}>{(stats.pending||0)}</div><div className="sub">{(stats.errors||0)>0?`${stats.errors} errores`:'✓ Al día'}</div></div>
        <div className="stat-card"><div className="label">Último sync</div><div className="value" style={{fontSize:14}}>{stats.lastSync?new Date(stats.lastSync).toLocaleString('es-MX'):'Nunca'}</div><div className="sub">{(cfg.backendUrl||'').replace('https://','')}</div></div>
      </div>
      <div className="card" style={{marginTop:20}}>
        <div className="card-title">Últimas ventas</div>
        {(sales||[]).length===0?<div className="empty-state"><p>Sin ventas registradas</p></div>:
        <table className="table"><thead><tr><th>Folio</th><th>Cliente</th><th>Total</th><th>Sync</th><th>Fecha</th></tr></thead>
        <tbody>{(sales||[]).slice(0,10).map(s=><tr key={s.id}><td><strong>{(s.folio||s.id).slice(0,10)}</strong></td><td>{s.customer_name}</td><td><strong>${parseFloat(s.total||0).toFixed(2)}</strong></td><td><span className={`badge ${s.sync_status==='synced'?'badge-success':s.sync_status==='error'?'badge-danger':'badge-warning'}`}>{s.sync_status}</span></td><td>{new Date(s.created_at).toLocaleString('es-MX')}</td></tr>)}</tbody></table>}
      </div>
      <div style={{marginTop:16,display:'flex',gap:10}}>
        <button className="btn btn-primary" onClick={()=>window.api.triggerSync().then(()=>Promise.all([window.api.syncStatus().then(s=>setStats(s)),window.api.listSales().then(s=>setSales(s||[]))]))}>🔄 Forzar sync</button>
        <button className="btn btn-secondary" onClick={()=>Promise.all([window.api.syncProducts(),window.api.syncClients()]).then(()=>window.api.listSales().then(s=>setSales(s||[])))}>☁️ Sync productos y clientes</button>
      </div>
    </div>
  );
}
