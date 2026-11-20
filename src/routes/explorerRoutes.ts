import { Router } from 'express';
import { pool } from '../config/db';
import { requireAuth } from '../middleware/auth';
import { getRxCUI, fetchFDAInteractions } from '../services/fdaService';
import { findInteractionChains } from '../services/graphService';

const router = Router();

// Explorer Page
router.get('/', requireAuth, async (req, res) => {
    const meds = await pool.query("SELECT * FROM medications ORDER BY name ASC");
    res.render('explorer', { meds: meds.rows, chains: null, selectedDrug: null, user: req.session.username });
});

// Add a Medication (Fetch real data from FDA)
router.post('/add-medication', requireAuth, async (req, res) => {
    const { name } = req.body;
    // 1. Get RxCUI
    const rxcui = await getRxCUI(name);
    // 2. Fetch interaction text
    const interactionText = await fetchFDAInteractions(name);
    
    try {
        await pool.query(
            `INSERT INTO medications (rxcui, name, description) 
             VALUES ($1, $2, $3) ON CONFLICT (rxcui) DO NOTHING`,
            [rxcui, name, interactionText]
        );
    } catch (e) { console.error("Insert failed", e); }
    res.redirect('/explorer');
});

// View Interaction Chain (The Recursive CTE in action)
router.get('/chain/:id', requireAuth, async (req, res) => {
    const drugId = parseInt(req.params.id);
    const chains = await findInteractionChains(drugId, 4); // Depth 4
    const meds = await pool.query("SELECT * FROM medications ORDER BY name ASC");
    const selectedDrug = await pool.query("SELECT * FROM medications WHERE id = $1", [drugId]);
    
    res.render('explorer', { 
        meds: meds.rows, 
        chains: chains, 
        selectedDrug: selectedDrug.rows[0],
        user: req.session.username 
    });
});

export default router;