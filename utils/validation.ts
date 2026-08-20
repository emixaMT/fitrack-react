// utils/validation.ts
// Validations de sécurité pour les paramètres de route et les inputs

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Valide qu'une string est un UUID valide (v4) */
export function isValidUUID(id: string | string[] | undefined): id is string {
  if (typeof id !== 'string') return false;
  return UUID_REGEX.test(id);
}

/** Valide et retourne un UUID sûr, ou null si invalide */
export function safeUUID(id: string | string[] | undefined): string | null {
  if (typeof id !== 'string') return null;
  return UUID_REGEX.test(id) ? id : null;
}

/** Valide qu'un nombre est dans une plage donnée */
export function isInRange(value: number, min: number, max: number): boolean {
  return !Number.isNaN(value) && value >= min && value <= max;
}

/** Regex mot de passe fort : min 8, majuscule, minuscule, chiffre, caractère spécial */
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^*()_\-+=\[\]{}|;:,.<>?])[A-Za-z\d@$!%*?&#^*()_\-+=\[\]{}|;:,.<>?]{8,}$/;

/** Sanitise une string (trim + longueur max) */
export function sanitizeText(text: string, maxLength = 1000): string {
  return text.trim().slice(0, maxLength);
}
