let entries = [];

// [DB:REPLACE] Load dari localStorage
function loadEntries() {
  const data = localStorage.getItem('guideEntries');
  entries = data ? JSON.parse(data) : [];
}

// [DB:REPLACE] Simpan ke localStorage
function saveEntries() {
  localStorage.setItem('guideEntries', JSON.stringify(entries));
}

function renderEntries() {
  const container = document.getElementById('entries');
  container.innerHTML = '';
  entries.forEach((entry, index) => {
    const div = document.createElement('div');
    div.className = 'entry';
    div.innerHTML = `
      <img src="${entry.image}">
      <p>${entry.caption}</p>
      ${typeof deleteEntry === 'function' ? `<button onclick="deleteEntry(${index})">Hapus</button>` : ''}
    `;
    container.appendChild(div);
  });
}

function addEntry() {
  const imageInput = document.getElementById('imageInput');
  const captionInput = document.getElementById('captionInput');
  const file = imageInput.files[0];

  if (!file) {
    alert("Pilih gambar terlebih dahulu!");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const newEntry = {
      image: e.target.result,
      caption: captionInput.value
    };

    entries.push(newEntry);
    saveEntries(); // [DB:REPLACE] Ganti ke simpan ke database
    renderEntries();

    imageInput.value = '';
    captionInput.value = '';
  };

  reader.readAsDataURL(file);
}

function deleteEntry(index) {
  if (confirm("Yakin ingin menghapus?")) {
    entries.splice(index, 1);
    saveEntries(); // [DB:REPLACE] Ganti ke hapus di database
    renderEntries();
  }
}

// Export PDF (offline, tidak perlu database)
function exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 10;

  let promises = entries.map((entry) => {
    return new Promise(resolve => {
      let img = new Image();
      img.src = entry.image;
      img.onload = function () {
        let width = 180;
        let height = (img.height / img.width) * width;

        if (y + height > 280) {
          doc.addPage();
          y = 10;
        }

        doc.addImage(img, 'JPEG', 15, y, width, height);
        y += height + 5;

        doc.text(entry.caption, 15, y);
        y += 10;

        resolve();
      };
    });
  });

  Promise.all(promises).then(() => {
    doc.save('panduan.pdf');
  });
}

// PWA setup
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(reg => console.log("SW registered"))
    .catch(err => console.log("SW failed", err));
}

// Inisialisasi
window.onload = () => {
  loadEntries(); // [DB:REPLACE] Ganti ke ambil dari database
  renderEntries();
};

