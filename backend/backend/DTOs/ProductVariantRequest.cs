using System.ComponentModel.DataAnnotations;

public class ProductVariantRequest
{
    [Required]
    public string Name { get; set; } = string.Empty;

    [Range(0, double.MaxValue)]
    public decimal? Price { get; set; }

    [Range(0, int.MaxValue)]
    public int Inventory { get; set; }

    public string? Sku { get; set; }
}
