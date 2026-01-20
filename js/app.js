/**
 * AI 周报助手 - 主应用
 */
const DOM = {};
const AppState = { template: 'tech', workItems: '', currentReport: '', reports: [] };

function initDOM() {
    DOM.workInput = document.getElementById('work-input');
    DOM.btnGenerate = document.getElementById('btn-generate');
    DOM.btnPlan = document.getElementById('btn-plan');
    DOM.reportResult = document.getElementById('report-result');
    DOM.reportContent = document.getElementById('report-content');
    DOM.historyPanel = document.getElementById('history-panel');
    DOM.historyList = document.getElementById('history-list');
    DOM.historyOverlay = document.getElementById('history-overlay');
    DOM.settingsModal = document.getElementById('settings-modal');
    DOM.toast = document.getElementById('toast');
}

function initEvents() {
    document.querySelectorAll('.template-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            AppState.template = btn.dataset.template;
        });
    });

    DOM.workInput.addEventListener('input', () => AppState.workItems = DOM.workInput.value);
    DOM.btnGenerate.addEventListener('click', generateReport);
    DOM.btnPlan.addEventListener('click', generatePlan);
    document.getElementById('btn-copy').addEventListener('click', copyReport);
    document.getElementById('btn-save').addEventListener('click', saveReport);

    document.getElementById('btn-history').addEventListener('click', () => { DOM.historyPanel.classList.add('open'); DOM.historyOverlay.classList.remove('hidden'); });
    document.getElementById('btn-close-history').addEventListener('click', closeHistory);
    DOM.historyOverlay.addEventListener('click', closeHistory);

    document.getElementById('btn-settings').addEventListener('click', () => { DOM.settingsModal.classList.add('show'); loadSettings(); });
    document.getElementById('btn-close-settings').addEventListener('click', () => DOM.settingsModal.classList.remove('show'));
    document.getElementById('btn-cancel-settings').addEventListener('click', () => DOM.settingsModal.classList.remove('show'));
    document.getElementById('btn-save-settings').addEventListener('click', saveSettings);

    document.querySelectorAll('.example-btn').forEach(btn => btn.addEventListener('click', () => loadExample(btn.dataset.example)));
}

const EXAMPLES = {
    dev: `- 完成用户登录模块开发和单元测试
- 修复首页加载缓慢问题，优化SQL查询
- 参加需求评审会议，讨论V2.0功能
- 协助QA进行回归测试`,
    pm: `- 完成V2.0产品需求文档撰写
- 组织需求评审会议，收集反馈
- 分析用户反馈，整理优化建议
- 与设计团队对接UI改版方案`,
    test: `- 完成登录模块测试用例编写（50条）
- 执行回归测试，发现3个bug
- 搭建自动化测试环境
- 编写接口测试脚本`,
    design: `- 完成V2.0首页改版设计
- 输出5个页面的UI设计稿
- 与开发对接切图规范
- 整理设计规范文档`
};

function loadExample(key) {
    const ex = EXAMPLES[key];
    if (!ex) return;
    DOM.workInput.value = ex;
    AppState.workItems = ex;
    showToast('info', '已填入示例', '点击"生成周报"');
}

async function generateReport() {
    if (!AppState.workItems.trim()) { showToast('warning', '请输入工作内容', ''); return; }
    DOM.reportResult.classList.remove('hidden');
    DOM.reportContent.textContent = '';
    AppState.currentReport = '';

    await AIService.generateReport(AppState.workItems, AppState.template,
        (text) => { AppState.currentReport += text; DOM.reportContent.textContent = AppState.currentReport; },
        () => showToast('success', '周报生成完成', ''),
        (e) => showToast('error', '生成失败', e.message)
    );
}

async function generatePlan() {
    if (!AppState.workItems.trim()) { showToast('warning', '请输入工作内容', ''); return; }
    DOM.reportResult.classList.remove('hidden');
    DOM.reportContent.textContent = '';
    AppState.currentReport = '';

    await AIService.generatePlan(AppState.workItems, AppState.template,
        (text) => { AppState.currentReport += text; DOM.reportContent.textContent = AppState.currentReport; },
        () => showToast('success', '计划生成完成', ''),
        (e) => showToast('error', '生成失败', e.message)
    );
}

function copyReport() {
    if (!AppState.currentReport) { showToast('warning', '无内容复制', ''); return; }
    navigator.clipboard.writeText(AppState.currentReport).then(() => showToast('success', '已复制', ''));
}

async function saveReport() {
    if (!AppState.currentReport) { showToast('warning', '无内容保存', ''); return; }
    const report = { template: AppState.template, workItems: AppState.workItems, content: AppState.currentReport };
    const result = await StorageService.saveReport(report);
    if (result.success) { showToast('success', '已保存', result.cloudSync ? '已同步云端' : '本地保存'); loadHistory(); }
}

async function loadHistory() { AppState.reports = await StorageService.getReports(); renderHistory(); }

function renderHistory() {
    if (AppState.reports.length === 0) { DOM.historyList.innerHTML = '<p class="text-gray-400 text-sm text-center">暂无历史周报</p>'; return; }
    DOM.historyList.innerHTML = AppState.reports.map(r => `
        <div class="p-3 bg-emerald-50 rounded-xl cursor-pointer hover:bg-emerald-100 transition-all" data-id="${r.id}">
            <div class="font-medium text-gray-700">周报 - ${new Date(r.createdAt).toLocaleDateString()}</div>
            <div class="text-xs text-gray-400 mt-1">${r.template === 'tech' ? '技术研发' : r.template === 'product' ? '产品运营' : r.template === 'sales' ? '销售商务' : '行政人事'}</div>
        </div>
    `).join('');
}

function closeHistory() { DOM.historyPanel.classList.remove('open'); DOM.historyOverlay.classList.add('hidden'); }
function loadSettings() { const c = AIService.getModelConfig() || {}; document.getElementById('api-url').value = c.apiUrl || ''; document.getElementById('api-key').value = c.apiKey || ''; document.getElementById('model-name').value = c.modelName || ''; }
function saveSettings() { const c = { apiUrl: document.getElementById('api-url').value.trim(), apiKey: document.getElementById('api-key').value.trim(), modelName: document.getElementById('model-name').value.trim() || 'GLM-4-Flash' }; if (!c.apiUrl || !c.apiKey) { showToast('warning', '请填写完整', ''); return; } AIService.saveModelConfig(c); DOM.settingsModal.classList.remove('show'); showToast('success', '配置已保存', ''); }

function showToast(type, title, message) {
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const colors = { success: 'bg-green-500', error: 'bg-red-500', warning: 'bg-yellow-500', info: 'bg-emerald-500' };
    document.getElementById('toast-icon').className = `w-8 h-8 rounded-full flex items-center justify-center ${colors[type]}`;
    document.getElementById('toast-icon').textContent = icons[type];
    document.getElementById('toast-title').textContent = title;
    document.getElementById('toast-message').textContent = message;
    DOM.toast.classList.remove('hidden');
    setTimeout(() => DOM.toast.classList.add('hidden'), 3000);
}

async function init() {
    initDOM();
    initEvents();
    await loadHistory();
    const config = await AIService.initConfig();
    if (!config) setTimeout(() => { DOM.settingsModal.classList.add('show'); showToast('info', '欢迎使用', '请配置 AI 模型'); }, 500);
}

document.addEventListener('DOMContentLoaded', init);
