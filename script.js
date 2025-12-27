// ===== VERI YÖNETİMİ =====
const storage = {
    files: {
        'siir-1.txt': '<p>Gece düşünceleri...</p><p>Ayın ışığında kaybolan rüyalar</p>',
        'siir-2.txt': '<p>Bahar geldi ve çiçekler açıldı</p><p>Yüreğime de bahar geldi</p>',
        'polisiye-1.txt': '<p><strong>Bölüm 1 - Başlangıç</strong></p><p>Katil hala aranan bir şahıs...</p>',
        'polisiye-2.txt': '<p><strong>Bölüm 2 - İpuçları</strong></p><p>Detektif ilk ipucunu bulmuştu...</p>'
    },
    notes: {},
    currentFile: null
};

// localStorage'dan veriyi yükle
function loadFromStorage() {
    const saved = localStorage.getItem('writerData');
    if (saved) {
        const data = JSON.parse(saved);
        storage.files = { ...storage.files, ...data.files };
        storage.notes = data.notes || {};
    }
}

// localStorage'a veriyi kaydet
function saveToStorage() {
    localStorage.setItem('writerData', JSON.stringify({
        files: storage.files,
        notes: storage.notes
    }));
}

// ===== DOSYA YÖNETİMİ =====
function buildFileItemInner(name) {
    return `${name} <span class="edit-btn" title="Yeniden Adlandır">✎</span> <span class="delete-btn" title="Sil">✕</span>`;
}

function attachFileItemEvents(fileItem, fileName) {
    fileItem.setAttribute('data-file', fileName);
    fileItem.innerHTML = buildFileItemInner(fileName);

    fileItem.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-btn') || e.target.classList.contains('edit-btn')) {
            return;
        }
        const targetFile = this.getAttribute('data-file');
        loadFile(targetFile);
    });

    const deleteBtn = fileItem.querySelector('.delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteFile(fileName, fileItem);
        });
    }

    const editBtn = fileItem.querySelector('.edit-btn');
    if (editBtn) {
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            renameFile(fileName, fileItem);
        });
    }
}

document.querySelectorAll('.file-item').forEach(item => {
    const initialName = item.getAttribute('data-file');
    attachFileItemEvents(item, initialName);
});

function loadFile(fileName) {
    // Önceki seçili dosyayı kaldır
    document.querySelectorAll('.file-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Yeni dosyayı seç
    document.querySelector(`[data-file="${fileName}"]`)?.classList.add('active');
    
    // Dosya içeriğini yükle
    storage.currentFile = fileName;
    document.getElementById('editor').innerHTML = storage.files[fileName] || '';
    
    // Notları yükle
    const notes = storage.notes[fileName] || '';
    document.getElementById('notes-text').value = notes;
    
    document.getElementById('currentFileName').textContent = fileName.replace('.txt', '');
    
    // İstatistikleri güncelle
    updateStats();
}

// ===== YAZMA TİMER =====
let writeStartTime = null;
let totalMinutes = 0;

document.getElementById('editor').addEventListener('focus', () => {
    if (!writeStartTime) writeStartTime = Date.now();
});

document.getElementById('editor').addEventListener('input', function() {
    updateStats();
    // Otomatik kaydet
    if (storage.currentFile) {
        storage.files[storage.currentFile] = this.innerHTML;
        saveToStorage();
    }
});

setInterval(() => {
    if (writeStartTime) {
        totalMinutes = Math.floor((Date.now() - writeStartTime) / 60000);
        document.getElementById('timeSpent').textContent = `⏱️ ${totalMinutes} dk`;
    }
}, 1000);

// ===== İSTATİSTİKLER =====
document.getElementById('editor').addEventListener('input', function() {
    updateStats();
    // Otomatik kaydet
    if (storage.currentFile) {
        storage.files[storage.currentFile] = this.value;
        saveToStorage();
    }
});

function updateStats() {
    const editor = document.getElementById('editor');
    const text = editor.innerText || editor.textContent;
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    const chars = text.length;
    
    document.getElementById('wordCount').textContent = `Kelimeler: ${words}`;
    document.getElementById('charCount').textContent = `Karakterler: ${chars}`;
}

// ===== KAYDET BUTONU =====
document.getElementById('saveBtn').addEventListener('click', function() {
    if (storage.currentFile) {
        storage.files[storage.currentFile] = document.getElementById('editor').innerHTML;
        saveToStorage();
        
        // Kısa bir feedback ver
        this.textContent = '✓ Kaydedildi!';
        setTimeout(() => {
            this.textContent = '💾 Kaydet';
        }, 2000);
    }
});

// ===== NOTLAR =====
document.getElementById('saveNotesBtn').addEventListener('click', function() {
    if (storage.currentFile) {
        storage.notes[storage.currentFile] = document.getElementById('notes-text').value;
        saveToStorage();
        
        this.textContent = '✓ Kaydedildi!';
        setTimeout(() => {
            this.textContent = '💾 Kaydet';
        }, 2000);
    }
});

document.getElementById('clearNotesBtn').addEventListener('click', function() {
    if (confirm('Tüm notları silmek istediğinize emin misiniz?')) {
        document.getElementById('notes-text').value = '';
        if (storage.currentFile) {
            storage.notes[storage.currentFile] = '';
            saveToStorage();
        }
    }
});

// Notlar otomatik kaydet
document.getElementById('notes-text').addEventListener('input', function() {
    if (storage.currentFile) {
        storage.notes[storage.currentFile] = this.value;
        saveToStorage();
    }
});

// ===== KARAKTERLER =====
// Bu sekme için planlananlar index.html içerisinde listelendi; şu an aktif işlem yok.

// ===== SAĞ PANEL TOGGLING =====
document.getElementById('rightPanelToggle').addEventListener('click', (e) => {
    const rightPanel = document.getElementById('rightPanel');
    const middlePanel = document.querySelector('.middle-panel');
    const toggleBtn = e.currentTarget;
    const isOpen = rightPanel.classList.toggle('open');
    toggleBtn.classList.toggle('active', isOpen);
    middlePanel.style.marginRight = isOpen ? '250px' : '0';
});

// ===== PANEL TABS =====
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.getAttribute('data-tab');
        
        // Tüm tab buttonlarından active sınıfını kaldır
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        // Tüm tab contentlerini gizle
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Seçilen tab'ı aktif yap
        btn.classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    });
});

// ===== GECE MODU =====
const themeToggleBtn = document.getElementById('themeToggleBtn');

if (themeToggleBtn) {
    let isDarkMode = localStorage.getItem('darkMode');

    // Eğer daha önce ayarlanmamışsa, sistem tercihi kontrol et
    if (isDarkMode === null) {
        isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        localStorage.setItem('darkMode', isDarkMode);
    } else {
        isDarkMode = isDarkMode === 'true';
    }

    const applyThemeState = (dark) => {
        document.body.classList.toggle('dark-mode', dark);
        themeToggleBtn.classList.toggle('active', dark);
        themeToggleBtn.setAttribute('aria-pressed', String(dark));
        themeToggleBtn.title = dark ? 'Açık moda geç' : 'Koyu moda geç';
        themeToggleBtn.setAttribute('aria-label', dark ? 'Açık moda geç' : 'Koyu moda geç');
    };

    applyThemeState(Boolean(isDarkMode));

    themeToggleBtn.addEventListener('click', () => {
        const darkMode = !document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', darkMode);
        applyThemeState(darkMode);
    });
}

// ===== PROJE SEÇİMİ =====
let selectedProject = null;

function selectProject(projectEl) {
    document.querySelectorAll('.project-name').forEach(el => el.classList.remove('selected'));
    projectEl.classList.add('selected');
    selectedProject = projectEl.closest('.project-item');
}

function toggleProject(projectItem) {
    projectItem.classList.toggle('collapsed');
}

document.querySelectorAll('.project-name').forEach(nameEl => {
    nameEl.addEventListener('click', () => {
        const projectItem = nameEl.closest('.project-item');
        toggleProject(projectItem);
        selectProject(nameEl);
    });
});

// Varsayılan olarak ilk projeyi seç
const firstProjectName = document.querySelector('.project-name');
if (firstProjectName) selectProject(firstProjectName);

function appendFileToProject(cleanName, targetProject) {
    const fileList = targetProject.querySelector('.file-list');
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    attachFileItemEvents(fileItem, cleanName);
    fileList.appendChild(fileItem);
}

function createFile(promptText = 'Dosya adı (ör: Yeni Hikaye.txt):') {
    const fileName = prompt(promptText);
    if (!(fileName && fileName.trim())) return;

    const cleanName = fileName.includes('.txt') ? fileName.trim() : `${fileName.trim()}.txt`;
    if (storage.files[cleanName]) {
        alert('Bu dosya zaten var!');
        return;
    }

    storage.files[cleanName] = '';
    storage.notes[cleanName] = '';
    saveToStorage();

    const targetProject = selectedProject || document.querySelector('.project-item');
    if (!targetProject) return;
    appendFileToProject(cleanName, targetProject);
    loadFile(cleanName);
}

document.getElementById('newNoteAction').addEventListener('click', () => {
    createFile('Not adı (ör: Yeni Not):');
});

document.getElementById('newFolderAction').addEventListener('click', () => {
    const folderName = prompt('Klasör adı (ör: Yeni Proje):');
    if (!(folderName && folderName.trim())) return;
    const clean = folderName.trim();

    const projectItem = document.createElement('div');
    projectItem.className = 'project-item';
    projectItem.innerHTML = `
        <div class="project-name">${clean}</div>
        <div class="file-list"></div>
    `;
    document.getElementById('fileTree').appendChild(projectItem);

    const nameEl = projectItem.querySelector('.project-name');
    nameEl.addEventListener('click', () => {
        toggleProject(projectItem);
        selectProject(nameEl);
    });
    selectProject(nameEl);
});

// ===== DOSYA SİLME =====
function deleteFile(fileName, element) {
    if (confirm(`"${fileName}" dosyasını silmek istediğinize emin misiniz?`)) {
        delete storage.files[fileName];
        delete storage.notes[fileName];
        saveToStorage();
        element.remove();
        
        // İlk dosyayı yükle
        const firstFile = Object.keys(storage.files)[0];
        if (firstFile) {
            loadFile(firstFile);
        } else {
            document.getElementById('editor').value = '';
            document.getElementById('notes').value = '';
            document.getElementById('currentFileName').textContent = 'Yeni Belge';
        }
    }
}

function renameFile(oldName, element) {
    const newNameInput = prompt('Yeni dosya adı:', oldName.replace('.txt', ''));
    if (!(newNameInput && newNameInput.trim())) return;
    const cleanName = newNameInput.includes('.txt') ? newNameInput.trim() : `${newNameInput.trim()}.txt`;

    if (cleanName === oldName) return;
    if (storage.files[cleanName]) {
        alert('Bu isimde bir dosya zaten var!');
        return;
    }

    storage.files[cleanName] = storage.files[oldName] || '';
    storage.notes[cleanName] = storage.notes[oldName] || '';
    delete storage.files[oldName];
    delete storage.notes[oldName];
    saveToStorage();

    attachFileItemEvents(element, cleanName);

    // Eğer açık dosya rename olduysa güncelle
    if (storage.currentFile === oldName) {
        storage.currentFile = cleanName;
        document.getElementById('currentFileName').textContent = cleanName.replace('.txt', '');
    }
}

// Var olan dosyalara silme fonksiyonalitesi ekle
document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const fileName = btn.parentElement.getAttribute('data-file');
        deleteFile(fileName, btn.parentElement);
    });
});

// ===== FORMATTING TOOLBAR =====
function updateToolbarState() {
    document.getElementById('boldBtn').classList.toggle('active', document.queryCommandState('bold'));
    document.getElementById('italicBtn').classList.toggle('active', document.queryCommandState('italic'));
    document.getElementById('underlineBtn').classList.toggle('active', document.queryCommandState('underline'));
    document.getElementById('strikeBtn').classList.toggle('active', document.queryCommandState('strikethrough'));
}

document.getElementById('boldBtn').addEventListener('click', () => {
    document.execCommand('bold', false, null);
    updateToolbarState();
    document.getElementById('editor').focus();
});

document.getElementById('italicBtn').addEventListener('click', () => {
    document.execCommand('italic', false, null);
    updateToolbarState();
    document.getElementById('editor').focus();
});

document.getElementById('underlineBtn').addEventListener('click', () => {
    document.execCommand('underline', false, null);
    updateToolbarState();
    document.getElementById('editor').focus();
});

document.getElementById('strikeBtn').addEventListener('click', () => {
    document.execCommand('strikethrough', false, null);
    updateToolbarState();
    document.getElementById('editor').focus();
});

document.getElementById('alignLeftBtn').addEventListener('click', () => {
    document.execCommand('justifyLeft', false, null);
    document.getElementById('editor').focus();
});

document.getElementById('alignCenterBtn').addEventListener('click', () => {
    document.execCommand('justifyCenter', false, null);
    document.getElementById('editor').focus();
});

document.getElementById('alignRightBtn').addEventListener('click', () => {
    document.execCommand('justifyRight', false, null);
    document.getElementById('editor').focus();
});

// Toolbar state'i güncelle
document.getElementById('editor').addEventListener('click', updateToolbarState);
document.getElementById('editor').addEventListener('keyup', updateToolbarState);

// ===== İLK YÜKLEME =====
window.addEventListener('load', () => {
    loadFromStorage();
    // İlk dosyayı yükle
    if (Object.keys(storage.files).length > 0) {
        loadFile(Object.keys(storage.files)[0]);
    }
});

// ===== EXPORT =====
document.getElementById('exportTxtBtn').addEventListener('click', () => {
    if (!storage.currentFile) {
        alert('Lütfen bir dosya seçin');
        return;
    }
    
    const editor = document.getElementById('editor');
    const text = editor.innerText || editor.textContent;
    const fileName = storage.currentFile.replace('.txt', '');
    
    // TXT olarak indir
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', `${fileName}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    alert('✓ Dosya indirildi!');
});
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        document.getElementById('saveBtn').click();
    }
});

// ===== ARAMA VE DEĞİŞTİR =====
document.getElementById('searchBtn').addEventListener('click', () => {
    const panel = document.getElementById('searchPanel');
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) {
        document.getElementById('searchInput').focus();
    }
});

document.getElementById('closeSearchBtn').addEventListener('click', () => {
    document.getElementById('searchPanel').classList.add('hidden');
});

document.getElementById('replaceBtn').addEventListener('click', () => {
    const searchText = document.getElementById('searchInput').value;
    const replaceText = document.getElementById('replaceInput').value;
    const editor = document.getElementById('editor');
    
    if (!searchText) {
        alert('Lütfen aranacak metni girin');
        return;
    }
    
    const currentValue = editor.innerText || editor.textContent;
    const newValue = currentValue.replace(searchText, replaceText);
    
    if (newValue === currentValue) {
        alert(`"${searchText}" metni bulunamadı`);
    } else {
        // Metni değiştir
        const html = editor.innerHTML;
        const newHtml = html.replace(searchText, replaceText);
        editor.innerHTML = newHtml;
        storage.files[storage.currentFile] = newHtml;
        saveToStorage();
        updateStats();
    }
});

document.getElementById('replaceAllBtn').addEventListener('click', () => {
    const searchText = document.getElementById('searchInput').value;
    const replaceText = document.getElementById('replaceInput').value;
    const editor = document.getElementById('editor');
    
    if (!searchText) {
        alert('Lütfen aranacak metni girin');
        return;
    }
    
    const currentValue = editor.innerText || editor.textContent;
    const newValue = currentValue.split(searchText).join(replaceText);
    const count = (currentValue.match(new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    
    if (newValue === currentValue) {
        alert(`"${searchText}" metni bulunamadı`);
    } else {
        const html = editor.innerHTML;
        const newHtml = html.split(searchText).join(replaceText);
        editor.innerHTML = newHtml;
        storage.files[storage.currentFile] = newHtml;
        saveToStorage();
        updateStats();
        alert(`✓ ${count} yer değiştirildi!`);
    }
});

// Arama panelinde Enter tuşu
document.getElementById('searchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('replaceBtn').click();
    }
});

// ===== KISAYOLLAR =====
document.addEventListener('keydown', (e) => {
    // Ctrl+S - Kaydet
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        document.getElementById('saveBtn').click();
    }
    
    // Ctrl+F - Arama Paneli Aç
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('searchBtn').click();
    }
    
    // Ctrl+B - Kalın
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        document.execCommand('bold', false, null);
        updateToolbarState();
    }
    
    // Ctrl+I - İtalik
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        document.execCommand('italic', false, null);
        updateToolbarState();
    }
    
    // Ctrl+U - Altı Çizili
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        document.execCommand('underline', false, null);
        updateToolbarState();
    }
});

// ===== SAYFA KAPATILIRKEN KAYDET =====
window.addEventListener('beforeunload', () => {
    if (storage.currentFile) {
        storage.files[storage.currentFile] = document.getElementById('editor').innerHTML;
        storage.notes[storage.currentFile] = document.getElementById('notes-text').value;
        saveToStorage();
    }
});
