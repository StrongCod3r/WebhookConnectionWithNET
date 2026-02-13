import { useEffect, useState } from 'react';
import type { WebhookListener } from '../types/webhook';
import { webhookService } from '../services/webhookService';

export default function Listeners() {
  const [listeners, setListeners] = useState<WebhookListener[]>([]);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    webhookService.getListeners().then(setListeners).catch(console.error);
  }, []);

  const handleRegister = async () => {
    if (!name || !url) return;
    setLoading(true);
    try {
      const listener = await webhookService.registerListener({
        name,
        url,
        isActive: true,
      });
      setListeners((prev) => [...prev, listener]);
      setName('');
      setUrl('');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await webhookService.deleteListener(id);
    setListeners((prev) => prev.filter((l) => l.id !== id));
  };

  const handleToggle = async (id: string) => {
    const updated = await webhookService.toggleListener(id);
    setListeners((prev) => prev.map((l) => (l.id === id ? updated : l)));
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Registrar Listener</span>
        </div>
        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
          Los listeners registrados recibirán automáticamente una copia de cada
          webhook entrante vía HTTP POST.
        </p>

        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label">Nombre</label>
            <input
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mi Servicio"
            />
          </div>
          <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
            <label className="form-label">URL</label>
            <input
              className="form-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://mi-servicio.com/webhook"
            />
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleRegister}
          disabled={loading || !name || !url}
        >
          + Registrar Listener
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Listeners ({listeners.length})</span>
        </div>

        {listeners.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 20px' }}>
            <div className="empty-state-icon">👂</div>
            <h3>Sin listeners registrados</h3>
            <p>Registra una URL para recibir copias de cada webhook</p>
          </div>
        ) : (
          listeners.map((listener) => (
            <div key={listener.id} className="listener-item">
              <div className="listener-info">
                <div className="listener-name">{listener.name}</div>
                <div className="listener-url">{listener.url}</div>
              </div>
              <div className="listener-actions">
                <span
                  className={`badge ${
                    listener.isActive ? 'badge-active' : 'badge-inactive'
                  }`}
                >
                  {listener.isActive ? 'Activo' : 'Pausado'}
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleToggle(listener.id)}
                >
                  {listener.isActive ? 'Pausar' : 'Activar'}
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(listener.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
