// Password must be at least 8 characters with at least one uppercase,
// one lowercase, one digit, and one special character.
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
