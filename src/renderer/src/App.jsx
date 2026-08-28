import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Clients from './pages/Clients';
import Sales from './pages/Sales';
import Invoices from './pages/Invoices';
import Settings from './pages/Settings';

const NAV = [
  { id: 'dashboard',  label: 'Dashboard',   emoji: '📊' },
  { id: 'pos',        label: 'Punto de Venta', emoji: '🛒' },
  { id: 'products',   label: 'Productos',   emoji: '📦' },
  { id: 'clients',    label: 'Clientes',   emoji: '👥' },
  { id: 'sales',      label: 'Ventas',     emoji: '💰' },
  { id: 'invoices',   label: 'Facturas',   emoji: '🧾' },
  { id: 'settings',   label: 'Config',     emoji: '⚙️' },
];

export default function App() {
  const [page, setPage] = useState('pos');

  const render = () => {
    switch (page) {
      case 'dashboard': return <Dashboard onNav={setPage} />;
      case 'pos':       return <POS />;
      case 'products':  return <Products />;
      case 'clients':   return <Clients />;
      case 'sales':     return <Sales />;
      case 'invoices':  return <Invoices />;
      case 'settings':  return <Settings />;
      default:          return <POS />;
    }
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">n<span>pos</span></div>
        <nav className="sidebar-nav">
          {NAV.map(item => (
            <div
              key={item.id}
              className={`nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => setPage(item.id)}
            >
              <span className="emoji">{item.emoji}</span>
              {item.label}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">npos v1.0 · SQLite local</div>
      </aside>
      <main className="main-content">{render()}</main>
    </div>
  );
}
