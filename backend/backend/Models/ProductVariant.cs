using System.Text.Json.Serialization;

public class ProductVariant
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal? Price { get; set; }
    public int Inventory { get; set; }
    public string? Sku { get; set; }

    [JsonIgnore]
    public Product Product { get; set; } = null!;
}
