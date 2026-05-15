using System.ComponentModel.DataAnnotations;

public class RegisterRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(8), StrongPassword]
    public string Password { get; set; } = string.Empty;
}
