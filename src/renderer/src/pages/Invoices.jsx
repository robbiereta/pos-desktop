import React from 'react';
export default function Invoices() {
  return (
    <div>
      <div className="page-title">🧾 Facturas</div>
      <div className="card">
        <div className="empty-state">
          <div className="icon">🧾</div>
          <p>Las facturas se generan desde el backend en Hetzner.</p>
          <p style={{marginTop:8,fontSize:13,color:'#718096'}}>Usa el POS para registrar ventas, y desde el backend podrás timbrar CFDI.</p>
        </div>
      </div>
    </div>
  );
}
