using System.Text.Json.Serialization;

public class ProductImage
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string Url { get; set; } = string.Empty;
    public string PublicId { get; set; } = string.Empty;
    public string ResourceType { get; set; } = "image";
    public bool IsMain { get; set; }
    public string? AltText { get; set; }
    public int SortOrder { get; set; }

    [JsonIgnore]
    public Product Product { get; set; } = null!;
}
