import { Request, Response, NextFunction } from 'express';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) return res.redirect('/login');
    next();
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    // Ensure the session has the admin role
    if (req.session.role !== 'admin') {
        return res.status(403).send("Access Denied: Admins Only");
    }
    next();
};