export function validatePassword(value: string): string | null {
  if (!value) return 'Le mot de passe est requis.';
  if (value.length < 8) return 'Au moins 8 caractères requis.';
  if (!/[a-zA-Z]/.test(value)) return 'Doit contenir au moins une lettre.';
  if (!/\d/.test(value)) return 'Doit contenir au moins un chiffre.';
  if (!/[!@#$%^&*()\-_=+\[\]{};:'",.<>?/\\|`~]/.test(value))
    return 'Doit contenir au moins un caractère spécial (!@#$%...).';
  return null;
}
