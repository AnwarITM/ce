/**
 * Work Planner Unified Logic (Single Mode)
 */

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const STORAGE_KEY = 'eps_work_planner_v2';
const MAX_TS = 9999999999999;

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
        dragItem: null,
        touchDragging: false
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

        // Migrate old data: ensure each row has id + status
        this.state.tabs.forEach(tab => {
            tab.data = (tab.data || []).map(row => {
                if (!row.id) row.id = 'm_' + Date.now() + Math.random();
                if (!row.status) row.status = 'outstanding';
                // Backfill legacy field names
                if (!row.wsid && row.machineData) row.wsid = row.machineData;
                if (!row.plan && row.period) row.plan = row.period;
                row.wsidKey = this.getWsidKey(row.wsid);

                const { label, ts } = this.parsePlanValue(row.plan);
                row.plan = label;
                row.planTs = row.planTs || ts;
                return row;
            });
        });
        this.saveState();
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

        const total = tab.data.length;
        const done = tab.data.filter(r => r.status === 'done').length;
        const out = total - done;

        $('#mTotal').textContent = total;
        $('#mDone').textContent = done;
        $('#mOut').textContent = out;
        $('#emptyState').style.display = total === 0 ? 'block' : 'none';

        let filtered = tab.data;
        if (this.state.filter !== 'all') {
            filtered = filtered.filter(row => row.status === this.state.filter);
        }

        this.sortDataByDate(filtered);

        filtered.forEach((row, index) => {
            const tr = document.createElement('tr');
            tr.className = 'tr-clickable swipe-row';
            tr.dataset.id = row.id;

            const statusClass = row.status === 'done' ? 'status-done' : 'status-outstanding';
            const statusLabel = row.status === 'done' ? 'Done' : 'Outstanding';

            tr.innerHTML = `
                <td class="col-order drag-handle" style="cursor: move;" draggable="true">${index + 1}</td>
                <td onclick="app.openModal('${row.id}')"><div class="text-cell wsid-text">${row.wsid || '-'}</div></td>
                <td onclick="app.openModal('${row.id}')"><div class="text-cell notes-text text-left">${row.notes || ''}</div></td>
                <td onclick="app.openModal('${row.id}')"><div class="text-cell plan-text">${row.plan || this.formatPlanTs(row.planTs)}</div></td>
                <td style="position: relative; overflow: visible;">
                    <button class="status-btn ${statusClass}" onclick="event.stopPropagation(); app.toggleStatus('${row.id}')">${statusLabel}</button>
                    <button class="desktop-delete-btn" onclick="event.stopPropagation(); app.deleteOne('${row.id}')">Delete</button>
                    <div class="swipe-action-delete" onclick="event.stopPropagation(); app.deleteOne('${row.id}')">Hapus</div>
                </td>
            `;

            const handle = tr.querySelector('.drag-handle');

            this.attachDragEvents(tr, handle, row);
            this.attachSwipeEvents(tr, row.id);
            this.attachTouchReorder(tr, handle, row);
            tbody.appendChild(tr);
        });
    },

    attachDragEvents(tr, handle, row) {
        if (!handle) return;

        handle.addEventListener('dragstart', (e) => {
            // Close swipe and ensure row is at 0
            tr.style.transition = 'none';
            tr.style.transform = 'translateX(0)';

            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', row.id);
            this.state.dragItem = row;

            // Visual feedback
            setTimeout(() => {
                tr.style.opacity = '0.3';
                tr.classList.add('dragging');
            }, 0);
        });

        handle.addEventListener('dragend', () => {
            tr.style.opacity = '1';
            tr.classList.remove('dragging');
            this.state.dragItem = null;
        });

        tr.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        tr.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const sourceId = e.dataTransfer.getData('text/plain');
            if (sourceId && sourceId !== row.id) {
                this.reorderItems(sourceId, row.id);
            }
        });
    },

    attachSwipeEvents(tr, id) {
        // Skip swipe when touch-based drag-and-drop is active
        const isTouchDragActive = () => this.state.touchDragging;

        let startX = 0;
        let startY = 0;
        let isSwiping = false;
        let swipeTriggered = false;
        const MAX_SWIPE = 80;

        tr.addEventListener('touchstart', (e) => {
            if (e.target.closest('.drag-handle')) return; // don't start swipe on handle
            // Reset transition for instant response
            tr.style.transition = 'none';
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isSwiping = true;
            swipeTriggered = false;
        }, { passive: true });

        tr.addEventListener('touchmove', (e) => {
            if (isTouchDragActive()) return;
            if (!isSwiping) return;
            const x = e.touches[0].clientX;
            const y = e.touches[0].clientY;
            const diffX = x - startX;
            const diffY = y - startY;

            // Strict threshold for horizontal swipe vs vertical scroll
            if (!swipeTriggered) {
                if (Math.abs(diffX) > 15 && Math.abs(diffX) > Math.abs(diffY)) {
                    swipeTriggered = true;
                } else if (Math.abs(diffY) > 15) {
                    isSwiping = false; // Vertical scroll takes priority
                    return;
                }
            }

            if (swipeTriggered) {
                // If it's a swipe, we might want to prevent vertical scrolling
                // diffX < 0 is swipe left (to delete)
                const move = diffX < 0 ? Math.max(diffX, -MAX_SWIPE) : 0;
                tr.style.transform = `translateX(${move}px)`;
            }
        }, { passive: true });

        tr.addEventListener('touchend', (e) => {
            if (!isSwiping) return;
            isSwiping = false;

            // Clean up: Snap to positions
            tr.style.transition = 'transform 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)';

            const matrix = new WebKitCSSMatrix(window.getComputedStyle(tr).transform);
            const x = matrix.m41;

            if (x < -40) {
                tr.style.transform = `translateX(-${MAX_SWIPE}px)`;
            } else {
                tr.style.transform = 'translateX(0)';
            }
        });

        tr.oncontextmenu = (e) => { e.preventDefault(); }; // Disable long-press delete to avoid accidental data loss
    },

    attachTouchReorder(tr, handle, row) {
        if (!handle) return;
        handle.style.touchAction = 'none';

        let pointerTargetId = null;

        const cleanup = () => {
            this.state.touchDragging = false;
            pointerTargetId = null;
            tr.classList.remove('dragging');
        };

        handle.addEventListener('pointerdown', (e) => {
            if (e.pointerType !== 'touch') return; // keep native drag for mouse/trackpad
            e.preventDefault();

            this.state.touchDragging = true;
            tr.classList.add('dragging');
            tr.style.transition = 'none';
            tr.style.transform = 'translateX(0)';

            const moveHandler = (ev) => {
                ev.preventDefault();
                const target = document.elementFromPoint(ev.clientX, ev.clientY);
                const targetRow = target ? target.closest('tr.swipe-row') : null;
                pointerTargetId = targetRow ? targetRow.dataset.id : null;
                // Highlight potential drop target
                $$('tr.swipe-row').forEach(r => r.classList.toggle('dragging', r.dataset.id === pointerTargetId));
            };

            const upHandler = () => {
                if (pointerTargetId && pointerTargetId !== row.id) {
                    this.reorderItems(row.id, pointerTargetId);
                }
                $$('tr.swipe-row').forEach(r => r.classList.remove('dragging'));
                handle.releasePointerCapture(e.pointerId);
                document.removeEventListener('pointermove', moveHandler);
                document.removeEventListener('pointerup', upHandler);
                document.removeEventListener('pointercancel', upHandler);
                cleanup();
            };

            handle.setPointerCapture(e.pointerId);
            document.addEventListener('pointermove', moveHandler);
            document.addEventListener('pointerup', upHandler);
            document.addEventListener('pointercancel', upHandler);
        });
    },

    // --- Actions ---

    addData() {
        this.openModal();
    },

    openModal(id = null) {
        const modal = $('#dataModal');
        const title = $('#modalTitle');
        const editId = $('#editId');
        const wsid = $('#mInputWsid');
        const notes = $('#mInputNotes');
        const plan = $('#mInputPlan');

        if (id) {
            const row = this.getCurrentTab().data.find(r => r.id === id);
            title.textContent = "Edit Data";
            editId.value = id;
            wsid.value = row.wsid || '';
            notes.value = row.notes || '';
            plan.value = row.plan || '';
        } else {
            title.textContent = "Add Data";
            editId.value = "";
            wsid.value = "";
            notes.value = "";
            plan.value = "";
        }

        modal.style.display = 'flex';
        wsid.style.color = '#000000'; // Force visibility
        notes.style.color = '#000000';
        plan.style.color = '#000000';
        wsid.focus();
    },

    closeModal() {
        $('#dataModal').style.display = 'none';
    },

    saveModalData() {
        const id = $('#editId').value;
        const wsidVal = $('#mInputWsid').value;
        const notesVal = $('#mInputNotes').value;
        const planVal = $('#mInputPlan').value;

        if (!wsidVal) { alert("WSID harus diisi"); return; }
        const parsedPlan = this.parsePlanValue(planVal);
        const wsidKey = this.getWsidKey(wsidVal);

        const tab = this.getCurrentTab();
        if (id) {
            // Edit
            const row = tab.data.find(r => r.id === id);
            row.wsid = wsidVal;
            row.wsidKey = wsidKey;
            row.notes = notesVal;
            row.plan = parsedPlan.label;
            row.planTs = parsedPlan.ts;
        } else {
            // Add
            tab.data.push({
                id: 'm_' + Date.now(),
                wsid: wsidVal,
                wsidKey,
                notes: notesVal,
                plan: parsedPlan.label,
                planTs: parsedPlan.ts,
                status: 'outstanding',
                timestamp: Date.now()
            });
        }

        this.saveState();
        this.renderTableData();
        this.closeModal();
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
        const tab = this.getCurrentTab();
        tab.data = tab.data.filter(r => r.id !== id);
        this.saveState();
        this.renderTableData();
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

            // Normalize WSID with key
            const cleanWSID = this.getWsidKey(rawWSID);
            if (!cleanWSID) continue;

            let planRaw = row[keyPlan];
            if (typeof planRaw === 'number') {
                planRaw = this.fromExcelSerial(planRaw);
            }
            const { label, ts } = this.parsePlanValue(planRaw);
            if (label) excelMap.set(cleanWSID, { label, ts });
        }

        // Update matches
        tab.data.forEach(item => {
            const itemKey = item.wsidKey || this.getWsidKey(item.wsid);
            if (itemKey) {
                matchAttempts++;
                const matchPlan = excelMap.get(itemKey);
                if (matchPlan) {
                    item.plan = matchPlan.label;
                    item.planTs = matchPlan.ts;
                    item.wsidKey = itemKey;
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
        data.sort((a, b) => {
            const aTs = a.planTs ?? this.parsePlanValue(a.plan).ts;
            const bTs = b.planTs ?? this.parsePlanValue(b.plan).ts;
            return aTs - bTs;
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

                const newData = list.map(item => {
                    const parsedPlan = this.parsePlanValue(item.plan || item.period || '');
                    const wsidVal = item.machineData || item.wsid || '';
                    return {
                        id: 'i_' + Date.now() + Math.random(),
                        wsid: wsidVal,
                        wsidKey: this.getWsidKey(wsidVal),
                        notes: item.notes || item.note || '',
                        plan: parsedPlan.label,
                        planTs: parsedPlan.ts,
                        status: (item.status && item.status.toLowerCase() === 'done') ? 'done' : 'outstanding',
                        timestamp: Date.now()
                    };
                });

                tab.data = [...tab.data, ...newData];
                this.saveState();
                this.renderTableData();
                alert("Import Successful");

            } catch (err) { alert("Error: " + err.message); }
            input.value = '';
        };
        reader.readAsText(file);
    },

    formatPlanTs(ts) {
        if (!ts || ts === MAX_TS) return '';
        const d = new Date(ts);
        if (isNaN(d.getTime())) return '';
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yy = String(d.getFullYear()).slice(-2);
        return `${dd}/${mm}/${yy}`;
    },

    fromExcelSerial(serial) {
        if (typeof serial !== 'number' || isNaN(serial)) return null;
        const excelEpoch = Date.UTC(1899, 11, 30);
        return new Date(excelEpoch + serial * 86400000);
    },

    parsePlanValue(raw) {
        const fail = { label: (raw || '').toString().trim(), ts: MAX_TS };
        if (!raw && raw !== 0) return { label: '', ts: MAX_TS };

        // Excel serial number
        if (typeof raw === 'number') {
            const d = this.fromExcelSerial(raw);
            if (d && !isNaN(d.getTime())) {
                return { label: this.formatPlanTs(d.getTime()), ts: d.getTime() };
            }
        }

        // Date object
        if (raw instanceof Date && !isNaN(raw.getTime())) {
            return { label: this.formatPlanTs(raw.getTime()), ts: raw.getTime() };
        }

        let str = String(raw).trim();
        if (!str) return fail;

        // DD/MM[/YY]
        const dm = str.match(/^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?$/);
        if (dm) {
            const d = parseInt(dm[1], 10);
            const m = parseInt(dm[2], 10) - 1;
            const y = dm[3] ? (dm[3].length === 2 ? 2000 + parseInt(dm[3], 10) : parseInt(dm[3], 10)) : new Date().getFullYear();
            const date = new Date(y, m, d);
            if (!isNaN(date.getTime())) {
                return { label: this.formatPlanTs(date.getTime()), ts: date.getTime() };
            }
        }

        // MM/YY (assume day 1)
        const my = str.match(/^(\d{1,2})[\/\-](\d{2,4})$/);
        if (my) {
            const m = parseInt(my[1], 10) - 1;
            const y = my[2].length === 2 ? 2000 + parseInt(my[2], 10) : parseInt(my[2], 10);
            const date = new Date(y, m, 1);
            if (!isNaN(date.getTime())) {
                return { label: this.formatPlanTs(date.getTime()), ts: date.getTime() };
            }
        }

        // Month name fallback
        const dateGuess = new Date(str);
        if (!isNaN(dateGuess.getTime())) {
            return { label: this.formatPlanTs(dateGuess.getTime()), ts: dateGuess.getTime() };
        }

        return fail;
    },

    getWsidKey(raw) {
        if (!raw) return '';
        const str = String(raw).trim();
        if (!str) return '';
        // Ambil token pertama berisi huruf/angka/strip/underscore
        const match = str.match(/[A-Za-z0-9_-]+/);
        return match ? match[0].toLowerCase() : '';
    },

    loadTheme() { }
};

document.addEventListener('DOMContentLoaded', () => app.init());
