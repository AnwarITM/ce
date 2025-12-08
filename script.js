let tabs = [{ id: 0, name: 'Tab 1', data: [] }];
let currentTab = 0;
let editIndex = -1;
let pendingAction = null;
let draggedItem = null;

const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Initialize the application
function initializeData() {
    try {
        const savedTheme = localStorage.getItem('theme') || 'light';
        const themeLink = document.getElementById('theme-link');
        themeLink.href = savedTheme === 'dark' ? 'theme-dark.css' : 'theme-light.css';

        if (savedTheme === 'dark') {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }

        if (!localStorage.getItem('tabs')) {
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
        console.error('Error initializing data:', error);
        showAlertModal('Failed to initialize data. Check console for details.');
    }
}

// Theme toggle function
function toggleTheme() {
    try {
        const themeLink = document.getElementById('theme-link');
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
        console.error('Error toggling theme:', error);
        showAlertModal('Failed to toggle theme. Check console for details.');
    }
}

// Tab management functions
function addTab() {
    if (tabs.length >= 5) {
        showAlertModal('Maximum 5 tabs allowed!');
        return;
    }
    const newTab = { id: tabs.length, name: `Tab ${tabs.length + 1}`, data: [] };
    tabs.push(newTab);
    switchTab(tabs.length - 1);
    saveToLocalStorage();
}

function removeTab() {
    if (currentTab === 0) {
        showAlertModal('Cannot delete first tab!');
        return;
    }
    
    showConfirmModal(
        'Delete this tab and all its data?',
        () => {
            tabs.splice(currentTab, 1);
            switchTab(0);
            saveToLocalStorage();
        },
        {
            btnText: 'Delete Tab',
            title: 'Delete Tab',
            btnClass: 'danger-btn'
        }
    );
}

function switchTab(index) {
    currentTab = index;
    renderTabs();
    renderTable();
    updateStats();
    updateRemoveTabButton();
    updateHeaderTitle();
}

// Rename tab functions
function renameTab() {
    document.getElementById('renameModal').style.display = 'flex';
    document.getElementById('newTabName').value = tabs[currentTab].name;
    document.getElementById('newTabName').focus();
}

function closeRenameModal() {
    document.getElementById('renameModal').style.display = 'none';
}

function confirmRenameTab() {
    const loader = document.getElementById('renameLoader');
    loader.style.display = 'block';
    
    setTimeout(() => {
        const newName = document.getElementById('newTabName').value.trim();
        
        if (!newName) {
            showAlertModal('Tab name cannot be empty!');
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

// UI update functions
function updateHeaderTitle() {
    document.querySelector('h1').textContent = tabs[currentTab].name;
}

function updateRemoveTabButton() {
    document.getElementById('removeTabBtn').style.display = currentTab === 0 ? 'none' : 'inline-block';
}

function renderTabs() {
    const tabsContainer = document.getElementById('tabs');
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
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    tabs[currentTab].data.forEach((item, index) => {
        if (!item || !item.machineData || !item.period || !item.status) return;
        const row = document.createElement('tr');
        row.setAttribute('data-index', index);
        row.draggable = true;
        row.addEventListener('dragstart', handleDragStart);
        row.addEventListener('dragover', handleDragOver);
        row.addEventListener('dragleave', handleDragLeave);
        row.addEventListener('drop', handleDrop);
        row.addEventListener('dragend', handleDragEnd);
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <span class="machine-data ${item.notes && item.notes.trim() ? 'has-notes' : ''}"
                    onclick="showEditModal(${index})"
                    title="Click to edit machine name & notes">
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
                <button class="delete-btn" onclick="deleteData(${index})" title="Delete Data">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Drag and Drop functions
function handleDragStart(e) {
    draggedItem = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
    this.classList.add('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this.classList.add('drag-over');
}

function handleDragLeave() {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.stopPropagation();
    e.preventDefault();
    this.classList.remove('drag-over');
    
    if (draggedItem !== this) {
        const fromIndex = parseInt(draggedItem.getAttribute('data-index'));
        const toIndex = parseInt(this.getAttribute('data-index'));
        
        // Reorder the data array
        const movedItem = tabs[currentTab].data.splice(fromIndex, 1)[0];
        tabs[currentTab].data.splice(toIndex, 0, movedItem);
        
        // Save and re-render
        saveToLocalStorage();
        renderTable();
        updateStats();
    }
}

function handleDragEnd() {
    this.classList.remove('dragging');
    document.querySelectorAll('tr').forEach(row => {
        row.classList.remove('drag-over');
    });
}

function updateStats() {
    const data = tabs[currentTab].data;
    const total = data.length;
    const done = data.filter(item => item.status === 'Done').length;
    const outstanding = total - done;

    document.getElementById('totalStat').textContent = total;
    document.getElementById('doneStat').textContent = done;
    document.getElementById('outstandingStat').textContent = outstanding;
}

// Data management functions
function showAddModal() {
    editIndex = -1;
    document.getElementById('addModal').style.display = 'flex';
    document.getElementById('modalTitle').textContent = 'Add Data';
    document.getElementById('machineData').value = '';
    document.getElementById('notes').value = '';
    document.getElementById('machineData').disabled = false;
}

function showEditModal(index) {
    editIndex = index;
    const item = tabs[currentTab].data[index];
    document.getElementById('addModal').style.display = 'flex';
    document.getElementById('modalTitle').textContent = 'Edit Data';
    document.getElementById('machineData').value = item.machineData;
    document.getElementById('notes').value = item.notes || '';
    document.getElementById('machineData').disabled = false;
}

function closeModal() {
    document.getElementById('addModal').style.display = 'none';
}

function saveData() {
    const loader = document.getElementById('loader');
    loader.style.display = 'block';
    setTimeout(() => {
        const machineData = document.getElementById('machineData').value;
        const notes = document.getElementById('notes').value;

        if (!machineData && editIndex === -1) {
            showAlertModal('Machine Data is required!');
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
        'Are you sure you want to delete this item?',
        () => {
            tabs[currentTab].data.splice(index, 1);
            saveToLocalStorage();
            renderTable();
            updateStats();
        },
        {
            btnText: 'Delete',
            title: 'Delete Item',
            btnClass: 'danger-btn'
        }
    );
}

function deleteAll() {
    showConfirmModal(
        'This will delete ALL data in current tab. Continue?',
        () => {
            tabs[currentTab].data = [];
            saveToLocalStorage();
            renderTable();
            updateStats();
        },
        {
            btnText: 'Delete All',
            title: 'Delete All Data',
            btnClass: 'danger-btn'
        }
    );
}

function resetStatus() {
    showConfirmModal(
        'Reset all statuses to Outstanding?',
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
    tabs[currentTab].data.sort((a, b) => {
        return monthOrder.indexOf(a.period) - monthOrder.indexOf(b.period);
    });
    saveToLocalStorage();
    renderTable();
    updateStats();
}

// Import/Export functions
function exportData() {
    const data = tabs[currentTab].data;
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-tab-${currentTab + 1}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (Array.isArray(importedData) && importedData.every(item =>
                item.machineData && typeof item.machineData === 'string' &&
                monthOrder.includes(item.period) &&
                ['Done', 'Outstanding'].includes(item.status)
            )) {
                showConfirmModal(
                    'Import will replace current tab data. Continue?',
                    () => {
                        tabs[currentTab].data = importedData;
                        saveToLocalStorage();
                        renderTable();
                        updateStats();
                        document.getElementById('importFile').value = '';
                    },
                    {
                        btnText: 'Import',
                        title: 'Import Data'
                    }
                );
            } else {
                showAlertModal('Invalid JSON format or data structure!');
            }
        } catch (error) {
            console.error('Error reading JSON file:', error);
            showAlertModal('Error reading JSON file: ' + error.message);
        }
    };
    reader.readAsText(file);
}

// Modal system functions
function showConfirmModal(message, action, options = {}) {
    const {
        btnText = 'Confirm',
        title = 'Confirm',
        btnClass = ''
    } = options;
    
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    const confirmBtn = document.getElementById('confirmActionBtn');
    confirmBtn.textContent = btnText;
    confirmBtn.className = btnClass || '';
    pendingAction = action;
    document.getElementById('confirmModal').style.display = 'flex';
}

function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
    pendingAction = null;
}

function executeConfirmedAction() {
    if (pendingAction) pendingAction();
    closeConfirmModal();
}

function showAlertModal(message, title = 'Alert') {
    showConfirmModal(message, () => {}, {
        btnText: 'OK',
        title: title,
        btnClass: 'btn-secondary'
    });
}

// Local storage functions
function saveToLocalStorage() {
    localStorage.setItem('tabs', JSON.stringify(tabs));
    const theme = document.getElementById('theme-link').href.includes('dark') ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
}

function loadFromLocalStorage() {
    const savedTabs = localStorage.getItem('tabs');
    if (savedTabs) {
        tabs = JSON.parse(savedTabs);
        tabs.forEach(tab => {
            if (!tab.data) tab.data = [];
            tab.data = tab.data.filter(item =>
                item && item.machineData && typeof item.machineData === 'string' &&
                monthOrder.includes(item.period) &&
                ['Done', 'Outstanding'].includes(item.status)
            );
        });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeData);
