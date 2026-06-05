using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

[ApiController]
[Route("api/product-images")]
[Authorize]
public class ProductImagesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly Cloudinary _cloudinary;

    public ProductImagesController(AppDbContext db, Cloudinary cloudinary)
    {
        _db = db;
        _cloudinary = cloudinary;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("upload-signature")]
    public IActionResult GetUploadSignature()
    {
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var paramsToSign = new SortedDictionary<string, object>
        {
            { "timestamp", timestamp }
        };
        var signature = _cloudinary.Api.SignParameters(paramsToSign);

        return Ok(new
        {
            signature,
            timestamp,
            apiKey = _cloudinary.Api.Account.ApiKey,
            cloudName = _cloudinary.Api.Account.Cloud
        });
    }

    [HttpPost("{productId}")]
    public async Task<IActionResult> SaveImage(int productId, [FromBody] SaveImageRequest request)
    {
        var product = await _db.Products
            .FirstOrDefaultAsync(p => p.Id == productId && p.UserId == GetUserId());

        if (product == null) return NotFound();

        if (request.IsMain)
        {
            var prevMain = await _db.ProductImages
                .Where(i => i.ProductId == productId && i.IsMain)
                .FirstOrDefaultAsync();
            if (prevMain != null) prevMain.IsMain = false;
        }

        bool noImagesYet = !await _db.ProductImages.AnyAsync(i => i.ProductId == productId);

        var sortOrder = await _db.ProductImages
            .Where(i => i.ProductId == productId)
            .CountAsync();

        var image = new ProductImage
        {
            ProductId = productId,
            Url = request.Url,
            PublicId = request.PublicId,
            ResourceType = request.ResourceType,
            IsMain = request.IsMain || noImagesYet,
            AltText = request.AltText,
            SortOrder = sortOrder
        };

        _db.ProductImages.Add(image);
        await _db.SaveChangesAsync();

        return Ok(image);
    }

    [HttpPost("{productId}/batch")]
    public async Task<IActionResult> SaveBatch(int productId, [FromBody] List<SaveBatchImageRequest> images)
    {
        var product = await _db.Products
            .FirstOrDefaultAsync(p => p.Id == productId && p.UserId == GetUserId());

        if (product == null) return NotFound();

        if (images.Count == 0)
            return BadRequest(new { message = "No images provided" });

        var baseSortOrder = await _db.ProductImages
            .Where(i => i.ProductId == productId)
            .CountAsync();

        var results = new List<ProductImage>();

        for (int i = 0; i < images.Count; i++)
        {
            var img = images[i];
            var image = new ProductImage
            {
                ProductId = productId,
                Url = img.Url,
                PublicId = img.PublicId,
                ResourceType = img.ResourceType,
                IsMain = false,
                SortOrder = baseSortOrder + i
            };
            _db.ProductImages.Add(image);
            results.Add(image);
        }

        await _db.SaveChangesAsync();
        return Ok(results);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var image = await _db.ProductImages
            .Include(i => i.Product)
            .FirstOrDefaultAsync(i => i.Id == id && i.Product.UserId == GetUserId());

        if (image == null) return NotFound();

        if (!string.IsNullOrEmpty(image.PublicId))
            await _cloudinary.DestroyAsync(new DeletionParams(image.PublicId)
            {
                ResourceType = image.ResourceType == "video" ? ResourceType.Video : ResourceType.Image
            });

        _db.ProductImages.Remove(image);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}

public record SaveImageRequest(
    string Url,
    string PublicId,
    string ResourceType,
    bool IsMain = false,
    string? AltText = null
);

public record SaveBatchImageRequest(string Url, string PublicId, string ResourceType);
