import { Request, Response, NextFunction } from 'express';
import { verifySessionToken } from '../lib/auth/jwt.ts';
import { UserRole, UserSession } from '../types.ts';

export interface AuthRequest extends Request {
  user?: UserSession;
}

export const requireAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  let token: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split('Bearer ')[1].trim();
  } else if (req.query && req.query.token) {
    token = String(req.query.token).trim();
  }

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized: Authentication required',
      code: 'AUTH_REQUIRED',
    });
  }

  const session = verifySessionToken(token);

  if (!session) {
    return res.status(401).json({
      error: 'Unauthorized: Invalid or expired session token',
      code: 'INVALID_TOKEN',
    });
  }

  req.user = session;
  next();
};

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized: Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden: You do not have permission to access this portal',
        code: 'ACCESS_DENIED',
        requiredRoles: allowedRoles,
        userRole: req.user.role,
      });
    }

    next();
  };
};

export const requireStudent = [requireAuth, requireRole('STUDENT')];
export const requireTeacher = [requireAuth, requireRole('TEACHER')];
export const requireAdmin = [requireAuth, requireRole('ADMIN', 'SUPER_ADMIN')];
