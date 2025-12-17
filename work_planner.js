/**
 * Work Planner Unified Logic (Single Mode)
 */

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const STORAGE_KEY = 'eps_work_planner_v2';

// Initial State Template
const createNewTab = (id) => ({
    id: id,
    name: `Tab ${id + 1}`,
    data: [],
    excelConfig: {
        lastMapWsid: '',
        lastMapPlan: ''
    }
});

const app = {
    state: {
        tabs: [],
        currentTabId: 0,
        filter: 'all',
        dragItem: null
    },

    init() {
        this.loadState();
        this.renderTabs();
        this.renderUI();
        this.setupEventListeners();
        this.loadTheme();
    },

    // --- State Management ---
    loadState() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                this.state.tabs = parsed.tabs || [];
                this.state.currentTabId = parsed.currentTabId || 0;
            } catch (e) { console.error('Corrupt state', e); }
        }

        if (this.state.tabs.length === 0) {
            this.state.tabs = [createNewTab(0)];
        }
    },

    saveState() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            tabs: this.state.tabs,
            currentTabId: this.state.currentTabId
        }));
    },

    getCurrentTab() {
        return this.state.tabs.find(t => t.id === this.state.currentTabId) || this.state.tabs[0];
    },

    // --- Tab Management ---
    renderTabs() {
        const container = $('#tabsContainer');
        const addBtn = container.querySelector('.tab-add-btn');

        // Clear existing tabs (keep add btn)
        Array.from(container.children).forEach(c => {
            if (!c.classList.contains('tab-add-btn')) c.remove();
        });

        this.state.tabs.forEach(tab => {
            const el = document.createElement('div');
            el.className = `tab-item ${tab.id === this.state.currentTabId ? 'active' : ''}`;
            el.textContent = tab.name;
            el.onclick = () => this.switchTab(tab.id);
            container.insertBefore(el, addBtn);
        });
    },

    switchTab(id) {
        this.state.currentTabId = id;
        this.saveState();
        this.renderTabs();
        this.renderUI();
        $('#excelMappingArea').style.display = 'none';
        $('#fileExcel').value = '';
    },

    addTab() {
        const newId = this.state.tabs.length > 0 ? Math.max(...this.state.tabs.map(t => t.id)) + 1 : 0;
        this.state.tabs.push(createNewTab(newId));
        this.switchTab(newId);
    },

    renameTab() {
        const tab = this.getCurrentTab();
        const newName = prompt("Rename Tab:", tab.name);
        if (newName) {
            tab.name = newName;
            this.saveState();
            this.renderTabs();
        }
    },

    deleteTab() {
        if (confirm("Delete this tab and all its data?")) {
            const idx = this.state.tabs.findIndex(t => t.id === this.state.currentTabId);
            this.state.tabs.splice(idx, 1);
            if (this.state.tabs.length === 0) this.state.tabs.push(createNewTab(0));
            this.state.currentTabId = this.state.tabs[0].id;
            this.saveState();
            this.renderTabs();
            this.renderUI();
        }
    },

    // --- UI Rendering ---
    renderUI() {
        this.renderTableData();
    },

    setFilter(f) {
        this.state.filter = f;
        $$('[data-filter]').forEach(b => b.classList.toggle('active', b.dataset.filter === f));
        this.renderTableData();
    },

    renderTableData() {
        const tab = this.getCurrentTab();
        const tbody = $('#tableBody');
        tbody.innerHTML = '';

        // Filter Data
        let filtered = tab.data;
        if (this.state.filter !== 'all') {
            filtered = filtered.filter(row => row.status === this.state.filter);
        }

        // Metrics
        const total = tab.data.length;
        const done = tab.data.filter(r => r.status === 'done').length;
        const out = total - done;

        $('#mTotal').textContent = total;
        $('#mDone').textContent = done;
        $('#mOut').textContent = out;
        $('#emptyState').style.display = total === 0 ? 'block' : 'none';

        // Render Rows
        filtered.forEach((row, index) => {
            const tr = document.createElement('tr');
            tr.draggable = true;
            tr.dataset.id = row.id;

            // WSID Input
            const wsidInput = `<input class="cell-edit" value="${row.wsid}" onchange="app.updateField('${row.id}', 'wsid', this.value)">`;

            // Notes Textarea
            const notesInput = `<textarea class="cell-edit" onchange="app.updateField('${row.id}', 'notes', this.value)">${row.notes || ''}</textarea>`;

            // Plan 
            const planInput = `<input class="cell-edit" value="${row.plan || ''}" placeholder="-" onchange="app.updateField('${row.id}', 'plan', this.value)">`;

            // Status Button
            const statusClass = row.status === 'done' ? 'status-done' : 'status-outstanding';
            const statusLabel = row.status === 'done' ? 'Done' : 'Outstanding';
            const statusBtn = `<button class="status-btn ${statusClass}" onclick="app.toggleStatus('${row.id}')">${statusLabel}</button>`;

            tr.innerHTML = `
                <td class="col-order">${index + 1}</td>
                <td>${wsidInput}</td>
                <td>${notesInput}</td>
                <td>${planInput}</td>
                <td>${statusBtn}</td>
                <td>
                    <button class="btn-glass" onclick="app.deleteOne('${row.id}')" style="color:red; padding:4px 8px;">✕</button>
                </td>
            `;

            this.attachDragEvents(tr, row);
            tbody.appendChild(tr);
        });
    },

    attachDragEvents(tr, row) {
        tr.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', row.id);
            this.state.dragItem = row;
            tr.style.opacity = '0.5';
        });
        tr.addEventListener('dragend', () => {
            this.state.dragItem = null;
            tr.style.opacity = '1';
        });
        tr.addEventListener('dragover', (e) => e.preventDefault());
        tr.addEventListener('drop', (e) => {
            e.stopPropagation();
            if (this.state.dragItem && this.state.dragItem.id !== row.id) {
                this.reorderItems(this.state.dragItem.id, row.id);
            }
        });
    },

    // --- Actions ---

    addData() {
        const tab = this.getCurrentTab();
        tab.data.push({
            id: 'm_' + Date.now(),
            wsid: '',
            notes: '',
            plan: '',
            status: 'outstanding',
            timestamp: Date.now()
        });
        this.saveState();
        this.renderTableData();
    },

    updateField(id, field, val) {
        const row = this.getCurrentTab().data.find(r => r.id === id);
        if (row) {
            row[field] = val;
            this.saveState();
        }
    },

    toggleStatus(id) {
        const row = this.getCurrentTab().data.find(r => r.id === id);
        if (row) {
            row.status = row.status === 'done' ? 'outstanding' : 'done';
            this.saveState();
            this.renderTableData();
        }
    },

    deleteOne(id) {
        if (confirm("Delete item?")) {
            const tab = this.getCurrentTab();
            tab.data = tab.data.filter(r => r.id !== id);
            this.saveState();
            this.renderTableData();
        }
    },

    deleteAll() {
        if (confirm("Delete ALL items in this tab?")) {
            this.getCurrentTab().data = [];
            this.saveState();
            this.renderTableData();
        }
    },

    resetStatus() {
        if (confirm("Reset all status to Outstanding?")) {
            this.getCurrentTab().data.forEach(r => r.status = 'outstanding');
            this.saveState();
            this.renderTableData();
        }
    },

    reorderItems(srcId, targetId) {
        const tab = this.getCurrentTab();
        const srcIdx = tab.data.findIndex(r => r.id === srcId);
        const tgtIdx = tab.data.findIndex(r => r.id === targetId);

        if (srcIdx >= 0 && tgtIdx >= 0) {
            const item = tab.data.splice(srcIdx, 1)[0];
            tab.data.splice(tgtIdx, 0, item);
            this.saveState();
            this.renderTableData();
        }
    },

    // --- Excel Integration ---

    setupEventListeners() {
        const fileInput = $('#fileExcel');
        if (fileInput) {
            fileInput.addEventListener('change', async (e) => {
                const f = e.target.files[0];
                if (!f) return;
                try {
                    const buf = await f.arrayBuffer();
                    const wb = XLSX.read(buf, { type: 'array' });
                    const ws = wb.Sheets[wb.SheetNames[0]];
                    const matrix = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', blankrows: false });

                    if (!matrix || matrix.length === 0) return;

                    $('#excelMappingArea').style.display = 'block';

                    const headerIdx = this.findHeaderRow(matrix);
                    const headers = matrix[headerIdx].map(String);

                    this.state.tempExcelData = { matrix, headerIdx };

                    ['mapWSID', 'mapPlan'].forEach(id => {
                        const sel = $('#' + id);
                        sel.innerHTML = '<option value="">-- Pilih --</option>';
                        headers.forEach(h => {
                            const opt = document.createElement('option');
                            opt.value = h;
                            opt.textContent = h;
                            sel.appendChild(opt);
                        });
                    });

                } catch (err) { console.error(err); alert("Gagal baca Excel"); }
            });
        }
    },

    findHeaderRow(matrix) {
        for (let i = 0; i < Math.min(matrix.length, 20); i++) {
            const rowStr = matrix[i].join(' ').toLowerCase();
            if (rowStr.includes('wsid') || rowStr.includes('plan') || rowStr.includes('bulan')) return i;
        }
        return 0;
    },

    processExcel() {
        if (!this.state.tempExcelData) return;

        const mapWSID = $('#mapWSID').value;
        const mapPlan = $('#mapPlan').value;
        if (!mapWSID || !mapPlan) { alert("Pilih kolom WSID dan Plan dulu"); return; }

        const { matrix, headerIdx } = this.state.tempExcelData;
        const headers = matrix[headerIdx].map(String);

        // Robust Index Finding (Match exact string from options)
        const keyWSID = headers.indexOf(mapWSID);
        const keyPlan = headers.indexOf(mapPlan);

        if (keyWSID < 0 || keyPlan < 0) {
            alert(`Error: Kolom tidak ditemukan internal (Index fail). Coba file lain.`);
            return;
        }

        const tab = this.getCurrentTab();
        let updateCount = 0;
        let matchAttempts = 0;

        // Build Map
        const excelMap = new Map();
        for (let i = headerIdx + 1; i < matrix.length; i++) {
            const row = matrix[i];
            const rawWSID = row[keyWSID];
            if (!rawWSID) continue;

            // Normalize
            const cleanWSID = String(rawWSID).trim().toLowerCase();

            let plan = row[keyPlan];
            if (typeof plan === 'number') {
                const d = XLSX.SSF.parse_date_code(plan);
                if (d) plan = `${d.d}/${d.m}/${d.y}`;
            }
            if (plan) excelMap.set(cleanWSID, String(plan).trim());
        }

        // Update matches
        tab.data.forEach(item => {
            const itemWSID = String(item.wsid).trim().toLowerCase();
            if (itemWSID) {
                matchAttempts++;
                const matchPlan = excelMap.get(itemWSID);
                if (matchPlan) {
                    item.plan = matchPlan;
                    updateCount++;
                }
            }
        });

        // Diagnostics
        if (updateCount === 0 && matchAttempts > 0) {
            const sampleExcel = Array.from(excelMap.keys()).slice(0, 3).join(', ');
            const sampleList = tab.data.slice(0, 3).map(r => r.wsid).join(', ');
            alert(`0 Data terupdate! \nKemungkinan WSID tidak cocok.\n\nContoh di Excel: ${sampleExcel}\nContoh di List: ${sampleList}\n\nPastikan penulisan sama persis.`);
            return;
        }

        this.sortDataByDate(tab.data);
        this.saveState();
        this.renderTableData();

        $('#excelMappingArea').style.display = 'none';
        $('#fileExcel').value = '';
        alert(`Berhasil update ${updateCount} data dari ${excelMap.size} baris Excel.`);
    },

    sortDataByDate(data) {
        const parseScore = (str) => {
            if (!str) return 999999999999;
            str = str.toLowerCase();

            const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'mei', 'agt', 'okt', 'des'];
            const mIdx = months.findIndex(m => str.includes(m));

            if (mIdx >= 0) {
                const realIdx = (mIdx > 11) ? (mIdx === 12 ? 4 : (mIdx === 13 ? 7 : (mIdx === 14 ? 9 : 11))) : mIdx;
                const yearMatch = str.match(/\d{4}/);
                const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();
                return (year * 100) + realIdx;
            }

            const d = new Date(str);
            if (!isNaN(d.getTime())) return d.getTime();
            return 999999999999;
        };

        data.sort((a, b) => {
            return parseScore(a.plan) - parseScore(b.plan);
        });
    },

    exportTabData() {
        const tab = this.getCurrentTab();
        const exportData = tab.data.map(r => ({
            machineData: r.wsid,
            notes: r.notes,
            status: r.status === 'done' ? 'Done' : 'Outstanding',
            plan: r.plan
        }));

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `data-${tab.name}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    },

    importUniversal(input) {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                let list = Array.isArray(json) ? json : (json.data || []);

                if (!Array.isArray(list)) throw new Error("Invalid Format");

                const tab = this.getCurrentTab();
                if (tab.data.length > 0) {
                    if (!confirm(`Import ${list.length} items? This will APPEND to current list.`)) return;
                }

                const newData = list.map(item => ({
                    id: 'i_' + Date.now() + Math.random(),
                    wsid: item.machineData || item.wsid || '',
                    notes: item.notes || item.note || '',
                    plan: item.plan || item.period || '',
                    status: (item.status && item.status.toLowerCase() === 'done') ? 'done' : 'outstanding',
                    timestamp: Date.now()
                }));

                tab.data = [...tab.data, ...newData];
                this.saveState();
                this.renderTableData();
                alert("Import Successful");

            } catch (err) { alert("Error: " + err.message); }
            input.value = '';
        };
        reader.readAsText(file);
    },

    loadTheme() { }
};

document.addEventListener('DOMContentLoaded', () => app.init());
