// utils/logger.ts
// Logger sécurisé — no-op en production, actif en développement uniquement
// Empêche l'exposition de données sensibles dans les builds de production

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

export const log = (...args: unknown[]): void => {
  if (isDev) console.log(...args);
};

export const logError = (...args: unknown[]): void => {
  if (isDev) console.error(...args);
};

export const logWarn = (...args: unknown[]): void => {
  if (isDev) console.warn(...args);
};
