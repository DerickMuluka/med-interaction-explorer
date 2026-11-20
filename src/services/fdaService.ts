import axios from 'axios';

interface FDAInteractionResult {
    drugName: string;
    text: string;
}

// 1. Normalize name via RxNorm (Free NLM API)
export async function getRxCUI(drugName: string): Promise<string | null> {
    try {
        const res = await axios.get(`https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(drugName)}`);
        const idGroup = res.data.idGroup;
        return idGroup?.rxnormId?.[0] || null;
    } catch (e) {
        return null;
    }
}

// 2. Fetch FDA Label Interactions
export async function fetchFDAInteractions(drugName: string): Promise<string> {
    try {
        // Search OpenFDA for the drug label
        const res = await axios.get(`https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encodeURIComponent(drugName)}"&limit=1`);
        const results = res.data.results;
        if (results && results.length > 0) {
            const label = results[0];
            // The "drug_interactions" field is an array of strings
            if (label.drug_interactions) {
                return label.drug_interactions.join(' '); 
            }
            // Fallback to warnings if interactions field missing
            if (label.warnings) {
                return label.warnings.join(' ');
            }
        }
        return "No specific interaction text found in FDA label.";
    } catch (e) {
        return "Error fetching data from OpenFDA.";
    }
}