

export const validatePassword = (password: string): string | true => {
    // const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    // return regex.test(password);
  if (password.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.';
  if (!/[A-Z]/.test(password)) return 'Le mot de passe doit contenir au moins une lettre majuscule.';
  if (!/[a-z]/.test(password)) return 'Le mot de passe doit contenir au moins une lettre minuscule.';
  if (!/\d/.test(password)) return 'Le mot de passe doit contenir au moins un chiffre.';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Le mot de passe doit contenir au moins un caractère spécial.';
  return true;
};


export const PHONE_ERROR_MESSAGE = 'Numéro de téléphone sénégalais invalide (ex. 77 123 45 67).';

/**
 * Ramène un numéro sénégalais à ses 9 chiffres, comme le fait le backend :
 * « 77 123 45 67 », « +221 77 123 45 67 » et « 00221771234567 » donnent tous
 * « 771234567 ».
 */
export const normalizePhoneNumber = (phone: string): string => {
    const compact = (phone || '').replace(/[\s.\-()]/g, '');
    for (const prefixe of ['+221', '00221', '221']) {
        if (compact.startsWith(prefixe) && compact.length - prefixe.length === 9) {
            return compact.slice(prefixe.length);
        }
    }
    return compact;
};

/** Accepte les séparateurs et l'indicatif : la validation porte sur le numéro normalisé. */
export const validatePhoneNumber = (phone: string): boolean => {
    const regex = /^(7[015678]\d{7}|33\d{7})$/;
    return regex.test(normalizePhoneNumber(phone));
}
