using System.ComponentModel.DataAnnotations;

public class AiDescriptionRequest
{
    [Required]
    public string ProductName { get; set; } = string.Empty;

    [Required]
    public string Category { get; set; } = string.Empty;
}
