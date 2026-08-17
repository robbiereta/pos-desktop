import React, { useState, useEffect } from 'react';
export default function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nombre:'', sku:'', precioVenta:'', categoria:'General', claveProdServ:'01010101', activo:1 });
  const [formErr, setFormErr] = useState({});
  const [saving, setSaving] = useState(false);
  const inputStyle = { width:'100%', padding:'8px 10px', fontSize:'13px', borderRadius:'6px', border:'1.5px solid #e2e8f0', outline:'none', boxSizing:'border-box' };
  useEffect(() => { window.api.listProducts().then(p => setProducts(p||[])); }, []);
  const filtered = (products||[]).filter(p => !search || (p.nombre||'').toLowerCase().includes(search.toLowerCase()) || (p.sku||'').toLowerCase().includes(search.toLowerCase()));
  const openNew = () => { setEditing(null); setForm({nombre:'',sku:'',precioVenta:'',categoria:'General',claveProdServ:'01010101',activo:1}); setFormErr({}); setShowModal(true); };
  const openEdit = (p) => { setEditing(p); setForm({nombre:p.nombre||'',sku:p.sku||'',precioVenta:p.precioVenta||'',categoria:p.categoria||'General',claveProdServ:p.claveProdServ||'01010101',activo:p.activo?1:0}); setFormErr({}); setShowModal(true); };
  const handleSave = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.nombre.trim()) errs.nombre = 'Requerido';
    if (!form.precioVenta || parseFloat(form.precioVenta) <= 0) errs.precioVenta = 'Precio inválido';
    if (Object.keys(errs).length) { setFormErr(errs); return; }
    setSaving(true);
    const id = editing?.id || `prod_${Date.now()}`;
    await window.api.upsertProduct({ ...editing, ...form, id, precioVenta: parseFloat(form.precioVenta), activo: form.activo===1 });
    window.api.listProducts().then(p => setProducts(p||[]));
    setShowModal(false); setSaving(false);
  };
  return (
    <div>
      <div className="page-title">📦 Productos</div>
      <div className="search-bar" style={{marginBottom:16}}>
        <input className="input" placeholder="🔍 Buscar..." value={search} onChange={e=>setSearch(e.target.value)} />
        <button className="btn btn-primary" onClick={openNew}>➕ Nuevo producto</button>
      </div>
      {(products||[]).length===0 ? <div className="empty-state"><p>Sin productos. Sincroniza desde Config.</p></div> :
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <table className="table"><thead><tr><th>Nombre</th><th>SKU</th><th>Categoría</th><th>Precio</th><th>Activo</th><th></th></tr></thead>
        <tbody>{filtered.map(p=><tr key={p.id}><td><strong>{p.nombre}</strong></td><td>{p.sku||'—'}</td><td>{p.categoria||'General'}</td><td><strong>${parseFloat(p.precioVenta||0).toFixed(2)}</strong></td><td><span className={`badge ${p.activo?'badge-success':'badge-gray'}`}>{p.activo?'Sí':'No'}</span></td><td><button className="btn btn-secondary btn-sm" onClick={()=>openEdit(p)}>Editar</button></td></tr>)}</tbody>
        </table>
      </div>}
      {showModal && (
        <div className="modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h2>{editing?'✏️ Editar':'➕ Nuevo'} producto</h2><button className="modal-close" onClick={()=>setShowModal(false)}>✕</button></div>
            <form onSubmit={handleSave} className="modal-body">
              <div className="form-group"><label className="input-label">Nombre *</label><input value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} style={{...inputStyle, borderColor:formErr.nombre?'#dc3545':'#e2e8f0'}} />{formErr.nombre&&<span style={{color:'#dc3545',fontSize:11}}>{formErr.nombre}</span>}</div>
              <div className="form-row">
                <div className="form-group"><label className="input-label">SKU</label><input value={form.sku} onChange={e=>setForm(f=>({...f,sku:e.target.value}))} style={inputStyle} /></div>
                <div className="form-group"><label className="input-label">Categoría</label><input value={form.categoria} onChange={e=>setForm(f=>({...f,categoria:e.target.value}))} style={inputStyle} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="input-label">Precio venta (IVA incl.) *</label><input type="number" step="0.01" min="0" value={form.precioVenta} onChange={e=>setForm(f=>({...f,precioVenta:e.target.value}))} style={{...inputStyle, borderColor:formErr.precioVenta?'#dc3545':'#e2e8f0'}} />{formErr.precioVenta&&<span style={{color:'#dc3545',fontSize:11}}>{formErr.precioVenta}</span>}</div>
                <div className="form-group"><label className="input-label">Clave SAT</label><input value={form.claveProdServ} onChange={e=>setForm(f=>({...f,claveProdServ:e.target.value}))} style={inputStyle} maxLength={8} /></div>
              </div>
              <div className="form-group">
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                  <input type="checkbox" checked={form.activo===1} onChange={e=>setForm(f=>({...f,activo:e.target.checked?1:0}))} />
                  <span>Producto activo</span>
                </label>
              </div>
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
