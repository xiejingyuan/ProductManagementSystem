using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AiController : ControllerBase
{
    private readonly AiService _ai;

    public AiController(AiService ai) => _ai = ai;

    [HttpPost("description")]
    public async Task<IActionResult> GenerateDescription(AiDescriptionRequest req)
    {
        var description = await _ai.GenerateDescriptionAsync(req.ProductName, req.Category);
        return Ok(new { description });
    }
}
