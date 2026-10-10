import { config } from './config.js';

// Internal error details (Prisma messages, stack info) are only returned outside production.
export const exposeError = (error) => {
  if (!config.isProduction) return error?.message;
  console.error(error);
  return undefined;
};
