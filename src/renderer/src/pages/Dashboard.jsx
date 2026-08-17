import React, { useEffect, useState } from 'react';
export default function Dashboard() {
  const [sales, setSales] = useState([]);
  useEffect(() => { window.api.listSales().then(s => setSales(s||[])); }, []);
  const today = (sales||[]).filter(s => { const d=new Date(s.created_at),n=new Date(); return d.toDateString()===n.toDateString(); });
  const totalToday = today.reduce((a,s)=>a+(parseFloat(s.total)||0),0);
  const totalAll = (sales||[]).reduce((a,s)=>a+(parseFloat(s.total)||0),0);
  return (
    <div>
      <div className="page-title">📊 Dashboard</div>
      <div className="stats-grid">
        <div className="stat-card"><div className="label">Ventas hoy</div><div className="value">{today.length}</div><div className="sub">${totalToday.toFixed(2)} MXN</div></div>
        <div className="stat-card"><div className="label">Total ventas</div><div className="value">{(sales||[]).length}</div><div className="sub">${totalAll.toFixed(2)} MXN</div></div>
        <div className="stat-card"><div className="label">Productos locales</div><div className="value">—</div><div className="sub">Ve la página de Productos</div></div>
        <div className="stat-card"><div className="label">Modo</div><div className="value" style={{fontSize:16}}>📴 100% Offline</div><div className="sub">Sin conexión al backend</div></div>
      </div>
      <div className="card" style={{marginTop:20}}>
        <div className="card-title">Últimas ventas</div>
        {(sales||[]).length===0?<div className="empty-state"><p>Sin ventas registradas. Ve al POS para registrar tu primera venta.</p></div>:
        <table className="table"><thead><tr><th>Folio</th><th>Cliente</th><th>Total</th><th>Método</th><th>Fecha</th></tr></thead>
        <tbody>{(sales||[]).slice(0,10).map(s=><tr key={s.id}><td><strong>{(s.folio||s.id).slice(0,10)}</strong></td><td>{s.customer_name}</td><td><strong>${parseFloat(s.total||0).toFixed(2)}</strong></td><td>{s.metodoPago}/{s.formaPago}</td><td>{new Date(s.created_at).toLocaleString('es-MX')}</td></tr>)}</tbody></table>}
      </div>
    </div>
  );
}
