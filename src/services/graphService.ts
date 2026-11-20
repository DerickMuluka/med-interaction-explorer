import { pool } from '../config/db';

export async function findInteractionChains(startDrugId: number, maxDepth: number = 3) {
    // Using WITH RECURSIVE to traverse the graph of interactions
    const query = `
        WITH RECURSIVE interaction_chain AS (
            -- Base case: Start with the given drug
            SELECT 
                m.id AS drug_id,
                m.name AS drug_name,
                NULL::integer AS interacts_with_id,
                NULL::varchar AS interacts_with_name,
                NULL::varchar AS severity,
                0 AS depth,
                ARRAY[m.id] AS path_ids,
                ARRAY[m.name]::text[] AS path_names
            FROM medications m
            WHERE m.id = $1

            UNION ALL

            -- Recursive step: Join interactions to the chain
            SELECT 
                i.drug_b_id,
                m2.name,
                i.drug_a_id,
                m1.name,
                i.severity,
                ic.depth + 1,
                ic.path_ids || i.drug_b_id,
                ic.path_names || m2.name
            FROM interaction_chain ic
            JOIN interactions i ON (
                -- Find interactions where the current drug is either A or B
                (ic.drug_id = i.drug_a_id AND i.drug_b_id != ALL(ic.path_ids))
                OR 
                (ic.drug_id = i.drug_b_id AND i.drug_a_id != ALL(ic.path_ids))
            )
            JOIN medications m1 ON m1.id = i.drug_a_id
            JOIN medications m2 ON m2.id = i.drug_b_id
            WHERE ic.depth < $2
              AND NOT (m2.id = ANY(ic.path_ids)) -- Prevent cycles
        )
        SELECT * FROM interaction_chain ORDER BY depth, drug_name;
    `;
    
    const res = await pool.query(query, [startDrugId, maxDepth]);
    return res.rows;
}