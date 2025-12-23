import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="loader-fullscreen" style={{ zIndex: 1000, background: 'rgba(15, 23, 42, 0.6)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '500px', margin: '1rem', position: 'relative', padding: '0', overflow: 'hidden' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', marginBottom: 0, background: 'var(--slate-50)' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--slate-500)', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: '1.5rem' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
