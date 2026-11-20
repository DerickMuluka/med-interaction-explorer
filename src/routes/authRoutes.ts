import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db';

const router = Router();

router.get('/login', (req, res) => res.render('login', { error: null }));

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    const user = result.rows[0];

    if (!user) return res.render('login', { error: 'User not found' });
    if (!user.is_verified) return res.render('login', { error: 'Account pending Admin verification' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.render('login', { error: 'Invalid password' });

    // Set Session
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;

    if (user.role === 'admin') res.redirect('/admin/dashboard');
    else res.redirect('/explorer');
});

router.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/login'));
});

export default router;