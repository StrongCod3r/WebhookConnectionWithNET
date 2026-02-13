import type {
  SendWebhookRequest,
  SendWebhookResponse,
  WebhookEvent,
  WebhookListener,
} from '../types/webhook';

const BASE = '/api/webhooks';

export const webhookService = {
  async getEvents(): Promise<WebhookEvent[]> {
    const res = await fetch(`${BASE}/events`);
    return res.json();
  },

  async clearEvents(): Promise<void> {
    await fetch(`${BASE}/events`, { method: 'DELETE' });
  },

  async sendWebhook(request: SendWebhookRequest): Promise<SendWebhookResponse> {
    const res = await fetch(`${BASE}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return res.json();
  },

  async getListeners(): Promise<WebhookListener[]> {
    const res = await fetch(`${BASE}/listeners`);
    return res.json();
  },

  async registerListener(
    listener: Omit<WebhookListener, 'id' | 'registeredAt'>
  ): Promise<WebhookListener> {
    const res = await fetch(`${BASE}/listeners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listener),
    });
    return res.json();
  },

  async deleteListener(id: string): Promise<void> {
    await fetch(`${BASE}/listeners/${id}`, { method: 'DELETE' });
  },

  async toggleListener(id: string): Promise<WebhookListener> {
    const res = await fetch(`${BASE}/listeners/${id}/toggle`, { method: 'PATCH' });
    return res.json();
  },
};
