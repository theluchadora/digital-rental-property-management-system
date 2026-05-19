import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticateToken = (req: any, res: Response, next: NextFunction) => {
  // Extract token from cookies
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ error: "Forbidden: Invalid or expired token" });
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
};