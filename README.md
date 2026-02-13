# Webhook Example

A sample project demonstrating the webhook pattern between a **C# .NET 10 Minimal API** with SignalR and a **React + TypeScript** frontend, fully containerized with **Docker Compose**.

![](/assets/cover.png)
---

## Project structure

```
WebhookExample/
├── docker-compose.yml
├── api/
│   ├── Dockerfile
│   ├── WebhookApi.csproj          (.NET 10)
│   ├── Program.cs                  Minimal API + SignalR
│   ├── Models/
│   │   ├── WebhookEvent.cs
│   │   └── WebhookListener.cs
│   └── Hubs/
│       └── WebhookHub.cs
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── App.tsx                 Tabs + SignalR connection
        ├── index.css
        ├── types/webhook.ts
        ├── services/webhookService.ts
        └── components/
            ├── EventLog.tsx        Real-time event log
            ├── SendWebhook.tsx     Send webhook form
            └── Listeners.tsx       Listener CRUD
```

---

## API endpoints (C# Minimal API)

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/webhooks/receive` | Receives a webhook, stores it and forwards it to all listeners |
| `GET` | `/api/webhooks/events` | Returns the last 100 events |
| `DELETE` | `/api/webhooks/events` | Clears all events |
| `POST` | `/api/webhooks/send` | Sends a webhook to any URL |
| `POST` | `/api/webhooks/listeners` | Registers a listener |
| `GET` | `/api/webhooks/listeners` | Lists all listeners |
| `DELETE` | `/api/webhooks/listeners/{id}` | Removes a listener |
| `PATCH` | `/api/webhooks/listeners/{id}/toggle` | Toggles a listener on/off |
| Hub | `/webhookHub` | SignalR hub for real-time updates |

---

## Run with Docker Compose

```bash
docker compose up --build
```

- **Frontend:** http://localhost:3000
- **API:** http://localhost:5000

---

## Local development (without Docker)

**API:**
```bash
cd api
dotnet run
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

> The Vite dev server proxies requests to `http://localhost:5000`, so no additional CORS configuration is needed during development.

---

## Example flow

1. Open http://localhost:3000
2. From the **Send** tab, fire a webhook to `http://localhost:5000/api/webhooks/receive`
3. The event appears in real time in the **Events** tab via SignalR
4. Register an external URL in the **Listeners** tab (e.g. https://webhook.site) — every incoming webhook will be automatically forwarded to it

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Docker Compose (network: webhook-net)                      │
│                                                             │
│  ┌──────────────────┐        ┌───────────────────────────┐  │
│  │  frontend :3000  │        │       api :5000           │  │
│  │  (nginx)         │        │   (.NET 10 Minimal API)   │  │
│  │                  │        │                           │  │
│  │  React + TS      │──HTTP──▶  POST /receive            │  │
│  │  (Vite build)    │        │  GET  /events             │  │
│  │                  │◀─WS────│  SignalR /webhookHub      │  │
│  └──────────────────┘        │                           │  │
│         ▲                    │  Forwards to listeners ──▶│  │
│         │ proxy              └───────────────────────────┘  │
│    localhost:3000                                           │
└─────────────────────────────────────────────────────────────┘
```

### Key components

- **SignalR** — The API pushes real-time notifications to the frontend whenever a webhook is received (`WebhookReceived`) or events are cleared (`EventsCleared`).
- **Listeners** — Registered URLs that automatically receive an HTTP POST copy of every incoming webhook.
- **In-memory storage** — Events and listeners are stored in memory (`ConcurrentQueue` / `ConcurrentDictionary`). Data is lost when the container restarts.

---

## Environment variables (API)

| Variable | Default | Description |
|----------|---------|-------------|
| `ASPNETCORE_URLS` | `http://+:5000` | Listening port |
| `ASPNETCORE_ENVIRONMENT` | `Development` | Runtime environment |
