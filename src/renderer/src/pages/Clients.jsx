import React, { useState, useEffect } from 'react';
export default function Clients() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nombre:'', rfc:'XAXX010101000', usoCFDI:'G03', regimenFiscal:'616', email:'', telefono:'' });
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState({});
  const inputStyle = { width:'100%', padding:'8px 10px', fontSize:'13px', borderRadius:'6px', border:'1.5px solid #e2e8f0', outline:'none', boxSizing:'border-box' };
  useEffect(() => { window.api.listClients().then(c => setClients(c||[])); }, []);
  const filtered = (clients||[]).filter(c => !search || (c.nombre||'').toLowerCase().includes(search.toLowerCase()) || (c.rfc||'').toLowerCase().includes(search.toLowerCase()));
  const openNew = () => { setEditing(null); setForm({nombre:'',rfc:'XAXX010101000',usoCFDI:'G03',regimenFiscal:'616',email:'',telefono:''}); setFormErr({}); setShowModal(true); };
  const openEdit = (c) => { setEditing(c); setForm({nombre:c.nombre||'',rfc:c.rfc||'XAXX010101000',usoCFDI:c.usoCFDI||'G03',regimenFiscal:c.regimenFiscal||'616',email:c.email||'',telefono:c.telefono||''}); setFormErr({}); setShowModal(true); };
  const handleSave = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.nombre.trim()) errs.nombre = 'Requerido';
    if (Object.keys(errs).length) { setFormErr(errs); return; }
    setSaving(true);
    const id = editing?.id || `client_${Date.now()}`;
    await window.api.upsertClient({ ...editing, ...form, id });
    window.api.listClients().then(c => setClients(c||[]));
    setShowModal(false); setSaving(false);
  };
  return (
    <div>
      <div className="page-title">👥 Clientes</div>
      <div className="search-bar" style={{marginBottom:16}}>
        <input className="input" placeholder="🔍 Buscar..." value={search} onChange={e=>setSearch(e.target.value)} />
        <button className="btn btn-primary" onClick={openNew}>➕ Nuevo cliente</button>
      </div>
      {(clients||[]).length===0 ? <div className="empty-state"><p>Sin clientes. Sincroniza desde Config.</p></div> :
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <table className="table"><thead><tr><th>Nombre</th><th>RFC</th><th>Uso CFDI</th><th>Email</th><th></th></tr></thead>
        <tbody>{filtered.map(c=><tr key={c.id}><td><strong>{c.nombre}</strong></td><td>{c.rfc}</td><td>{c.usoCFDI}</td><td>{c.email||'—'}</td><td><button className="btn btn-secondary btn-sm" onClick={()=>openEdit(c)}>Editar</button></td></tr>)}</tbody></table>
      </div>}
      {showModal && (
        <div className="modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h2>{editing?'✏️ Editar':'➕ Nuevo'} cliente</h2><button className="modal-close" onClick={()=>setShowModal(false)}>✕</button></div>
            <form onSubmit={handleSave} className="modal-body">
              <div className="form-group"><label className="input-label">Nombre *</label><input value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} style={{...inputStyle, borderColor:formErr.nombre?'#dc3545':'#e2e8f0'}} />{formErr.nombre&&<span style={{color:'#dc3545',fontSize:11}}>{formErr.nombre}</span>}</div>
              <div className="form-row">
                <div className="form-group"><label className="input-label">RFC</label><input value={form.rfc} onChange={e=>setForm(f=>({...f,rfc:e.target.value}))} style={inputStyle} /></div>
                <div className="form-group"><label className="input-label">Uso CFDI</label><input value={form.usoCFDI} onChange={e=>setForm(f=>({...f,usoCFDI:e.target.value}))} style={inputStyle} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="input-label">Régimen Fiscal</label><input value={form.regimenFiscal} onChange={e=>setForm(f=>({...f,regimenFiscal:e.target.value}))} style={inputStyle} /></div>
                <div className="form-group"><label className="input-label">Email</label><input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} style={inputStyle} /></div>
              </div>
              <div className="form-group"><label className="input-label">Teléfono</label><input value={form.telefono} onChange={e=>setForm(f=>({...f,telefono:e.target.value}))} style={inputStyle} /></div>
              <div className="modal-footer" style={{padding:0,border:'none',marginTop:8}}>
                <button type="button" className="btn btn-secondary" onClick={()=>setShowModal(false)}>Cancelar</button>
                <button type="submit" disabled={saving} className="btn btn-primary">{saving?'⏳...':'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
