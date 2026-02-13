import { useState } from 'react';
import type { WebhookEvent } from '../types/webhook';

interface Props {
  events: WebhookEvent[];
  onClear: () => void;
}

export default function EventLog({ events, onClear }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  if (events.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-title">Log de Eventos</span>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <h3>Sin eventos todavía</h3>
          <p>Los webhooks recibidos aparecerán aquí en tiempo real</p>
          <p className="endpoint-hint">POST /api/webhooks/receive</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Log de Eventos ({events.length})</span>
        <button className="btn btn-danger btn-sm" onClick={onClear}>
          Limpiar todo
        </button>
      </div>
      <div className="event-list">
        {events.map((event, index) => (
          <div
            key={event.id}
            className={`event-item ${index === 0 ? 'new' : ''}`}
            onClick={() => toggle(event.id)}
          >
            <div className="event-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="event-type">{event.eventType}</span>
                <span className="event-source">{event.source}</span>
              </div>
              <span className="event-time">
                {new Date(event.timestamp).toLocaleTimeString('es', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            </div>
            {expandedId === event.id && (
              <pre className="event-payload">
                {JSON.stringify(event.payload, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
