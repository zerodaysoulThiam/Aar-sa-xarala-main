const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?";

export interface GeneratorOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  digits: boolean;
  symbols: boolean;
}

export const defaultOptions: GeneratorOptions = {
  length: 16,
  uppercase: true,
  lowercase: true,
  digits: true,
  symbols: true,
};

export function generatePassword(options: GeneratorOptions = defaultOptions): string {
  let chars = "";
  let required = "";

  if (options.lowercase) { chars += LOWERCASE; required += LOWERCASE[Math.floor(Math.random() * LOWERCASE.length)]; }
  if (options.uppercase) { chars += UPPERCASE; required += UPPERCASE[Math.floor(Math.random() * UPPERCASE.length)]; }
  if (options.digits) { chars += DIGITS; required += DIGITS[Math.floor(Math.random() * DIGITS.length)]; }
  if (options.symbols) { chars += SYMBOLS; required += SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]; }

  if (!chars) chars = LOWERCASE + UPPERCASE + DIGITS;

  const remaining = options.length - required.length;
  let password = required;
  for (let i = 0; i < remaining; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }

  return password.split("").sort(() => Math.random() - 0.5).join("");
}

export function getPasswordStrength(password: string): { score: number; label: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const labels = ["Très faible", "Faible", "Moyen", "Bon", "Fort", "Très fort", "Excellent"];
  return { score, label: labels[Math.min(score, labels.length - 1)] };
}
