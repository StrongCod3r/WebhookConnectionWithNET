import { useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import type { WebhookEvent } from './types/webhook';
import { webhookService } from './services/webhookService';
import EventLog from './components/EventLog';
import SendWebhook from './components/SendWebhook';
import Listeners from './components/Listeners';

type Tab = 'events' | 'send' | 'listeners';
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

function App() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('events');
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const connRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    webhookService.getEvents().then(setEvents).catch(console.error);

    const connection = new signalR.HubConnectionBuilder()
      .withUrl('/webhookHub')
      .withAutomaticReconnect()
      .build();

    connection.on('WebhookReceived', (event: WebhookEvent) => {
      setEvents((prev) => [event, ...prev].slice(0, 100));
    });

    connection.on('EventsCleared', () => setEvents([]));

    connection.onreconnecting(() => setStatus('connecting'));
    connection.onreconnected(() => setStatus('connected'));
    connection.onclose(() => setStatus('disconnected'));

    connection
      .start()
      .then(() => setStatus('connected'))
      .catch(() => setStatus('disconnected'));

    connRef.current = connection;
    return () => { connection.stop(); };
  }, []);

  const handleClearEvents = async () => {
    await webhookService.clearEvents();
    setEvents([]);
  };

  const statusLabel: Record<ConnectionStatus, string> = {
    connected: 'Conectado',
    connecting: 'Conectando…',
    disconnected: 'Desconectado',
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="header-title">
            <span className="header-icon">🔗</span>
            <h1>Webhook Dashboard</h1>
          </div>
          <div className={`connection-status ${status}`}>
            <span className="status-dot" />
            {statusLabel[status]}
          </div>
        </div>
      </header>

      <nav className="tabs">
        <button
          className={`tab ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          📥 Eventos {events.length > 0 && `(${events.length})`}
        </button>
        <button
          className={`tab ${activeTab === 'send' ? 'active' : ''}`}
          onClick={() => setActiveTab('send')}
        >
          📤 Enviar
        </button>
        <button
          className={`tab ${activeTab === 'listeners' ? 'active' : ''}`}
          onClick={() => setActiveTab('listeners')}
        >
          👂 Listeners
        </button>
      </nav>

      <main className="main">
        {activeTab === 'events' && (
          <EventLog events={events} onClear={handleClearEvents} />
        )}
        {activeTab === 'send' && <SendWebhook />}
        {activeTab === 'listeners' && <Listeners />}
      </main>
    </div>
  );
}

export default App;
