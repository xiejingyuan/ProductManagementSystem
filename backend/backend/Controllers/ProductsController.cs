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
    public async Task<IActionResult> GetAll()
    {
        var products = await _db.Products
            .Include(p => p.Variants)
            .Include(p => p.Images.OrderBy(i => i.SortOrder))
            .Where(p => p.UserId == GetUserId())
            .ToListAsync();
        return Ok(products);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var product = await _db.Products
            .Include(p => p.Variants)
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

        foreach (var v in req.Variants)
        {
            _db.ProductVariants.Add(new ProductVariant
            {
                ProductId = product.Id,
                Name = v.Name,
                Price = v.Price,
                Inventory = v.Inventory,
                Sku = v.Sku
            });
        }
        await _db.SaveChangesAsync();

        var created = await _db.Products
            .Include(p => p.Variants)
            .Include(p => p.Images)
            .FirstAsync(p => p.Id == product.Id);

        return CreatedAtAction(nameof(GetById), new { id = product.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, ProductRequest req)
    {
        var product = await _db.Products
            .Include(p => p.Variants)
            .Include(p => p.Images.OrderBy(i => i.SortOrder))
            .FirstOrDefaultAsync(p => p.Id == id && p.UserId == GetUserId());

        if (product == null) return NotFound();

        product.Name = req.Name;
        product.Category = req.Category;
        product.Price = req.Price;
        product.Inventory = req.Inventory;
        product.Description = req.Description;
        product.UpdatedAt = DateTime.UtcNow;

        _db.ProductVariants.RemoveRange(product.Variants);
        foreach (var v in req.Variants)
        {
            _db.ProductVariants.Add(new ProductVariant
            {
                ProductId = product.Id,
                Name = v.Name,
                Price = v.Price,
                Inventory = v.Inventory,
                Sku = v.Sku
            });
        }

        await _db.SaveChangesAsync();

        var updated = await _db.Products
            .Include(p => p.Variants)
            .Include(p => p.Images.OrderBy(i => i.SortOrder))
            .FirstAsync(p => p.Id == id);

        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var product = await _db.Products
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == id && p.UserId == GetUserId());

        if (product == null) return NotFound();

        foreach (var image in product.Images)
        {
            if (!string.IsNullOrEmpty(image.PublicId))
                await _cloudinary.DestroyAsync(new DeletionParams(image.PublicId)
                {
                    ResourceType = image.ResourceType == "video" ? ResourceType.Video : ResourceType.Image
                });
        }

        _db.Products.Remove(product);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
