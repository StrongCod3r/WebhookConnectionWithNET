export interface WebhookEvent {
  id: string;
  timestamp: string;
  source: string;
  eventType: string;
  payload: unknown;
  headers: Record<string, string>;
}

export interface WebhookListener {
  id: string;
  name: string;
  url: string;
  registeredAt: string;
  isActive: boolean;
}

export interface SendWebhookRequest {
  targetUrl: string;
  eventType: string;
  payload: unknown;
}

export interface SendWebhookResponse {
  success: boolean;
  statusCode?: number;
  response?: string;
  error?: string;
}
