using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly Cloudinary _cloudinary;

    public ProductsController(AppDbContext db, Cloudinary cloudinary)
    {
        _db = db;
        _cloudinary = cloudinary;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? page,
        [FromQuery] int pageSize = 25,
        [FromQuery] string? search = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? sortDir = null)
    {
        var query = _db.Products
            .Include(p => p.Images.OrderBy(i => i.SortOrder))
            .Where(p => p.UserId == GetUserId())
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(p => p.Name.ToLower().Contains(search.ToLower()));

        query = (sortBy, sortDir?.ToLower()) switch
        {
            ("category", "desc") => query.OrderByDescending(p => p.Category),
            ("category", _)      => query.OrderBy(p => p.Category),
            ("status",   "desc") => query.OrderBy(p => p.Inventory > 0),
            ("status",   _)      => query.OrderByDescending(p => p.Inventory > 0),
            _                    => query.OrderByDescending(p => p.Id)
        };

        if (page.HasValue)
        {
            var totalCount = await query.CountAsync();
            var items = await query
                .Skip((page.Value - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
            return Ok(new { items, totalCount });
        }

        return Ok(await query.ToListAsync());
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var userId = GetUserId();
        var baseQuery = _db.Products.Where(p => p.UserId == userId);

        var total = await baseQuery.CountAsync();
        var active = await baseQuery.CountAsync(p => p.Inventory > 0);

        var byCategory = await baseQuery
            .GroupBy(p => p.Category)
            .Select(g => new { category = g.Key, count = g.Count() })
            .OrderByDescending(x => x.count)
            .ToListAsync();

        var recentlyAdded = await baseQuery
            .OrderByDescending(p => p.Id)
            .Take(5)
            .Select(p => new { p.Id, p.Name, p.CreatedAt })
            .ToListAsync();

        return Ok(new
        {
            total,
            active,
            outOfStock = total - active,
            byCategory,
            recentlyAdded
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var product = await _db.Products
            .Include(p => p.Images.OrderBy(i => i.SortOrder))
            .FirstOrDefaultAsync(p => p.Id == id && p.UserId == GetUserId());
        return product == null ? NotFound() : Ok(product);
    }

    [HttpPost]
    public async Task<IActionResult> Create(ProductRequest req)
    {
        var product = new Product
        {
            Name = req.Name,
            Category = req.Category,
            Price = req.Price,
            Inventory = req.Inventory,
            Description = req.Description,
            UserId = GetUserId()
        };

        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        var created = await _db.Products
            .Include(p => p.Images)
            .FirstAsync(p => p.Id == product.Id);

        return CreatedAtAction(nameof(GetById), new { id = product.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, ProductRequest req)
    {
        var product = await _db.Products
            .Include(p => p.Images.OrderBy(i => i.SortOrder))
            .FirstOrDefaultAsync(p => p.Id == id && p.UserId == GetUserId());

        if (product == null) return NotFound();

        product.Name = req.Name;
        product.Category = req.Category;
        product.Price = req.Price;
        product.Inventory = req.Inventory;
        product.Description = req.Description;
        product.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(product);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var product = await _db.Products
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == id && p.UserId == GetUserId());

        if (product == null) return NotFound();

        foreach (var img in product.Images)
        {
            if (!string.IsNullOrEmpty(img.PublicId))
                await _cloudinary.DestroyAsync(new DeletionParams(img.PublicId)
                {
                    ResourceType = img.ResourceType == "video" ? ResourceType.Video : ResourceType.Image
                });
        }

        _db.Products.Remove(product);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
