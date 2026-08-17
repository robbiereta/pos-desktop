import React, { useState, useEffect, useRef } from 'react';

function QuickAddProductModal({ onClose, onAdd }) {
  const [tab, setTab] = useState('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState('');
  const [form, setForm] = useState({ nombre: '', sku: '', precioVenta: '', categoria: 'General', claveProdServ: '01010101' });
  const [formErr, setFormErr] = useState({});
  const [creating, setCreating] = useState(false);
  const inputStyle = { width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1.5px solid #e2e8f0', outline: 'none', boxSizing: 'border-box' };

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      const prods = await window.api.listProducts();
      const q = query.toLowerCase();
      setResults((prods || []).filter(p => (p.nombre || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q)).slice(0, 15));
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const handleSelect = (p) => { setSelected(p); setPrice((p.precioVenta || '').toString()); setQty(1); };
  const handleAdd = () => {
    const unitPrice = parseFloat(price) || selected.precioVenta || 0;
    onAdd({ ...selected, valorUnitario: unitPrice }, qty);
    onClose();
  };
  const handleCreate = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.nombre.trim()) errs.nombre = 'Requerido';
    if (!form.precioVenta || parseFloat(form.precioVenta) <= 0) errs.precioVenta = 'Precio inválido';
    if (Object.keys(errs).length) { setFormErr(errs); return; }
    setCreating(true);
    const id = `prod_${Date.now()}`;
    try {
      await window.api.upsertProduct({ ...form, id, precioVenta: parseFloat(form.precioVenta), activo: 1 });
      const prod = { id, ...form, precioVenta: parseFloat(form.precioVenta) };
      onAdd({ ...prod, valorUnitario: parseFloat(form.precioVenta) }, qty);
      onClose();
    } catch (err) { setFormErr({ form: err.message }); setCreating(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h2>➕ Agregar Producto</h2><button className="modal-close" onClick={onClose}>✕</button></div>
        <div style={{ display: 'flex', borderBottom: '2px solid #eee' }}>
          {[{ id: 'search', label: '🔍 Buscar' }, { id: 'create', label: '✨ Crear' }].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setSelected(null); }}
              style={{ flex: 1, padding: '10px', background: 'none', border: 'none', borderBottom: `3px solid ${tab === t.id ? '#667eea' : 'transparent'}`, color: tab === t.id ? '#667eea' : '#999', fontWeight: tab === t.id ? 700 : 400, cursor: 'pointer', fontSize: '14px' }}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="modal-body">
          {tab === 'search' && !selected && (
            <div>
              <input autoFocus type="text" placeholder="Buscar por nombre o SKU..." value={query} onChange={e => setQuery(e.target.value)}
                style={{ ...inputStyle, marginBottom: 12 }} />
              {loading && <p style={{ textAlign: 'center', color: '#999', fontSize: 13 }}>Buscando...</p>}
              {results.map(p => (
                <div key={p.id} onClick={() => handleSelect(p)}
                  style={{ padding: '9px 10px', borderRadius: 8, border: '1px solid #eee', marginBottom: 6, cursor: 'pointer', background: '#f9f9f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onMouseOver={e => e.currentTarget.style.borderColor = '#667eea'} onMouseOut={e => e.currentTarget.style.borderColor = '#eee'}>
                  <div><div style={{ fontWeight: 600, fontSize: 13 }}>{p.nombre}</div><div style={{ fontSize: 11, color: '#999' }}>{p.sku || ''} · {p.categoria || 'General'}</div></div>
                  <div style={{ fontWeight: 700, color: '#667eea', fontSize: 14 }}>${(p.precioVenta || 0).toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
          {tab === 'search' && selected && (
            <div>
              <div style={{ background: 'linear-gradient(135deg,#667eea18,#764ba218)', border: '2px solid #667eea44', borderRadius: 10, padding: 14, marginBottom: 14, display: 'flex', justifyContent: 'space-between' }}>
                <div><div style={{ fontWeight: 700, fontSize: 15 }}>{selected.nombre}</div><div style={{ fontSize: 12, color: '#666' }}>{selected.sku || ''} · {selected.categoria}</div></div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#999' }}>✕</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div><label className="input-label">Cantidad *</label><input type="number" min="1" value={qty} onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))} style={inputStyle} /></div>
                <div><label className="input-label">Precio (IVA incl.)</label><input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder={selected.precioVenta} style={inputStyle} /></div>
              </div>
              <div style={{ background: '#f8f9fa', borderRadius: 8, padding: 12, marginBottom: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#666' }}>Total</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#667eea' }}>${((parseFloat(price) || selected.precioVenta || 0) * qty).toFixed(2)}</div>
              </div>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} onClick={handleAdd}>Agregar al carrito ({qty}×)</button>
            </div>
          )}
          {tab === 'create' && (
            <form onSubmit={handleCreate}>
              <div className="form-group"><label className="input-label">Nombre *</label><input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} style={{ ...inputStyle, borderColor: formErr.nombre ? '#dc3545' : '#e2e8f0' }} />{formErr.nombre && <span style={{ color: '#dc3545', fontSize: 11 }}>{formErr.nombre}</span>}</div>
              <div className="form-row">
                <div className="form-group"><label className="input-label">SKU</label><input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} style={inputStyle} /></div>
                <div className="form-group"><label className="input-label">Categoría</label><input value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} style={inputStyle} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="input-label">Precio venta (IVA incl.) *</label><input type="number" step="0.01" min="0" value={form.precioVenta} onChange={e => setForm(f => ({ ...f, precioVenta: e.target.value }))} style={{ ...inputStyle, borderColor: formErr.precioVenta ? '#dc3545' : '#e2e8f0' }} />{formErr.precioVenta && <span style={{ color: '#dc3545', fontSize: 11 }}>{formErr.precioVenta}</span>}</div>
                <div className="form-group"><label className="input-label">Cantidad</label><input type="number" min="1" value={qty} onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))} style={inputStyle} /></div>
              </div>
              <div className="form-group"><label className="input-label">Clave SAT</label><input value={form.claveProdServ} onChange={e => setForm(f => ({ ...f, claveProdServ: e.target.value }))} style={inputStyle} maxLength={8} /></div>
              {formErr.form && <div style={{ background: '#fff0f0', border: '1px solid #dc3545', borderRadius: 6, padding: 8, fontSize: 13, color: '#dc3545', marginBottom: 10 }}>{formErr.form}</div>}
              <button type="submit" disabled={creating} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>{creating ? '⏳ Creando...' : `✨ Crear y agregar (×${qty})`}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function POS() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState({ id: null, nombre: 'PUBLICO EN GENERAL', rfc: 'XAXX010101000' });
  const [clientSearch, setClientSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('PUE');
  const [paymentForm, setPaymentForm] = useState('01');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [clientDD, setClientDD] = useState(false);
  const [toast, setToast] = useState(null);
  const toastRef = useRef(null);

  const showToast = (msg) => { setToast(msg); clearTimeout(toastRef.current); toastRef.current = setTimeout(() => setToast(null), 2000); };

  useEffect(() => {
    window.api.listProducts().then(p => setProducts(p || []));
    window.api.listClients().then(c => setClients(c || []));
  }, []);

  const addToCart = (product, qty = 1) => {
    const existing = cart.find(i => i.id === product.id);
    const unitPrice = product.valorUnitario || product.precioVenta || 0;
    const baseAmount = unitPrice / 1.16;
    const ivaAmount = unitPrice - baseAmount;
    if (existing) {
      const newQty = existing.cantidad + qty;
      const newImp = newQty * existing.valorUnitario;
      const newBase = newImp / 1.16;
      const newIva = newImp - newBase;
      setCart(cart.map(i => i.id === product.id ? { ...i, cantidad: newQty, importe: newImp, impuestos: { traslados: [{ base: newBase, impuesto: '002', tipoFactor: 'Tasa', tasaOCuota: '0.160000', importe: newIva }] } } : i));
    } else {
      setCart([...cart, { id: product.id, descripcion: product.nombre || product.descripcion, cantidad: qty, valorUnitario: unitPrice, importe: qty * unitPrice, claveProdServ: product.claveProdServ || '01010101', claveUnidad: product.claveUnidad || 'E48', unidad: product.unidad || 'Pieza', objetoImp: product.objetoImp || '02', impuestos: { traslados: [{ base: qty * baseAmount, impuesto: '002', tipoFactor: 'Tasa', tasaOCuota: '0.160000', importe: qty * ivaAmount }] } }]);
    }
    showToast(`+${qty} ${product.nombre || product.descripcion}`);
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(i => {
      if (i.id !== id) return i;
      const newQty = Math.max(0, i.cantidad + delta);
      if (newQty === 0) return null;
      const newImp = newQty * i.valorUnitario;
      const newBase = newImp / 1.16;
      return { ...i, cantidad: newQty, importe: newImp, impuestos: { traslados: [{ base: newBase, impuesto: '002', tipoFactor: 'Tasa', tasaOCuota: '0.160000', importe: newImp - newBase }] } };
    }).filter(Boolean));
  };

  const subtotal = cart.reduce((a, i) => a + i.importe / 1.16, 0);
  const iva = cart.reduce((a, i) => a + i.importe - i.importe / 1.16, 0);
  const total = cart.reduce((a, i) => a + i.importe, 0);

  const processSale = async () => {
    if (!cart.length) { alert('El carrito está vacío'); return; }
    setLoading(true);
    try {
      const id = `sale_${Date.now()}`;
      await window.api.createSale({ id, customerId: selectedClient.id || null, customerName: selectedClient.nombre, customerRfc: selectedClient.rfc,
        items: cart.map(i => ({ claveProdServ: i.claveProdServ, cantidad: i.cantidad, claveUnidad: i.claveUnidad, unidad: i.unidad, descripcion: i.descripcion, valorUnitario: i.valorUnitario, importe: i.importe, descuento: 0, objetoImp: i.objetoImp, impuestos: i.impuestos })),
        subtotal, total, totalImpuestos: iva, metodoPago: paymentMethod, formaPago: paymentForm });
      alert(`✅ Venta registrada!\nTotal: $${total.toFixed(2)}\nSync en segundo plano.`);
      setCart([]);
    } catch (err) { alert('Error: ' + err.message); }
    finally { setLoading(false); }
  };

  const filteredProducts = (products || []).filter(p => !search || (p.nombre || '').toLowerCase().includes(search.toLowerCase()) || (p.sku || '').toLowerCase().includes(search.toLowerCase()));
  const filteredClients = (clients || []).filter(c => !clientSearch || (c.nombre || '').toLowerCase().includes(clientSearch.toLowerCase()) || (c.rfc || '').toLowerCase().includes(clientSearch.toLowerCase()));

  return (
    <div>
      {toast && <div style={{ position: 'fixed', top: 20, right: 20, background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', padding: '10px 18px', borderRadius: 10, fontWeight: 700, fontSize: 14, zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>{toast}</div>}
      <div className="page-title">🛒 Punto de Venta</div>
      <div className="pos-layout">
        <div className="pos-products">
          <div className="search-bar">
            <input className="input" placeholder="🔍 Buscar producto..." value={search} onChange={e => setSearch(e.target.value)} />
            <button className="btn btn-primary" onClick={() => setShowQuickAdd(true)}>➕ Agregar</button>
          </div>
          {filteredProducts.length === 0 ? (
            <div className="empty-state"><div className="icon">📦</div><p>Sin productos. Ve a Config → Sync para descargar del backend.</p></div>
          ) : (
            <div className="grid-3">
              {filteredProducts.map(p => (
                <div key={p.id} className="product-card" onClick={() => addToCart(p)}>
                  <h4>{p.nombre}</h4><div className="cat">{p.categoria || 'General'}{p.sku ? ` · SKU: ${p.sku}` : ''}</div>
                  <div className="price">${(p.precioVenta || 0).toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="pos-cart">
          <div className="cart-panel">
            <div className="cart-header">
              <h2>🛒 Carrito</h2>
              <button className="btn btn-sm" onClick={() => setShowQuickAdd(true)} style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.5)', color: '#fff' }}>➕ Agregar</button>
            </div>
            {cart.length === 0 ? (
              <div className="cart-empty">El carrito está vacío</div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map(item => (
                    <div key={item.id} className="cart-item">
                      <div className="cart-item-top">
                        <div className="cart-item-name">{item.descripcion}</div>
                        <div className="cart-item-price">${item.importe.toFixed(2)}</div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <button className="qty-btn minus" onClick={() => updateQty(item.id, -1)}>−</button>
                          <span className="qty-display">{item.cantidad}</span>
                          <button className="qty-btn plus" onClick={() => updateQty(item.id, 1)}>+</button>
                        </div>
                        <div style={{ fontSize: 12, color: '#667eea', fontWeight: 600, cursor: 'pointer' }} onClick={() => setCart(cart.filter(i => i.id !== item.id))}>✕</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="cart-summary">
                  <div className="cart-summary-row"><span>Subtotal:</span><span>${subtotal.toFixed(2)}</span></div>
                  <div className="cart-summary-row"><span>IVA (16%):</span><span>${iva.toFixed(2)}</span></div>
                  <div className="cart-summary-row total"><span>Total:</span><span>${total.toFixed(2)}</span></div>
                </div>
                <div style={{ padding: '0 14px 8px' }}>
                  <select className="input" value={paymentForm} onChange={e => setPaymentForm(e.target.value)} style={{ marginBottom: 8 }}>
                    <option value="01">01 — Efectivo</option><option value="04">04 — Tarjeta crédito</option><option value="28">28 — Tarjeta débito</option>
                  </select>
                  <select className="input" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ marginBottom: 8 }}>
                    <option value="PUE">PUE — Pago único</option><option value="PPD">PPD — Pago diferido</option>
                  </select>
                  <div style={{ position: 'relative', marginBottom: 8 }}>
                    <input className="input" placeholder="Buscar cliente..." value={clientSearch} onChange={e => { setClientSearch(e.target.value); setClientDD(true); }} onFocus={() => setClientDD(true)} />
                    {clientDD && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 8, zIndex: 100, maxHeight: 160, overflowY: 'auto' }}>
                        <div style={{ padding: '7px 10px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid #f0f0f0', fontWeight: 600 }} onClick={() => { setSelectedClient({ id: null, nombre: 'PUBLICO EN GENERAL', rfc: 'XAXX010101000' }); setClientSearch(''); setClientDD(false); }}>PUBLICO EN GENERAL</div>
                        {filteredClients.map(c => (
                          <div key={c.id} style={{ padding: '7px 10px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid #f0f0f0' }} onClick={() => { setSelectedClient({ id: c.id, nombre: c.nombre, rfc: c.rfc }); setClientSearch(''); setClientDD(false); }}>
                            <div style={{ fontWeight: 600 }}>{c.nombre}</div><div style={{ fontSize: 11, color: '#999' }}>{c.rfc}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#667eea', fontWeight: 600, marginBottom: 8, padding: '4px 8px', background: '#f0f4ff', borderRadius: 6 }}>{selectedClient.nombre} · RFC: {selectedClient.rfc}</div>
                </div>
                <div className="cart-actions">
                  <button className="btn btn-primary" onClick={processSale} disabled={loading}>{loading ? '⏳...' : '✅ Vender'}</button>
                  <button className="btn btn-danger" onClick={() => setCart([])} disabled={cart.length === 0}>✕</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {showQuickAdd && <QuickAddProductModal onClose={() => setShowQuickAdd(false)} onAdd={addToCart} />}
    </div>
  );
}
