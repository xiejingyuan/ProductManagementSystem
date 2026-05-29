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
    private static readonly string[] AllowedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    private static readonly string[] AllowedVideoTypes = ["video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-msvideo"];

    private readonly AppDbContext _db;
    private readonly Cloudinary _cloudinary;

    public ProductImagesController(AppDbContext db, Cloudinary cloudinary)
    {
        _db = db;
        _cloudinary = cloudinary;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost("{productId}")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Upload(int productId, IFormFile file, [FromForm] string? altText)
    {
        var product = await _db.Products
            .FirstOrDefaultAsync(p => p.Id == productId && p.UserId == GetUserId());

        if (product == null) return NotFound();

        if (file == null || file.Length == 0)
            return BadRequest(new { message = "File is empty" });

        var contentType = file.ContentType.ToLower();
        bool isImage = AllowedImageTypes.Contains(contentType);
        bool isVideo = AllowedVideoTypes.Contains(contentType);

        if (!isImage && !isVideo)
            return BadRequest(new { message = "Only JPEG, PNG, GIF, WebP images or MP4, WebM, MOV videos are allowed" });

        using var stream = file.OpenReadStream();

        UploadResult uploadResult;
        if (isVideo)
        {
            uploadResult = await _cloudinary.UploadAsync(new VideoUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                Folder = $"products/{productId}",
                UseFilename = false,
                UniqueFilename = true,
                Overwrite = false
            });
        }
        else
        {
            uploadResult = await _cloudinary.UploadAsync(new ImageUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                Folder = $"products/{productId}",
                UseFilename = false,
                UniqueFilename = true,
                Overwrite = false
            });
        }

        if (uploadResult.Error != null)
            return StatusCode(500, new { message = uploadResult.Error.Message });

        var sortOrder = await _db.ProductImages
            .Where(i => i.ProductId == productId)
            .CountAsync();

        var image = new ProductImage
        {
            ProductId = productId,
            Url = uploadResult.SecureUrl.ToString(),
            PublicId = uploadResult.PublicId,
            ResourceType = isVideo ? "video" : "image",
            AltText = altText,
            SortOrder = sortOrder
        };

        _db.ProductImages.Add(image);
        await _db.SaveChangesAsync();

        return Ok(image);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var image = await _db.ProductImages
            .Include(i => i.Product)
            .FirstOrDefaultAsync(i => i.Id == id && i.Product.UserId == GetUserId());

        if (image == null) return NotFound();

        if (!string.IsNullOrEmpty(image.PublicId))
        {
            var deletionParams = new DeletionParams(image.PublicId)
            {
                ResourceType = image.ResourceType == "video" ? ResourceType.Video : ResourceType.Image
            };
            await _cloudinary.DestroyAsync(deletionParams);
        }

        _db.ProductImages.Remove(image);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
