/**
 * Work Planner Unified Logic
 * Merges functionality from wsid_planner (Excel) and task_manager (Manual/Tabs)
 */

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const STORAGE_KEY = 'eps_work_planner_v1';
const THEME_KEY = 'eps_theme_pref';

// Initial State Template
const createNewTab = (id) => ({
    id: id,
    name: `Tab ${id + 1}`,
    mode: 'manual', // manual | excel
    data: [], // Array of { id, wsid, lokasi, plan, status, note, timestamp }
    // Excel specific config
    excelConfig: {
        mapping: { wsid: '', lokasi: '', plan: '' },
        myWsids: []
    }
});

const app = {
    state: {
        tabs: [],
        currentTabId: 0,
        filter: 'all', // all | done | outstanding
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

            // Context menu for rename/delete could go here, for now simple click
            container.insertBefore(el, addBtn);
        });
    },

    switchTab(id) {
        this.state.currentTabId = id;
        this.saveState();
        this.renderTabs();
        this.renderUI();
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
        const tab = this.getCurrentTab();

        // 1. Mode Switcher State
        $$('input[name="mode"]').forEach(r => {
            r.checked = r.value === tab.mode;
        });

        // 2. Control Visibility
        $('#manualControls').style.display = tab.mode === 'manual' ? 'flex' : 'none';
        $('#excelControls').style.display = tab.mode === 'excel' ? 'flex' : 'none';

        // 3. Excel Specifics
        if (tab.mode === 'excel') {
            $('#myWsids').value = tab.excelConfig.myWsids.join(', ');
            // Re-populate mapping dropdowns if file loaded would be complex, 
            // for now just ensure UI is ready.
        }

        // 4. Metrics & Table
        this.renderTableData();
    },

    setMode(mode) {
        const tab = this.getCurrentTab();
        if (tab.data.length > 0 && tab.mode !== mode) {
            if (!confirm("Switching mode might require clearing current data layout. Continue?")) {
                this.renderUI(); // Reset radio
                return;
            }
        }
        tab.mode = mode;
        this.saveState();
        this.renderUI();
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

        // Excel Logic: Filter by "My WSIDs" if enabled
        if (tab.mode === 'excel' && tab.excelConfig.myWsids.length > 0) {
            const allowed = new Set(tab.excelConfig.myWsids.map(s => String(s).trim().toLowerCase()));
            filtered = filtered.filter(row => allowed.has(String(row.wsid).toLowerCase()));
        }

        // Status Logic
        if (this.state.filter !== 'all') {
            filtered = filtered.filter(row => row.status === this.state.filter);
        }

        // Metrics
        const total = filtered.length;
        const done = filtered.filter(r => r.status === 'done').length;
        const out = total - done;

        $('#mTotal').textContent = total;
        $('#mDone').textContent = done;
        $('#mOut').textContent = out;
        $('#emptyState').style.display = total === 0 ? 'block' : 'none';

        // Sort (Basic: PlanAt time or ID)
        filtered.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

        // Render Rows
        filtered.forEach((row, index) => {
            const tr = document.createElement('tr');
            tr.draggable = true;
            tr.dataset.id = row.id;

            // Drag Handle
            tr.innerHTML = `
                <td class="col-drag" onmousedown="app.dragStart(event, '${row.id}')">⋮⋮</td>
                <td style="font-weight:600; color:#4f46e5;">${row.wsid}</td>
                <td class="cell-left">${row.lokasi || '-'}</td>
                <td>${row.plan || '-'}</td>
                <td>
                    <select class="status-select ${row.status === 'done' ? 'status-done' : 'status-outstanding'}" 
                        onchange="app.updateStatus('${row.id}', this.value)">
                        <option value="outstanding" ${row.status === 'outstanding' ? 'selected' : ''}>Outstanding</option>
                        <option value="done" ${row.status === 'done' ? 'selected' : ''}>Done</option>
                    </select>
                </td>
                <td style="padding:4px;">
                    <textarea class="cell-note" onchange="app.updateNote('${row.id}', this.value)" placeholder="Add note...">${row.note || ''}</textarea>
                </td>
                <td>
                    <button class="btn-glass" onclick="app.deleteOne('${row.id}')" style="color:red; padding:4px 8px;">✕</button>
                </td>
            `;

            // Drag Events
            tr.addEventListener('dragstart', (e) => {
                e.dataTransfer.effectAllowed = 'move';
                this.state.dragItem = row;
                tr.style.opacity = '0.5';
            });
            tr.addEventListener('dragend', () => {
                this.state.dragItem = null;
                tr.style.opacity = '1';
            });
            tr.addEventListener('dragover', (e) => {
                e.preventDefault();
                return false;
            });
            tr.addEventListener('drop', (e) => {
                e.stopPropagation();
                if (this.state.dragItem !== row) {
                    this.reorderItems(this.state.dragItem.id, row.id);
                }
                return false;
            });

            tbody.appendChild(tr);
        });
    },

    // --- Actions ---
    updateStatus(id, newStatus) {
        const row = this.getCurrentTab().data.find(r => r.id === id);
        if (row) {
            row.status = newStatus;
            this.saveState();
            this.renderTableData(); // Re-render to update colors/metrics
        }
    },

    updateNote(id, note) {
        const row = this.getCurrentTab().data.find(r => r.id === id);
        if (row) {
            row.note = note;
            this.saveState();
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

    // --- Manual Entry ---
    showAddModal() {
        $('#inpData').value = '';
        $('#inpLok').value = '';
        $('#inpPlan').value = '';
        document.getElementById('addModal').showModal();
    },

    saveAddData() {
        const wsid = $('#inpData').value.trim();
        const lok = $('#inpLok').value.trim();
        const plan = $('#inpPlan').value.trim();

        if (!wsid) { alert('Data/WSID wajib diisi'); return; }

        const newItem = {
            id: 'm_' + Date.now(),
            wsid: wsid,
            lokasi: lok,
            plan: plan,
            status: 'outstanding',
            note: '',
            timestamp: Date.now()
        };

        this.getCurrentTab().data.push(newItem);
        this.saveState();
        this.renderTableData();
        document.getElementById('addModal').close();
    },

    // --- Excel Import Logic ---
    async processExcel() {
        const fileInp = $('#fileExcel');
        const f = fileInp.files[0];
        if (!f) { alert("Pilih file Excel dulu"); return; }

        const mapWSID = $('#mapWSID').value;
        const mapLok = $('#mapLok').value;
        const mapPlan = $('#mapPlan').value;

        // Simpan mapping dan filter list
        const tab = this.getCurrentTab();
        tab.excelConfig.myWsids = $('#myWsids').value.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
        tab.excelConfig.mapping = { wsid: mapWSID, lokasi: mapLok, plan: mapPlan };
        this.saveState(); // Partial save

        if (!mapWSID) { alert("Mapping WSID harus dipilih"); return; }

        alert("Memproses...");

        try {
            const buf = await f.arrayBuffer();
            const wb = XLSX.read(buf, { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(ws, { defval: '' });

            const newData = json.map((row, idx) => {
                const rawDate = row[mapPlan];
                let planDate = rawDate;

                // Try parse Excel serial date
                if (typeof rawDate === 'number') {
                    const d = XLSX.SSF.parse_date_code(rawDate);
                    if (d) planDate = `${d.d}/${d.m}/${d.y}`; // Simple format
                }

                return {
                    id: 'x_' + idx + '_' + Math.random().toString(36).substr(2, 5),
                    wsid: row[mapWSID],
                    lokasi: row[mapLok] || '',
                    plan: planDate || '',
                    status: 'outstanding', // Default
                    note: '',
                    timestamp: idx // Keep excel order initially
                };
            }).filter(item => item.wsid);

            // Replace data or append? Usually replace for Excel import flows or append?
            // User flow: Import usually means loading a dataset. Let's append to avoid accidental loss, 
            // but Warn if not empty?
            if (tab.data.length > 0 && !confirm("Append to existing data? Cancel to Abort.")) {
                return;
            }

            tab.data = [...tab.data, ...newData];
            this.saveState();
            this.renderTableData();
            alert(`Berhasil import ${newData.length} baris.`);

        } catch (e) {
            console.error(e);
            alert("Gagal baca Excel: " + e.message);
        }
    },

    // Helpers untuk isi dropdown mapping saat file dipilih
    importData(input) {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                if (json.tabs) {
                    this.state = json;
                    this.saveState();
                    this.init();
                    alert("Data berhasil di-restore!");
                }
            } catch (err) { alert("Format JSON invalid"); }
        };
        reader.readAsText(file);
    },

    exportData() {
        const str = JSON.stringify(this.state, null, 2);
        const blob = new Blob([str], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'eps-work-planner-backup.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    },

    toggleTheme() {
        const link = document.getElementById('theme-link');
        const curr = link.getAttribute('href');
        const next = curr.includes('light') ? 'theme-dark.css' : 'theme-light.css';
        link.setAttribute('href', next);
        localStorage.setItem(THEME_KEY, next);
    },

    loadTheme() {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved) document.getElementById('theme-link').setAttribute('href', saved);
    }
};

// Excel Header Detection Helper
$('#fileExcel').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const buf = await f.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const headers = XLSX.utils.sheet_to_json(ws, { header: 1 })[0] || [];

    ['mapWSID', 'mapLok', 'mapPlan'].forEach(id => {
        const sel = $('#' + id);
        sel.innerHTML = '<option value="">-- Pilih --</option>';
        headers.forEach(h => {
            const opt = document.createElement('option');
            opt.value = h;
            opt.textContent = h;
            sel.appendChild(opt);
        });
    });
});

// Init
document.addEventListener('DOMContentLoaded', () => app.init());
