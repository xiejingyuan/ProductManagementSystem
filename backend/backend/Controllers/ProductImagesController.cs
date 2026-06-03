using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.Features;
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

    private const long MaxFileSize = 50L * 1024 * 1024; // 50 MB

    [HttpPost("{productId}")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(50L * 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = 50L * 1024 * 1024)]
    public async Task<IActionResult> Upload(int productId, IFormFile file, [FromForm] string? altText, [FromForm] bool isMain = false)
    {
        var product = await _db.Products
            .FirstOrDefaultAsync(p => p.Id == productId && p.UserId == GetUserId());

        if (product == null) return NotFound();

        if (file == null || file.Length == 0)
            return BadRequest(new { message = "File is empty" });

        if (file.Length > MaxFileSize)
            return BadRequest(new { message = "File exceeds the 50 MB limit." });

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

        // If this is the main image, unset any existing main
        if (isMain)
        {
            var prevMain = await _db.ProductImages
                .Where(i => i.ProductId == productId && i.IsMain)
                .FirstOrDefaultAsync();
            if (prevMain != null) prevMain.IsMain = false;
        }

        // Auto-set as main if no images exist yet
        bool noImagesYet = !await _db.ProductImages.AnyAsync(i => i.ProductId == productId);

        var sortOrder = await _db.ProductImages
            .Where(i => i.ProductId == productId)
            .CountAsync();

        var image = new ProductImage
        {
            ProductId = productId,
            Url = uploadResult.SecureUrl.ToString(),
            PublicId = uploadResult.PublicId,
            ResourceType = isVideo ? "video" : "image",
            IsMain = isMain || noImagesYet,
            AltText = altText,
            SortOrder = sortOrder
        };

        _db.ProductImages.Add(image);
        await _db.SaveChangesAsync();

        return Ok(image);
    }

    [HttpPost("{productId}/batch")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(200L * 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = 200L * 1024 * 1024)]
    public async Task<IActionResult> UploadBatch(int productId)
    {
        var product = await _db.Products
            .FirstOrDefaultAsync(p => p.Id == productId && p.UserId == GetUserId());

        if (product == null) return NotFound();

        var files = Request.Form.Files;
        if (files.Count == 0)
            return BadRequest(new { message = "No files provided" });

        var baseSortOrder = await _db.ProductImages
            .Where(i => i.ProductId == productId)
            .CountAsync();

        var results = new List<ProductImage>();

        foreach (var file in files)
        {
            if (file.Length == 0) continue;

            if (file.Length > MaxFileSize)
                return BadRequest(new { message = $"\"{file.FileName}\" exceeds the 50 MB limit." });

            var contentType = file.ContentType.ToLower();
            bool isImage = AllowedImageTypes.Contains(contentType);
            bool isVideo = AllowedVideoTypes.Contains(contentType);

            if (!isImage && !isVideo)
                return BadRequest(new { message = $"\"{file.FileName}\" is not an allowed file type." });

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

            var image = new ProductImage
            {
                ProductId = productId,
                Url = uploadResult.SecureUrl.ToString(),
                PublicId = uploadResult.PublicId,
                ResourceType = isVideo ? "video" : "image",
                IsMain = false,
                SortOrder = baseSortOrder + results.Count
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
