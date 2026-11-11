
// ==========================================
// 1. STATE MANAGEMENT
// ==========================================

let currentView = 'form';

const STORAGE_KEY_LIST = 'zzso_analysis_records_v1';
const STORAGE_KEY_DRAFT = 'zzso_analysis_draft_v1';
const STORAGE_KEY_SYNC = 'zzso_analysis_sync_queue_v1';

const SUPABASE_URL = 'https://fbnhlhzpwvogzyjiphm.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_iahfPQ8Ps5inAPYRaBZZsg_X7i7az98';

const supabaseClient = window.supabase
    ? window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    )
    : null;

let isSyncing = false;


// ==========================================
// 2. FORM FIELDS
// ==========================================

const formFields = [
    'schoolName', 'schoolType', 'foundingYear', 'address',
    'studentCount', 'classCount', 'studyForm', 'specialization',
    'phone', 'email', 'website',

    'roomCount', 'hasShelter', 'interactiveBoards',
    'computersCount', 'multimedia', 'hasEJournal',
    'hasWifi', 'internetAccess',

    'sportsHalls', 'hasStadium', 'hasPool', 'bookCount',
    'hasELibrary', 'eResourceAccess', 'otherResources',

    'educationProgram', 'authorPrograms', 'schoolProblem',
    'normativeDocs', 'teachingMethods', 'ictIntegration',
    'giftedStudentsWork', 'assessmentMethods', 'clubsAndSections',

    'directorName', 'directorEducation', 'directorExperience',
    'deputyDirectors', 'methodicalUnits', 'managementSystem',
    'schoolCouncil',

    'upbringingApproach', 'civicActivities',
    'studentInitiatives', 'safetyMeasures', 'academicIntegrity',

    'schoolPsychologist', 'socialPedagogue',
    'studentSupportSystem', 'hasInclusiveClasses',
    'inclusiveAssistants', 'homeEducation', 'pedagogicalPatronage',

    'surveysConducted', 'communityInteraction',
    'developmentProspects', 'finalConclusions'
];


// ==========================================
// 3. INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    loadDraft();

    updateRecordCountBadge();
    setupAutoDraftSave();
    setupSectionNavigation();

    setActiveSection('sec1');
    updateFormProgress();
    updateSyncStatus();

    // Спроба синхронізації після запуску
    syncWithSupabase();
});


// ==========================================
// 4. LOCAL STORAGE
// ==========================================

function getStoredRecords() {
    try {
        return JSON.parse(
            localStorage.getItem(STORAGE_KEY_LIST) || '[]'
        );
    } catch (error) {
        console.error('Помилка читання локальних записів:', error);
        return [];
    }
}

function saveStoredRecords(records) {
    localStorage.setItem(
        STORAGE_KEY_LIST,
        JSON.stringify(records)
    );
}

function getSyncQueue() {
    try {
        return JSON.parse(
            localStorage.getItem(STORAGE_KEY_SYNC) || '[]'
        );
    } catch (error) {
        console.error('Помилка читання черги:', error);
        return [];
    }
}

function saveSyncQueue(queue) {
    localStorage.setItem(
        STORAGE_KEY_SYNC,
        JSON.stringify(queue)
    );
}


// ==========================================
// 5. SYNC QUEUE
// ==========================================

function addToSyncQueue(operation) {
    let queue = getSyncQueue();

    // Залишаємо лише останню операцію для конкретного ID
    queue = queue.filter(item => item.id !== operation.id);

    queue.push(operation);

    saveSyncQueue(queue);
}

function removeFromSyncQueue(operation) {
    const queue = getSyncQueue().filter(item =>
        !(
            item.id === operation.id &&
            item.type === operation.type
        )
    );

    saveSyncQueue(queue);
}


// ==========================================
// 6. SUPABASE SYNCHRONIZATION
// ==========================================

async function syncWithSupabase() {
    if (!supabaseClient || !navigator.onLine || isSyncing) {
        updateSyncStatus();
        return;
    }

    isSyncing = true;
    updateSyncStatus();

    try {
        let queue = getSyncQueue();

        while (queue.length > 0) {
            const operation = queue[0];

            let result;

            // Створення або оновлення
            if (operation.type === 'upsert') {
                const records = getStoredRecords();

                const record = records.find(
                    item => item.id === operation.id
                );

                if (!record) {
                    removeFromSyncQueue(operation);
                    queue = getSyncQueue();
                    continue;
                }

                result = await supabaseClient
                    .from('surveys')
                    .upsert({
                        id: record.id,
                        answers: record,
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'id'
                    });
            }

            // Видалення
            else if (operation.type === 'delete') {
                result = await supabaseClient
                    .from('surveys')
                    .delete()
                    .eq('id', operation.id);
            }

            else {
                console.error('Невідома операція:', operation.type);
                break;
            }

            // Якщо сталася помилка, залишаємо операцію в черзі
            if (result.error) {
                console.error(
                    'Помилка Supabase:',
                    result.error.message
                );

                break;
            }

            removeFromSyncQueue(operation);
            queue = getSyncQueue();
        }

    } catch (error) {
        console.error('Помилка синхронізації:', error);

    } finally {
        isSyncing = false;
        updateSyncStatus();
    }
}


// ==========================================
// 7. SYNC STATUS
// ==========================================

function updateSyncStatus() {
    const element = document.getElementById('sync-status');

    if (!element) return;

    const queue = getSyncQueue();

    if (!navigator.onLine) {
        element.textContent = 'Немає інтернету';
        element.className = 'text-amber-600';
    } else if (!supabaseClient) {
        element.textContent = 'Supabase недоступний';
        element.className = 'text-red-600';
    } else if (isSyncing) {
        element.textContent = 'Синхронізація...';
        element.className = 'text-indigo-600';
    } else if (queue.length > 0) {
        element.textContent =
            `Очікує синхронізації: ${queue.length}`;
        element.className = 'text-amber-600';
    } else {
        element.textContent = 'Усі записи синхронізовано';
        element.className = 'text-green-600';
    }
}

window.addEventListener('online', () => {
    syncWithSupabase();
});

window.addEventListener('offline', () => {
    updateSyncStatus();
});

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        syncWithSupabase();
    }
});


// ==========================================
// 8. VIEW SWITCHER
// ==========================================

function switchView(view) {
    currentView = view;

    const formContainer = document.getElementById('form-view-container');
    const tableContainer = document.getElementById('table-view-container');
    const sectionNav = document.getElementById('section-nav');
    const btnForm = document.getElementById('btn-form-view');
    const btnTable = document.getElementById('btn-table-view');

    if (view === 'form') {
        formContainer.classList.remove('hidden');
        tableContainer.classList.add('hidden');
        sectionNav.classList.remove('hidden');

        btnForm.className =
            "px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-medium transition flex items-center gap-2 bg-white text-indigo-900 shadow";

        btnTable.className =
            "px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-medium transition flex items-center gap-2 text-indigo-100 hover:text-white";

    } else {
        formContainer.classList.add('hidden');
        tableContainer.classList.remove('hidden');
        sectionNav.classList.add('hidden');

        btnTable.className =
            "px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-medium transition flex items-center gap-2 bg-white text-indigo-900 shadow";

        btnForm.className =
            "px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-medium transition flex items-center gap-2 text-indigo-100 hover:text-white";

        renderTable();
    }
}


// ==========================================
// 9. SECTION NAVIGATION
// ==========================================

function setActiveSection(id) {
    document.querySelectorAll('#section-nav button[data-section]')
        .forEach(button => {
            const active = button.dataset.section === id;

            button.classList.toggle('text-indigo-600', active);
            button.classList.toggle('bg-indigo-50', active);
            button.classList.toggle('border', active);
            button.classList.toggle('border-indigo-200', active);

            button.classList.toggle('text-slate-600', !active);
            button.classList.toggle('hover:bg-slate-100', !active);
        });
}

function scrollToSection(id) {
    const section = document.getElementById(id);

    if (!section) return;

    setActiveSection(id);

    const offset = window.innerWidth <= 767 ? 125 : 140;

    const position =
        section.getBoundingClientRect().top +
        window.scrollY - offset;

    window.scrollTo({
        top: position,
        behavior: 'smooth'
    });
}

function setupSectionNavigation() {
    const sections = Array.from(
        document.querySelectorAll('#school-analysis-form section[id]')
    );

    if (!sections.length) return;

    function updateActiveSection() {
        let current = sections[0];

        const offset = window.innerWidth <= 767 ? 140 : 155;

        sections.forEach(section => {
            if (section.getBoundingClientRect().top <= offset) {
                current = section;
            }
        });

        if (
            window.innerHeight + window.scrollY >=
            document.documentElement.scrollHeight - 5
        ) {
            current = sections[sections.length - 1];
        }

        setActiveSection(current.id);
    }

    window.addEventListener('scroll', updateActiveSection, {
        passive: true
    });

    window.addEventListener('resize', updateActiveSection);

    updateActiveSection();
}


// ==========================================
// 10. FORM PROGRESS
// ==========================================

function setupAutoDraftSave() {
    formFields.forEach(id => {
        const el = document.getElementById(id);

        if (el) {
            el.addEventListener('input', saveDraft);
            el.addEventListener('change', saveDraft);
        }
    });

    updateFormProgress();
}

function updateFormProgress() {
    const fields = formFields
        .map(id => document.getElementById(id))
        .filter(el => el && el.type !== 'hidden');

    const total = fields.length;

    const completed = fields.filter(el => {
        return el.value.trim() !== '';
    }).length;

    const percentage = total
        ? Math.round((completed / total) * 100)
        : 0;

    const progressText = document.getElementById('form-progress-text');
    const progressBar = document.getElementById('form-progress-bar');
    const progressDetails = document.getElementById('form-progress-details');

    if (progressText) {
        progressText.textContent = `${percentage}%`;
    }

    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }

    if (progressDetails) {
        progressDetails.textContent =
            `Заповнено ${completed} із ${total} полів`;
    }

    document.querySelectorAll(
        '#school-analysis-form section[id]'
    ).forEach(section => {
        const sectionFields = Array.from(
            section.querySelectorAll('input, select, textarea')
        ).filter(el => el.type !== 'hidden');

        const sectionCompleted = sectionFields.filter(
            el => el.value.trim() !== ''
        ).length;

        const sectionTotal = sectionFields.length;

        const sectionProgress = sectionTotal
            ? Math.round((sectionCompleted / sectionTotal) * 100)
            : 0;

        const navButton = document.querySelector(
            `#section-nav button[data-section="${section.id}"]`
        );

        if (navButton) {
            navButton.dataset.progress = `${sectionProgress}%`;
        }
    });
}


// ==========================================
// 11. DRAFT SAVE / LOAD
// ==========================================

function saveDraft() {
    const formData = {};

    formFields.forEach(id => {
        const el = document.getElementById(id);

        if (el) {
            formData[id] = el.value;
        }
    });

    localStorage.setItem(
        STORAGE_KEY_DRAFT,
        JSON.stringify(formData)
    );

    updateFormProgress();
}

function loadDraft() {
    const draft = localStorage.getItem(STORAGE_KEY_DRAFT);

    if (draft) {
        try {
            const formData = JSON.parse(draft);

            formFields.forEach(id => {
                const el = document.getElementById(id);

                if (el && formData[id] !== undefined) {
                    el.value = formData[id];
                }
            });

        } catch (error) {
            console.error('Помилка завантаження чернетки:', error);
        }
    }

    updateFormProgress();
}


// ==========================================
// 12. SAVE RECORD
// ==========================================

async function saveCurrentRecord() {
    const schoolName = document
        .getElementById('schoolName')
        .value.trim();

    if (!schoolName) {
        showToast('Будь ласка, вкажіть назву закладу!');
        scrollToSection('sec1');
        document.getElementById('schoolName').focus();
        return;
    }

    const editingId = document.getElementById(
        'editing-record-id'
    ).value;

    const now = new Date();

    const formData = {
        id: editingId || crypto.randomUUID(),

        updatedAt:
            now.toLocaleDateString('uk-UA') + ' ' +
            now.toLocaleTimeString('uk-UA', {
                hour: '2-digit',
                minute: '2-digit'
            })
    };

    formFields.forEach(id => {
        const el = document.getElementById(id);

        if (el) {
            formData[id] = el.value;
        }
    });

    const records = getStoredRecords();

    const existingIdx = records.findIndex(
        record => record.id === formData.id
    );

    if (existingIdx >= 0) {
        records[existingIdx] = formData;
    } else {
        records.unshift(formData);
    }

    // Спочатку локальне збереження
    saveStoredRecords(records);

    // Додаємо до черги
    addToSyncQueue({
        id: formData.id,
        type: 'upsert'
    });

    // Очищення форми
    resetForm();

    updateRecordCountBadge();
    switchView('table');

    showToast(
        existingIdx >= 0
            ? 'Запис оновлено локально!'
            : 'Новий запис збережено локально!'
    );

    // Синхронізація з Supabase
    await syncWithSupabase();
}


// ==========================================
// 13. RECORD COUNT
// ==========================================

function updateRecordCountBadge() {
    const records = getStoredRecords();

    const badge = document.getElementById('record-count-badge');

    if (badge) {
        badge.textContent = records.length;
    }
}


// ==========================================
// 14. RENDER TABLE
// ==========================================

function renderTable() {
    const records = getStoredRecords();

    const searchElement = document.getElementById('table-search');

    const search = searchElement
        ? searchElement.value.toLowerCase()
        : '';

    const tbody = document.getElementById('analysis-table-body');
    const cardsContainer = document.getElementById('analysis-cards-mobile');
    const emptyState = document.getElementById('empty-state');

    if (!tbody || !cardsContainer || !emptyState) return;

    const filtered = records.filter(r =>
        (r.schoolName && r.schoolName.toLowerCase().includes(search)) ||
        (r.schoolType && r.schoolType.toLowerCase().includes(search)) ||
        (r.address && r.address.toLowerCase().includes(search))
    );

    if (filtered.length === 0) {
        tbody.innerHTML = '';
        cardsContainer.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    // Desktop table
    tbody.innerHTML = filtered.map(r => `
        <tr class="hover:bg-slate-50 border-b">
            <td class="p-3 text-xs text-slate-400 whitespace-nowrap">
                ${escapeHTML(r.updatedAt || '-')}
            </td>

            <td class="p-3 font-semibold text-slate-800">
                ${escapeHTML(r.schoolName || 'Без назви')}
            </td>

            <td class="p-3 text-xs">
                ${escapeHTML(r.schoolType || '-')}
            </td>

            <td class="p-3 text-xs">
                ${escapeHTML(r.studentCount || '-')}
            </td>

            <td class="p-3 text-xs">
                ${escapeHTML(r.classCount || '-')}
            </td>

            <td class="p-3 text-xs">
                ${escapeHTML(r.studyForm || '-')}
            </td>

            <td class="p-3 text-right space-x-1 whitespace-nowrap">
                <button onclick="viewRecord('${escapeHTML(r.id)}')"
                    class="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"
                    title="Переглянути">
                    <i class="fa-solid fa-eye"></i>
                </button>

                <button onclick="editRecord('${escapeHTML(r.id)}')"
                    class="p-1.5 text-amber-600 hover:bg-amber-50 rounded"
                    title="Редагувати">
                    <i class="fa-solid fa-pen"></i>
                </button>

                <button onclick="deleteRecord('${escapeHTML(r.id)}')"
                    class="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    title="Видалити">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');

    // Mobile cards
    cardsContainer.innerHTML = filtered.map(r => `
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">

            <div class="flex justify-between items-start gap-2">
                <h4 class="font-bold text-slate-800 text-sm">
                    ${escapeHTML(r.schoolName || 'Без назви')}
                </h4>

                <span class="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                    ${escapeHTML(r.updatedAt || '')}
                </span>
            </div>

            <p class="text-xs text-slate-500">
                ${escapeHTML(r.schoolType || 'Тип не вказано')}
                •
                ${escapeHTML(r.address || 'Адреса не вказана')}
            </p>

            <div class="flex gap-4 text-xs text-slate-600 pt-1 border-t border-slate-100">
                <span>Учнів: <b>${escapeHTML(r.studentCount || '0')}</b></span>
                <span>Класів: <b>${escapeHTML(r.classCount || '0')}</b></span>
                <span>Форма: <b>${escapeHTML(r.studyForm || '-')}</b></span>
            </div>

            <div class="flex justify-end gap-2 pt-2">
                <button onclick="viewRecord('${escapeHTML(r.id)}')"
                    class="px-2.5 py-1 text-xs bg-indigo-50 text-indigo-700 font-medium rounded">
                    <i class="fa-solid fa-eye"></i> Перегляд
                </button>

                <button onclick="editRecord('${escapeHTML(r.id)}')"
                    class="px-2.5 py-1 text-xs bg-amber-50 text-amber-700 font-medium rounded">
                    <i class="fa-solid fa-pen"></i> Редагувати
                </button>

                <button onclick="deleteRecord('${escapeHTML(r.id)}')"
                    class="px-2.5 py-1 text-xs bg-red-50 text-red-700 rounded">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}


// ==========================================
// 15. HTML ESCAPING
// ==========================================

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    })[char]);
}


// ==========================================
// 16. RESET FORM
// ==========================================

function resetForm() {
    const form = document.getElementById('school-analysis-form');

    if (form) {
        form.reset();
    }

    const editingId = document.getElementById('editing-record-id');

    if (editingId) {
        editingId.value = '';
    }

    localStorage.removeItem(STORAGE_KEY_DRAFT);

    updateFormProgress();

    showToast('Форму очищено');
}


// ==========================================
// 17. EDIT RECORD
// ==========================================

function editRecord(id) {
    const records = getStoredRecords();

    const record = records.find(r => r.id === id);

    if (!record) return;

    document.getElementById('editing-record-id').value = record.id;

    formFields.forEach(field => {
        const el = document.getElementById(field);

        if (el) {
            el.value = record[field] || '';
        }
    });

    updateFormProgress();

    switchView('form');

    showToast('Запис завантажено для редагування');
}


// ==========================================
// 18. VIEW RECORD
// ==========================================

function viewRecord(id) {
    const records = getStoredRecords();

    const record = records.find(r => r.id === id);

    if (!record) return;

    document.getElementById('modal-title').textContent =
        record.schoolName || 'Перегляд аналізу';

    let html = '<div class="space-y-4">';

    formFields.forEach(field => {
        if (record[field]) {
            html += `
                <div class="border-b border-slate-100 pb-1">
                    <span class="font-semibold text-slate-500 text-xs block">
                        ${escapeHTML(field)}
                    </span>

                    <span class="text-slate-800 text-xs sm:text-sm">
                        ${escapeHTML(record[field])}
                    </span>
                </div>
            `;
        }
    });

    html += '</div>';

    document.getElementById('modal-content').innerHTML = html;

    document.getElementById('view-modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('view-modal').classList.add('hidden');
}


// ==========================================
// 19. DELETE RECORD
// ==========================================

async function deleteRecord(id) {
    if (!confirm('Ви дійсно бажаєте видалити цей запис?')) {
        return;
    }

    let records = getStoredRecords();

    records = records.filter(record => record.id !== id);

    // Видалення локально
    saveStoredRecords(records);

    // Додавання операції в чергу
    addToSyncQueue({
        id: id,
        type: 'delete'
    });

    renderTable();
    updateRecordCountBadge();

    showToast('Запис видалено локально');

    // Видалення з Supabase
    await syncWithSupabase();
}


// ==========================================
// 20. EXPORT CSV
// ==========================================

function exportToCSV() {
    const records = getStoredRecords();

    if (records.length === 0) {
        showToast('Немає даних для експорту');
        return;
    }

    let csvContent = '\uFEFF';

    const headers = formFields.join(',');

    csvContent += headers + '\r\n';

    records.forEach(r => {
        const row = formFields.map(f => {
            let val = r[f] || '';

            val = val.toString().replace(/"/g, '""');

            return `"${val}"`;
        }).join(',');

        csvContent += row + '\r\n';
    });

    const blob = new Blob(
        [csvContent],
        { type: 'text/csv;charset=utf-8;' }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');

    link.href = url;
    link.download =
        `База_ЗЗСО_${new Date().toISOString().slice(0, 10)}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}


// ==========================================
// 21. EXPORT JSON
// ==========================================

function exportAllJSON() {
    const records = getStoredRecords();

    const dataStr =
        'data:text/json;charset=utf-8,' +
        encodeURIComponent(JSON.stringify(records, null, 2));

    const link = document.createElement('a');

    link.href = dataStr;
    link.download =
        `backup_zzso_${new Date().toISOString().slice(0, 10)}.json`;

    document.body.appendChild(link);

    link.click();

    link.remove();
}


// ==========================================
// 22. IMPORT JSON
// ==========================================

function importJSON(event) {
    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = async function(e) {
        try {
            const imported = JSON.parse(e.target.result);

            if (!Array.isArray(imported)) {
                showToast('Помилка: некоректний формат файлу');
                return;
            }

            const validRecords = imported.filter(record =>
                record &&
                typeof record === 'object' &&
                record.id
            );

            // Імпорт локально
            saveStoredRecords(validRecords);

            // Синхронізація імпортованих записів
            validRecords.forEach(record => {
                addToSyncQueue({
                    id: record.id,
                    type: 'upsert'
                });
            });

            renderTable();
            updateRecordCountBadge();

            showToast('Дані імпортовано локально!');

            await syncWithSupabase();

        } catch (error) {
            console.error('Помилка імпорту:', error);
            showToast('Помилка зчитування JSON');

        } finally {
            event.target.value = '';
        }
    };

    reader.readAsText(file);
}


// ==========================================
// 23. TOAST NOTIFICATIONS
// ==========================================

function showToast(msg) {
    const toast = document.getElementById('toast');
    const message = document.getElementById('toast-message');

    if (!toast || !message) return;

    message.textContent = msg;

    toast.classList.remove(
        'translate-y-[-100px]',
        'opacity-0'
    );

    setTimeout(() => {
        toast.classList.add(
            'translate-y-[-100px]',
            'opacity-0'
        );
    }, 3000);
}


// Реєстрація
async function registerUser(email, password) {
    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password
    });

    if (error) {
        throw error;
    }

    return data;
}

// Вхід
async function loginUser(email, password) {
    const { data, error } = await supabaseClient.auth
        .signInWithPassword({
            email,
            password
        });

    if (error) {
        throw error;
    }

    return data;
}

// Вихід
async function logoutUser() {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        throw error;
    }
}

// Отримання поточного користувача
async function getCurrentUser() {
    const { data, error } = await supabaseClient.auth.getUser();

    if (error) {
        throw error;
    }

    return data.user;
}

async function downloadRecordsFromSupabase() {
    const user = await getCurrentUser();

    if (!user) {
        throw new Error('Потрібно авторизуватися.');
    }

    const { data, error } = await supabaseClient
        .from('surveys')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Помилка завантаження:', error);
        throw error;
    }

    return data.map(row => row.answers);
}