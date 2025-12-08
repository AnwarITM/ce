'use strict';

// Log pemuatan skrip
console.log('script.js dimuat di Android');

// Data dan variabel global
let tabs = [{ id: 0, name: 'Tab 1', data: [] }];
let currentTab = 0;
let editIndex = -1;
let pendingAction = null;

const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Inisialisasi aplikasi
function initializeData() {
    console.log('initializeData dipanggil');
    try {
        const savedTheme = localStorage.getItem('theme') || 'light';
        const themeLink = document.getElementById('theme-link');
        if (!themeLink) {
            console.warn('Element theme-link tidak ditemukan, menggunakan tema default');
        } else {
            themeLink.href = savedTheme === 'dark' ? 'theme-dark.css' : 'theme-light.css';
            document.body.classList.toggle('dark', savedTheme === 'dark');
        }

        if (!isLocalStorageAvailable()) {
            console.warn('Local storage tidak tersedia');
            tabs[0].data = [
                { machineData: 'Machine A', period: 'Jan', status: 'Done', notes: 'Initial check' },
                { machineData: 'Machine B', period: 'Feb', status: 'Outstanding', notes: '' }
            ];
        } else if (!localStorage.getItem('tabs')) {
            tabs[0].data = [
                { machineData: 'Machine A', period: 'Jan', status: 'Done', notes: 'Initial check' },
                { machineData: 'Machine B', period: 'Feb', status: 'Outstanding', notes: '' }
            ];
            saveToLocalStorage();
        } else {
            loadFromLocalStorage();
        }

        renderTabs();
        renderTable();
        updateStats();
        updateRemoveTabButton();
        updateHeaderTitle();
    } catch (error) {
        console.error('Error inisialisasi data:', error);
        showAlertModal('Gagal menginisialisasi data. Coba hapus data browser atau periksa file di repositori.');
    }
}

// Cek ketersediaan localStorage
function isLocalStorageAvailable() {
    try {
        return typeof localStorage !== 'undefined' && localStorage !== null;
    } catch (e) {
        return false;
    }
}

// Toggle tema
function toggleTheme() {
    try {
        const themeLink = document.getElementById('theme-link');
        if (!themeLink) {
            console.warn('Element theme-link tidak ditemukan');
            return;
        }
        const body = document.body;
        const currentTheme = localStorage.getItem('theme') || 'light';

        if (currentTheme === 'light') {
            themeLink.href = 'theme-dark.css';
            body.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            themeLink.href = 'theme-light.css';
            body.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    } catch (error) {
        console.error('Error mengganti tema:', error);
        showAlertModal('Gagal mengganti tema.');
    }
}

// Manajemen tab
function addTab() {
    if (tabs.length >= 5) {
        showAlertModal('Maksimum 5 tab diperbolehkan!');
        return;
    }
    const newTab = { id: Math.max(...tabs.map(t => t.id), -1) + 1, name: `Tab ${tabs.length + 1}`, data: [] };
    tabs.push(newTab);
    switchTab(tabs.length - 1);
    saveToLocalStorage();
}

function removeTab() {
    if (currentTab === 0) {
        showAlertModal('Tab pertama tidak bisa dihapus!');
        return;
    }
    
    showConfirmModal(
        'Hapus tab ini dan semua datanya?',
        () => {
            tabs.splice(currentTab, 1);
            tabs.forEach((tab, index) => tab.id = index);
            switchTab(0);
            saveToLocalStorage();
        },
        {
            btnText: 'Hapus Tab',
            title: 'Hapus Tab',
            btnClass: 'danger-btn'
        }
    );
}

function switchTab(index) {
    console.log('switchTab dipanggil untuk index:', index);
    currentTab = index;
    renderTabs();
    renderTable();
    updateStats();
    updateRemoveTabButton();
    updateHeaderTitle();
}

// Rename tab
function renameTab() {
    const renameModal = document.getElementById('renameModal');
    if (!renameModal) {
        console.error('Modal rename tidak ditemukan');
        return;
    }
    renameModal.style.display = 'flex';
    document.getElementById('newTabName').value = tabs[currentTab].name;
    document.getElementById('newTabName').focus();
}

function closeRenameModal() {
    const renameModal = document.getElementById('renameModal');
    if (renameModal) renameModal.style.display = 'none';
}

function confirmRenameTab() {
    const loader = document.getElementById('renameLoader');
    if (!loader) {
        console.error('Loader rename tidak ditemukan');
        return;
    }
    loader.style.display = 'block';
    
    setTimeout(() => {
        const newName = document.getElementById('newTabName').value.trim();
        
        if (!newName) {
            showAlertModal('Nama tab tidak boleh kosong!');
            loader.style.display = 'none';
            return;
        }
        
        tabs[currentTab].name = newName;
        saveToLocalStorage();
        renderTabs();
        updateHeaderTitle();
        closeRenameModal();
        loader.style.display = 'none';
    }, 500);
}

// Update UI
function updateHeaderTitle() {
    console.log('updateHeaderTitle dipanggil');
    const header = document.querySelector('h1');
    if (header) header.textContent = tabs[currentTab].name;
    else console.warn('Header h1 tidak ditemukan');
}

function updateRemoveTabButton() {
    console.log('updateRemoveTabButton dipanggil');
    const removeTabBtn = document.getElementById('removeTabBtn');
    if (removeTabBtn) {
        removeTabBtn.style.display = currentTab === 0 ? 'none' : 'inline-block';
    } else {
        console.warn('Elemen removeTabBtn tidak ditemukan');
    }
}

function renderTabs() {
    console.log('renderTabs dipanggil');
    const tabsContainer = document.getElementById('tabs');
    if (!tabsContainer) {
        console.error('Kontainer tab tidak ditemukan');
        return;
    }
    tabsContainer.innerHTML = '';
    tabs.forEach((tab, index) => {
        const tabElement = document.createElement('div');
        tabElement.className = `tab ${currentTab === index ? 'active' : ''}`;
        tabElement.textContent = tab.name;
        tabElement.onclick = () => switchTab(index);
        tabsContainer.appendChild(tabElement);
    });
}

function renderTable() {
    console.log('renderTable dipanggil');
    const tbody = document.getElementById('tableBody');
    if (!tbody) {
        console.error('Tabel body tidak ditemukan');
        return;
    }
    tbody.innerHTML = '';
    tabs[currentTab].data.forEach((item, index) => {
        if (!item || !item.machineData || !item.period || !item.status) {
            console.warn('Data tidak valid:', item);
            return;
        }
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <span class="machine-data ${item.notes && item.notes.trim() ? 'has-notes' : ''}"
                    onclick="showEditModal(${index})"
                    title="Klik untuk edit nama mesin & catatan">
                    ${item.machineData}
                </span>
                ${item.notes && item.notes.trim() ? `<span class="notes-marquee">${item.notes}</span>` : ''}
            </td>
            <td>
                <select onchange="updatePeriod(${index}, this.value)">
                    ${monthOrder.map(month => `<option value="${month}" ${item.period === month ? 'selected' : ''}>${month}</option>`).join('')}
                </select>
            </td>
            <td>
                <select onchange="updateStatus(${index}, this.value)" class="status-${item.status.toLowerCase()}">
                    <option value="Done" ${item.status === 'Done' ? 'selected' : ''}>Done</option>
                    <option value="Outstanding" ${item.status === 'Outstanding' ? 'selected' : ''}>Outstanding</option>
                </select>
            </td>
            <td>
                <button class="delete-btn" onclick="deleteData(${index})" title="Hapus Data">Hapus</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateStats() {
    console.log('updateStats dipanggil');
    const data = tabs[currentTab].data;
    const total = data.length;
    const done = data.filter(item => item.status === 'Done').length;
    const outstanding = total - done;

    const totalStat = document.getElementById('totalStat');
    const doneStat = document.getElementById('doneStat');
    const outstandingStat = document.getElementById('outstandingStat');

    if (totalStat) totalStat.textContent = total;
    else console.warn('Elemen totalStat tidak ditemukan');
    if (doneStat) doneStat.textContent = done;
    else console.warn('Elemen doneStat tidak ditemukan');
    if (outstandingStat) outstandingStat.textContent = outstanding;
    else console.warn('Elemen outstandingStat tidak ditemukan');
}

// Manajemen data
function showAddModal() {
    editIndex = -1;
    const addModal = document.getElementById('addModal');
    if (!addModal) {
        console.error('Modal tambah/edit tidak ditemukan');
        return;
    }
    addModal.style.display = 'flex';
    document.getElementById('modalTitle').textContent = 'Tambah Data';
    document.getElementById('machineData').value = '';
    document.getElementById('notes').value = '';
    document.getElementById('machineData').disabled = false;
}

function showEditModal(index) {
    editIndex = index;
    const item = tabs[currentTab].data[index];
    const addModal = document.getElementById('addModal');
    if (!addModal) {
        console.error('Modal tambah/edit tidak ditemukan');
        return;
    }
    addModal.style.display = 'flex';
    document.getElementById('modalTitle').textContent = 'Edit Data';
    document.getElementById('machineData').value = item.machineData;
    document.getElementById('notes').value = item.notes || '';
    document.getElementById('machineData').disabled = false;
}

function closeModal() {
    const addModal = document.getElementById('addModal');
    if (addModal) addModal.style.display = 'none';
}

function saveData() {
    const loader = document.getElementById('loader');
    if (!loader) {
        console.error('Loader tidak ditemukan');
        return;
    }
    loader.style.display = 'block';
    setTimeout(() => {
        const machineData = document.getElementById('machineData').value.trim();
        const notes = document.getElementById('notes').value.trim();

        if (!machineData) {
            showAlertModal('Data Mesin wajib diisi!');
            loader.style.display = 'none';
            return;
        }

        if (editIndex === -1) {
            tabs[currentTab].data.push({
                machineData,
                period: 'Jan',
                status: 'Outstanding',
                notes
            });
        } else {
            tabs[currentTab].data[editIndex].machineData = machineData;
            tabs[currentTab].data[editIndex].notes = notes;
        }

        saveToLocalStorage();
        renderTable();
        updateStats();
        closeModal();
        loader.style.display = 'none';
    }, 500);
}

function updatePeriod(index, value) {
    tabs[currentTab].data[index].period = value;
    saveToLocalStorage();
    renderTable();
    updateStats();
}

function updateStatus(index, value) {
    tabs[currentTab].data[index].status = value;
    saveToLocalStorage();
    renderTable();
    updateStats();
}

function deleteData(index) {
    showConfirmModal(
        'Yakin ingin menghapus data ini?',
        () => {
            tabs[currentTab].data.splice(index, 1);
            saveToLocalStorage();
            renderTable();
            updateStats();
        },
        {
            btnText: 'Hapus',
            title: 'Hapus Data',
            btnClass: 'danger-btn'
        }
    );
}

function deleteAll() {
    showConfirmModal(
        'Hapus SEMUA data di tab ini?',
        () => {
            tabs[currentTab].data = [];
            saveToLocalStorage();
            renderTable();
            updateStats();
        },
        {
            btnText: 'Hapus Semua',
            title: 'Hapus Semua Data',
            btnClass: 'danger-btn'
        }
    );
}

function resetStatus() {
    showConfirmModal(
        'Reset semua status ke Outstanding?',
        () => {
            tabs[currentTab].data.forEach(item => item.status = 'Outstanding');
            saveToLocalStorage();
            renderTable();
            updateStats();
        },
        {
            btnText: 'Reset',
            title: 'Reset Status'
        }
    );
}

function sortByPeriod() {
    tabs[currentTab].data = tabs[currentTab].data.filter(item => monthOrder.includes(item.period));
    tabs[currentTab].data.sort((a, b) => monthOrder.indexOf(a.period) - monthOrder.indexOf(b.period));
    saveToLocalStorage();
    renderTable();
    updateStats();
}

// Import/Export
function exportData() {
    if (typeof XLSX === 'undefined') {
        console.error('Library XLSX tidak ditemukan');
        showAlertModal('Library Excel tidak ditemukan. Gunakan file lokal atau periksa koneksi internet.');
        return;
    }
    const activeTab = tabs[currentTab];
    const exportRows = activeTab.data.map((item, index) => ({
        No: index + 1,
        "Data Mesin": item.machineData || '',
        Plan: item.period || '',
        Notes: item.notes || '',
        Status: item.status || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, activeTab.name || "Sheet1");
    XLSX.writeFile(workbook, (activeTab.name || "data") + ".xlsx");
}

function importData(event) {
    console.log('importData dipanggil dengan file:', event.target.files[0]?.name);
    const file = event.target.files[0];
    if (!file) {
        console.error('Tidak ada file yang dipilih');
        showAlertModal('Tidak ada file yang dipilih.');
        return;
    }

    const reader = new FileReader();
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.json')) {
        reader.onload = function (e) {
            try {
                const importedTabs = JSON.parse(e.target.result);
                if (!Array.isArray(importedTabs) || !importedTabs.every(tab => tab.id !== undefined && tab.name && Array.isArray(tab.data))) {
                    throw new Error("Struktur JSON tidak valid. Harus berupa array tab dengan properti id, name, dan data.");
                }
                tabs = importedTabs;
                currentTab = 0;
                saveToLocalStorage();
                renderTabs();
                renderTable();
                updateStats();
                showAlertModal('Data berhasil diimpor dari JSON.');
            } catch (err) {
                console.error('Error impor JSON:', err);
                showAlertModal('Gagal mengimpor JSON: ' + err.message);
            }
            document.getElementById('importFile').value = '';
        };
        reader.readAsText(file);
    } else if (fileName.endsWith('.xlsx')) {
        if (typeof XLSX === 'undefined') {
            console.error('Library XLSX tidak ditemukan');
            showAlertModal('Library Excel tidak ditemukan. Gunakan file lokal atau periksa koneksi internet.');
            document.getElementById('importFile').value = '';
            return;
        }
        reader.onload = function (e) {
            try {
                const workbook = XLSX.read(e.target.result, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                if (!jsonData.length || !jsonData[0]['Data Mesin'] || !jsonData[0]['Plan'] || !jsonData[0]['Status']) {
                    showAlertModal("Format Excel tidak sesuai. Kolom yang diperlukan: 'Data Mesin', 'Plan', 'Status'. Kolom 'Notes' opsional.");
                    document.getElementById('importFile').value = '';
                    return;
                }

                const formatted = jsonData.map(row => ({
                    machineData: row['Data Mesin'] || '',
                    period: row['Plan'] || 'Jan',
                    notes: row['Notes'] || '',
                    status: (row['Status'] || '').toLowerCase() === 'done' ? 'Done' : 'Outstanding'
                }));

                tabs[currentTab].data.push(...formatted);
                saveToLocalStorage();
                renderTable();
                updateStats();
                showAlertModal('Data berhasil diimpor dari Excel ke tab aktif.');
            } catch (err) {
                console.error('Error impor Excel:', err);
                showAlertModal('Gagal mengimpor Excel: ' + err.message);
            }
            document.getElementById('importFile').value = '';
        };
        reader.readAsArrayBuffer(file);
    } else {
        showAlertModal('Format file tidak didukung. Gunakan .json atau .xlsx');
        document.getElementById('importFile').value = '';
    }
}

function resetAndOpenImport() {
    console.log('resetAndOpenImport dipanggil');
    const fileInput = document.getElementById('importFile');
    if (!fileInput) {
        console.error('Elemen input file tidak ditemukan');
        showAlertModal('Elemen input file tidak ditemukan. Periksa struktur file di repositori.');
        return;
    }
    fileInput.value = '';
    fileInput.click();
    console.log('Input file dipicu');
}

// Sistem modal
function showConfirmModal(message, action, options = {}) {
    const { btnText = 'Konfirmasi', title = 'Konfirmasi', btnClass = '' } = options;
    
    const confirmModal = document.getElementById('confirmModal');
    if (!confirmModal) {
        console.error('Modal konfirmasi tidak ditemukan');
        return;
    }
    
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    const confirmBtn = document.getElementById('confirmActionBtn');
    confirmBtn.textContent = btnText;
    confirmBtn.className = btnClass || '';
    pendingAction = action;
    confirmModal.style.display = 'flex';
}

function closeConfirmModal() {
    const confirmModal = document.getElementById('confirmModal');
    if (confirmModal) {
        confirmModal.style.display = 'none';
        pendingAction = null;
    }
}

function executeConfirmedAction() {
    if (pendingAction) pendingAction();
    closeConfirmModal();
}

function showAlertModal(message, title = 'Peringatan') {
    showConfirmModal(message, () => {}, {
        btnText: 'OK',
        title: title,
        btnClass: 'btn-secondary'
    });
}

// Local storage
function saveToLocalStorage() {
    try {
        localStorage.setItem('tabs', JSON.stringify(tabs));
        const themeLink = document.getElementById('theme-link');
        const theme = themeLink && themeLink.href.includes('dark') ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
    } catch (error) {
        console.error('Error menyimpan ke localStorage:', error);
        showAlertModal('Gagal menyimpan data. Coba hapus data browser.');
    }
}

function loadFromLocalStorage() {
    if (!isLocalStorageAvailable()) return;
    const savedTabs = localStorage.getItem('tabs');
    if (savedTabs) {
        try {
            tabs = JSON.parse(savedTabs);
            tabs.forEach(tab => {
                if (!tab.data) tab.data = [];
                const validData = tab.data.filter(item =>
                    item && item.machineData && typeof item.machineData === 'string' &&
                    monthOrder.includes(item.period) &&
                    ['Done', 'Outstanding'].includes(item.status)
                );
                if (validData.length !== tab.data.length) {
                    console.warn(`Menghapus ${tab.data.length - validData.length} data tidak valid di tab ${tab.name}`);
                }
                tab.data = validData;
            });
        } catch (error) {
            console.error('Error parsing tabs dari localStorage:', error);
            tabs = [{ id: 0, name: 'Tab 1', data: [] }];
            saveToLocalStorage();
        }
    }
}

// Inisialisasi aplikasi saat DOM dimuat
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded dipicu, memulai inisialisasi di Android');
    initializeData();
});
