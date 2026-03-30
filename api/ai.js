// api/ai.js — Vercel Edge Function
// Proxira zahteve ka Anthropic API-ju
// API ključ se čuva u Vercel Environment Variables kao ANTHROPIC_API_KEY

export const config = { runtime: 'edge' };

export default async function handler(req) {
    // Samo POST
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // CORS — dozvoli pozive sa tvog domena
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    // Preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        return new Response(JSON.stringify({ error: 'API ključ nije konfigurisan.' }), {
            status: 500,
            headers: corsHeaders
        });
    }

    let body;
    try {
        body = await req.json();
    } catch {
        return new Response(JSON.stringify({ error: 'Neispravan JSON.' }), {
            status: 400,
            headers: corsHeaders
        });
    }

    const { system, messages } = body;
    if (!messages || !Array.isArray(messages)) {
        return new Response(JSON.stringify({ error: 'Nedostaje messages polje.' }), {
            status: 400,
            headers: corsHeaders
        });
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
            return new Response(JSON.stringify({ error: `Anthropic greška: ${anthropicRes.status}`, detail: errText }), {
                status: anthropicRes.status,
                headers: corsHeaders
            });
        }

        const data = await anthropicRes.json();
        const content = data.content?.[0]?.text || '';

        return new Response(JSON.stringify({ content }), {
            status: 200,
            headers: corsHeaders
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: 'Interna greška servera.', detail: err.message }), {
            status: 500,
            headers: corsHeaders
        });
    }
}
