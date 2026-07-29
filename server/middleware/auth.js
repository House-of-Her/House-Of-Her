import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'house-of-her-super-secret-change-in-production-2026';

export function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name, model_id: user.model_id },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
