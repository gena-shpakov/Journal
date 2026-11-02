// State Management
let currentView = 'form';
const STORAGE_KEY_LIST = 'zzso_analysis_records_v1';
const STORAGE_KEY_DRAFT = 'zzso_analysis_draft_v1';

// Form Fields Mapping
const formFields = [
  'schoolName', 'schoolType', 'foundingYear', 'address', 'studentCount', 'classCount', 'studyForm', 'specialization', 'text','email','phone',
  'roomCount', 'hasShelter', 'interactiveBoards', 'computersCount', 'multimedia', 'hasEJournal', 'hasWifi', 'internetAccess',
  'sportsHalls', 'hasStadium', 'hasPool', 'bookCount', 'hasELibrary', 'eResourceAccess', 'otherResources',
  'educationProgram', 'authorPrograms', 'schoolProblem', 'normativeDocs', 'teachingMethods', 'ictIntegration', 'giftedStudentsWork', 'assessmentMethods', 'clubsAndSections',
  'directorName', 'directorEducation', 'directorExperience', 'deputyDirectors', 'methodicalUnits', 'managementSystem', 'schoolCouncil',
  'upbringingApproach', 'civicActivities', 'studentInitiatives', 'safetyMeasures', 'academicIntegrity',
  'schoolPsychologist', 'socialPedagogue', 'studentSupportSystem', 'hasInclusiveClasses', 'inclusiveAssistants', 'homeEducation', 'pedagogicalPatronage',
  'surveysConducted', 'communityInteraction', 'developmentProspects', 'finalConclusions'
];

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  loadDraft();
  updateRecordCountBadge();
  setupAutoDraftSave();
  setupSectionNavigation();

  setActiveSection('sec1');
  updateFormProgress();
});

// View Switcher (Form / Table)
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
    
    btnForm.className = "px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-medium transition flex items-center gap-2 bg-white text-indigo-900 shadow";
    btnTable.className = "px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-medium transition flex items-center gap-2 text-indigo-100 hover:text-white";
  } else {
    formContainer.classList.add('hidden');
    tableContainer.classList.remove('hidden');
    sectionNav.classList.add('hidden');

    btnTable.className = "px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-medium transition flex items-center gap-2 bg-white text-indigo-900 shadow";
    btnForm.className = "px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-medium transition flex items-center gap-2 text-indigo-100 hover:text-white";
    
    renderTable();
  }
}

// Встановлення активної кнопки навігації
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

// Scroll to section
function scrollToSection(id) {
    const section = document.getElementById(id);
    if (!section) return;

    setActiveSection(id);

    const offset = window.innerWidth <= 767 ? 125 : 140;
    const position = section.getBoundingClientRect().top
        + window.scrollY - offset;

    window.scrollTo({
        top: position,
        behavior: 'smooth'
    });
}

// Автоматичне перемикання активної секції
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

        if (window.innerHeight + window.scrollY >=
            document.documentElement.scrollHeight - 5) {
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

// Auto Save Draft
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

    // Оновлення прогресу окремих розділів
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


function saveDraft() {
    const formData = {};

    formFields.forEach(id => {
        const el = document.getElementById(id);
        if (el) formData[id] = el.value;
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
        if (el && formData[id] !== undefined) el.value = formData[id];
      });
    } catch (e) {
      console.error("Error loading draft", e);
    }
  }
  updateFormProgress();
}

// Save Full Record to Table
function saveCurrentRecord() {
  const schoolName = document.getElementById('schoolName').value.trim();
  if (!schoolName) {
    showToast('Будь ласка, вкажіть назву закладу!');
    scrollToSection('sec1');
    document.getElementById('schoolName').focus();
    return;
  }

  const formData = {
    id: document.getElementById('editing-record-id').value || Date.now().toString(),
    updatedAt: new Date().toLocaleDateString('uk-UA') + ' ' + new Date().toLocaleTimeString('uk-UA', {hour: '2-digit', minute:'2-digit'})
  };

  formFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) formData[id] = el.value;
  });

  let records = getStoredRecords();
  const existingIdx = records.findIndex(r => r.id === formData.id);

  if (existingIdx >= 0) {
    records[existingIdx] = formData;
    showToast('Запис успішно оновлено!');
  } else {
    records.unshift(formData);
    showToast('Новий аналіз додано у базу!');
  }

  localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(records));
  resetForm();
  updateRecordCountBadge();
  switchView('table');
}

function getStoredRecords() {
  const data = localStorage.getItem(STORAGE_KEY_LIST);
  return data ? JSON.parse(data) : [];
}

function updateRecordCountBadge() {
  const records = getStoredRecords();
  document.getElementById('record-count-badge').textContent = records.length;
}

// Render Table Function
function renderTable() {
  const records = getStoredRecords();
  const search = document.getElementById('table-search').value.toLowerCase();
  const tbody = document.getElementById('analysis-table-body');
  const cardsContainer = document.getElementById('analysis-cards-mobile');
  const emptyState = document.getElementById('empty-state');

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

  // Render Desktop Rows
  tbody.innerHTML = filtered.map(r => `
    <tr class="hover:bg-slate-50 border-b">
      <td class="p-3 text-xs text-slate-400 whitespace-nowrap">${r.updatedAt || '-'}</td>
      <td class="p-3 font-semibold text-slate-800">${r.schoolName || 'Без назви'}</td>
      <td class="p-3 text-xs">${r.schoolType || '-'}</td>
      <td class="p-3 text-xs">${r.studentCount || '-'}</td>
      <td class="p-3 text-xs">${r.classCount || '-'}</td>
      <td class="p-3 text-xs">${r.studyForm || '-'}</td>
      <td class="p-3 text-right space-x-1 whitespace-nowrap">
        <button onclick="viewRecord('${r.id}')" class="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded" title="Переглянути">
          <i class="fa-solid fa-eye"></i>
        </button>
        <button onclick="editRecord('${r.id}')" class="p-1.5 text-amber-600 hover:bg-amber-50 rounded" title="Редагувати">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button onclick="deleteRecord('${r.id}')" class="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Видалити">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');

  // Render Mobile Cards
  cardsContainer.innerHTML = filtered.map(r => `
    <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
      <div class="flex justify-between items-start gap-2">
        <h4 class="font-bold text-slate-800 text-sm">${r.schoolName || 'Без назви'}</h4>
        <span class="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded">${r.updatedAt || ''}</span>
      </div>
      <p class="text-xs text-slate-500">${r.schoolType || 'Тип не вказано'} • ${r.address || 'Адреса не вказана'}</p>
      <div class="flex gap-4 text-xs text-slate-600 pt-1 border-t border-slate-100">
        <span>Учнів: <b>${r.studentCount || '0'}</b></span>
        <span>Класів: <b>${r.classCount || '0'}</b></span>
        <span>Форма: <b>${r.studyForm || '-'}</b></span>
      </div>
      <div class="flex justify-end gap-2 pt-2">
        <button onclick="viewRecord('${r.id}')" class="px-2.5 py-1 text-xs bg-indigo-50 text-indigo-700 font-medium rounded">
          <i class="fa-solid fa-eye"></i> Перегляд
        </button>
        <button onclick="editRecord('${r.id}')" class="px-2.5 py-1 text-xs bg-amber-50 text-amber-700 font-medium rounded">
          <i class="fa-solid fa-pen"></i> Редагувати
        </button>
        <button onclick="deleteRecord('${r.id}')" class="px-2.5 py-1 text-xs bg-red-50 text-red-700 font-medium rounded">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
}

// Reset form
function resetForm() {
  document.getElementById('school-analysis-form').reset();
  updateFormProgress();
  document.getElementById('editing-record-id').value = '';
  localStorage.removeItem(STORAGE_KEY_DRAFT);
  showToast('Форму очищено');
}

// Edit Record
function editRecord(id) {
  const records = getStoredRecords();
  const record = records.find(r => r.id === id);
  if (!record) return;

  document.getElementById('editing-record-id').value = record.id;
  formFields.forEach(field => {
    const el = document.getElementById(field);
    if (el) el.value = record[field] || '';
  });

  switchView('form');
  showToast('Запис завантажено для редагування');
}

// View Modal Record
function viewRecord(id) {
  const records = getStoredRecords();
  const record = records.find(r => r.id === id);
  if (!record) return;

  document.getElementById('modal-title').textContent = record.schoolName || 'Перегляд аналізу';
  
  let html = `<div class="space-y-4">`;
  formFields.forEach(field => {
    if (record[field]) {
      html += `
        <div class="border-b border-slate-100 pb-1">
          <span class="font-semibold text-slate-500 text-xs block">${field}</span>
          <span class="text-slate-800 text-xs sm:text-sm">${record[field]}</span>
        </div>
      `;
    }
  });
  html += `</div>`;

  document.getElementById('modal-content').innerHTML = html;
  document.getElementById('view-modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('view-modal').classList.add('hidden');
}

// Delete Record
function deleteRecord(id) {
  if (!confirm('Ви дійсно бажаєте видалити цей запис?')) return;
  let records = getStoredRecords();
  records = records.filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(records));
  renderTable();
  updateRecordCountBadge();
  showToast('Запис видалено');
}

// Export to Excel / CSV
function exportToCSV() {
  const records = getStoredRecords();
  if (records.length === 0) {
    showToast('Немає даних для експорту');
    return;
  }

  let csvContent = "\uFEFF"; // UTF-8 BOM
  const headers = formFields.join(",");
  csvContent += headers + "\r\n";

  records.forEach(r => {
    const row = formFields.map(f => {
      let val = r[f] || '';
      val = val.toString().replace(/"/g, '""');
      return `"${val}"`;
    }).join(",");
    csvContent += row + "\r\n";
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `База_ЗЗСО_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export Backup JSON
function exportAllJSON() {
  const records = getStoredRecords();
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(records, null, 2));
  const link = document.createElement('a');
  link.setAttribute("href", dataStr);
  link.setAttribute("download", `backup_zzso_${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

// Import JSON
function importJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(imported));
        renderTable();
        updateRecordCountBadge();
        showToast('Дані успішно імпортовано!');
      } else {
        showToast('Помилка: некоректний формат файлу');
      }
    } catch (err) {
      showToast('Помилка зчитування JSON');
    }
  };
  reader.readAsText(file);
}

// Toast notification helper
function showToast(msg) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-message').textContent = msg;
  toast.classList.remove('translate-y-[-100px]', 'opacity-0');
  setTimeout(() => {
    toast.classList.add('translate-y-[-100px]', 'opacity-0');
  }, 3000);
}

// 1. Підключаємося до Supabase
const SUPABASE_URL = 'https://fbnhlhzpwvogzyjiphm.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_iahfPQ8Ps5inAPYRaBZZsg_X7i7az98';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. Функція збору даних із вашої форми та надсилання в базу
async function handleFormSubmit(event) {
  event.preventDefault(); // Запобігаємо стандартному перезавантаженню сторінки

  // Збираємо дані з полів вашої форми (замініть id="...") на ваші реальні id полів у HTML
  const surveyData = {
    school_name: document.getElementById('schoolName')?.value || '',
    school_type: document.getElementById('schoolType')?.value || '',
    address: document.getElementById('address')?.value || '',
    students_count: document.getElementById('studentsCount')?.value || '',
    // ... сюди можна додати інші поля з вашого шаблону
  };

  // 3. Надсилаємо весь об'єкт у колонку "answers" (тип jsonb) таблиці "surveys"
  const { data, error } = await supabase
    .from('surveys') // назва вашої таблиці в Supabase
    .insert([
      { answers: surveyData }
    ]);

  if (error) {
    console.error('Помилка збереження:', error.message);
    alert('Сталася помилка при надсиланні. Спробуйте ще раз.');
  } else {
    console.log('Дані успішно збережено!', data);
    alert('Дякуємо! Вашу форму успішно надіслано.');
    
    // Опціонально: очистити форму після відправлення
    event.target.reset();
  }
}

// 4. Прив'язуємо цю функцію до вашої форми за її id (наприклад, id="schoolForm")
document.addEventListener('DOMContentLoaded', () => {
  const formElement = document.getElementById('school-analysis-fotm');
  if (formElement) {
    formElement.addEventListener('submit', handleFormSubmit);
  }
});