// src/app.ts
import express from 'express';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import path from 'path';
import expressLayouts from 'express-ejs-layouts';   // <-- NEW
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import explorerRoutes from './routes/explorerRoutes';
import { pool } from './config/db';

const app = express();
const PgSession = pgSession(session);

// ---- FIX: absolute paths so it works no matter where you run from ----
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);                             // <-- NEW: enables layout.ejs
app.set('layout', 'layout');                         // <-- NEW: default layout file

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use(session({
    store: new PgSession({ pool, tableName: 'session' }),
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }
}));

app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/explorer', explorerRoutes);

app.get('/', (req, res) => {
    if (req.session.userId) res.redirect('/explorer');
    else res.redirect('/login');
});

app.listen(process.env.PORT || 3000, () =>
    console.log('Server running on http://localhost:3000'));