using System.ComponentModel.DataAnnotations;

public class StrongPasswordAttribute : ValidationAttribute
{
    protected override ValidationResult? IsValid(object? value, ValidationContext ctx)
    {
        var password = value as string;
        if (string.IsNullOrEmpty(password)) return ValidationResult.Success;

        if (!password.Any(char.IsUpper))
            return new ValidationResult("Password must contain at least one uppercase letter.");
        if (!password.Any(char.IsLower))
            return new ValidationResult("Password must contain at least one lowercase letter.");
        if (!password.Any(char.IsDigit))
            return new ValidationResult("Password must contain at least one number.");
        if (!password.Any(ch => !char.IsLetterOrDigit(ch)))
            return new ValidationResult("Password must contain at least one special character.");

        return ValidationResult.Success;
    }
}
