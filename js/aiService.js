/**
 * AI 服务 - 周报生成
 */
const CONFIG_KEY = 'ai_weekly_config';
const REMOTE_CONFIG_URL = 'https://ai-pages.dc616fa1.er.aliyun-esa.net/api/storage?key=config';
const DECRYPT_KEY = 'shfn73fnein348un';

function decryptConfig(e) { try { const d = CryptoJS.RC4.decrypt(e, DECRYPT_KEY).toString(CryptoJS.enc.Utf8); if (!d) return null; const c = JSON.parse(d); c.modelName = 'GLM-4-Flash'; return c; } catch (e) { return null; } }
async function fetchRemoteConfig() { try { const r = await fetch(REMOTE_CONFIG_URL); if (!r.ok) return null; const d = await r.json(); if (d && d.value) { const c = decryptConfig(d.value); if (c && c.apiUrl && c.apiKey) { localStorage.setItem(CONFIG_KEY + '_remote', JSON.stringify(c)); return c; } } return null; } catch (e) { return null; } }
function getModelConfig() { try { const u = localStorage.getItem(CONFIG_KEY); if (u) { const p = JSON.parse(u); if (p && p.apiUrl && p.apiKey && p.modelName) return p; } const r = localStorage.getItem(CONFIG_KEY + '_remote'); if (r) return JSON.parse(r); return null; } catch (e) { return null; } }
function saveModelConfig(c) { localStorage.setItem(CONFIG_KEY, JSON.stringify(c)); }
async function initConfig() { const c = getModelConfig(); if (c) return c; return await fetchRemoteConfig(); }

async function generateReport(workItems, template, onMessage, onComplete, onError) {
    let config = getModelConfig();
    if (!config || !config.apiUrl || !config.apiKey) config = await fetchRemoteConfig();
    if (!config || !config.apiUrl || !config.apiKey || !config.modelName) { onError(new Error('请先配置模型')); return { abort: () => { } }; }

    const templateMap = { tech: '技术研发', product: '产品运营', sales: '销售商务', admin: '行政人事' };
    const prompt = `你是一位专业的${templateMap[template]}工作人员，请根据以下工作要点，生成一份规范、专业的周报。

本周工作要点：
${workItems}

请按以下格式生成周报：

## 📋 本周工作总结

（对工作内容进行专业描述和总结，适当扩展细节）

## ✅ 主要成果

（列出本周的主要工作成果）

## 🔍 问题与风险

（如有，列出遇到的问题和潜在风险）

## 💡 经验与思考

（总结工作中的经验教训）

请用专业、正式的语言撰写，内容充实但不冗余。`;

    const controller = new AbortController();
    try {
        const response = await fetch(`${config.apiUrl}/chat/completions`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.apiKey}` },
            body: JSON.stringify({ model: config.modelName, messages: [{ role: 'user', content: prompt }], stream: true, temperature: 0.7 }),
            signal: controller.signal
        });
        if (!response.ok) throw new Error(`请求失败: ${response.status}`);
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) { onComplete(); break; }
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n'); buffer = lines.pop() || '';
            for (const line of lines) { if (line.startsWith('data: ')) { const data = line.slice(6).trim(); if (data === '[DONE]') { onComplete(); return; } try { const content = JSON.parse(data).choices?.[0]?.delta?.content; if (content) onMessage(content); } catch (e) { } } }
        }
    } catch (error) { if (error.name !== 'AbortError') onError(error); }
    return { abort: () => controller.abort() };
}

async function generatePlan(workItems, template, onMessage, onComplete, onError) {
    let config = getModelConfig();
    if (!config || !config.apiUrl || !config.apiKey) config = await fetchRemoteConfig();
    if (!config || !config.apiUrl || !config.apiKey || !config.modelName) { onError(new Error('请先配置模型')); return { abort: () => { } }; }

    const prompt = `根据本周工作内容，生成下周工作计划：

本周工作：
${workItems}

请按以下格式生成下周计划：

## 📅 下周工作计划

### 重点任务
（列出下周的重点工作任务）

### 持续跟进
（需要持续跟进的事项）

### 学习提升
（计划学习或提升的内容）

请确保计划具体可执行，有明确的目标。`;

    const controller = new AbortController();
    try {
        const response = await fetch(`${config.apiUrl}/chat/completions`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.apiKey}` },
            body: JSON.stringify({ model: config.modelName, messages: [{ role: 'user', content: prompt }], stream: true, temperature: 0.7 }),
            signal: controller.signal
        });
        if (!response.ok) throw new Error(`请求失败: ${response.status}`);
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) { onComplete(); break; }
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n'); buffer = lines.pop() || '';
            for (const line of lines) { if (line.startsWith('data: ')) { const data = line.slice(6).trim(); if (data === '[DONE]') { onComplete(); return; } try { const content = JSON.parse(data).choices?.[0]?.delta?.content; if (content) onMessage(content); } catch (e) { } } }
        }
    } catch (error) { if (error.name !== 'AbortError') onError(error); }
    return { abort: () => controller.abort() };
}

window.AIService = { getModelConfig, saveModelConfig, initConfig, generateReport, generatePlan };
