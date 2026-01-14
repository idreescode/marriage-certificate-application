import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div 
      className="loader-fullscreen" 
      style={{ 
        zIndex: 1000, 
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="card" 
        style={{ 
          width: '100%', 
          maxWidth: '520px', 
          margin: '1rem', 
          position: 'relative', 
          padding: '0', 
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: 'none',
          animation: 'slideUp 0.3s ease-out',
          transform: 'translateY(0)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="card-header" 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '1.5rem 1.75rem', 
            marginBottom: 0, 
            background: 'linear-gradient(135deg, var(--brand-600) 0%, var(--brand-700) 100%)',
            borderBottom: 'none'
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'white' }}>{title}</h3>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'rgba(255, 255, 255, 0.2)', 
              border: 'none', 
              cursor: 'pointer', 
              color: 'white', 
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              width: '32px',
              height: '32px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'rotate(90deg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'rotate(0deg)';
            }}
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '1.75rem', background: 'white' }}>
          {children}
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
