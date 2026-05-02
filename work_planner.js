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
    },
    sortMode: 'date' // 'date' | 'manual'
});

const app = {
    platform: {
        isAndroid: false,
        prefersTouch: false
    },
    state: {
        tabs: [],
        currentTabId: 0,
        filter: 'all',
        touchDragging: false
    },

    init() {
        this.detectPlatform();
        this.loadState();
        this.renderTabs();
        this.renderUI();
        this.setupEventListeners();
        this.loadTheme();
    },

    detectPlatform() {
        const ua = navigator.userAgent || '';
        this.platform.isAndroid = /Android/i.test(ua);
        this.platform.prefersTouch =
            (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
            (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
            ('ontouchstart' in window);
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

        this.normalizeState();
        this.saveState();
    },

    normalizeState(skipSave = false) {
        if (!this.state) {
            this.state = { tabs: [], currentTabId: 0 };
        }

        if (!Array.isArray(this.state.tabs)) {
            this.state.tabs = [];
        }

        if (this.state.tabs.length === 0) {
            this.state.tabs = [createNewTab(0)];
            this.state.currentTabId = 0;
        }

        const usedIds = new Set();
        this.state.tabs.forEach((tab, tabIndex) => {
            let tabId = Number(tab.id);
            if (!Number.isFinite(tabId) || usedIds.has(tabId)) {
                tabId = tabIndex;
                while (usedIds.has(tabId)) tabId += 1;
            }
            tab.id = tabId;
            usedIds.add(tabId);
            tab.name = tab.name || `Tab ${tab.id + 1}`;
            tab.excelConfig = tab.excelConfig || {
                lastMapWsid: '',
                lastMapPlan: ''
            };
            tab.data = (tab.data || []).map((row, idx) => {
                if (!row.id) row.id = 'm_' + Date.now() + Math.random();
                if (!row.status) row.status = 'outstanding';
                if (typeof row.sortOrder !== 'number') row.sortOrder = idx;
                // Backfill legacy field names
                if (!row.wsid && row.machineData) row.wsid = row.machineData;
                if (!row.plan && row.period) row.plan = row.period;
                row.wsidKey = this.getWsidKey(row.wsid);

                const { label, ts } = this.parsePlanValue(row.plan);
                row.plan = label;
                row.planTs = row.planTs || ts;
                return row;
            });
            tab.sortMode = tab.sortMode || 'date';
        });

        const currentTabId = Number(this.state.currentTabId);
        const hasCurrentTab = this.state.tabs.some(tab => tab.id === currentTabId);
        this.state.currentTabId = hasCurrentTab ? currentTabId : this.state.tabs[0].id;
        if (!skipSave) this.saveState();
    },

    saveState() {
        // Ensure state is initialized
        if (!this.state) {
            this.state = { tabs: [], currentTabId: 0 };
        }
        
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
        if (!container) return;
        const addBtn = container.querySelector('.tab-add-btn');
        if (!addBtn) return;

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

    // --- Professional Dialogs ---
    showConfirm(options) {
        const overlay = $('#confirmModal');
        const titleEl = $('#confirmTitle');
        const msgEl = $('#confirmMessage');
        const confirmBtn = $('#confirmBtn');
        const cancelBtn = $('#cancelBtn');

        titleEl.textContent = options.title || 'Konfirmasi';
        msgEl.textContent = options.message || '';
        confirmBtn.textContent = options.confirmText || 'Ya, Hapus';
        cancelBtn.textContent = options.cancelText || 'Batal';

        confirmBtn.className = `btn-glass ${options.isDanger ? 'btn-danger' : 'btn-primary'}`;
        
        overlay.style.display = 'flex';

        return new Promise((resolve) => {
            const handleConfirm = () => {
                overlay.style.display = 'none';
                confirmBtn.removeEventListener('click', handleConfirm);
                cancelBtn.removeEventListener('click', handleCancel);
                resolve(true);
            };
            const handleCancel = () => {
                overlay.style.display = 'none';
                confirmBtn.removeEventListener('click', handleConfirm);
                cancelBtn.removeEventListener('click', handleCancel);
                resolve(false);
            };
            confirmBtn.onclick = handleConfirm;
            cancelBtn.onclick = handleCancel;
        });
    },

    showAlert(message, title = 'Informasi') {
        const overlay = $('#confirmModal');
        $('#confirmTitle').textContent = title;
        $('#confirmMessage').textContent = message;
        const confirmBtn = $('#confirmBtn');
        const cancelBtn = $('#cancelBtn');
        
        confirmBtn.textContent = 'OK';
        confirmBtn.className = 'btn-glass btn-primary';
        cancelBtn.style.display = 'none';
        overlay.style.display = 'flex';

        confirmBtn.onclick = () => {
            overlay.style.display = 'none';
            cancelBtn.style.display = 'inline-flex';
        };
    },

    addTab() {
        if (this.state.tabs.length >= 4) {
            this.showAlert("Maksimal 4 tab diperbolehkan.", "Limit Tab");
            return;
        }
        
        const name = prompt("Masukkan nama tab baru:", `Tab ${this.state.tabs.length + 1}`);
        if (name === null) return; // Cancelled
        
        this.normalizeState();
        const tabIds = this.state.tabs.map(t => Number(t.id)).filter(Number.isFinite);
        const newId = tabIds.length > 0 ? Math.max(...tabIds) + 1 : 0;
        
        const newTab = createNewTab(newId);
        newTab.name = name.trim() || `Tab ${newId + 1}`;
        
        this.state.tabs.push(newTab);
        this.switchTab(newId);
    },

    async deleteTab() {
        const tab = this.getCurrentTab();
        const confirmed = await this.showConfirm({
            title: 'Hapus Tab',
            message: `Delete tab "${tab.name}"?`,
            isDanger: true
        });

        if (confirmed) {
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

    highlightRow(id) {
        const rowEl = document.querySelector(`tr.swipe-row[data-id="${id}"]`);
        if (!rowEl) return;
        rowEl.classList.remove('row-flash');
        void rowEl.offsetWidth; // restart animation
        rowEl.classList.add('row-flash');
        setTimeout(() => rowEl.classList.remove('row-flash'), 450);
    },

    setFilter(f) {
        this.state.filter = f;
        $$('[data-filter]').forEach(b => b.classList.toggle('active', b.dataset.filter === f));
        this.renderTableData();
    },

    syncSortButtons() {
        const tab = this.getCurrentTab();
        const mode = (tab && tab.sortMode) ? tab.sortMode : 'date';
        $$('[data-sort-mode]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.sortMode === mode);
        });
    },

    ensureManualOrder(tab) {
        (tab?.data || []).forEach((r, idx) => {
            if (typeof r.sortOrder !== 'number') r.sortOrder = idx;
        });
    },

    setSortMode(mode, opts = {}) {
        const tab = this.getCurrentTab();
        if (!tab) return;
        const current = tab.sortMode || 'date';
        const force = opts.force === true;
        if (!force && current === mode) {
            this.syncSortButtons();
            return;
        }

        tab.sortMode = mode;
        if (mode === 'date') {
            this.sortDataByDate(tab.data);
            tab.data.forEach((r, idx) => r.sortOrder = idx);
        } else {
            this.ensureManualOrder(tab);
        }

        this.saveState();
        if (!opts.skipRender) {
            this.renderTableData();
        } else {
            this.syncSortButtons();
        }
    },

    renderTableData() {
        const tab = this.getCurrentTab();
        const tbody = $('#tableBody');
        tbody.innerHTML = '';

        const total = tab.data.length;
        const done = tab.data.filter(r => r.status === 'done').length;
        const out = total - done;

        this.syncSortButtons();

        $('#mTotal').textContent = total;
        $('#mDone').textContent = done;
        $('#mOut').textContent = out;
        $('#emptyState').style.display = total === 0 ? 'block' : 'none';

        if (tab.sortMode === 'date') this.sortDataByDate(tab.data);

        let filtered = tab.data;
        if (this.state.filter !== 'all') {
            filtered = filtered.filter(row => row.status === this.state.filter);
        }

        const displayRows = (tab.sortMode === 'manual')
            ? [...filtered].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            : filtered;

        displayRows.forEach((row, index) => {
            const tr = document.createElement('tr');
            tr.className = 'tr-clickable swipe-row';
            tr.dataset.id = row.id;

            const statusClass = row.status === 'done' ? 'status-done' : 'status-outstanding';
            const statusLabel = row.status === 'done' ? 'DONE' : 'OUTSTANDING';

            tr.innerHTML = `
                <td class="col-order drag-handle" style="cursor: move;">${index + 1}</td>
                <td onclick="app.openModal('${row.id}')"><div class="wsid-text">${row.wsid || '-'}</div></td>
                <td onclick="app.openModal('${row.id}')"><div class="notes-text">${row.notes || ''}</div></td>
                <td onclick="app.openModal('${row.id}')"><div>${row.plan || this.formatPlanTs(row.planTs)}</div></td>
                <td style="position: relative;">
                    <button class="status-btn ${statusClass}" onclick="event.stopPropagation(); app.toggleStatus('${row.id}')">${statusLabel}</button>
                    <button class="desktop-delete-btn" onclick="event.stopPropagation(); app.deleteOne('${row.id}')">Hapus</button>
                    <div class="swipe-action-delete" onclick="event.stopPropagation(); app.deleteOne('${row.id}')">Hapus</div>
                </td>
            `;

            const handle = tr.querySelector('.drag-handle');

            this.attachSwipeEvents(tr, row.id);
            this.attachTouchReorder(tr, handle, row);
            tbody.appendChild(tr);
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

        let pointerTargetId = null;
        let dragClone = null;
        let dragOffsetX = 0;
        let dragOffsetY = 0;

        const clearDropTargets = () => {
            $$('tr.swipe-row').forEach(r => r.classList.remove('drop-target'));
        };

        const cleanup = () => {
            this.state.touchDragging = false;
            pointerTargetId = null;
            tr.classList.remove('dragging-source');
            tr.style.opacity = '1';
            clearDropTargets();
            if (dragClone && dragClone.parentNode) dragClone.parentNode.removeChild(dragClone);
            dragClone = null;
        };

        const findTargetRow = (clientX, clientY) => {
            const hit = document.elementFromPoint(clientX, clientY);
            if (hit) {
                const directRow = hit.closest('tr.swipe-row');
                if (directRow) return directRow;
            }
            // Fallback to nearest row by vertical distance so drops still register
            let nearest = null;
            let best = Infinity;
            $$('tr.swipe-row').forEach(r => {
                const rect = r.getBoundingClientRect();
                const dist = Math.abs((rect.top + rect.height / 2) - clientY);
                if (dist < best) {
                    best = dist;
                    nearest = r;
                }
            });
            return nearest;
        };

        handle.addEventListener('pointerdown', (e) => {
            // Let desktop/mouse keep the native drag flow
            if (e.pointerType === 'mouse') return;
            if (e.button !== 0) return;

            e.preventDefault();
            // Force manual mode so the drag result is not overridden by date sorting
            this.setSortMode('manual', { skipRender: true, force: true });
            this.ensureManualOrder(this.getCurrentTab());
            this.saveState();
            this.syncSortButtons();

            const rect = tr.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;

            this.state.touchDragging = true;
            tr.classList.add('dragging-source');
            tr.style.opacity = '0.5';

            // Lightweight floating clone so users see the drag position
            dragClone = tr.cloneNode(true);
            dragClone.classList.add('dragging-clone');
            Object.assign(dragClone.style, {
                position: 'fixed',
                left: `${rect.left}px`,
                top: `${rect.top}px`,
                width: `${rect.width}px`,
                pointerEvents: 'none',
                zIndex: '1200',
                opacity: '0.9',
                transform: 'translateZ(0)',
                transition: 'none'
            });
            document.body.appendChild(dragClone);

            if (navigator.vibrate) navigator.vibrate(30);

            const moveHandler = (ev) => {
                if (!this.state.touchDragging) return;
                ev.preventDefault();
                const targetRow = findTargetRow(ev.clientX, ev.clientY);
                pointerTargetId = targetRow ? targetRow.dataset.id : null;

                $$('tr.swipe-row').forEach(r => {
                    const isTarget = targetRow && r.dataset.id === pointerTargetId && r.dataset.id !== row.id;
                    r.classList.toggle('drop-target', isTarget);
                });

                if (dragClone) {
                    dragClone.style.left = `${ev.clientX - dragOffsetX}px`;
                    dragClone.style.top = `${ev.clientY - dragOffsetY}px`;
                }
            };

            const upHandler = (ev) => {
                if (ev) ev.preventDefault();
                if (pointerTargetId && pointerTargetId !== row.id) {
                    this.reorderItems(row.id, pointerTargetId);
                }
                handle.releasePointerCapture(e.pointerId);
                document.removeEventListener('pointermove', moveHandler);
                document.removeEventListener('pointerup', upHandler);
                document.removeEventListener('pointercancel', upHandler);
                cleanup();
            };

            handle.setPointerCapture(e.pointerId);
            document.addEventListener('pointermove', moveHandler, { passive: false });
            document.addEventListener('pointerup', upHandler, { passive: false });
            document.addEventListener('pointercancel', upHandler, { passive: false });
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

        if (!wsidVal) { this.showAlert("WSID harus diisi", "Input Kurang"); return; }
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
                timestamp: Date.now(),
                sortOrder: tab.data.length
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

    async deleteOne(id) {
        const row = this.getCurrentTab().data.find(r => r.id === id);
        const confirmed = await this.showConfirm({
            title: 'Hapus Data',
            message: `Hapus data "${row.wsid || 'tanpa ID'}"?`,
            isDanger: true
        });

        if (confirmed) {
            const tab = this.getCurrentTab();
            tab.data = tab.data.filter(r => r.id !== id);
            this.saveState();
            this.renderTableData();
        }
    },

    async deleteAll() {
        const confirmed = await this.showConfirm({
            title: 'Hapus Semua',
            message: 'Clear all items in this tab?',
            isDanger: true
        });

        if (confirmed) {
            this.getCurrentTab().data = [];
            this.saveState();
            this.renderTableData();
        }
    },

    async resetStatus() {
        const confirmed = await this.showConfirm({
            title: 'Reset Status',
            message: 'Reset all status to OUTSTANDING?',
            confirmText: 'Ya, Reset'
        });

        if (confirmed) {
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
            tab.data.forEach((r, idx) => r.sortOrder = idx);
            this.setSortMode('manual', { skipRender: true, force: true });
            this.saveState();
            this.renderTableData();
            this.highlightRow(targetId);
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

                } catch (err) { console.error(err); this.showAlert("Gagal baca Excel", "Error"); }
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
        if (!mapWSID || !mapPlan) { this.showAlert("Pilih kolom WSID dan Plan dulu", "Input Kurang"); return; }

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
            this.showAlert(`0 Data terupdate! \nKemungkinan WSID tidak cocok.\n\nContoh di Excel: ${sampleExcel}\nContoh di List: ${sampleList}\n\nPastikan penulisan sama persis.`, "Update Fail");
            return;
        }

        this.sortDataByDate(tab.data);
        this.saveState();
        this.renderTableData();

        $('#excelMappingArea').style.display = 'none';
        $('#fileExcel').value = '';
        this.showAlert(`Berhasil update ${updateCount} data dari ${excelMap.size} baris Excel.`, "Success");
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

    async importUniversal(input) {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const json = JSON.parse(e.target.result);
                let list = Array.isArray(json) ? json : (json.data || []);

                if (!Array.isArray(list)) throw new Error("Format tidak valid");

                const tab = this.getCurrentTab();
                if (tab.data.length > 0) {
                    const confirmed = await this.showConfirm({
                        title: 'Import Data',
                        message: `Import ${list.length} items?`,
                        confirmText: 'Ya, Import'
                    });
                    if (!confirmed) return;
                }

                const baseOrder = tab.data.length;
                const newData = list.map((item, idx) => {
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
                        timestamp: Date.now(),
                        sortOrder: baseOrder + idx
                    };
                });

                tab.data = [...tab.data, ...newData];
                this.saveState();
                this.renderTableData();
                this.showAlert("Berhasil mengimpor data.", "Import Sukses");

            } catch (err) { this.showAlert("Gagal: " + err.message, "Error Import"); }
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
        return `${dd}/${mm}`;
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
