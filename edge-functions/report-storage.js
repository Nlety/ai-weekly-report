async function handleRequest(request) {
    const url = new URL(request.url);
    const KV = 'AI_WEEKLY';
    if (request.method === 'OPTIONS') return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
    try {
        if (request.method === 'GET' && url.searchParams.get('action') === 'list') {
            const index = await EdgeKV.get(KV, 'index'); const ids = index ? JSON.parse(index) : []; const reports = [];
            for (const id of ids.slice(0, 50)) { const r = await EdgeKV.get(KV, `report_${id}`); if (r) reports.push(JSON.parse(r)); }
            return new Response(JSON.stringify({ reports }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
        }
        if (request.method === 'POST') {
            const body = await request.json();
            if (body.action === 'save' && body.report) {
                await EdgeKV.put(KV, `report_${body.report.id}`, JSON.stringify(body.report));
                let index = await EdgeKV.get(KV, 'index'); let ids = index ? JSON.parse(index) : [];
                ids = ids.filter(id => id !== body.report.id); ids.unshift(body.report.id); if (ids.length > 100) ids = ids.slice(0, 100);
                await EdgeKV.put(KV, 'index', JSON.stringify(ids));
                return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
            }
            if (body.action === 'delete' && body.id) {
                await EdgeKV.delete(KV, `report_${body.id}`);
                let index = await EdgeKV.get(KV, 'index'); let ids = index ? JSON.parse(index) : [];
                ids = ids.filter(id => id !== body.id); await EdgeKV.put(KV, 'index', JSON.stringify(ids));
                return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
            }
        }
        return new Response(JSON.stringify({ error: 'Invalid' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }); }
}
addEventListener('fetch', e => { e.respondWith(handleRequest(e.request)); });
