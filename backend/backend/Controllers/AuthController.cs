using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly JwtService _jwt;

    public AuthController(AppDbContext db, JwtService jwt)
    {
        _db = db;
        _jwt = jwt;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest req)
    {
        if (await _db.Users.AnyAsync(u => u.Email == req.Email))
            return Conflict(new { message = "Email already in use." });

        var user = new User
        {
            Email = req.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password)
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return Ok(new { token = await CreateSession(user) });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest req)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == req.Email);

        // Always run BCrypt even when user is not found to prevent timing-based email enumeration
        var hash = user?.PasswordHash ?? "$2a$11$dummyhashvaluethatisnotrealandexists000000000000000000";
        var passwordValid = BCrypt.Net.BCrypt.Verify(req.Password, hash);

        if (user == null || !passwordValid)
            return Unauthorized(new { message = "Invalid credentials." });

        return Ok(new { token = await CreateSession(user) });
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var jti = User.FindFirstValue(JwtRegisteredClaimNames.Jti);
        var session = await _db.ActiveSessions.FirstOrDefaultAsync(s => s.Jti == jti);

        if (session != null)
        {
            _db.ActiveSessions.Remove(session);
            await _db.SaveChangesAsync();
        }

        return Ok(new { message = "Logged out successfully." });
    }

    [Authorize]
    [HttpGet("sessions")]
    public async Task<IActionResult> GetSessions()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var currentJti = User.FindFirstValue(JwtRegisteredClaimNames.Jti);

        var sessions = await _db.ActiveSessions
            .Where(s => s.UserId == userId && s.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new
            {
                s.Id,
                s.DeviceInfo,
                s.CreatedAt,
                s.ExpiresAt,
                IsCurrent = s.Jti == currentJti
            })
            .ToListAsync();

        return Ok(sessions);
    }

    [Authorize]
    [HttpDelete("sessions/{id}")]
    public async Task<IActionResult> RevokeSession(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var session = await _db.ActiveSessions
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

        if (session == null) return NotFound();

        _db.ActiveSessions.Remove(session);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest req)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _db.Users.FindAsync(userId);

        if (user == null || !BCrypt.Net.BCrypt.Verify(req.CurrentPassword, user.PasswordHash))
            return Unauthorized(new { message = "Current password is incorrect." });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Password changed successfully." });
    }

    private async Task<string> CreateSession(User user)
    {
        var result = _jwt.GenerateToken(user);

        _db.ActiveSessions.Add(new ActiveSession
        {
            UserId = user.Id,
            Jti = result.Jti,
            ExpiresAt = result.ExpiresAt,
            DeviceInfo = Request.Headers["User-Agent"].ToString()
        });

        await _db.SaveChangesAsync();
        return result.Token;
    }
}
