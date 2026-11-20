import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// GET: Admin Dashboard - Show pending users and user list
router.get('/dashboard', requireAdmin, async (req, res) => {
    const pending = await pool.query("SELECT id, username, created_at FROM users WHERE is_verified = FALSE");
    const users = await pool.query("SELECT id, username, role, is_verified, created_at FROM users ORDER BY created_at DESC");
    res.render('admin-dashboard', { 
        pending: pending.rows, 
        users: users.rows,
        user: req.session.username 
    });
});

// POST: Verify a user
router.post('/verify/:id', requireAdmin, async (req, res) => {
    await pool.query("UPDATE users SET is_verified = TRUE WHERE id = $1", [req.params.id]);
    res.redirect('/admin/dashboard');
});

// POST: Create a new user (Admin only)
router.post('/create-user', requireAdmin, async (req, res) => {
    const { username, password, role } = req.body;
    const hash = await bcrypt.hash(password, 10);
    try {
        await pool.query(
            "INSERT INTO users (username, password_hash, role, is_verified) VALUES ($1, $2, $3, TRUE)",
            [username, hash, role || 'user']
        );
    } catch (e) { console.error(e); }
    res.redirect('/admin/dashboard');
});

// POST: Delete a user (CRUD)
router.post('/delete/:id', requireAdmin, async (req, res) => {
    // Prevent admin from deleting themselves
    if (req.params.id == req.session.userId) return res.redirect('/admin/dashboard');
    await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]);
    res.redirect('/admin/dashboard');
});


// src/routes/adminRoutes.ts (add this before `export default router;`)
import bcrypt from 'bcryptjs';   // already imported

router.post('/reset-password/:id', requireAdmin, async (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).send('Password must be at least 6 characters.');
    }
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2",
                     [hash, req.params.id]);
    res.redirect('/admin/dashboard');
});


export default router;