const APP_VERSION = '2.0.1';

/* ==========================================================================
   STATE MANAGEMENT
   ========================================================================== */
const state = {
    version: APP_VERSION,
    apiKey: localStorage.getItem('infoquiz_api_key') || '',
    
    // Grade Selection (1–12)
    selectedGrade: localStorage.getItem('infoquiz_selected_grade') || '5',
    selectedTier: localStorage.getItem('infoquiz_selected_tier') || 'middle1',
    
    // Test Select Tab state
    testSelectedSubject: 'Matematika',
    
    // Library Tab Form state
    libUploadedImageBase64: '',
    libUploadedImageSrc: '',
    libImageThumbnail: '',
    libSelectedSubject: 'Matematika',

    // Active quiz state
    activeInfographic: null, // Holds the selected infographic object
    questions: [],
    currentQuestionIndex: 0,
    userAnswers: [],
    
    // History
    history: JSON.parse(localStorage.getItem('infoquiz_history')) || []
};

// IndexedDB configuration
const dbName = "InfoQuizDB";
const storeName = "infographics";

/* ==========================================================================
   DOM ELEMENTS
   ========================================================================== */
const elements = {
    // Warnings & Settings
    apiWarningBanner: document.getElementById('api-warning-banner'),
    fixApiBtn: document.getElementById('fix-api-btn'),
    settingsBtn: document.getElementById('settings-btn'),
    settingsModal: document.getElementById('settings-modal'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    cancelSettingsBtn: document.getElementById('cancel-settings-btn'),
    saveSettingsBtn: document.getElementById('save-settings-btn'),
    apiKeyInput: document.getElementById('api-key-input'),
    toggleApiKeyVisibility: document.getElementById('toggle-api-key-visibility'),

    // Tabs
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabPanes: document.querySelectorAll('.tab-pane'),

    // Screens
    configScreen: document.getElementById('config-screen'),
    loadingScreen: document.getElementById('loading-screen'),
    quizScreen: document.getElementById('quiz-screen'),
    resultScreen: document.getElementById('result-screen'),

    // GRADE SELECTOR ELEMENTS
    gradeTierBtns: document.querySelectorAll('#grade-tier-selector .tier-btn'),
    gradePillGrid: document.getElementById('grade-pill-grid'),
    selectedGradeBadge: document.getElementById('selected-grade-badge'),

    // TEST TAB ELEMENTS
    testSubjectBtns: document.querySelectorAll('#test-subject-selector .subject-btn'),
    testThemeGrid: document.getElementById('test-theme-grid'),
    previewPlaceholderPrompt: document.getElementById('preview-placeholder-prompt'),
    selectedPreviewContainer: document.getElementById('selected-preview-container'),
    selectedPreviewSubject: document.getElementById('selected-preview-subject'),
    selectedPreviewImage: document.getElementById('selected-preview-image'),
    generateBtn: document.getElementById('generate-btn'),
    
    // LIBRARY TAB ELEMENTS
    addInfographicForm: document.getElementById('add-infographic-form'),
    libCodeInput: document.getElementById('lib-code-input'),
    libSubjectBtns: document.querySelectorAll('#lib-subject-selector .subject-btn'),
    libDropZone: document.getElementById('lib-drop-zone'),
    libFileInput: document.getElementById('lib-file-input'),
    libPreviewContainer: document.getElementById('lib-preview-container'),
    libImagePreview: document.getElementById('lib-image-preview'),
    libRemoveImageBtn: document.getElementById('lib-remove-image-btn'),
    libSubmitBtn: document.getElementById('lib-submit-btn'),
    libraryGrids: {
        'Matematika': document.getElementById('library-grid-matematika'),
        'Gamtos mokslai': document.getElementById('library-grid-gamtos'),
        'Istorija': document.getElementById('library-grid-istorija')
    },

    // Loading View
    loadingProgressBar: document.getElementById('loading-progress-bar'),
    loadingStatusText: document.getElementById('loading-status-text'),

    // Quiz View & Multimodal Components
    quizSubjectBadge: document.getElementById('quiz-subject-badge'),
    currentQuestionNum: document.getElementById('current-question-num'),
    totalQuestionsNum: document.getElementById('total-questions-num'),
    quizProgressFill: document.getElementById('quiz-progress-fill'),
    questionTypeBadge: document.getElementById('question-type-badge'),
    questionText: document.getElementById('question-text'),
    snippetContainer: document.getElementById('snippet-container'),
    snippetImage: document.getElementById('snippet-image'),
    hotspotContainer: document.getElementById('hotspot-container'),
    hotspotWrapper: document.getElementById('hotspot-wrapper'),
    hotspotImage: document.getElementById('hotspot-image'),
    hotspotPin: document.getElementById('hotspot-pin'),
    hotspotTargetBox: document.getElementById('hotspot-target-box'),
    orderingContainer: document.getElementById('ordering-container'),
    orderingList: document.getElementById('ordering-list'),
    confirmOrderBtn: document.getElementById('confirm-order-btn'),
    optionsContainer: document.getElementById('options-container'),
    explanationPanel: document.getElementById('explanation-panel'),
    explanationBody: document.getElementById('explanation-body'),
    nextQuestionBtn: document.getElementById('next-question-btn'),

    // Result View
    resultBadgeIcon: document.getElementById('result-badge-icon'),
    resultTitle: document.getElementById('result-title'),
    resultSubtitle: document.getElementById('result-subtitle'),
    scorePercent: document.getElementById('score-percent'),
    scoreFraction: document.getElementById('score-fraction'),
    resultRadialFill: document.getElementById('result-radial-fill'),
    resultSubjectVal: document.getElementById('result-subject-val'),
    resultGradeVal: document.getElementById('result-grade-val'),
    toggleReviewBtn: document.getElementById('toggle-review-btn'),
    reviewSection: document.getElementById('review-section'),
    reviewList: document.getElementById('review-list'),
    restartBtn: document.getElementById('restart-btn'),
    goHomeBtn: document.getElementById('go-home-btn'),

    // Zoom Modal
    zoomModal: document.getElementById('zoom-modal'),
    zoomedImage: document.getElementById('zoomed-image'),
    closeZoomBtn: document.getElementById('close-zoom-btn'),

    // History
    historyGrid: document.getElementById('history-grid')
};

/* ==========================================================================
   INDEXED DB FUNCTIONS
   ========================================================================== */
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 2);
        request.onupgradeneeded = function(e) {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName, { keyPath: "id" });
            }
        };
        request.onsuccess = function(e) {
            resolve(e.target.result);
        };
        request.onerror = function(e) {
            reject(e.target.error);
        };
    });
}

const withStore = async (mode, fn) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const store = db.transaction(storeName, mode).objectStore(storeName);
        const req = fn(store);
        if (req) {
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        } else {
            store.transaction.oncomplete = () => resolve();
            store.transaction.onerror = () => reject(store.transaction.error);
        }
    });
};

const saveInfographicToDB = o => withStore('readwrite', s => void s.put(o));
const getAllInfographicsFromDB = () => withStore('readonly', s => s.getAll());
const getInfographicFromDB = id => withStore('readonly', s => s.get(id));
const deleteInfographicFromDB = id => withStore('readwrite', s => void s.delete(id));

/* ==========================================================================
   INITIALIZATION & SETTINGS
   ========================================================================== */
async function init() {
    initGradeSelector();
    setupEventListeners();
    checkApiKey();
    await refreshTabsData();
    renderHistory();
}

function checkApiKey() {
    if (!state.apiKey) {
        elements.apiWarningBanner.classList.remove('hidden');
    } else {
        elements.apiWarningBanner.classList.add('hidden');
    }
    updateGenerateButtonState();
}

/* ==========================================================================
   GRADE SELECTOR (1–12 KL.)
   ========================================================================== */
const GRADE_TIERS = {
    primary: { label: 'Pradinis ugdymas', grades: [1, 2, 3, 4] },
    middle1: { label: 'Pagrindinis I', grades: [5, 6, 7, 8] },
    middle2: { label: 'Pagrindinis II (PUPP)', grades: [9, 10] },
    gymnasium: { label: 'Gimnazija (VBE)', grades: [11, 12] }
};

function initGradeSelector() {
    // Determine initial tier from saved grade
    const curGrade = parseInt(state.selectedGrade, 10) || 5;
    for (const [tierKey, tierObj] of Object.entries(GRADE_TIERS)) {
        if (tierObj.grades.includes(curGrade)) {
            state.selectedTier = tierKey;
            break;
        }
    }

    renderGradePills();
    updateGradeBadge();

    if (elements.gradeTierBtns) {
        elements.gradeTierBtns.forEach(btn => {
            if (btn.dataset.tier === state.selectedTier) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }

            btn.addEventListener('click', (e) => {
                elements.gradeTierBtns.forEach(b => b.classList.remove('active'));
                const targetBtn = e.currentTarget;
                targetBtn.classList.add('active');
                const tier = targetBtn.dataset.tier;
                state.selectedTier = tier;
                localStorage.setItem('infoquiz_selected_tier', tier);

                // If current grade not in this tier, select first grade of the tier
                if (!GRADE_TIERS[tier].grades.includes(parseInt(state.selectedGrade, 10))) {
                    state.selectedGrade = String(GRADE_TIERS[tier].grades[0]);
                    localStorage.setItem('infoquiz_selected_grade', state.selectedGrade);
                }

                renderGradePills();
                updateGradeBadge();
            });
        });
    }
}

function renderGradePills() {
    if (!elements.gradePillGrid) return;
    elements.gradePillGrid.innerHTML = '';
    const activeTier = GRADE_TIERS[state.selectedTier] || GRADE_TIERS.middle1;
    
    activeTier.grades.forEach(gradeNum => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'grade-pill';
        if (String(gradeNum) === String(state.selectedGrade)) {
            btn.classList.add('active');
        }
        btn.textContent = `${gradeNum} kl.`;
        btn.addEventListener('click', () => {
            state.selectedGrade = String(gradeNum);
            localStorage.setItem('infoquiz_selected_grade', state.selectedGrade);
            renderGradePills();
            updateGradeBadge();
        });
        elements.gradePillGrid.appendChild(btn);
    });
}

function updateGradeBadge() {
    if (!elements.selectedGradeBadge) return;
    const tier = state.selectedTier;
    const tierLabel = GRADE_TIERS[tier]?.label || '';
    elements.selectedGradeBadge.textContent = `${state.selectedGrade} klasė (${tierLabel})`;
}


function setupEventListeners() {
    // Settings modal events
    elements.settingsBtn.addEventListener('click', openSettingsModal);
    elements.fixApiBtn.addEventListener('click', openSettingsModal);
    elements.closeModalBtn.addEventListener('click', closeSettingsModal);
    elements.cancelSettingsBtn.addEventListener('click', closeSettingsModal);
    elements.saveSettingsBtn.addEventListener('click', saveSettings);
    
    elements.toggleApiKeyVisibility.addEventListener('click', () => {
        const type = elements.apiKeyInput.type === 'password' ? 'text' : 'password';
        elements.apiKeyInput.type = type;
        elements.toggleApiKeyVisibility.textContent = type === 'password' ? '👁️' : '🔒';
    });

    // Tab switcher events
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetTab = e.target.dataset.tab;
            
            elements.tabBtns.forEach(b => b.classList.remove('active'));
            elements.tabPanes.forEach(p => p.classList.add('hidden'));
            
            e.target.classList.add('active');
            document.getElementById(targetTab).classList.remove('hidden');
            
            refreshTabsData();
        });
    });

    // Generate Quiz button click
    elements.generateBtn.addEventListener('click', generateQuiz);

    // Subject selector in test form (Step 1)
    elements.testSubjectBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            elements.testSubjectBtns.forEach(b => b.classList.remove('active'));
            const targetBtn = e.currentTarget;
            targetBtn.classList.add('active');
            state.testSelectedSubject = targetBtn.dataset.subject;
            
            clearSelectedInfographicPreview();
            renderTestSelectionTab();
        });
    });

    // Quiz flow buttons
    elements.nextQuestionBtn.addEventListener('click', handleNextQuestion);
    elements.selectedPreviewImage.addEventListener('click', openZoomModal);
    elements.closeZoomBtn.addEventListener('click', closeZoomModal);
    
    // Result screen buttons
    elements.restartBtn.addEventListener('click', startQuiz);
    elements.goHomeBtn.addEventListener('click', goToHome);
    
    elements.toggleReviewBtn.addEventListener('click', () => {
        elements.reviewSection.classList.toggle('hidden');
        const isHidden = elements.reviewSection.classList.contains('hidden');
        elements.toggleReviewBtn.textContent = isHidden 
            ? 'Peržiūrėti klausimus ir atsakymus' 
            : 'Slėpti atsakymų suvestinę';
            
        if (!isHidden) {
            elements.reviewSection.scrollIntoView({ behavior: 'smooth' });
        }
    });

    // --- LIBRARY TAB EVENT LISTENERS ---
    
    // Subject selector in library form
    elements.libSubjectBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            elements.libSubjectBtns.forEach(b => b.classList.remove('active'));
            const targetBtn = e.currentTarget;
            targetBtn.classList.add('active');
            state.libSelectedSubject = targetBtn.dataset.subject;
        });
    });

    // Library drag & drop / file selection
    elements.libDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.libDropZone.classList.add('drag-over');
    });

    elements.libDropZone.addEventListener('dragleave', () => {
        elements.libDropZone.classList.remove('drag-over');
    });

    elements.libDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.libDropZone.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        handleLibraryFiles(files);
    });

    elements.libFileInput.addEventListener('change', (e) => {
        const files = e.target.files;
        handleLibraryFiles(files);
    });

    elements.libRemoveImageBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        clearLibraryUploadedImage();
    });

    elements.libCodeInput.addEventListener('input', () => {
        updateLibrarySubmitButtonState();
    });

    // Save Infographic Form Submit
    elements.addInfographicForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveInfographicToLibrary();
    });
}

async function refreshTabsData() {
    // Determine which tab is active and refresh its content
    const activeTabBtn = document.querySelector('.tab-btn.active');
    if (!activeTabBtn) return;
    
    const tabName = activeTabBtn.dataset.tab;
    if (tabName === 'tab-tests') {
        await renderTestSelectionTab();
    } else if (tabName === 'tab-library') {
        await renderLibraryTab();
    }
}

/* ==========================================================================
   SETTINGS MODAL MANAGEMENT
   ========================================================================== */
function openSettingsModal() {
    elements.apiKeyInput.value = state.apiKey;
    elements.settingsModal.classList.remove('hidden');
}

function closeSettingsModal() {
    elements.settingsModal.classList.add('hidden');
}

function saveSettings() {
    const newKey = elements.apiKeyInput.value.trim();
    state.apiKey = newKey;
    localStorage.setItem('infoquiz_api_key', newKey);
    checkApiKey();
    closeSettingsModal();
}

/* ==========================================================================
   LIBRARY TAB LOGIC
   ========================================================================== */
function parseFilename(file) {
    const filename = file.name || file; // fallback if string is passed
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename;
    
    let subject = state.libSelectedSubject;
    const SUBJECT_PATTERNS = [
        [/\bmatematik/i, 'Matematika'],
        [/\b(gamtos|gamta)\b/i, 'Gamtos mokslai'],
        [/\bistorij/i, 'Istorija']
    ];

    const pathToCheck = (typeof file === 'object' && file.webkitRelativePath) ? file.webkitRelativePath : filename;
    
    for (const [pattern, sub] of SUBJECT_PATTERNS) {
        if (pattern.test(pathToCheck)) {
            subject = sub;
            break;
        }
    }
    
    const codeMatch = nameWithoutExt.match(/(\d+[\.\-_]\d+)/);
    let code = '';
    if (codeMatch) {
        code = codeMatch[1].replace(/[-_]/g, '.');
    } else {
        code = nameWithoutExt.trim().substring(0, 15);
    }
    return { code, subject };
}

async function fileToInfographic(file, subject, code) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 60;
                canvas.height = 60;
                
                const size = Math.min(img.width, img.height);
                const sx = (img.width - size) / 2;
                const sy = (img.height - size) / 2;
                ctx.drawImage(img, sx, sy, size, size, 0, 0, 60, 60);
                
                const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
                const imageBase64 = e.target.result.split(',')[1];
                
                resolve({
                    id: `${subject}_${code}`,
                    code: code,
                    subject: subject,
                    imageSrc: e.target.result,
                    imageBase64: imageBase64,
                    thumbnail: thumbnail,
                    addedAt: new Date().toISOString()
                });
            };
            img.onerror = () => reject(new Error('Nepavyko įkelti nuotraukos'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Klaida skaitant failą'));
        reader.readAsDataURL(file);
    });
}

async function handleLibraryFiles(files) {
    if (files.length === 1) {
        const file = files[0];
        if (!file.type.startsWith('image/')) {
            alert('Įkelkite tik paveikslėlio bylą (PNG, JPG, JPEG, WEBP).');
            return;
        }

        const parsed = parseFilename(file);
        elements.libCodeInput.value = parsed.code;
        state.libSelectedSubject = parsed.subject;
        
        elements.libSubjectBtns.forEach(btn => {
            if (btn.dataset.subject === parsed.subject) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        try {
            const infographic = await fileToInfographic(file, parsed.subject, parsed.code);
            state.libUploadedImageSrc = infographic.imageSrc;
            elements.libImagePreview.src = state.libUploadedImageSrc;
            elements.libPreviewContainer.classList.remove('hidden');
            
            state.libUploadedImageBase64 = infographic.imageBase64;
            state.libImageThumbnail = infographic.thumbnail;
            
            updateLibrarySubmitButtonState();
        } catch (err) {
            console.error(err);
        }
    } else if (files.length > 1) {
        let pendingImports = [];
        let failedCount = 0;
        const details = [];

        const overlay = document.createElement('div');
        overlay.className = 'import-loading-overlay';
        overlay.innerHTML = `
            <div class="import-loading-card">
                <div class="loading-spinner"></div>
                <h3>Ruošiami infografikai...</h3>
                <p>Apdorojama: <span id="import-current-index">0</span> iš ${files.length}</p>
            </div>
        `;
        document.body.appendChild(overlay);

        for (let i = 0; i < files.length; i++) {
            document.getElementById('import-current-index').textContent = i + 1;
            const file = files[i];
            
            if (!file.type.startsWith('image/')) {
                failedCount++;
                details.push(`${file.name}: Netinkamas failo tipas`);
                continue;
            }

            const parsed = parseFilename(file);
            try {
                const infographic = await fileToInfographic(file, parsed.subject, parsed.code);
                infographic._filename = file.name; // Keep for display
                pendingImports.push(infographic);
            } catch (err) {
                failedCount++;
                details.push(`❌ ${file.name}: Klaida skaitant (${err.message})`);
            }
        }
        document.body.removeChild(overlay);

        if (pendingImports.length === 0) {
            alert(`Nėra tinkamų failų importavimui.\nNepavyko: ${failedCount}\n\nDetali ataskaita:\n${details.join('\n')}`);
            return;
        }

        // Render Review Modal
        const modal = document.getElementById('import-review-modal');
        const list = document.getElementById('import-review-list');
        list.innerHTML = '';

        pendingImports.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'import-review-row';
            row.innerHTML = `
                <img src="${item.thumbnail}" class="review-thumb">
                <div class="review-filename" title="${item._filename}">${item._filename}</div>
                <div class="review-inputs">
                    <input type="text" value="${item.code}" id="import-code-${index}">
                    <select id="import-subject-${index}">
                        <option value="Matematika" ${item.subject === 'Matematika' ? 'selected' : ''}>Matematika</option>
                        <option value="Gamtos mokslai" ${item.subject === 'Gamtos mokslai' ? 'selected' : ''}>Gamtos mokslai</option>
                        <option value="Istorija" ${item.subject === 'Istorija' ? 'selected' : ''}>Istorija</option>
                    </select>
                </div>
            `;
            list.appendChild(row);
        });

        modal.classList.remove('hidden');

        // Setup handlers for the modal
        const closeBtn = document.getElementById('close-import-review-btn');
        const cancelBtn = document.getElementById('cancel-import-btn');
        const saveBtn = document.getElementById('save-import-btn');

        const closeModal = () => {
            modal.classList.add('hidden');
            closeBtn.removeEventListener('click', closeModal);
            cancelBtn.removeEventListener('click', closeModal);
            saveBtn.removeEventListener('click', saveAll);
        };

        const saveAll = async () => {
            closeModal();
            let successCount = 0;
            
            // Show saving overlay
            document.body.appendChild(overlay);
            overlay.querySelector('h3').textContent = 'Išsaugoma į biblioteką...';
            
            for (let i = 0; i < pendingImports.length; i++) {
                document.getElementById('import-current-index').textContent = i + 1;
                const item = pendingImports[i];
                const code = document.getElementById(`import-code-${i}`).value.trim();
                const subject = document.getElementById(`import-subject-${i}`).value;
                
                // Update item with finalized data
                item.code = code || item.code;
                item.subject = subject;
                item.id = `${item.subject}_${item.code}`; // regenerate ID
                delete item._filename;
                
                try {
                    await saveInfographicToDB(item);
                    successCount++;
                    details.push(`✔️ ${code} (${subject}) išsaugotas.`);
                } catch (err) {
                    failedCount++;
                    details.push(`❌ Klaida saugant ${code}: ${err.message}`);
                }
            }
            
            document.body.removeChild(overlay);
            await renderLibraryTab();
            await renderTestSelectionTab();
            alert(`Importavimas baigtas!\n\nSėkmingai išsaugota: ${successCount}\nNepavyko (įskaitant ankstesnes klaidas): ${failedCount}`);
        };

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        saveBtn.addEventListener('click', saveAll);
    }
}

/* ==========================================================================
   LIBRARY TAB LOGIC
   ========================================================================== */
function clearLibraryUploadedImage() {
    state.libUploadedImageBase64 = '';
    state.libUploadedImageSrc = '';
    state.libImageThumbnail = '';
    elements.libFileInput.value = '';
    elements.libPreviewContainer.classList.add('hidden');
    elements.libImagePreview.src = '';
    updateLibrarySubmitButtonState();
}

function updateLibrarySubmitButtonState() {
    const code = elements.libCodeInput.value.trim();
    if (code && state.libUploadedImageBase64 && state.libImageThumbnail) {
        elements.libSubmitBtn.removeAttribute('disabled');
    } else {
        elements.libSubmitBtn.setAttribute('disabled', 'true');
    }
}

async function saveInfographicToLibrary() {
    const code = elements.libCodeInput.value.trim();
    if (!code || !state.libUploadedImageBase64) return;

    // Check if code contains characters or numbers only
    const cleanCode = code.replace(/[^a-zA-Z0-9.\-_ ]/g, '').trim();
    if (!cleanCode) {
        alert("Įveskite tinkamą kodą (gali būti skaičiai, raidės, taškai, brūkšneliai).");
        return;
    }

    const newInfographic = {
        id: `${state.libSelectedSubject}_${cleanCode}`,
        code: cleanCode,
        subject: state.libSelectedSubject,
        imageBase64: state.libUploadedImageBase64,
        imageSrc: state.libUploadedImageSrc,
        thumbnail: state.libImageThumbnail
    };

    try {
        await saveInfographicToDB(newInfographic);
        
        // Reset form
        elements.libCodeInput.value = '';
        clearLibraryUploadedImage();
        
        // Refresh grid
        await renderLibraryTab();
        alert(`Infografikas „${cleanCode}“ sėkmingai išsaugotas bibliotekoje!`);
    } catch (err) {
        console.error(err);
        alert(`Klaida saugant duomenis: ${err.message}`);
    }
}

async function renderLibraryTab() {
    // Clear all three grids
    Object.values(elements.libraryGrids).forEach(grid => {
        if (grid) grid.innerHTML = '';
    });
    
    try {
        const infographics = await getAllInfographicsFromDB();
        
        // Group infographics by subject
        const grouped = {
            'Matematika': [],
            'Gamtos mokslai': [],
            'Istorija': []
        };
        
        infographics.forEach(item => {
            if (grouped[item.subject]) {
                grouped[item.subject].push(item);
            }
        });
        
        // Render each group into its respective grid
        Object.keys(grouped).forEach(subject => {
            const grid = elements.libraryGrids[subject];
            if (!grid) return;
            
            const items = grouped[subject];
            
            if (items.length === 0) {
                grid.innerHTML = `
                    <div class="library-empty-msg">Nėra išsaugotų infografikų.</div>
                `;
                return;
            }
            
            items.forEach(item => {
                const card = document.createElement('div');
                card.className = 'library-card animate-fade-in';
                
                card.innerHTML = `
                    <div class="lib-card-img-wrapper">
                        <img src="${item.thumbnail}" alt="Thumbnail" class="lib-card-img">
                    </div>
                    <div class="lib-card-info">
                        <span class="lib-card-code">${escapeHTML(item.code)}</span>
                        <span class="lib-card-subject">${escapeHTML(item.subject)}</span>
                    </div>
                    <div class="lib-card-actions">
                        <button type="button" class="lib-delete-btn" title="Ištrinti infografiką" data-id="${item.id}" data-code="${item.code}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                `;
                
                // Delete button handler
                card.querySelector('.lib-delete-btn').addEventListener('click', async (e) => {
                    const idToDelete = e.currentTarget.dataset.id;
                    const codeToDelete = e.currentTarget.dataset.code;
                    if (confirm(`Ar tikrai norite ištrinti infografiką „${codeToDelete}“ iš bibliotekos?`)) {
                        await deleteInfographicFromDB(idToDelete);
                        if (state.activeInfographic?.id === idToDelete) {
                            clearSelectedInfographicPreview();
                        }
                        await renderLibraryTab();
                        await renderTestSelectionTab();
                    }
                });

                grid.appendChild(card);
            });
        });

    } catch (err) {
        console.error(err);
        Object.values(elements.libraryGrids).forEach(grid => {
            if (grid) grid.innerHTML = `<div class="library-empty-msg">Klaida įkeliant biblioteką: ${err.message}</div>`;
        });
    }
}

/* ==========================================================================
   TEST SELECTION TAB LOGIC
   ========================================================================== */
async function renderTestSelectionTab() {
    elements.testThemeGrid.innerHTML = '';
    
    // Highlight the active subject button
    elements.testSubjectBtns.forEach(btn => {
        if (btn.dataset.subject === state.testSelectedSubject) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    try {
        const infographics = await getAllInfographicsFromDB();
        
        // Filter by currently selected subject
        const items = infographics.filter(item => item.subject === state.testSelectedSubject);
        
        if (items.length === 0) {
            elements.testThemeGrid.innerHTML = `
                <div class="select-grid-empty">
                    Šiame dalyke nėra išsaugotų infografikų. Pridėkite juos bibliotekoje!
                </div>
            `;
            elements.generateBtn.setAttribute('disabled', 'true');
            clearSelectedInfographicPreview();
            return;
        }

        items.forEach(item => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'infographic-select-btn';
            if (state.activeInfographic?.id === item.id) {
                btn.classList.add('active');
            }
            btn.dataset.id = item.id;
            btn.dataset.code = item.code;
            
            btn.innerHTML = `
                <span class="select-btn-code">${escapeHTML(item.code)}</span>
                <span class="select-btn-subject">${escapeHTML(item.subject)}</span>
            `;
            
            btn.addEventListener('click', async (e) => {
                document.querySelectorAll('.infographic-select-btn').forEach(b => b.classList.remove('active'));
                const targetBtn = e.currentTarget;
                targetBtn.classList.add('active');
                
                await selectInfographicForTest(targetBtn.dataset.id);
            });

            elements.testThemeGrid.appendChild(btn);
        });

        // Re-evaluate current selection just in case
        if (state.activeInfographic?.id) {
            const selectedExists = items.some(i => i.id === state.activeInfographic?.id);
            if (selectedExists) {
                await selectInfographicForTest(state.activeInfographic?.id);
            } else {
                clearSelectedInfographicPreview();
            }
        } else {
            clearSelectedInfographicPreview();
        }

    } catch (err) {
        console.error(err);
        elements.testThemeGrid.innerHTML = `<div class="select-grid-empty">Klaida kraunant sąrašą: ${err.message}</div>`;
    }
}

async function selectInfographicForTest(id) {
    
    try {
        const infographic = await getInfographicFromDB(id);
        if (infographic) {
            state.activeInfographic = infographic;
            
            // Render preview
            elements.selectedPreviewImage.src = infographic.imageSrc;
            elements.selectedPreviewSubject.textContent = infographic.subject;
            
            elements.previewPlaceholderPrompt.classList.add('hidden');
            elements.selectedPreviewContainer.classList.remove('hidden');
            
            updateGenerateButtonState();
        }
    } catch (err) {
        console.error(err);
        alert(`Nepavyko užkrauti infografiko informacijos: ${err.message}`);
    }
}

function clearSelectedInfographicPreview() {
    state.activeInfographic = null;
    elements.previewPlaceholderPrompt.classList.remove('hidden');
    elements.selectedPreviewContainer.classList.add('hidden');
    elements.selectedPreviewImage.src = '';
    updateGenerateButtonState();
}

function updateGenerateButtonState() {
    if (state.apiKey && state.activeInfographic?.id && state.activeInfographic) {
        elements.generateBtn.removeAttribute('disabled');
    } else {
        elements.generateBtn.setAttribute('disabled', 'true');
    }
}

/* ==========================================================================
   GEMINI API INTEGRATION & LOADING (UNIVERSAL 1–12 KL. & MULTIMODAL)
   ========================================================================== */
async function generateQuiz() {
    if (!state.apiKey || !state.activeInfographic) return;

    // Switch to loading screen
    switchScreen('loading');
    animateProgressBar();

    const infoObj = state.activeInfographic;
    const gradeNumber = parseInt(state.selectedGrade, 10) || 5;

    let pedagogicalGuidance = '';
    if (gradeNumber <= 4) {
        pedagogicalGuidance = `TIKSLINĖ AUDITORIJA: 1-4 klasės mokiniai (pradinis ugdymas).
- Vartok labai aiškią, paprastą, trumpą kalbą ir kasdienius žodžius.
- Užduotys turi būti orientuotos į vizualų stebėjimą, tiesioginį elementų atpažinimą, paprastą skaičiavimą (kiek objektų?), spalvas, formas ar gyvūnų/augalų bruožus.
- Venk sunkių teorinių ar akademinių formuluočių.`;
    } else if (gradeNumber <= 8) {
        pedagogicalGuidance = `TIKSLINĖ AUDITORIJA: 5-8 klasės mokiniai (pagrindinis ugdymas I dalis).
- Klausimai turi atitikti Lietuvos 5-8 klasių bendrojo ugdymo programą.
- Tikrink temų supratimą, dėsningumus, priežasties-pasekmės ryšius, chronologiją, schemų dalių atpažinimą ir procesų eigą.`;
    } else if (gradeNumber <= 10) {
        pedagogicalGuidance = `TIKSLINĖ AUDITORIJA: 9-10 klasės mokiniai (PUPP lygis).
- Užduotys turi reikalauti analitinio mąstymo, fizikinių/cheminių dėsnių, formulių supratimo, diagramų, lentelių ir žemėlapių interpretavimo bei istorinių kontekstų analizės.`;
    } else {
        pedagogicalGuidance = `TIKSLINĖ AUDITORIJA: 11-12 klasės gimnazistai (VBE lygis - pasirengimas Valstybiniams brandos egzaminams).
- Užduotys turi būti aukšto akademinio lygio, reikalaujančios gilaus mąstymo, hipotezių kėlimo, kritinio duomenų vertinimo ir daugiasluoksnės analizės.`;
    }

    const promptText = `Tu esi profesionalus Lietuvos pedagogas ir egzaminų testų kūrėjas. Tavo užduotis yra atidžiai išanalizuoti pateiktą infografiką (nuotrauką) ir pagal jį sugeneruoti lygiai 20 įvairiapusių testo užduočių lietuvių kalba pasirinkta tema: ${infoObj.subject}, skirtų ${gradeNumber} klasei.

${pedagogicalGuidance}

KLAUSIMŲ TIPŲ MIŠINYS (privaloma sugeneruoti įvairių tipų užduočių rinkinį, pvz.: ~12 multiple_choice, ~3 hotspot, ~3 ordering, ~2 image_snippet):

1. "multiple_choice": Standartinis klausimas su lygiai 4 pasirinkimo variantais ('options') ir teisingo atsakymo indeksu ('correctAnswerIndex' nuo 0 iki 3). Klausimas tikrina temos supratimą ir faktų žinojimą.
2. "hotspot": GRAFINIS KLAUSIMAS! Mokinys turi spustelėti ant konkrečios infografiko vietos (pvz.: "Raskite infografike...", "Pažymėkite, kur pavaizduota..."). Privaloma nurodyti 'hotspotArea': { "ymin": 0-1000, "xmin": 0-1000, "ymax": 0-1000, "xmax": 0-1000, "label": "paaiškinimas" } (koordinatės normalizuotos 0-1000 intervale pagal paveikslėlio aukštį ir plotį).
3. "ordering": RIKIAVIMO KLAUSIMAS! Mokinys turi sudėlioti 4 elementus teisinga seka (chronologinė tvarka, proceso etapai, reikšmių didėjimas). Pateik 'items' (4 tekstiniai elementai) ir 'correctOrder' (teisingi indeksai, pvz., [0, 1, 2, 3] arba [3, 1, 0, 2]).
4. "image_snippet": GRAFINIS KLAUSIMAS! Nurodyk 'snippetArea': { "ymin": 0-1000, "xmin": 0-1000, "ymax": 0-1000, "xmax": 0-1000 } (0-1000 intervale), kuri žymi konkrečią infografiko dalį (schemą, formulę, grafiką). Programa šią dalį automatiškai iškirps ir parodys mokiniui. Užduok klausimą apie šį iškirptą fragmentą su 4 pasirinkimo variantais ('options' ir 'correctAnswerIndex').

Kiekviena užduotis privalo turėti aiškų ir motyvuojantį lietuvišką paaiškinimą ('explanation').
Pateik atsakymą TIK JSON formatu pagal nurodytą schemą.`;

    const apiBody = {
        contents: [
            {
                parts: [
                    { text: promptText },
                    {
                        inlineData: {
                            mimeType: "image/png",
                            data: infoObj.imageBase64
                        }
                    }
                ]
            }
        ],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "ARRAY",
                description: "Masyvas su sugeneruotomis 20 testo užduočių",
                items: {
                    type: "OBJECT",
                    properties: {
                        type: {
                            type: "STRING",
                            description: "Užduoties tipas: 'multiple_choice', 'hotspot', 'ordering' arba 'image_snippet'"
                        },
                        question: {
                            type: "STRING",
                            description: "Užduoties sąlyga lietuvių kalba"
                        },
                        options: {
                            type: "ARRAY",
                            items: { type: "STRING" },
                            description: "4 pasirinkimo variantai (multiple_choice ir image_snippet)"
                        },
                        correctAnswerIndex: {
                            type: "INTEGER",
                            description: "Teisingo varianto indeksas 0-3 (multiple_choice ir image_snippet)"
                        },
                        hotspotArea: {
                            type: "OBJECT",
                            properties: {
                                ymin: { type: "INTEGER" },
                                xmin: { type: "INTEGER" },
                                ymax: { type: "INTEGER" },
                                xmax: { type: "INTEGER" },
                                label: { type: "STRING" }
                            },
                            description: "Normalizuotos teisingos zonos koordinatės (0-1000)"
                        },
                        snippetArea: {
                            type: "OBJECT",
                            properties: {
                                ymin: { type: "INTEGER" },
                                xmin: { type: "INTEGER" },
                                ymax: { type: "INTEGER" },
                                xmax: { type: "INTEGER" }
                            },
                            description: "Normalizuotos iškerpamo fragmento koordinatės (0-1000)"
                        },
                        items: {
                            type: "ARRAY",
                            items: { type: "STRING" },
                            description: "4 rikiuojami elementai (ordering tipo užduočiai)"
                        },
                        correctOrder: {
                            type: "ARRAY",
                            items: { type: "INTEGER" },
                            description: "Teisinga elementų tvarka (ordering tipo užduočiai)"
                        },
                        explanation: {
                            type: "STRING",
                            description: "Išsamus paaiškinimas lietuvių kalba"
                        }
                    },
                    required: ["type", "question", "explanation"]
                }
            }
        }
    };

    try {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': state.apiKey
            },
            body: JSON.stringify(apiBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errMsg = errorData.error?.message || `Klaida: ${response.status}`;
            throw new Error(errMsg);
        }

        const data = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!responseText) {
            throw new Error("Nepavyko gauti atsakymo iš Gemini AI.");
        }

        const questions = JSON.parse(responseText);
        if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error("Gemini AI nesugeneravo tinkamo klausimų masyvo.");
        }

        // Validate and normalize all questions
        state.questions = questions.map(q => {
            const validTypes = ['multiple_choice', 'hotspot', 'ordering', 'image_snippet'];
            const type = validTypes.includes(q.type) ? q.type : 'multiple_choice';

            let opts = Array.isArray(q.options) ? [...q.options] : [];
            while (opts.length < 4) opts.push("Nepateikta");
            if (opts.length > 4) opts.length = 4;

            let items = Array.isArray(q.items) && q.items.length >= 2 ? [...q.items] : ["1 etapas", "2 etapas", "3 etapas", "4 etapas"];
            let correctOrder = Array.isArray(q.correctOrder) && q.correctOrder.length === items.length
                ? q.correctOrder
                : items.map((_, i) => i);

            return {
                type: type,
                question: q.question || "Užduotis",
                options: opts,
                correctAnswerIndex: (typeof q.correctAnswerIndex === 'number' && q.correctAnswerIndex >= 0 && q.correctAnswerIndex < 4) ? q.correctAnswerIndex : 0,
                hotspotArea: q.hotspotArea || null,
                snippetArea: q.snippetArea || null,
                items: items,
                correctOrder: correctOrder,
                explanation: q.explanation || "Paaiškinimas nepateiktas."
            };
        });

        startQuiz();

    } catch (err) {
        console.error(err);
        alert(`Klaida generuojant testą: ${err.message}\n\nĮsitikinkite, kad API raktas teisingas ir interneto ryšys veikia.`);
        switchScreen('config');
    }
}

// Adjusted progress animation during loading screen for 20 questions (~20s max)
let progressInterval;
function animateProgressBar() {
    let progress = 0;
    elements.loadingProgressBar.style.width = '0%';
    elements.loadingStatusText.textContent = `Analizuojamas infografikas ir ruošiamos ${state.selectedGrade} klasės užduotys...`;

    const startTime = Date.now();
    clearInterval(progressInterval);

    progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        
        if (elapsed > 4000 && elapsed < 9000) {
            elements.loadingStatusText.textContent = "Kuriami grafiniai klausimai ir infografiko fragmentai...";
        } else if (elapsed >= 9000 && elapsed < 14000) {
            elements.loadingStatusText.textContent = "Tikrinami atsakymų variantai ir paaiškinimai...";
        } else if (elapsed >= 14000) {
            elements.loadingStatusText.textContent = "Baigiamas testo formavimas...";
        }

        if (progress < 96) {
            progress = Math.min(96, (elapsed / 20000) * 100);
            elements.loadingProgressBar.style.width = `${progress}%`;
        }
    }, 200);
}

/* ==========================================================================
   QUIZ ENGINE & FLOW (MULTIMODAL SUPPORT)
   ========================================================================== */
let hotspotClickHandler = null;
let currentOrderingState = [];

function startQuiz() {
    clearInterval(progressInterval);
    state.currentQuestionIndex = 0;
    state.userAnswers = new Array(state.questions.length).fill(null);
    
    elements.quizSubjectBadge.textContent = `${state.activeInfographic.code} — ${state.activeInfographic.subject} (${state.selectedGrade} kl.)`;
    elements.totalQuestionsNum.textContent = state.questions.length;
    
    switchScreen('quiz');
    renderQuestion(0);
}

function renderQuestion(index) {
    state.currentQuestionIndex = index;
    const q = state.questions[index];

    // Update progress elements
    elements.currentQuestionNum.textContent = index + 1;
    const progressPercent = (index / state.questions.length) * 100;
    elements.quizProgressFill.style.width = `${progressPercent}%`;

    // Reset components & hide specialized containers
    elements.questionText.textContent = q.question;
    elements.optionsContainer.innerHTML = '';
    elements.optionsContainer.classList.add('hidden');
    if (elements.snippetContainer) elements.snippetContainer.classList.add('hidden');
    if (elements.hotspotContainer) elements.hotspotContainer.classList.add('hidden');
    if (elements.orderingContainer) elements.orderingContainer.classList.add('hidden');
    elements.explanationPanel.classList.add('hidden');
    elements.nextQuestionBtn.setAttribute('disabled', 'true');

    // Clean up previous event listeners
    if (hotspotClickHandler && elements.hotspotWrapper) {
        elements.hotspotWrapper.removeEventListener('click', hotspotClickHandler);
        hotspotClickHandler = null;
    }

    // Configure question type badge and dispatch renderer
    if (elements.questionTypeBadge) {
        elements.questionTypeBadge.className = 'question-type-badge';
        if (q.type === 'hotspot') {
            elements.questionTypeBadge.classList.add('badge-hotspot');
            elements.questionTypeBadge.textContent = '🎯 Interaktyvus žymėjimas';
            renderHotspotQuestion(q);
        } else if (q.type === 'ordering') {
            elements.questionTypeBadge.classList.add('badge-ordering');
            elements.questionTypeBadge.textContent = '🔢 Sekos rikiavimas';
            renderOrderingQuestion(q);
        } else if (q.type === 'image_snippet') {
            elements.questionTypeBadge.classList.add('badge-snippet');
            elements.questionTypeBadge.textContent = '🔍 Fragmento analizė';
            renderSnippetQuestion(q);
        } else {
            elements.questionTypeBadge.textContent = 'Pasirinkimo klausimas';
            renderMultipleChoiceQuestion(q);
        }
    } else {
        renderMultipleChoiceQuestion(q);
    }

    const card = document.querySelector('.question-card');
    if (card) {
        card.classList.remove('animate-fade-in');
        void card.offsetWidth;
        card.classList.add('animate-fade-in');
    }
}

/* 1. Multiple Choice Renderer */
function renderMultipleChoiceQuestion(q) {
    elements.optionsContainer.classList.remove('hidden');
    const letters = ['A', 'B', 'C', 'D'];

    q.options.forEach((optText, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'option-btn';
        btn.innerHTML = `
            <span class="option-badge">${letters[i]}</span>
            <span class="option-content">${escapeHTML(optText)}</span>
        `;
        btn.addEventListener('click', () => handleMultipleChoiceSelection(i));
        elements.optionsContainer.appendChild(btn);
    });
}

function handleMultipleChoiceSelection(selectedIndex) {
    const q = state.questions[state.currentQuestionIndex];
    const isCorrect = selectedIndex === q.correctAnswerIndex;
    
    state.userAnswers[state.currentQuestionIndex] = {
        isCorrect: isCorrect,
        selectedIndex: selectedIndex,
        userText: q.options[selectedIndex] || '',
        correctText: q.options[q.correctAnswerIndex] || ''
    };

    const buttons = elements.optionsContainer.querySelectorAll('.option-btn');
    buttons.forEach((btn, i) => {
        btn.setAttribute('disabled', 'true');
        if (i === q.correctAnswerIndex) {
            btn.classList.add('correct');
        } else if (i === selectedIndex) {
            btn.classList.add('incorrect');
        }
    });

    revealExplanation(q.explanation);
}

/* 2. Snippet Question Renderer */
function renderSnippetQuestion(q) {
    if (elements.snippetContainer) {
        elements.snippetContainer.classList.remove('hidden');
        cropAndDisplaySnippet(q.snippetArea);
    }
    renderMultipleChoiceQuestion(q);
}

function cropAndDisplaySnippet(area) {
    if (!elements.snippetImage) return;
    if (!area || !state.activeInfographic?.imageSrc) {
        elements.snippetImage.src = state.activeInfographic.imageSrc;
        return;
    }

    const img = new Image();
    img.onload = () => {
        const natW = img.naturalWidth || 800;
        const natH = img.naturalHeight || 600;

        const ymin = Math.max(0, Math.min(1000, area.ymin ?? 0)) / 1000 * natH;
        const xmin = Math.max(0, Math.min(1000, area.xmin ?? 0)) / 1000 * natW;
        const ymax = Math.max(0, Math.min(1000, area.ymax ?? 1000)) / 1000 * natH;
        const xmax = Math.max(0, Math.min(1000, area.xmax ?? 1000)) / 1000 * natW;

        const width = Math.max(20, xmax - xmin);
        const height = Math.max(20, ymax - ymin);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, xmin, ymin, width, height, 0, 0, width, height);

        elements.snippetImage.src = canvas.toDataURL('image/jpeg', 0.9);
    };
    img.src = state.activeInfographic.imageSrc;
}

/* 3. Hotspot Question Renderer */
function renderHotspotQuestion(q) {
    if (!elements.hotspotContainer) return;
    elements.hotspotContainer.classList.remove('hidden');
    elements.hotspotPin.classList.add('hidden');
    elements.hotspotTargetBox.classList.add('hidden');
    elements.hotspotTargetBox.classList.remove('wrong');
    elements.hotspotImage.src = state.activeInfographic.imageSrc;

    hotspotClickHandler = (e) => {
        handleHotspotClick(e, q);
    };
    elements.hotspotWrapper.addEventListener('click', hotspotClickHandler);
}

function handleHotspotClick(e, q) {
    const rect = elements.hotspotImage.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    if (clickX < 0 || clickY < 0 || clickX > rect.width || clickY > rect.height) {
        return;
    }

    // Normalized coordinates 0-1000
    const normX = (clickX / rect.width) * 1000;
    const normY = (clickY / rect.height) * 1000;

    // Pin position relative to wrapper
    const wrapperRect = elements.hotspotWrapper.getBoundingClientRect();
    const pinX = e.clientX - wrapperRect.left;
    const pinY = e.clientY - wrapperRect.top;

    elements.hotspotPin.style.left = `${pinX}px`;
    elements.hotspotPin.style.top = `${pinY}px`;
    elements.hotspotPin.classList.remove('hidden');

    const area = q.hotspotArea || { ymin: 400, xmin: 400, ymax: 600, xmax: 600, label: "Teisinga vieta" };
    // Tolerance buffer: ±60 in 1000 scale (~6% margin)
    const tolerance = 60;
    const isCorrect = normY >= (area.ymin - tolerance) && normY <= (area.ymax + tolerance) &&
                      normX >= (area.xmin - tolerance) && normX <= (area.xmax + tolerance);

    // Position target box over correct area
    const boxLeft = (area.xmin / 1000) * rect.width + (rect.left - wrapperRect.left);
    const boxTop = (area.ymin / 1000) * rect.height + (rect.top - wrapperRect.top);
    const boxWidth = ((area.xmax - area.xmin) / 1000) * rect.width;
    const boxHeight = ((area.ymax - area.ymin) / 1000) * rect.height;

    elements.hotspotTargetBox.style.left = `${boxLeft}px`;
    elements.hotspotTargetBox.style.top = `${boxTop}px`;
    elements.hotspotTargetBox.style.width = `${Math.max(28, boxWidth)}px`;
    elements.hotspotTargetBox.style.height = `${Math.max(28, boxHeight)}px`;
    elements.hotspotTargetBox.classList.remove('hidden');

    if (!isCorrect) {
        elements.hotspotTargetBox.classList.add('wrong');
    }

    state.userAnswers[state.currentQuestionIndex] = {
        isCorrect: isCorrect,
        userText: isCorrect ? '✔️ Tiksliai pažymėta vieta infografike' : '❌ Pažymėta ne ta vieta',
        correctText: area.label || 'Nurodyta teisinga vieta infografike'
    };

    if (hotspotClickHandler && elements.hotspotWrapper) {
        elements.hotspotWrapper.removeEventListener('click', hotspotClickHandler);
        hotspotClickHandler = null;
    }

    revealExplanation(q.explanation);
}

/* 4. Ordering Question Renderer */
function renderOrderingQuestion(q) {
    if (!elements.orderingContainer) return;
    elements.orderingContainer.classList.remove('hidden');
    elements.confirmOrderBtn.removeAttribute('disabled');
    elements.confirmOrderBtn.textContent = 'Patvirtinti atsakymą';

    currentOrderingState = q.items.map((text, idx) => ({ text, originalIndex: idx }));
    // Shuffle items slightly
    if (currentOrderingState.length > 2) {
        currentOrderingState.sort(() => Math.random() - 0.5);
    }

    renderOrderingItems(q, false);

    elements.confirmOrderBtn.onclick = () => {
        handleConfirmOrder(q);
    };
}

function renderOrderingItems(q, isLocked) {
    elements.orderingList.innerHTML = '';
    currentOrderingState.forEach((item, i) => {
        const div = document.createElement('div');
        div.className = 'ordering-item';
        div.innerHTML = `
            <span class="ordering-handle">${i + 1}</span>
            <span class="ordering-text">${escapeHTML(item.text)}</span>
            <div class="ordering-actions-btn-group">
                <button type="button" class="btn-order-move btn-move-up" title="Kelti aukštyn" ${i === 0 || isLocked ? 'disabled' : ''}>▲</button>
                <button type="button" class="btn-order-move btn-move-down" title="Leisti žemyn" ${i === currentOrderingState.length - 1 || isLocked ? 'disabled' : ''}>▼</button>
            </div>
        `;

        if (!isLocked) {
            div.querySelector('.btn-move-up').addEventListener('click', () => {
                if (i > 0) {
                    const temp = currentOrderingState[i];
                    currentOrderingState[i] = currentOrderingState[i - 1];
                    currentOrderingState[i - 1] = temp;
                    renderOrderingItems(q, false);
                }
            });
            div.querySelector('.btn-move-down').addEventListener('click', () => {
                if (i < currentOrderingState.length - 1) {
                    const temp = currentOrderingState[i];
                    currentOrderingState[i] = currentOrderingState[i + 1];
                    currentOrderingState[i + 1] = temp;
                    renderOrderingItems(q, false);
                }
            });
        }
        elements.orderingList.appendChild(div);
    });
}

function handleConfirmOrder(q) {
    elements.confirmOrderBtn.setAttribute('disabled', 'true');
    const userOrderIndices = currentOrderingState.map(item => item.originalIndex);
    const correctOrder = Array.isArray(q.correctOrder) && q.correctOrder.length === currentOrderingState.length
        ? q.correctOrder
        : currentOrderingState.map((_, i) => i);

    let matchesCount = 0;
    for (let i = 0; i < correctOrder.length; i++) {
        if (userOrderIndices[i] === correctOrder[i]) matchesCount++;
    }
    const isCorrect = matchesCount === correctOrder.length;

    state.userAnswers[state.currentQuestionIndex] = {
        isCorrect: isCorrect,
        userText: currentOrderingState.map((it, i) => `${i + 1}. ${it.text}`).join(' → '),
        correctText: correctOrder.map((origIdx, i) => `${i + 1}. ${q.items[origIdx] || ''}`).join(' → ')
    };

    // Re-render locked with colors
    const itemsDom = elements.orderingList.querySelectorAll('.ordering-item');
    itemsDom.forEach((dom, i) => {
        if (userOrderIndices[i] === correctOrder[i]) {
            dom.classList.add('correct-state');
        } else {
            dom.classList.add('wrong-state');
        }
        dom.querySelectorAll('.btn-order-move').forEach(b => b.setAttribute('disabled', 'true'));
    });

    revealExplanation(q.explanation);
}

/* Common Feedback & Next Step */
function revealExplanation(text) {
    elements.explanationBody.textContent = text;
    elements.explanationPanel.classList.remove('hidden');
    elements.nextQuestionBtn.removeAttribute('disabled');
    
    if (state.currentQuestionIndex === state.questions.length - 1) {
        elements.nextQuestionBtn.querySelector('span').textContent = 'Rezultatai';
    } else {
        elements.nextQuestionBtn.querySelector('span').textContent = 'Toliau';
    }
}

function handleNextQuestion() {
    const nextIndex = state.currentQuestionIndex + 1;
    if (nextIndex < state.questions.length) {
        renderQuestion(nextIndex);
    } else {
        showResults();
    }
}

/* ==========================================================================
   RESULTS & SUITE
   ========================================================================== */
function showResults() {
    let score = 0;
    state.questions.forEach((q, i) => {
        const ans = state.userAnswers[i];
        const isCorrect = (typeof ans === 'object' && ans !== null) 
            ? !!ans.isCorrect 
            : (ans === q.correctAnswerIndex);
        if (isCorrect) score++;
    });

    const total = state.questions.length;
    const percent = Math.round((score / total) * 100);

    elements.scorePercent.textContent = `${percent}%`;
    elements.scoreFraction.textContent = `${score} / ${total}`;
    elements.resultSubjectVal.textContent = `${state.activeInfographic.code} (${state.activeInfographic.subject}, ${state.selectedGrade} kl.)`;
    elements.resultGradeVal.textContent = `${score} iš ${total} teisingų`;

    let title = '';
    let subtitle = '';
    let icon = '';

    if (percent === 100) {
        title = "Tobulas rezultatas! 🏆";
        subtitle = "Atsakėte į visus klausimus teisingai. Puikiai įvaldėte šią temą!";
        icon = "🏆";
    } else if (percent >= 85) {
        title = "Puikus rezultatas! 🌟";
        subtitle = "Surinkote puikų balą! Jūsų analizės ir temos supratimo įgūdžiai yra stulbinantys.";
        icon = "🌟";
    } else if (percent >= 60) {
        title = "Geras rezultatas! 👍";
        subtitle = "Didžioji dalis atsakymų teisingi. Išanalizuokite klaidas atsakymų suvestinėje.";
        icon = "👍";
    } else {
        title = "Reikia pasistengti! 📚";
        subtitle = "Atsakėte į mažiau nei pusę klausimų. Rekomenduojame dar kartą atidžiai perskaityti infografiką.";
        icon = "📚";
    }

    elements.resultTitle.textContent = title;
    elements.resultSubtitle.textContent = subtitle;
    elements.resultBadgeIcon.textContent = icon;

    const strokeDashoffset = 251.2 - (251.2 * percent) / 100;
    elements.resultRadialFill.style.strokeDashoffset = strokeDashoffset;

    elements.reviewSection.classList.add('hidden');
    elements.toggleReviewBtn.textContent = 'Peržiūrėti klausimus ir atsakymus';

    renderReviewList();

    saveSessionToHistory(score, total, percent);
    switchScreen('result');
}

function renderReviewList() {
    elements.reviewList.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];

    state.questions.forEach((q, i) => {
        const userAns = state.userAnswers[i];
        const isCorrect = (typeof userAns === 'object' && userAns !== null)
            ? !!userAns.isCorrect
            : (userAns === q.correctAnswerIndex);
        
        const reviewItem = document.createElement('div');
        reviewItem.className = 'review-item';

        let typeLabel = 'Pasirinkimo klausimas';
        if (q.type === 'hotspot') typeLabel = '🎯 Interaktyvus žymėjimas';
        else if (q.type === 'ordering') typeLabel = '🔢 Sekos rikiavimas';
        else if (q.type === 'image_snippet') typeLabel = '🔍 Fragmento analizė';
        
        let detailsHtml = '';

        if (q.type === 'hotspot' || q.type === 'ordering') {
            const userText = userAns?.userText || 'Neatsakyta';
            const correctText = userAns?.correctText || q.hotspotArea?.label || 'Nurodyta teisinga tvarka';

            detailsHtml = `
                <div class="review-opt-badge ${isCorrect ? 'correct' : 'selected-wrong'}" style="margin-bottom: 0.5rem;">
                    <span><strong>Jūsų atsakymas:</strong> ${escapeHTML(userText)}</span>
                </div>
                ${!isCorrect ? `
                <div class="review-opt-badge correct">
                    <span><strong>Teisingas sprendimas:</strong> ${escapeHTML(correctText)}</span>
                </div>` : ''}
            `;
        } else {
            // Multiple choice or image snippet
            const userSelectedIdx = (typeof userAns === 'object' && userAns !== null) ? userAns.selectedIndex : userAns;
            q.options.forEach((opt, optIdx) => {
                let statusClass = '';
                let iconMark = '';
                
                if (optIdx === q.correctAnswerIndex) {
                    statusClass = 'correct';
                    iconMark = '✔️ Teisingas';
                } else if (optIdx === userSelectedIdx && !isCorrect) {
                    statusClass = 'selected-wrong';
                    iconMark = '❌ Jūsų atsakymas';
                }

                detailsHtml += `
                    <div class="review-opt-badge ${statusClass}">
                        <span><strong>${letters[optIdx]}:</strong> ${escapeHTML(opt)}</span>
                        <span style="font-size: 0.8rem; font-weight: 600;">${iconMark}</span>
                    </div>
                `;
            });
        }

        reviewItem.innerHTML = `
            <div class="review-q-header">
                <span class="review-q-num">#${i + 1}</span>
                <span class="review-q-badge" style="font-size: 0.75rem; padding: 0.15rem 0.5rem; border-radius: 9999px; background: rgba(255,255,255,0.06); color: var(--text-secondary); margin-right: auto; margin-left: 0.5rem;">${typeLabel}</span>
                <span class="review-status-badge ${isCorrect ? 'correct' : 'wrong'}">
                    ${isCorrect ? 'Teisingai (+1)' : 'Neteisingai (0)'}
                </span>
            </div>
            <h4 class="review-q-text">${escapeHTML(q.question)}</h4>
            <div class="review-options">
                ${detailsHtml}
            </div>
            <div class="review-explanation">
                <strong>Paaiškinimas:</strong> ${escapeHTML(q.explanation)}
            </div>
        `;

        elements.reviewList.appendChild(reviewItem);
    });
}

function showResults() {
    let score = 0;
    state.questions.forEach((q, i) => {
        if (state.userAnswers[i] === q.correctAnswerIndex) {
            score++;
        }
    });

    const total = state.questions.length;
    const percent = Math.round((score / total) * 100);

    elements.scorePercent.textContent = `${percent}%`;
    elements.scoreFraction.textContent = `${score} / ${total}`;
    elements.resultSubjectVal.textContent = `${state.activeInfographic.code} (${state.activeInfographic.subject})`;
    elements.resultGradeVal.textContent = `${score} iš ${total} teisingų`;

    let title = '';
    let subtitle = '';
    let icon = '';

    if (percent === 100) {
        title = "Tobulas rezultatas! 🏆";
        subtitle = "Atsakėte į visus 20 klausimų teisingai. Jūs esate šios temos ekspertas!";
        icon = "🏆";
    } else if (percent >= 85) {
        title = "Puikus rezultatas! 🌟";
        subtitle = "Surinkote puikų balą! Jūsų analizės ir temos supratimo įgūdžiai yra stulbinantys.";
        icon = "🌟";
    } else if (percent >= 60) {
        title = "Geras rezultatas! 👍";
        subtitle = "Didžioji dalis atsakymų teisingi. Išanalizuokite klaidas atsakymų suvestinėje.";
        icon = "👍";
    } else {
        title = "Reikia pasistengti! 📚";
        subtitle = "Atsakėte į mažiau nei pusę klausimų. Rekomenduojame dar kartą atidžiai perskaityti infografiką.";
        icon = "📚";
    }

    elements.resultTitle.textContent = title;
    elements.resultSubtitle.textContent = subtitle;
    elements.resultBadgeIcon.textContent = icon;

    const strokeDashoffset = 251.2 - (251.2 * percent) / 100;
    elements.resultRadialFill.style.strokeDashoffset = strokeDashoffset;

    elements.reviewSection.classList.add('hidden');
    elements.toggleReviewBtn.textContent = 'Peržiūrėti klausimus ir atsakymus';

    renderReviewList();

    // Save history with Selected Infographic thumbnail
    saveSessionToHistory(score, total, percent);

    switchScreen('result');
}

function renderReviewList() {
    elements.reviewList.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];

    state.questions.forEach((q, i) => {
        const userAns = state.userAnswers[i];
        const isCorrect = userAns === q.correctAnswerIndex;
        
        const reviewItem = document.createElement('div');
        reviewItem.className = 'review-item';
        
        let optionsHtml = '';
        q.options.forEach((opt, optIdx) => {
            let statusClass = '';
            let iconMark = '';
            
            if (optIdx === q.correctAnswerIndex) {
                statusClass = 'correct';
                iconMark = '✔️ Teisingas';
            } else if (optIdx === userAns && !isCorrect) {
                statusClass = 'selected-wrong';
                iconMark = '❌ Jūsų atsakymas';
            }

            optionsHtml += `
                <div class="review-opt-badge ${statusClass}">
                    <span><strong>${letters[optIdx]}:</strong> ${escapeHTML(opt)}</span>
                    <span style="font-size: 0.8rem; font-weight: 600;">${iconMark}</span>
                </div>
            `;
        });

        reviewItem.innerHTML = `
            <div class="review-q-header">
                <span class="review-q-num">${i + 1}.</span>
                <span class="review-q-text">${escapeHTML(q.question)}</span>
            </div>
            <div class="review-options">
                ${optionsHtml}
            </div>
            <div class="explanation-panel">
                <div class="explanation-header">
                    <span>💡</span>
                    <strong>Paaiškinimas:</strong>
                </div>
                <p class="explanation-body">${escapeHTML(q.explanation)}</p>
            </div>
        `;
        
        elements.reviewList.appendChild(reviewItem);
    });
}

function saveSessionToHistory(score, total, percent) {
    const newHistoryItem = {
        id: Date.now(),
        subject: `${state.activeInfographic.code} (${state.activeInfographic.subject})`,
        date: formatDate(new Date()),
        score: score,
        total: total,
        percent: percent,
        thumbnail: state.activeInfographic.thumbnail // Retrieve infographic thumb
    };

    state.history.unshift(newHistoryItem);
    
    if (state.history.length > 15) {
        state.history.pop();
    }
    
    localStorage.setItem('infoquiz_history', JSON.stringify(state.history));
    renderHistory();
}

function renderHistory() {
    elements.historyGrid.innerHTML = '';
    
    if (state.history.length === 0) {
        elements.historyGrid.innerHTML = `
            <div class="history-empty text-center">
                <p>Dar neatlikote jokių testų. Sukurkite savo pirmąjį testą aukščiau!</p>
            </div>
        `;
        return;
    }

    state.history.forEach(item => {
        const historyCard = document.createElement('div');
        historyCard.className = 'card glass-card history-card animate-fade-in';
        
        const thumbSrc = item.thumbnail || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="%236366f1" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>`;
        
        historyCard.innerHTML = `
            <img src="${thumbSrc}" alt="Miniatiūra" class="history-img-thumb">
            <div class="history-info">
                <div class="history-subj-date">
                    <span class="history-subj">${item.subject}</span>
                    <span class="history-date">${item.date}</span>
                </div>
                <div class="history-score-bar">
                    <div class="history-track">
                        <div class="history-fill" style="width: ${item.percent}%"></div>
                    </div>
                    <span class="history-score-val">${item.score}/${item.total}</span>
                </div>
            </div>
        `;
        
        elements.historyGrid.appendChild(historyCard);
    });
}

/* ==========================================================================
   NAVIGATION & ACTIONS
   ========================================================================== */
function switchScreen(screenName) {
    ['config', 'loading', 'quiz', 'result'].forEach(n =>
        elements[`${n}Screen`].classList.toggle('hidden', n !== screenName));
}


function goToHome() {
    switchScreen('config');
    refreshTabsData();
}

/* ==========================================================================
   ZOOM MODAL MANAGEMENT
   ========================================================================== */
function openZoomModal() {
    if (state.activeInfographic) {
        elements.zoomedImage.src = state.activeInfographic.imageSrc;
        elements.zoomModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function closeZoomModal() {
    elements.zoomModal.classList.add('hidden');
    document.body.style.overflow = '';
}

/* ==========================================================================
   HELPERS
   ========================================================================== */
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

const formatDate = d => d.toLocaleString('lt-LT', { dateStyle: 'short', timeStyle: 'short' });

// Load App
document.addEventListener('DOMContentLoaded', init);
