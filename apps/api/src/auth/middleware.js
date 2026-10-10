import { findSession } from './sessions.js';

export async function requireAuth(req, res, next) {
  try {
    const session = await findSession(req);
    if (!session) return res.status(401).json({ message: 'Authentication required' });

    req.session = session;
    req.user = session.user;
    next();
  } catch (error) {
    next(error);
  }
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// CSRF defense in depth (on top of SameSite=Strict cookies): state-changing requests
// must carry a custom header, which browsers won't send cross-origin without a CORS
// preflight — and this API doesn't enable CORS.
export function requireCsrfHeader(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  if (req.get('x-requested-with') !== 'HomeHub') {
    return res.status(403).json({ message: 'Missing X-Requested-With header' });
  }
  next();
}
