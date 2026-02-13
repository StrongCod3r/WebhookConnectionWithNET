import { useState } from 'react';
import { webhookService } from '../services/webhookService';
import type { SendWebhookResponse } from '../types/webhook';

const DEFAULT_PAYLOAD = JSON.stringify(
  {
    user: { id: 123, name: 'Juan Pérez', email: 'juan@example.com' },
    action: 'user.created',
    timestamp: new Date().toISOString(),
  },
  null,
  2
);

export default function SendWebhook() {
  const [targetUrl, setTargetUrl] = useState(
    'http://localhost:5000/api/webhooks/receive'
  );
  const [eventType, setEventType] = useState('user.created');
  const [payload, setPayload] = useState(DEFAULT_PAYLOAD);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SendWebhookResponse | null>(null);

  const handleSend = async () => {
    setLoading(true);
    setResult(null);
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(payload);
      } catch {
        setResult({ success: false, error: 'El payload no es JSON válido' });
        return;
      }
      const response = await webhookService.sendWebhook({
        targetUrl,
        eventType,
        payload: parsed,
      });
      setResult(response);
    } catch {
      setResult({ success: false, error: 'Error de red al enviar el webhook' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Enviar Webhook</span>
      </div>

      <div className="endpoint-box">
        <div className="endpoint-label">Endpoint receptor (este servidor)</div>
        <div className="endpoint-url">POST /api/webhooks/receive</div>
      </div>

      <div className="form-group">
        <label className="form-label">URL Destino</label>
        <input
          className="form-input"
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
          placeholder="https://mi-servicio.com/webhook"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Tipo de Evento</label>
        <input
          className="form-input"
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          placeholder="user.created, order.paid, etc."
        />
      </div>

      <div className="form-group">
        <label className="form-label">Payload (JSON)</label>
        <textarea
          className="form-textarea"
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          rows={10}
        />
      </div>

      <button
        className="btn btn-primary"
        onClick={handleSend}
        disabled={loading || !targetUrl}
      >
        {loading ? 'Enviando…' : '📤 Enviar Webhook'}
      </button>

      {result && (
        <div className={`alert ${result.success ? 'alert-success' : 'alert-error'}`}>
          {result.success
            ? `✓ Enviado exitosamente — HTTP ${result.statusCode}`
            : `✗ Error: ${result.error}`}
        </div>
      )}
    </div>
  );
}
