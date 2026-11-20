// test-db.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
    try {
        const r = await pool.query('SELECT NOW() AS now, current_user AS who, current_database() AS db');
        console.log('✅ Connected!');
        console.log('   Time     :', r.rows[0].now);
        console.log('   User     :', r.rows[0].who);
        console.log('   Database :', r.rows[0].db);
    } catch (e) {
        console.error('❌ Connection failed:', e.message);
    } finally {
        await pool.end();
    }
})();