public class TokenCleanupService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;

    public TokenCleanupService(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var expired = db.ActiveSessions.Where(s => s.ExpiresAt <= DateTime.UtcNow);
            db.ActiveSessions.RemoveRange(expired);
            await db.SaveChangesAsync();

            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
        }
    }
}
