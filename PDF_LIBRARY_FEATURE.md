# 📚 PDF Library Feature - Dokumentasi

**Dibuat:** 18 Maret 2026  
**Project:** Catatan Troubleshoot ATM  
**Status:** 📋 Planned (Belum Implementasi)

---

## 📋 Overview

Fitur **PDF Library** untuk menyimpan, mengelola, dan menampilkan dokumen PDF (manual, guide, troubleshooting) yang dapat diakses secara public.

**Storage Solution:** Google Drive (FREE 15 GB)

---

## 🎯 Tujuan

1. Admin dapat upload PDF (manual, guide, dll)
2. PDF tersimpan di Google Drive (FREE)
3. PDF dapat dibaca langsung di web (tanpa download)
4. Akses public (tanpa login)
5. Search & filter by kategori

---

## 💰 Storage Pricing Comparison

### Google Drive (RECOMMENDED) ✅

| Resource | Limit | Cost |
|----------|-------|------|
| **Storage** | 15 GB | FREE |
| **Download** | Unlimited | FREE |
| **Upload** | Unlimited | FREE |
| **Max File Size** | 5 TB | FREE |

**Cukup untuk ~7,500 PDFs (@ 2 MB each)!**

### Firebase Storage (NOT RECOMMENDED)

| Resource | Limit | Cost |
|----------|-------|------|
| **Storage** | 5 GB | FREE (Spark) |
| **Requirement** | Blaze Plan | ~$1-2/month |

**Require upgrade ke Blaze Plan untuk enable Storage.**

---

## 🗂️ Arsitektur Sistem

```
┌─────────────────────────────────────────┐
│  Admin Upload PDF                       │
│  (pdf_library.html)                     │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│  Upload ke Google Drive                 │
│  - Manual upload via web UI             │
│  - Atau Google Drive API (optional)     │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│  Google Drive Storage                   │
│  - PDF file tersimpan                   │
│  - Get shareable link                   │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│  Save Metadata ke Firebase              │
│  - Title, Category, Drive URL           │
│  - Realtime Database                    │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│  Public View PDF                        │
│  (pdf_viewer.html)                      │
│  - Embed Google Drive preview           │
│  - Search & Filter                      │
└─────────────────────────────────────────┘
```

### Realtime Database

```json
{
  "pdf_library": {
    "pdf_001": {
      "title": "ATM Manual NCR",
      "driveUrl": "https://drive.google.com/file/d/FILE_ID_1/view",
      "category": "Manual",
      "fileSize": 2048576,
      "uploadedAt": 1234567890,
      "uploadedBy": "admin"
    },
    "pdf_002": {
      "title": "Troubleshooting Guide Danamon",
      "driveUrl": "https://drive.google.com/file/d/FILE_ID_2/view",
      "category": "Troubleshooting",
      "fileSize": 1536000,
      "uploadedAt": 1234567891,
      "uploadedBy": "admin"
    }
  }
}
```

### Kategori PDF

```
1. Manual          - Manual book ATM
2. Troubleshooting - Guide troubleshooting
3. Service Bulletin - Bulletin service
4. Training        - Material training
5. Documentation   - Documentation umum
```

---

## 📁 File yang Dibuat

| File | Purpose | Access |
|------|---------|--------|
| `pdf_library.html` | Admin panel untuk upload & manage PDF | Admin only (login) |
| `pdf_viewer.html` | Public PDF reader | Public (tanpa login) |
| `index.html` | Update: tambah card "PDF Library" | Public |

---

## 🎨 Fitur Admin (`pdf_library.html`)

### 1. Upload PDF (Google Drive)

```html
┌─────────────────────────────────────────┐
│  Upload PDF Baru                        │
├─────────────────────────────────────────┤
│  Judul: [_________________________]     │
│                                         │
│  Kategori: [Manual            ▼]        │
│                                         │
│  Google Drive Link:                     │
│  [_________________________________]    │
│                                         │
│  ATAU                                   │
│                                         │
│  Upload Manual:                         │
│  1. Upload PDF ke Google Drive          │
│  2. Get shareable link                  │
│  3. Paste link di form atas             │
│                                         │
│  [Simpan PDF]                           │
└─────────────────────────────────────────┘
```

**Cara Get Google Drive Link:**
```
1. Upload PDF ke Google Drive
2. Klik kanan file → Share → Get link
3. Change "Restricted" → "Anyone with the link"
4. Copy link
5. Paste di form upload
```

**Features:**
- Input Google Drive URL
- Preview link sebelum save
- Auto-generate thumbnail (optional)
- Validate Google Drive URL format

### 2. Manage PDF List

```html
┌─────────────────────────────────────────┐
│  Daftar PDF (25 PDFs)                   │
├─────────────────────────────────────────┤
│  🔍 Search: [________________]          │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 📄 ATM Manual NCR                 │ │
│  │    Manual • 2.0 MB • 2024-03-18  │ │
│  │    [Preview] [Edit] [Delete]     │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 📄 Troubleshooting Guide          │ │
│  │    Troubleshooting • 1.5 MB      │ │
│  │    [Preview] [Edit] [Delete]     │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Features:**
- Search by title
- Filter by kategori
- Sort by date/name
- Preview PDF
- Edit metadata
- Delete PDF

### 3. Login Required

```javascript
// Admin login untuk upload
const ADMIN_PASSWORD = "admin123";

// Same login system as admin_notes.html
```

---

## 📖 Fitur Public (`pdf_viewer.html`)

### 1. PDF Library Landing

```html
┌─────────────────────────────────────────┐
│  📚 PDF Library                         │
│  Baca manual & guide ATM                │
├─────────────────────────────────────────┤
│  🔍 Search: [________________]          │
│                                         │
│  Filter: [All ▼] [Manual] [Trouble...] │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 📄 ATM Manual NCR                 │ │
│  │    Manual • 2.0 MB               │ │
│  │    [Read PDF] [Download]         │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 📄 Troubleshooting Guide          │ │
│  │    Troubleshooting • 1.5 MB      │ │
│  │    [Read PDF] [Download]         │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 2. PDF Reader (Inline)

```html
┌─────────────────────────────────────────┐
│  ← Back to Library    ATM Manual NCR    │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐ │
│  │                                   │ │
│  │        [PDF Content]              │ │
│  │                                   │ │
│  │        Page 1 of 25               │ │
│  │                                   │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [◄ Prev] [Page 1] [Next ►]            │
│  [Zoom -] [100%] [Zoom +]               │
│  [Download] [Fullscreen]                │
└─────────────────────────────────────────┘
```

**PDF Viewer Options:**

| Option | Library | Features | Complexity |
|--------|---------|----------|------------|
| **Opsi A** | Native iframe | Simple, browser default | Easy |
| **Opsi B** | PDF.js | Zoom, page nav, search | Medium |
| **Opsi C** | PDFObject | Embed, minimal UI | Easy |

**Rekomendasi:** Pakai **PDF.js** untuk UX terbaik!

---

## 🔧 Implementasi Teknis

### 1. Firebase Config (Same as Existing)

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAqqwSS1KTnAjfGcqvV_-TRHMYXJlTjtlI",
  authDomain: "catatan-troubleshoot-atm-2b5a4.firebaseapp.com",
  databaseURL: "https://catatan-troubleshoot-atm-2b5a4-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "catatan-troubleshoot-atm-2b5a4",
  storageBucket: "catatan-troubleshoot-atm-2b5a4.firebasestorage.app",
  messagingSenderId: "441198643571",
  appId: "1:441198643571:web:7ee3c056d933acb3515d06"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
// Note: firebase.storage() NOT needed for Google Drive approach
```

### 2. Upload PDF (Admin - Google Drive)

```javascript
function savePDF(title, category, driveUrl) {
    // Validate Google Drive URL
    if (!isValidDriveUrl(driveUrl)) {
        alert('Invalid Google Drive URL!');
        return;
    }
    
    // Extract file ID from URL
    const fileId = extractFileId(driveUrl);
    
    // Convert to preview URL
    const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
    
    // Save metadata to Firebase
    const pdfData = {
        title: title,
        category: category,
        driveUrl: driveUrl,
        previewUrl: previewUrl,
        uploadedAt: Date.now(),
        uploadedBy: 'admin'
    };
    
    db.ref('pdf_library').push(pdfData)
        .then(() => {
            alert('PDF berhasil disimpan!');
            loadPDFList();
        })
        .catch((error) => {
            console.error('Save error:', error);
            alert('Gagal menyimpan PDF: ' + error.message);
        });
}

function isValidDriveUrl(url) {
    // Validate Google Drive URL format
    const driveRegex = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
    return driveRegex.test(url);
}

function extractFileId(url) {
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
}
```

### 3. Load PDF List (Public)

```javascript
function loadPDFList() {
    db.ref('pdf_library').orderByChild('uploadedAt').once('value', (snapshot) => {
        const pdfs = snapshot.val() || {};
        renderPDFList(pdfs);
    });
}

function renderPDFList(pdfs) {
    const container = document.getElementById('pdfList');
    container.innerHTML = '';
    
    Object.entries(pdfs).reverse().forEach(([id, pdf]) => {
        const card = document.createElement('div');
        card.className = 'pdf-card';
        card.innerHTML = `
            <h3>${pdf.title}</h3>
            <p>${pdf.category}</p>
            <div class="pdf-actions">
                <button onclick="viewPDF('${pdf.previewUrl}')">📖 Read PDF</button>
                <a href="${pdf.driveUrl}" target="_blank" download>⬇ Download</a>
            </div>
        `;
        container.appendChild(card);
    });
}
```

### 4. View PDF (Google Drive Preview)

```html
<!-- PDF Viewer with Google Drive Embed -->
<div id="pdfViewerContainer" style="display:none;">
    <button onclick="closePDF()">← Back to Library</button>
    <iframe 
        id="pdfFrame"
        src=""
        width="100%"
        height="600px"
        style="border:none;">
    </iframe>
</div>

<script>
    function viewPDF(previewUrl) {
        document.getElementById('pdfFrame').src = previewUrl;
        document.getElementById('pdfViewerContainer').style.display = 'block';
        document.getElementById('pdfList').style.display = 'none';
    }
    
    function closePDF() {
        document.getElementById('pdfFrame').src = '';
        document.getElementById('pdfViewerContainer').style.display = 'none';
        document.getElementById('pdfList').style.display = 'block';
    }
</script>
```

---

## 🔐 Firebase Security Rules

### Database Rules (Google Drive Approach)

```javascript
{
  "rules": {
    "pdf_library": {
      // Public read (siapa saja bisa baca PDF list)
      ".read": true,
      
      // Write untuk semua (validasi di app layer)
      ".write": true,
      
      "$pdfId": {
        ".indexOn": ["category", "uploadedAt", "title"]
      }
    }
  }
}
```

**Note:** Tidak perlu Firebase Storage Rules karena PDF tersimpan di Google Drive, bukan Firebase Storage.

---

## 📊 Google Drive Setup Guide

### Step 1: Upload PDF ke Google Drive

```
1. Buka https://drive.google.com/
2. Login dengan Google account
3. Klik "+ New" → "File upload"
4. Pilih file PDF
5. Tunggu upload selesai
```

### Step 2: Get Shareable Link

```
1. Klik kanan file PDF → "Share"
2. Klik "Get link"
3. Change "Restricted" → "Anyone with the link"
4. Copy link

Format link:
https://drive.google.com/file/d/FILE_ID/view?usp=sharing
```

### Step 3: Convert to Preview URL

```
Original URL:
https://drive.google.com/file/d/FILE_ID/view?usp=sharing

Preview URL (untuk embed):
https://drive.google.com/file/d/FILE_ID/preview
```

### Step 4: Test Embed

```html
<iframe 
    src="https://drive.google.com/file/d/FILE_ID/preview" 
    width="100%" 
    height="600px">
</iframe>
```

---

## 💡 Google Drive Best Practices

### File Naming
```
✅ Good: atm-manual-ncr-2024.pdf
✅ Good: troubleshooting-guide-danamon.pdf
❌ Bad: document1.pdf
❌ Bad: final-final-revised.pdf
```

### Folder Organization
```
Google Drive/
├── ATM Manuals/
│   ├── NCR/
│   ├── Diebold/
│   └── Hyosung/
├── Troubleshooting Guides/
│   ├── Hardware/
│   └── Software/
├── Service Bulletins/
│   ├── 2024/
│   └── 2023/
└── Training Materials/
    ├── Beginner/
    └── Advanced/
```

### Sharing Settings
```
✅ Set: "Anyone with the link can view"
❌ Avoid: "Restricted" (won't work for public access)
❌ Avoid: "Anyone can edit" (security risk)
```

### File Size Limits
```
Google Drive Limits:
- Max file size: 5 TB (with Google One)
- Max file size: 250 GB (free account)
- Recommended: < 50 MB for faster loading
```

---

## 📊 Estimasi Usage (Spark Plan)

### Skenario Realistis

```
Month 1:
- Upload: 50 PDFs @ 2 MB = 100 MB
- Storage used: 100 MB / 5 GB (2%)
- Downloads: 500/hari @ 2 MB = 1 GB/hari
- Bandwidth: 1 GB / 10 GB per day (10%)

Month 6:
- Upload: 300 PDFs @ 2 MB = 600 MB
- Storage used: 600 MB / 5 GB (12%)
- Downloads: 2000/hari @ 2 MB = 4 GB/hari
- Bandwidth: 4 GB / 10 GB per day (40%)

Month 12:
- Upload: 600 PDFs @ 2 MB = 1.2 GB
- Storage used: 1.2 GB / 5 GB (24%)
- Downloads: 4000/hari @ 2 MB = 8 GB/hari
- Bandwidth: 8 GB / 10 GB per day (80%)

Status: ✅ MASIH FREE (Spark Plan)
```

---

## 🎯 Implementation Checklist

### Phase 1: Setup Google Drive
- [ ] 1.1 Create folder "PDF Library" di Google Drive
- [ ] 1.2 Upload beberapa PDF test
- [ ] 1.3 Get shareable links (set "Anyone with the link")
- [ ] 1.4 Test embed preview di browser local

### Phase 2: Admin Panel (`pdf_library.html`)
- [ ] 2.1 Buat HTML structure
- [ ] 2.2 Login admin (same as admin_notes.html)
- [ ] 2.3 Form input: Title, Category, Google Drive URL
- [ ] 2.4 Validasi Google Drive URL format
- [ ] 2.5 Save metadata ke Firebase Realtime Database
- [ ] 2.6 List PDF dengan preview
- [ ] 2.7 Edit metadata
- [ ] 2.8 Delete PDF (dari list only, file tetap di Drive)

### Phase 3: Public Viewer (`pdf_viewer.html`)
- [ ] 3.1 Buat HTML structure
- [ ] 3.2 PDF list dengan search & filter
- [ ] 3.3 Embed Google Drive preview
- [ ] 3.4 Fullscreen mode
- [ ] 3.5 Download button (link ke Google Drive)
- [ ] 3.6 Back to library button

### Phase 4: Update Index
- [ ] 4.1 Tambah card "📚 PDF Library" di index.html
- [ ] 4.2 Link ke pdf_viewer.html

### Phase 5: Testing
- [ ] 5.1 Test upload PDF ke Google Drive
- [ ] 5.2 Test get shareable link
- [ ] 5.3 Test save metadata ke Firebase
- [ ] 5.4 Test view PDF inline
- [ ] 5.5 Test download PDF
- [ ] 5.6 Test search & filter
- [ ] 5.7 Test mobile responsive

### Phase 6: Documentation
- [ ] 6.1 Buat panduan upload PDF untuk admin
- [ ] 6.2 Screenshot step-by-step
- [ ] 6.3 Share ke team

---

## 🚀 Next Steps (Untuk Lanjut)

1. **Setup Google Drive**
   - Create folder "PDF Library" di Google Drive
   - Upload beberapa PDF sample
   - Get shareable links

2. **Buat File Baru**
   - `pdf_library.html` (admin panel)
   - `pdf_viewer.html` (public reader)

3. **Implementasi**
   - Follow Implementation Checklist (Phase 1-6)
   - Copy code examples dari dokumentasi
   - Test local dengan http-server

4. **Testing & Deploy**
   - Test upload & view PDF
   - Deploy ke GitHub Pages
   - Monitor usage di Google Drive & Firebase Console

---

## 💡 Tips & Best Practices

### Google Drive Upload
- ✅ Set sharing: "Anyone with the link can view"
- ✅ Organize by folder (Manuals, Guides, dll)
- ✅ Use descriptive filenames
- ✅ Keep file size < 50 MB for faster loading

### Firebase Database
- ✅ Save metadata: title, category, driveUrl, previewUrl
- ✅ Index on category & uploadedAt for fast search
- ✅ Public read access for pdf_library

### PDF Viewer
- ✅ Use Google Drive preview embed (not download link)
- ✅ Show loading indicator saat load PDF
- ✅ Provide download button as alternative
- ✅ Mobile responsive iframe

### Security
- ✅ Validate Google Drive URL format
- ✅ Set proper sharing permissions (view only)
- ✅ Sanitize input (title, category)
- ✅ Monitor Google Drive storage usage

---

## 📞 Support & Resources

### Documentation
- [Firebase Storage Docs](https://firebase.google.com/docs/storage)
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)
- [Firebase Pricing](https://firebase.google.com/pricing)

### Tools
- [PDF Compressor](https://pdfcompressor.com/) - Compress PDF online
- [SmallPDF](https://smallpdf.com/) - PDF tools
- [Firebase Console](https://console.firebase.google.com/) - Monitor usage

---

## 📝 Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-03-18 | 1.0 | Initial documentation |

---

**Status:** 📋 Ready for Implementation  
**Priority:** Medium  
**Estimated Time:** ~4-6 jam implementasi

---

**Catatan:** Dokumentasi ini dibuat untuk referensi implementasi di masa depan. Semua spesifikasi dapat disesuaikan dengan kebutuhan actual saat implementasi.
