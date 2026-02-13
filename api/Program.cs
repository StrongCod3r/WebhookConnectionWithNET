using System.Collections.Concurrent;
using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using WebhookApi.Hubs;
using WebhookApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSignalR();
builder.Services.AddHttpClient();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy
            .SetIsOriginAllowed(_ => true)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// In-memory storage
var events = new ConcurrentQueue<WebhookEvent>();
var listeners = new ConcurrentDictionary<string, WebhookListener>();

var app = builder.Build();

app.UseCors();

var webhooks = app.MapGroup("/api/webhooks");

// POST /api/webhooks/receive — Receives an incoming webhook
webhooks.MapPost("/receive", async (
    JsonElement payload,
    HttpContext ctx,
    IHubContext<WebhookHub> hub,
    IHttpClientFactory httpFactory) =>
{
    var webhookEvent = new WebhookEvent
    {
        Source = ctx.Request.Headers["X-Webhook-Source"].FirstOrDefault() ?? "external",
        EventType = ctx.Request.Headers["X-Webhook-Event"].FirstOrDefault() ?? "webhook",
        Payload = payload,
        Headers = ctx.Request.Headers
            .Where(h => h.Key.StartsWith("X-", StringComparison.OrdinalIgnoreCase))
            .ToDictionary(h => h.Key, h => h.Value.ToString())
    };

    events.Enqueue(webhookEvent);

    // Keep only last 100 events
    while (events.Count > 100)
        events.TryDequeue(out _);

    // Notify frontend via SignalR
    await hub.Clients.All.SendAsync("WebhookReceived", webhookEvent);

    // Forward to all active listeners
    var client = httpFactory.CreateClient();
    client.Timeout = TimeSpan.FromSeconds(5);

    var forwardTasks = listeners.Values
        .Where(l => l.IsActive)
        .Select(async listener =>
        {
            try
            {
                var content = new StringContent(
                    JsonSerializer.Serialize(webhookEvent),
                    System.Text.Encoding.UTF8,
                    "application/json"
                );
                await client.PostAsync(listener.Url, content);
            }
            catch
            {
                // Swallow — listener may be temporarily unavailable
            }
        });

    await Task.WhenAll(forwardTasks);

    return Results.Ok(new { eventId = webhookEvent.Id, message = "Webhook received" });
});

// GET /api/webhooks/events — List all stored events (newest first)
webhooks.MapGet("/events", () =>
    Results.Ok(events.Reverse().ToList()));

// DELETE /api/webhooks/events — Clear all events
webhooks.MapDelete("/events", async (IHubContext<WebhookHub> hub) =>
{
    while (events.TryDequeue(out _)) { }
    await hub.Clients.All.SendAsync("EventsCleared");
    return Results.Ok(new { message = "Events cleared" });
});

// POST /api/webhooks/send — Send a webhook to any URL
webhooks.MapPost("/send", async (SendWebhookRequest request, IHttpClientFactory httpFactory) =>
{
    var client = httpFactory.CreateClient();
    client.Timeout = TimeSpan.FromSeconds(10);

    var content = new StringContent(
        JsonSerializer.Serialize(request.Payload),
        System.Text.Encoding.UTF8,
        "application/json"
    );
    content.Headers.Add("X-Webhook-Source", "webhook-dashboard");
    content.Headers.Add("X-Webhook-Event", request.EventType);

    try
    {
        var response = await client.PostAsync(request.TargetUrl, content);
        var responseBody = await response.Content.ReadAsStringAsync();

        return Results.Ok(new
        {
            success = true,
            statusCode = (int)response.StatusCode,
            response = responseBody
        });
    }
    catch (Exception ex)
    {
        return Results.Ok(new { success = false, error = ex.Message });
    }
});

// POST /api/webhooks/listeners — Register a listener
webhooks.MapPost("/listeners", (WebhookListener listener) =>
{
    listener.Id = Guid.NewGuid().ToString();
    listener.RegisteredAt = DateTime.UtcNow;
    listeners[listener.Id] = listener;
    return Results.Created($"/api/webhooks/listeners/{listener.Id}", listener);
});

// GET /api/webhooks/listeners — List all listeners
webhooks.MapGet("/listeners", () =>
    Results.Ok(listeners.Values.ToList()));

// DELETE /api/webhooks/listeners/{id} — Remove a listener
webhooks.MapDelete("/listeners/{id}", (string id) =>
{
    if (listeners.TryRemove(id, out _))
        return Results.Ok(new { message = "Listener removed" });
    return Results.NotFound();
});

// PATCH /api/webhooks/listeners/{id}/toggle — Toggle active state
webhooks.MapPatch("/listeners/{id}/toggle", (string id) =>
{
    if (listeners.TryGetValue(id, out var listener))
    {
        listener.IsActive = !listener.IsActive;
        return Results.Ok(listener);
    }
    return Results.NotFound();
});

// SignalR hub
app.MapHub<WebhookHub>("/webhookHub");

// Health check
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

app.Run();

// ─── Request models ────────────────────────────────────────────────────────────
record SendWebhookRequest(string TargetUrl, string EventType, JsonElement Payload);
