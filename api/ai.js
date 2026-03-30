// api/ai.js — Vercel Serverless Function
// Proxira zahteve ka Anthropic API-ju
// API ključ se čuva u Vercel Environment Variables kao ANTHROPIC_API_KEY

module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Preflight
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    // Samo POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'API ključ nije konfigurisan.' });
    }

    const { system, messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Nedostaje messages polje.' });
    }

    try {
        const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 1024,
                system: system || '',
                messages
            })
        });

        if (!anthropicRes.ok) {
            const errText = await anthropicRes.text();
            return res.status(anthropicRes.status).json({
                error: `Anthropic greška: ${anthropicRes.status}`,
                detail: errText
            });
        }

        const data = await anthropicRes.json();
        const content = data.content?.[0]?.text || '';

        return res.status(200).json({ content });

    } catch (err) {
        return res.status(500).json({
            error: 'Interna greška servera.',
            detail: err.message
        });
    }
};
