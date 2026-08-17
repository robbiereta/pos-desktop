import React, { useState, useEffect } from 'react';
export default function Sales() {
  const [sales, setSales] = useState([]);
  useEffect(() => { window.api.listSales().then(s => setSales(s||[])); }, []);
  return (
    <div>
      <div className="page-title">💰 Ventas</div>
      <div style={{marginBottom:16}}>
        <button className="btn btn-secondary" onClick={()=>window.api.listSales().then(s=>setSales(s||[]))}>🔃 Actualizar</button>
      </div>
      {(sales||[]).length===0 ? <div className="empty-state"><p>Sin ventas registradas</p></div> :
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <table className="table"><thead><tr><th>Folio</th><th>Cliente</th><th>Total</th><th>Método</th><th>Fecha</th></tr></thead>
        <tbody>{sales.map(s=><tr key={s.id}>
          <td><strong>{s.folio||s.id.slice(0,10)}</strong></td>
          <td>{s.customer_name}</td>
          <td><strong>${parseFloat(s.total||0).toFixed(2)}</strong></td>
          <td>{s.metodoPago}/{s.formaPago}</td>
          <td>{new Date(s.created_at).toLocaleString('es-MX')}</td>
        </tr>)}</tbody></table>
      </div>}
    </div>
  );
}
