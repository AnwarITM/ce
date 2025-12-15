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
        }

        // 4. Update Dynamic Header Label
        const headerLabel = $('#headerLabelDynamic');
        if (headerLabel) {
            headerLabel.textContent = tab.mode === 'excel' ? 'Lokasi' : 'Catatan';
        }

        // 5. Metrics & Table
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

        const isManual = tab.mode === 'manual';

        // Render Rows
        filtered.forEach((row, index) => {
            const tr = document.createElement('tr');
            tr.draggable = true;
            tr.dataset.id = row.id;

            // Prepare WSID Cell (Clickable in Manual Mode)
            let wsidHtml;
            if (isManual) {
                wsidHtml = `<span class="clickable-wsid" onclick="app.showDataModal('edit', '${row.id}')">${row.wsid}</span>`;
            } else {
                wsidHtml = `<span style="font-weight:600; color:#4f46e5;">${row.wsid}</span>`;
            }

            // Prepare Plan Cell Content
            let planCellHtml;
            if (isManual) {
                // Generate Month Dropdown with Short Names
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                let opts = `<option value="">--</option>`;
                months.forEach(m => {
                    const sel = (row.plan === m) ? 'selected' : '';
                    opts += `<option value="${m}" ${sel}>${m}</option>`;
                });
                planCellHtml = `<select class="cell-edit" onchange="app.updatePlan('${row.id}', this.value)">${opts}</select>`;
            } else {
                planCellHtml = row.plan || '-';
            }

            // Prepare Lokasi/Catatan Cell Content (Wrapped Text) - No input here, edit via Modal
            const lokHtml = `<div class="cell-wrapped">${row.lokasi || '-'}</div>`;

            // Drag Handle
            tr.innerHTML = `
                <td class="col-drag" style="cursor:grab;">⋮⋮</td>
                <td>${wsidHtml}</td>
                <td class="cell-left">${lokHtml}</td>
                <td>${planCellHtml}</td>
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
                e.dataTransfer.setData('text/plain', row.id);
                this.state.dragItem = row;
                tr.style.opacity = '0.5';
            });
            // ... (Drag listeners continue as before)
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
                if (this.state.dragItem && this.state.dragItem.id !== row.id) {
                    this.reorderItems(this.state.dragItem.id, row.id);
                }
                return false;
            });

            tbody.appendChild(tr);
        });
    },

    // --- Actions ---
    // Helper to sort current tab once (e.g. after import)
    sortTabByDate() {
        const tab = this.getCurrentTab();
        tab.data.sort((a, b) => {
            const dateA = parseDateScore(a.plan);
            const dateB = parseDateScore(b.plan);
            return dateA - dateB || (a.timestamp || 0) - (b.timestamp || 0);
        });
    },

    updateLokasi(id, val) {
        const row = this.getCurrentTab().data.find(r => r.id === id);
        if (row) {
            row.lokasi = val;
            this.saveState();
        }
    },

    updatePlan(id, val) {
        const row = this.getCurrentTab().data.find(r => r.id === id);
        if (row) {
            row.plan = val;
            this.saveState();
        }
    },

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

    // --- Data Modal (Add/Edit) ---
    showDataModal(mode = 'add', id = null) {
        const modal = document.getElementById('dataModal');
        const title = document.getElementById('modalTitle');
        const inpId = document.getElementById('inpId');
        const inpData = document.getElementById('inpData');
        const inpLok = document.getElementById('inpLok');
        const inpPlan = document.getElementById('inpPlan');

        if (mode === 'edit' && id) {
            const item = this.getCurrentTab().data.find(r => r.id === id);
            if (!item) return;
            title.textContent = 'Edit Data';
            inpId.value = id;
            inpData.value = item.wsid;
            inpLok.value = item.lokasi || '';
            inpPlan.value = item.plan || '';
        } else {
            title.textContent = 'Add New Data';
            inpId.value = '';
            inpData.value = '';
            inpLok.value = '';
            inpPlan.value = '';
        }
        modal.showModal();
    },

    saveData() {
        const id = document.getElementById('inpId').value;
        const wsid = $('#inpData').value.trim();
        const lok = $('#inpLok').value.trim();
        const plan = $('#inpPlan').value.trim();

        if (!wsid) { alert('Data/WSID wajib diisi'); return; }

        const tab = this.getCurrentTab();

        if (id) {
            // Edit Mode
            const item = tab.data.find(r => r.id === id);
            if (item) {
                item.wsid = wsid;
                item.lokasi = lok;
                item.plan = plan;
            }
        } else {
            // Add Mode
            const newItem = {
                id: 'm_' + Date.now(),
                wsid: wsid,
                lokasi: lok,
                plan: plan,
                status: 'outstanding',
                note: '',
                timestamp: Date.now()
            };
            tab.data.push(newItem);
        }

        this.saveState();
        this.renderTableData();
        document.getElementById('dataModal').close();
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

            // Re-read matrix + header detection logic
            const matrix = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', blankrows: false });

            // Pakai header index yang didapat dari event change sebelumnya (atau deteksi ulang)
            let headerIdx = parseInt($('#fileExcel').dataset.headerRowIdx);
            if (isNaN(headerIdx)) headerIdx = findHeaderRow(matrix);

            const headers = matrix[headerIdx].map(String);

            // Map keys
            const keyWSID = headers.indexOf(mapWSID);
            const keyLok = headers.indexOf(mapLok);
            const keyPlan = headers.indexOf(mapPlan);

            if (keyWSID < 0) throw new Error("Kolom WSID tidak ditemukan di baris header ke-" + (headerIdx + 1));

            // Parse data rows (start from headerIdx + 1)
            const newData = [];
            for (let i = headerIdx + 1; i < matrix.length; i++) {
                const row = matrix[i];
                const rawWSID = row[keyWSID];
                if (!rawWSID) continue; // Skip empty wsid

                const rawDate = keyPlan >= 0 ? row[keyPlan] : '';
                let planDate = rawDate;

                // Try parse Excel serial date
                if (typeof rawDate === 'number') {
                    const d = XLSX.SSF.parse_date_code(rawDate);
                    if (d) planDate = `${d.d}/${d.m}/${d.y}`;
                }

                newData.push({
                    id: 'x_' + i + '_' + Math.random().toString(36).substr(2, 5),
                    wsid: String(rawWSID).trim(),
                    lokasi: keyLok >= 0 ? String(row[keyLok] || '') : '',
                    plan: planDate ? String(planDate) : '',
                    status: 'outstanding',
                    note: '',
                    timestamp: i
                });
            }

            // Replace data or append? 
            // User request: Avoid "double data" when re-importing. Default to Overwrite.
            if (tab.data.length > 0) {
                if (!confirm("Terdapat data di tab ini. Timpa (Hapus & Ganti) dengan data baru?\nKlik OK untuk TIMPA\nKlik Cancel untuk BATAL")) {
                    return;
                }
                tab.data = newData;
            } else {
                tab.data = newData;
            }
            this.sortTabByDate();
            this.saveState();
            this.renderTableData();
            alert(`Berhasil import ${newData.length} baris (Header di baris ${headerIdx + 1}).`);

        } catch (e) {
            console.error(e);
            alert("Gagal baca Excel: " + e.message);
        }
    },

    // --- Import/Export (Unified) ---
    importUniversal(input) {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);

                // Case 1: Full Backup (Object with 'tabs')
                if (json.tabs && Array.isArray(json.tabs)) {
                    if (confirm("Restore full application state? This will replace all current tabs.")) {
                        this.state = json;
                        this.saveState();
                        this.init(); // Reload all
                        alert("Full Restore Success!");
                    }
                    return;
                }

                // Case 2: Simple List (Array) -> Import to Current Tab
                let list = json;
                // Maybe it's wrapped?
                if (json.data && Array.isArray(json.data)) list = json.data;

                if (Array.isArray(list)) {
                    // Map items
                    const newData = list.map((item, idx) => ({
                        id: 'imp_' + Date.now() + '_' + idx,
                        wsid: item.machineData || item.wsid || 'Unknown',
                        // User Request: In manual mode (JSON Import), map 'notes' from JSON to this column (lokasi data field)
                        lokasi: item.lokasi || item.notes || '',
                        plan: item.period || item.plan || '',
                        status: (item.status && item.status.toLowerCase() === 'done') ? 'done' : 'outstanding',
                        note: item.note || '', // Only take explicit note field, not notes
                        timestamp: Date.now() + idx
                    }));

                    const tab = this.getCurrentTab();
                    if (tab.data.length > 0 && !confirm(`Append ${newData.length} items to current tab "${tab.name}"?`)) {
                        input.value = '';
                        return;
                    }

                    tab.data = [...tab.data, ...newData];
                    this.sortTabByDate();
                    this.saveState();
                    this.renderTableData();
                    alert(`Imported ${newData.length} items.`);
                } else {
                    alert("Unrecognized JSON format. Must be an Array or Full Backup.");
                }

            } catch (err) { alert("Invalid JSON: " + err.message); }
            input.value = ''; // Reset
        };
        reader.readAsText(file);
    },

    exportTabData() {
        const tab = this.getCurrentTab();
        // Export in a clean friendly format matching data-tab.json
        const cleanData = tab.data.map(r => ({
            machineData: r.wsid,
            period: r.plan,
            status: r.status === 'done' ? 'Done' : 'Outstanding',
            notes: r.lokasi, // In data-tab.json, 'notes' corresponds to the Catatan/Lokasi column
            note: r.note // Preserve the separate 'Notes (Update)' column as 'note' (singular)
        }));

        const str = JSON.stringify(cleanData, null, 2);
        const blob = new Blob([str], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `data-${tab.name.replace(/\s+/g, '_')}.json`;
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

// --- Helpers ---
function parseDateScore(str) {
    if (!str) return 9999999999;
    str = String(str).trim().toLowerCase();

    // Month Names lookup
    const MONTHS = {
        'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
        'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11,
        'mei': 4, 'agt': 7, 'okt': 9, 'des': 11
    };

    // Try detecting Month Name
    for (const [m, val] of Object.entries(MONTHS)) {
        if (str.startsWith(m) || str.includes(' ' + m)) {
            // Found a month. Assume Current Year if not present
            // Simple score: Month Index (0-11)
            // To make it sortable across years if year is present? 
            // If year is present "Oct 2024", we need to parse.
            // But this simple lookup is good for "Sep", "Oct".
            // Let's try to see if there is a year number around?
            return val;
        }
    }

    // Try parsing date
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d.getTime();

    return 9999999999; // Unknown go last
}

// --- Helper for detecting header row index ---
function findHeaderRow(matrix) {
    const CAND_WS = ['wsid', 'id mesin', 'id_ws', 'id atm', 'no wsid', 'data mesin'];
    const CAND_LOC = ['lokasi', 'alamat', 'location', 'site', 'address'];
    const CAND_PLAN = ['plan', 'bulan', 'month', 'jadwal', 'periode', 'period', 'tanggal', 'date'];

    const hasAny = (row, arr) => row.some(c => arr.some(k => String(c).toLowerCase().includes(k)));

    for (let i = 0; i < Math.min(matrix.length, 25); i++) {
        const row = matrix[i].map(x => String(x || ''));
        const score =
            (hasAny(row, CAND_WS) ? 1 : 0) +
            (hasAny(row, CAND_LOC) ? 1 : 0) +
            (hasAny(row, CAND_PLAN) ? 1 : 0);
        // Jika ketemu keyword kuat atau skor tinggi
        if (score >= 1 || row.join('').toLowerCase().includes('wsid')) {
            return i;
        }
    }
    return 0; // fallback to row 0 if not found
}

// Excel Header Detection Helper
$('#fileExcel').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
        const buf = await f.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];

        // Read raw matrix
        const matrix = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', blankrows: false });
        if (!matrix || matrix.length === 0) return;

        // Auto detect header row
        const headerIdx = findHeaderRow(matrix);
        const headers = matrix[headerIdx].map(String);

        // Simpan info header index di state sementara (atau atribut elemen) agar processExcel tau
        $('#fileExcel').dataset.headerRowIdx = headerIdx;

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

        // Auto select suggestion? Optional, but nice.
    } catch (err) { console.error(err); alert("Gagal baca header Excel"); }
});

// Init
document.addEventListener('DOMContentLoaded', () => app.init());
