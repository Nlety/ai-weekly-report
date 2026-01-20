/**
 * 存储服务 - 周报历史
 */
const STORAGE_KEY = 'ai_weekly_reports';
const API_BASE = '/api/report-storage';

async function getReports() {
    try {
        const local = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        try { const r = await fetch(`${API_BASE}?action=list`); if (r.ok) { const c = await r.json(); if (c.reports) { const m = mergeData(local, c.reports); localStorage.setItem(STORAGE_KEY, JSON.stringify(m)); return m; } } } catch (e) { }
        return local;
    } catch (e) { return []; }
}

function mergeData(local, cloud) { const map = new Map();[...local, ...cloud].forEach(r => { if (!map.has(r.id) || r.updatedAt > map.get(r.id).updatedAt) map.set(r.id, r); }); return Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt); }

async function saveReport(report) {
    try {
        const reports = await getReports();
        const now = Date.now();
        if (!report.id) { report.id = `report_${now}_${Math.random().toString(36).slice(2, 8)}`; report.createdAt = now; }
        report.updatedAt = now;
        const index = reports.findIndex(r => r.id === report.id);
        if (index >= 0) reports[index] = report; else reports.unshift(report);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
        let cloudSync = false;
        try { const r = await fetch(API_BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'save', report }) }); cloudSync = r.ok; } catch (e) { }
        return { success: true, cloudSync, report };
    } catch (e) { return { success: false, error: e.message }; }
}

async function deleteReport(id) {
    try {
        let reports = await getReports();
        reports = reports.filter(r => r.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
        try { await fetch(API_BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) }); } catch (e) { }
        return { success: true };
    } catch (e) { return { success: false }; }
}

window.StorageService = { getReports, saveReport, deleteReport };
