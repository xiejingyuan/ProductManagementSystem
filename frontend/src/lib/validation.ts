export function validatePassword(pwd: string): string | null {
  if (pwd.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(pwd)) return "Password must contain an uppercase letter.";
  if (!/[a-z]/.test(pwd)) return "Password must contain a lowercase letter.";
  if (!/[0-9]/.test(pwd)) return "Password must contain a number.";
  if (!/[^A-Za-z0-9]/.test(pwd)) return "Password must contain a special character.";
  return null;
}
