using Microsoft.AspNetCore.SignalR;

namespace WebhookApi.Hubs;

public class WebhookHub : Hub
{
    public async Task JoinGroup(string groupName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
    }
}
