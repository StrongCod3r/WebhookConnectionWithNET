using System.Text.Json;

namespace WebhookApi.Models;

public class WebhookEvent
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string Source { get; set; } = "unknown";
    public string EventType { get; set; } = "webhook";
    public JsonElement Payload { get; set; }
    public Dictionary<string, string> Headers { get; set; } = new();
}
