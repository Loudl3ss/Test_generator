/* ==========================================================================
   STATE MANAGEMENT
   ========================================================================== */
const state = {
    apiKey: localStorage.getItem('infoquiz_api_key') || '',
    
    // Test Select Tab state
    selectedInfographicCode: '',
    selectedInfographicId: '',
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

    // Quiz View
    quizSubjectBadge: document.getElementById('quiz-subject-badge'),
    currentQuestionNum: document.getElementById('current-question-num'),
    totalQuestionsNum: document.getElementById('total-questions-num'),
    quizProgressFill: document.getElementById('quiz-progress-fill'),
    questionText: document.getElementById('question-text'),
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
            if (db.objectStoreNames.contains(storeName)) {
                db.deleteObjectStore(storeName);
            }
            db.createObjectStore(storeName, { keyPath: "id" });
        };
        request.onsuccess = function(e) {
            resolve(e.target.result);
        };
        request.onerror = function(e) {
            reject(e.target.error);
        };
    });
}

async function saveInfographicToDB(infographic) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        store.put(infographic);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function getAllInfographicsFromDB() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getInfographicFromDB(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function deleteInfographicFromDB(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

/* ==========================================================================
   INITIALIZATION & SETTINGS
   ========================================================================== */
async function init() {
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

function setupEventListeners() {
    // Settings modal events
    elements.settingsBtn.addEventListener('click', () => openSettingsModal());
    elements.fixApiBtn.addEventListener('click', () => openSettingsModal());
    elements.closeModalBtn.addEventListener('click', () => closeSettingsModal());
    elements.cancelSettingsBtn.addEventListener('click', () => closeSettingsModal());
    elements.saveSettingsBtn.addEventListener('click', () => saveSettings());
    
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
    elements.generateBtn.addEventListener('click', () => generateQuiz());

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
    elements.nextQuestionBtn.addEventListener('click', () => handleNextQuestion());
    elements.selectedPreviewImage.addEventListener('click', () => openZoomModal());
    elements.closeZoomBtn.addEventListener('click', () => closeZoomModal());
    
    // Result screen buttons
    elements.restartBtn.addEventListener('click', () => restartQuiz());
    elements.goHomeBtn.addEventListener('click', () => goToHome());
    
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
        if (files.length === 1) {
            handleLibraryImageFile(files[0]);
        } else if (files.length > 1) {
            handleMultipleLibraryImageFiles(files);
        }
    });

    elements.libFileInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files.length === 1) {
            handleLibraryImageFile(files[0]);
        } else if (files.length > 1) {
            handleMultipleLibraryImageFiles(files);
        }
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
function parseFilename(filename) {
    // Remove extension
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename;
    
    // Parse subject
    let subject = state.libSelectedSubject; // Default to currently selected subject in form
    const lower = nameWithoutExt.toLowerCase();
    if (lower.includes('mat')) {
        subject = 'Matematika';
    } else if (lower.includes('gam') || lower.includes('mok') || lower.includes('nat')) {
        subject = 'Gamtos mokslai';
    } else if (lower.includes('ist') || lower.includes('his')) {
        subject = 'Istorija';
    }
    
    // Parse code (find pattern like 1.1, 1.2, 12.3, etc. or fallback to clean name)
    const codeMatch = nameWithoutExt.match(/(\d+[\.\-_]\d+)/);
    let code = '';
    if (codeMatch) {
        // Normalize code format to X.Y (e.g. replace - or _ with .)
        code = codeMatch[1].replace(/[-_]/g, '.');
    } else {
        // Fallback to name without spaces, limited length
        code = nameWithoutExt.trim().substring(0, 15);
    }
    
    return { code, subject };
}

async function handleMultipleLibraryImageFiles(files) {
    let successCount = 0;
    let failedCount = 0;
    const details = [];

    // Helper to process a single file as a promise
    const processFile = (file) => {
        return new Promise((resolve) => {
            if (!file.type.startsWith('image/')) {
                failedCount++;
                details.push(`${file.name}: Netinkamas failo tipas`);
                resolve();
                return;
            }

            const parsed = parseFilename(file.name);
            const reader = new FileReader();
            
            reader.onload = function (e) {
                const img = new Image();
                img.onload = async function() {
                    try {
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
                        
                        const newInfographic = {
                            id: `${parsed.subject}_${parsed.code}`,
                            code: parsed.code,
                            subject: parsed.subject,
                            imageSrc: e.target.result,
                            imageBase64: imageBase64,
                            thumbnail: thumbnail,
                            addedAt: new Date().toISOString()
                        };
                        
                        await saveInfographicToDB(newInfographic);
                        successCount++;
                        details.push(`✔️ ${file.name} -> Kodas: ${parsed.code} (${parsed.subject})`);
                        resolve();
                    } catch (err) {
                        failedCount++;
                        details.push(`❌ ${file.name}: Klaida saugant (${err.message})`);
                        resolve();
                    }
                };
                img.onerror = () => {
                    failedCount++;
                    details.push(`❌ ${file.name}: Nepavyko įkelti nuotraukos`);
                    resolve();
                };
                img.src = e.target.result;
            };
            
            reader.onerror = () => {
                failedCount++;
                details.push(`❌ ${file.name}: Klaida skaitant failą`);
                resolve();
            };
            
            reader.readAsDataURL(file);
        });
    };

    // Show loading indicator
    const overlay = document.createElement('div');
    overlay.className = 'import-loading-overlay';
    overlay.innerHTML = `
        <div class="import-loading-card">
            <div class="loading-spinner"></div>
            <h3>Importuojami infografikai...</h3>
            <p>Apdorojama: <span id="import-current-index">0</span> iš ${files.length}</p>
        </div>
    `;
    document.body.appendChild(overlay);

    for (let i = 0; i < files.length; i++) {
        document.getElementById('import-current-index').textContent = i + 1;
        await processFile(files[i]);
    }

    // Remove overlay
    document.body.removeChild(overlay);

    // Refresh library and test list
    await renderLibraryTab();
    await renderTestSelectionTab();

    // Show summary dialog
    alert(`Importavimas baigtas!\n\nSėkmingai importuota: ${successCount}\nNepavyko: ${failedCount}\n\nDetali ataskaita:\n${details.join('\n')}`);
}

function handleLibraryImageFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Įkelkite tik paveikslėlio bylą (PNG, JPG, JPEG, WEBP).');
        return;
    }

    // Autofill code and subject from filename
    const parsed = parseFilename(file.name);
    elements.libCodeInput.value = parsed.code;
    state.libSelectedSubject = parsed.subject;
    
    // Highlight parsed subject button
    elements.libSubjectBtns.forEach(btn => {
        if (btn.dataset.subject === parsed.subject) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    const reader = new FileReader();
    reader.onload = function (e) {
        state.libUploadedImageSrc = e.target.result;
        elements.libImagePreview.src = state.libUploadedImageSrc;
        elements.libPreviewContainer.classList.remove('hidden');
        
        // Extract raw base64 string for Gemini API
        state.libUploadedImageBase64 = e.target.result.split(',')[1];
        
        // Create 60x60 square thumbnail for database
        createLibraryThumbnail(state.libUploadedImageSrc);
    };
    reader.readAsDataURL(file);
}

function createLibraryThumbnail(src) {
    const img = new Image();
    img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 60;
        canvas.height = 60;
        
        // Square centered crop
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 60, 60);
        state.libImageThumbnail = canvas.toDataURL('image/jpeg', 0.8);
        updateLibrarySubmitButtonState();
    };
    img.src = src;
}

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
                        if (state.selectedInfographicId === idToDelete) {
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
            if (state.selectedInfographicId === item.id) {
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
        if (state.selectedInfographicId) {
            const selectedExists = items.some(i => i.id === state.selectedInfographicId);
            if (selectedExists) {
                await selectInfographicForTest(state.selectedInfographicId);
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
    state.selectedInfographicId = id;
    
    try {
        const infographic = await getInfographicFromDB(id);
        if (infographic) {
            state.activeInfographic = infographic;
            state.selectedInfographicCode = infographic.code;
            
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
    state.selectedInfographicId = '';
    state.selectedInfographicCode = '';
    state.activeInfographic = null;
    elements.previewPlaceholderPrompt.classList.remove('hidden');
    elements.selectedPreviewContainer.classList.add('hidden');
    elements.selectedPreviewImage.src = '';
    updateGenerateButtonState();
}

function updateGenerateButtonState() {
    if (state.apiKey && state.selectedInfographicId && state.activeInfographic) {
        elements.generateBtn.removeAttribute('disabled');
    } else {
        elements.generateBtn.setAttribute('disabled', 'true');
    }
}

/* ==========================================================================
   GEMINI API INTEGRATION & LOADING (20 QUESTIONS)
   ========================================================================== */
async function generateQuiz() {
    if (!state.apiKey || !state.activeInfographic) return;

    // Switch to loading screen
    switchScreen('loading');
    animateProgressBar();

    const infoObj = state.activeInfographic;

    // Fixed 20 questions prompt with Lietuviskas instructives
    const promptText = `Tu esi profesionalus mokytojas ir testų kūrėjas. Tavo užduotis yra atidžiai išanalizuoti pateiktą infografiką (nuotrauką) ir pagal jį sugeneruoti lygiai 20 testinių klausimų lietuvių kalba pasirinkta tema: ${infoObj.subject}.

Kiekvienas klausimas privalo:
1. Remtis informacija, skaičiais, faktais ar koncepcijomis, pavaizduotomis infografike. Kadangi vartotojas testo metu infografiko nematys (jis bus paslėptas, kad nebūtų galima tiesiogiai nurašyti atsakymų), klausimai turi tikrinti žinias, faktų prisiminimą ir temos supratimą, o ne tiesioginę vaizdinę analizę (pvz., neklauskite „Ką vaizduoja žalia rodyklė?“ ar „Kokia spalva pavaizduotas...?“). Klausimus bei paaiškinimus gali papildyti bendromis mokslo/istorijos žiniomis (pvz., iš Wikipedia ar vadovėlių apie tą pačią temą), kad įvertintum bendrą temos supratimą.
2. Turėti lygiai 4 atsakymo variantus (pasirinkimus).
3. Turėti tik 1 teisingą atsakymą.
4. Turėti aiškų ir trumpą lietuvišką paaiškinimą (explanation), kodėl būtent šis atsakymas yra teisingas, remiantis infografiko informacija bei bendromis temos žiniomis.
5. Klausimai NETURI tiesiogiai referuoti į patį infografiką (venkite frazių „kaip parodyta infografike...“, „pagal infografiką...“). Klausimas turi skambėti kaip tikras kontrolinio darbo klausimas apie pateiktus faktus (pvz., vietoj „Koks skaičius apie vandenį nurodytas infografike?“ klauskite „Kiek procentų Žemės vandens yra gėlas?“).

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
                description: "Masyvas su sugeneruotais 20 testo klausimų",
                items: {
                    type: "OBJECT",
                    properties: {
                        question: {
                            type: "STRING",
                            description: "Klausimo tekstas lietuvių kalba"
                        },
                        options: {
                            type: "ARRAY",
                            items: { type: "STRING" },
                            description: "Lygiai 4 pasirinkimo variantai"
                        },
                        correctAnswerIndex: {
                            type: "INTEGER",
                            description: "Teisingo atsakymo indeksas (nuo 0 iki 3)"
                        },
                        explanation: {
                            type: "STRING",
                            description: "Trumpas paaiškinimas lietuvių kalba, kodėl pasirinktas atsakymas yra teisingas"
                        }
                    },
                    required: ["question", "options", "correctAnswerIndex", "explanation"]
                }
            }
        }
    };

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${state.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
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

        // Parse questions JSON
        const questions = JSON.parse(responseText);
        if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error("Gemini AI nesugeneravo tinkamo klausimų masyvo.");
        }

        // Validate options length to make sure we don't have broken cards
        state.questions = questions.map(q => {
            let opts = q.options || [];
            while (opts.length < 4) opts.push("Nepateikta");
            if (opts.length > 4) opts.length = 4;
            
            return {
                question: q.question || "Nenurodytas klausimas",
                options: opts,
                correctAnswerIndex: (typeof q.correctAnswerIndex === 'number' && q.correctAnswerIndex >= 0 && q.correctAnswerIndex < 4) ? q.correctAnswerIndex : 0,
                explanation: q.explanation || "Paaiškinimas nepateiktas."
            };
        });

        startQuiz();

    } catch (err) {
        console.error(err);
        alert(`Klaida generuojant testą: ${err.message}\n\nPastaba: Generuojama net 20 klausimų, todėl įsitikinkite, kad API raktas veikia ir užklausai pakanka laiko.`);
        switchScreen('config');
    }
}

// Adjusted fake progress animation during loading screen for 20 questions (medium waiting, ~18s max)
let progressInterval;
function animateProgressBar() {
    let progress = 0;
    elements.loadingProgressBar.style.width = '0%';
    elements.loadingStatusText.textContent = "Jungiamasi su Gemini AI...";

    const statuses = [
        { time: 1000, text: "Nuskaitomas pasirinktas infografikas..." },
        { time: 3000, text: "Gemini AI analizuoja vizualinę informaciją..." },
        { time: 6000, text: "Kuriama 20 klausimų sistema lietuvių kalba..." },
        { time: 10000, text: "Generuojami atsakymų variantai kiekvienam klausimui..." },
        { time: 13000, text: "Ruošiami teisingų atsakymų paaiškinimai..." },
        { time: 16000, text: "Struktūrizuojami testo duomenys JSON formatu..." }
    ];

    clearInterval(progressInterval);
    
    const startTime = Date.now();
    progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        
        // Fill progress slowly up to 96% over 18s
        if (progress < 96) {
            progress = Math.min(96, (elapsed / 18000) * 100);
            elements.loadingProgressBar.style.width = `${progress}%`;
        }

        // Update status texts
        const activeStatus = statuses.filter(s => elapsed >= s.time).pop();
        if (activeStatus) {
            elements.loadingStatusText.textContent = activeStatus.text;
        }
    }, 100);
}

/* ==========================================================================
   QUIZ ENGINE & FLOW
   ========================================================================== */
function startQuiz() {
    clearInterval(progressInterval);
    state.currentQuestionIndex = 0;
    state.userAnswers = new Array(state.questions.length).fill(null);
    
    // Set UI elements
    elements.quizSubjectBadge.textContent = `${state.activeInfographic.code} — ${state.activeInfographic.subject}`;
    elements.totalQuestionsNum.textContent = state.questions.length;
    
    switchScreen('quiz');
    renderQuestion(0);
}

function renderQuestion(index) {
    state.currentQuestionIndex = index;
    const q = state.questions[index];

    // Update progress elements
    elements.currentQuestionNum.textContent = index + 1;
    const progressPercent = ((index) / state.questions.length) * 100;
    elements.quizProgressFill.style.width = `${progressPercent}%`;

    // Reset components
    elements.questionText.textContent = q.question;
    elements.optionsContainer.innerHTML = '';
    elements.explanationPanel.classList.add('hidden');
    elements.nextQuestionBtn.setAttribute('disabled', 'true');
    
    const letters = ['A', 'B', 'C', 'D'];

    q.options.forEach((optText, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'option-btn';
        
        btn.innerHTML = `
            <span class="option-badge">${letters[i]}</span>
            <span class="option-content">${escapeHTML(optText)}</span>
        `;
        
        btn.addEventListener('click', () => handleOptionSelection(i));
        elements.optionsContainer.appendChild(btn);
    });

    const card = document.querySelector('.question-card');
    card.classList.remove('animate-fade-in');
    void card.offsetWidth;
    card.classList.add('animate-fade-in');
}

function handleOptionSelection(selectedIndex) {
    const q = state.questions[state.currentQuestionIndex];
    state.userAnswers[state.currentQuestionIndex] = selectedIndex;

    const buttons = elements.optionsContainer.querySelectorAll('.option-btn');
    buttons.forEach((btn, i) => {
        btn.setAttribute('disabled', 'true');
        
        if (i === q.correctAnswerIndex) {
            btn.classList.add('correct');
        } else if (i === selectedIndex) {
            btn.classList.add('incorrect');
        }
    });

    elements.explanationBody.textContent = q.explanation;
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
    elements.configScreen.classList.add('hidden');
    elements.loadingScreen.classList.add('hidden');
    elements.quizScreen.classList.add('hidden');
    elements.resultScreen.classList.add('hidden');

    if (screenName === 'config') {
        elements.configScreen.classList.remove('hidden');
    } else if (screenName === 'loading') {
        elements.loadingScreen.classList.remove('hidden');
    } else if (screenName === 'quiz') {
        elements.quizScreen.classList.remove('hidden');
    } else if (screenName === 'result') {
        elements.resultScreen.classList.remove('hidden');
    }
}

function restartQuiz() {
    startQuiz();
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

function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hr = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d} ${hr}:${min}`;
}

// Load App
document.addEventListener('DOMContentLoaded', init);
