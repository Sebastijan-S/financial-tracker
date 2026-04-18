/**
 * Kafić Finansije - Financial Management App
 * Module-based architecture for maintainability and scalability
 */

// ===== STORAGE MODULE =====
const Storage = (() => {
  const TX_KEY = 'kafic_tx';
  const KATS_KEY = 'kafic_kats';
  const SCHEMA_VERSION = 1;

  const DEFAULT_KATS = {
    prihod: ['Prihod od prodaje', 'Ostali prihodi'],
    rashod: ['Kirija', 'Atlantic', 'Ramada', 'Knjigovođa', 'Komunalije', 'Sokoj', 'Smart PH', 'Payspot', 'Konty', 'Ostalo']
  };

  /**
   * Load transactions from localStorage
   * @returns {Array} List of transaction objects
   */
  const loadTransactions = () => {
    try {
      return JSON.parse(localStorage.getItem(TX_KEY) || '[]');
    } catch (e) {
      console.error('Error loading transactions:', e);
      return [];
    }
  };

  /**
   * Save transactions to localStorage
   * @param {Array} data - Transactions to save
   */
  const saveTransactions = (data) => {
    try {
      localStorage.setItem(TX_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Error saving transactions:', e);
      return false;
    }
  };

  /**
   * Load categories from localStorage
   * @returns {Object} Categories object { prihod: [], rashod: [] }
   */
  const loadCategories = () => {
    try {
      return JSON.parse(localStorage.getItem(KATS_KEY) || JSON.stringify(DEFAULT_KATS));
    } catch (e) {
      console.error('Error loading categories:', e);
      return DEFAULT_KATS;
    }
  };

  /**
   * Save categories to localStorage
   * @param {Object} data - Categories to save
   */
  const saveCategories = (data) => {
    try {
      localStorage.setItem(KATS_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Error saving categories:', e);
      return false;
    }
  };

  /**
   * Export transactions to JSON
   * @returns {string} JSON string of all data
   */
  const exportJSON = () => {
    const txn = loadTransactions();
    const cats = loadCategories();
    return JSON.stringify({ version: SCHEMA_VERSION, transactions: txn, categories: cats }, null, 2);
  };

  /**
   * Import transactions from JSON
   * @param {string} jsonData - JSON string to import
   * @param {boolean} merge - If true, merge with existing; if false, replace
   * @returns {Object} { success: boolean, message: string }
   */
  const importJSON = (jsonData, merge = false) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (!parsed.transactions || !Array.isArray(parsed.transactions)) {
        return { success: false, message: 'Invalid JSON format: missing transactions array' };
      }
      
      const txn = merge ? [...loadTransactions(), ...parsed.transactions] : parsed.transactions;
      const cats = parsed.categories || loadCategories();
      
      saveTransactions(txn);
      saveCategories(cats);
      return { success: true, message: `Imported ${parsed.transactions.length} transactions` };
    } catch (e) {
      return { success: false, message: `Import error: ${e.message}` };
    }
  };

  /**
   * Export transactions to CSV format
   * @returns {string} CSV string
   */
  const exportCSV = () => {
    const txn = loadTransactions();
    const headers = ['Datum', 'Vrsta', 'Kategorija', 'Opis', 'Iznos (RSD)'];
    const rows = txn.map(t => [
      t.datum,
      t.tip === 'prihod' ? 'Prihod' : 'Rashod',
      t.kat,
      t.opis,
      t.iznos
    ]);
    
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    return csv;
  };

  /**
   * Import from CSV format
   * @param {string} csvData - CSV string to import
   * @param {boolean} merge - If true, merge with existing; if false, replace
   * @returns {Object} { success: boolean, message: string }
   */
  const importCSV = (csvData, merge = false) => {
    try {
      const lines = csvData.trim().split('\n');
      if (lines.length < 2) {
        return { success: false, message: 'CSV too short (need at least header + 1 row)' };
      }

      const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
      const transactions = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.replace(/"/g, ''));
        if (values.length < 5) continue;

        transactions.push({
          id: Date.now() + i,
          datum: values[0],
          tip: values[1].toLowerCase() === 'prihod' ? 'prihod' : 'rashod',
          kat: values[2],
          opis: values[3],
          iznos: parseFloat(values[4]) || 0
        });
      }

      if (transactions.length === 0) {
        return { success: false, message: 'No valid transactions found in CSV' };
      }

      const txn = merge ? [...loadTransactions(), ...transactions] : transactions;
      saveTransactions(txn);
      return { success: true, message: `Imported ${transactions.length} transactions` };
    } catch (e) {
      return { success: false, message: `CSV import error: ${e.message}` };
    }
  };

  /**
   * Clear all data with confirmation
   * @returns {boolean} - True if cleared
   */
  const clearAll = () => {
    if (confirm('⚠️ Obrisati SVE podatke? Ovo se ne može vratiti!')) {
      localStorage.removeItem(TX_KEY);
      localStorage.removeItem(KATS_KEY);
      return true;
    }
    return false;
  };

  return {
    loadTransactions,
    saveTransactions,
    loadCategories,
    saveCategories,
    exportJSON,
    importJSON,
    exportCSV,
    importCSV,
    clearAll,
    DEFAULT_KATS
  };
})();

// ===== UI MODULE =====
const UI = (() => {
  /**
   * Format number as Serbian currency
   * @param {number} n - Number to format
   * @returns {string} Formatted string with RSD
   */
  const fmt = (n) => Number(n).toLocaleString('sr-RS') + ' RSD';

  /**
   * Show notification toast
   * @param {string} message - Message to display
   * @param {string} type - 'success', 'error', or 'warning'
   * @param {number} duration - Duration in ms (default 3000)
   */
  const notify = (message, type = 'success', duration = 3000) => {
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.textContent = message;
    document.body.appendChild(notif);
    
    setTimeout(() => notif.remove(), duration);
  };

  /**
   * Show confirmation dialog
   * @param {string} message - Message to display
   * @returns {boolean} User confirmation
   */
  const confirm = (message) => window.confirm(message);

  /**
   * Update category select dropdown
   * @param {string} txType - Transaction type ('prihod' or 'rashod')
   * @param {Array} categories - Array of category names
   */
  const updateCategorySelect = (txType, categories) => {
    const sel = document.getElementById('f-kat');
    if (!sel) return;
    sel.innerHTML = categories[txType]
      .map(k => `<option value="${k}">${k}</option>`)
      .join('');
  };

  /**
   * Show/hide tab
   * @param {string} tabName - Tab name to show
   */
  const showTab = (tabName) => {
    const validTabs = ['dashboard', 'dodaj', 'istorija', 'izvestaj'];
    validTabs.forEach(tab => {
      const el = document.getElementById(`tab-${tab}`);
      if (el) el.style.display = tab === tabName ? 'block' : 'none';
    });

    document.querySelectorAll('.tab').forEach((el, i) => {
      el.classList.toggle('active', validTabs[i] === tabName);
    });
  };

  /**
   * Show/hide subtab
   * @param {string} subtabName - Subtab name to show
   */
  const showSubtab = (subtabName) => {
    const validSubtabs = ['nova', 'kategorije'];
    validSubtabs.forEach(subtab => {
      const el = document.getElementById(`subtab-${subtab}`);
      if (el) el.style.display = subtab === subtabName ? 'block' : 'none';
    });

    document.querySelectorAll('.subtab').forEach((el, i) => {
      el.classList.toggle('active', validSubtabs[i] === subtabName);
    });
  };

  /**
   * Set form field value
   */
  const setFieldValue = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  };

  /**
   * Get form field value
   */
  const getFieldValue = (id) => {
    const el = document.getElementById(id);
    return el ? el.value : '';
  };

  /**
   * Clear form fields
   */
  const clearForm = () => {
    const iznos = document.getElementById('f-iznos');
    const opis = document.getElementById('f-opis');
    const datum = document.getElementById('f-datum');
    
    if (iznos) iznos.value = '';
    if (opis) opis.value = '';
    if (datum) datum.valueAsDate = new Date();
    clearErrors();
  };

  /**
   * Show validation error on form field
   */
  const showFieldError = (fieldId, message) => {
    const field = document.getElementById(fieldId);
    const errorEl = document.getElementById(`err-${fieldId}`);
    
    if (field) {
      field.classList.add('error');
    }
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }
  };

  /**
   * Clear validation errors
   */
  const clearErrors = () => {
    document.querySelectorAll('[id^="f-"]').forEach(field => {
      field.classList.remove('error');
    });
    document.querySelectorAll('[id^="err-"]').forEach(errorEl => {
      errorEl.textContent = '';
      errorEl.style.display = 'none';
    });
  };

  /**
   * Show validation error
   */
  const showError = (message) => {
    notify(message, 'error');
  };

  return {
    fmt,
    notify,
    confirm,
    updateCategorySelect,
    showTab,
    showSubtab,
    setFieldValue,
    getFieldValue,
    clearForm,
    showError,
    showFieldError,
    clearErrors
  };
})();

// ===== TRANSACTIONS MODULE =====
const Transactions = (() => {
  let transactions = Storage.loadTransactions();
  let categories = Storage.loadCategories();
  let currentType = 'prihod';

  /**
   * Add new transaction
   */
  const add = (iznos, datum, opis, kat, tip = currentType) => {
    // Validation
    const errors = {};
    
    if (!iznos || isNaN(iznos) || iznos <= 0) {
      errors.iznos = 'Iznos mora biti veći od 0';
    }
    
    if (!datum) {
      errors.datum = 'Datum je obavezan';
    } else {
      const d = new Date(datum);
      if (isNaN(d.getTime())) {
        errors.datum = 'Nevažeći format datuma';
      } else if (d > new Date()) {
        errors.datum = 'Datum ne može biti u budućnosti';
      }
    }

    if (opis && opis.length > 100) {
      errors.opis = 'Opis ne sme biti duži od 100 karaktera';
    }

    if (!kat) {
      errors.kat = 'Kategorija je obavezna';
    }

    // Return errors if any
    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    const tx = {
      id: Date.now(),
      tip,
      iznos: parseFloat(iznos),
      datum,
      opis: opis || kat,
      kat
    };

    transactions.unshift(tx);
    Storage.saveTransactions(transactions);
    return { success: true, message: `Transakcija dodana: ${UI.fmt(iznos)}` };
  };

  /**
   * Update existing transaction
   */
  const update = (id, iznos, datum, opis, kat, tip) => {
    const idx = transactions.findIndex(t => t.id === id);
    if (idx === -1) {
      return { success: false, message: 'Transakcija nije pronađena' };
    }

    // Validation
    const errors = {};
    
    if (!iznos || isNaN(iznos) || iznos <= 0) {
      errors.iznos = 'Iznos mora biti veći od 0';
    }
    
    if (!datum) {
      errors.datum = 'Datum je obavezan';
    } else {
      const d = new Date(datum);
      if (isNaN(d.getTime())) {
        errors.datum = 'Nevažeći format datuma';
      }
    }

    if (opis && opis.length > 100) {
      errors.opis = 'Opis ne sme biti duži od 100 karaktera';
    }

    if (Object.keys(errors).length > 0) {
      return { success: false, errors };
    }

    transactions[idx] = {
      id,
      tip,
      iznos: parseFloat(iznos),
      datum,
      opis: opis || kat,
      kat
    };

    Storage.saveTransactions(transactions);
    return { success: true, message: 'Transakcija ažurirana' };
  };

  /**
   * Delete transaction
   */
  const remove = (id) => {
    if (!confirm('Obrisati transakciju?')) {
      return { success: false, message: 'Otkazano' };
    }

    transactions = transactions.filter(t => t.id !== id);
    Storage.saveTransactions(transactions);
    return { success: true, message: 'Transakcija obrisana' };
  };

  /**
   * Get all transactions
   */
  const getAll = () => transactions;

  /**
   * Get transactions by type and optional category
   */
  const filter = (tip = '', kat = '', search = '') => {
    let result = transactions;

    if (tip) result = result.filter(t => t.tip === tip);
    if (kat) result = result.filter(t => t.kat === kat);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        t.opis.toLowerCase().includes(q) ||
        t.kat.toLowerCase().includes(q)
      );
    }

    return result;
  };

  /**
   * Get transactions by date range
   */
  const filterByDateRange = (fromDate, toDate) => {
    return transactions.filter(t => {
      const d = new Date(t.datum);
      return d >= new Date(fromDate) && d <= new Date(toDate);
    });
  };

  /**
   * Get transactions by amount range
   */
  const filterByAmountRange = (minAmount, maxAmount) => {
    return transactions.filter(t =>
      t.iznos >= (minAmount || 0) && t.iznos <= (maxAmount || Infinity)
    );
  };

  /**
   * Get transaction by ID
   */
  const getById = (id) => transactions.find(t => t.id === id);

  /**
   * Set current transaction type
   */
  const setType = (type) => {
    currentType = type;
  };

  /**
   * Get current transaction type
   */
  const getType = () => currentType;

  /**
   * Reload from storage
   */
  const reload = () => {
    transactions = Storage.loadTransactions();
  };

  return {
    add,
    update,
    remove,
    getAll,
    filter,
    filterByDateRange,
    filterByAmountRange,
    getById,
    setType,
    getType,
    reload
  };
})();

// ===== CATEGORIES MODULE =====
const Categories = (() => {
  let categories = Storage.loadCategories();

  /**
   * Add new category
   */
  const add = (type, name) => {
    const trimmed = name.trim();
    
    if (!trimmed) {
      return { success: false, message: 'Unesite naziv kategorije' };
    }
    
    if (trimmed.length > 50) {
      return { success: false, message: 'Naziv je premali (maks 50 karaktera)' };
    }
    
    if (categories[type].includes(trimmed)) {
      return { success: false, message: 'Kategorija već postoji' };
    }

    categories[type].push(trimmed);
    Storage.saveCategories(categories);
    return { success: true, message: `Kategorija "${trimmed}" dodana` };
  };

  /**
   * Remove category
   */
  const remove = (type, name) => {
    if (categories[type].length <= 1) {
      return { success: false, message: 'Mora ostati barem jedna kategorija' };
    }
    
    if (!confirm(`Obrisati kategoriju "${name}"?`)) {
      return { success: false, message: 'Otkazano' };
    }

    categories[type] = categories[type].filter(k => k !== name);
    Storage.saveCategories(categories);
    return { success: true, message: `Kategorija "${name}" obrisana` };
  };

  /**
   * Get all categories
   */
  const getAll = () => categories;

  /**
   * Get categories by type
   */
  const getByType = (type) => categories[type] || [];

  /**
   * Reload from storage
   */
  const reload = () => {
    categories = Storage.loadCategories();
  };

  return {
    add,
    remove,
    getAll,
    getByType,
    reload
  };
})();

// ===== CHARTS MODULE =====
const Charts = (() => {
  const SR_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Avg', 'Sep', 'Okt', 'Nov', 'Dec'];
  const KAT_COLORS = [
    '#60a5fa', '#f87171', '#4ade80', '#fbbf24', '#c084fc',
    '#fb923c', '#34d399', '#a78bfa', '#f472b6', '#38bdf8', '#e879f9', '#84cc16'
  ];

  let barChart, pieChart, katChart;

  /**
   * Get monthly aggregated data
   */
  const getMonthlyData = () => {
    const m = {};
    Transactions.getAll().forEach(t => {
      const key = t.datum.slice(0, 7);
      if (!m[key]) m[key] = { prihodi: 0, rashodi: 0 };
      if (t.tip === 'prihod') m[key].prihodi += t.iznos;
      else m[key].rashodi += t.iznos;
    });
    return m;
  };

  /**
   * Get last 6 months data for bar chart
   */
  const getLast6Months = () => {
    const now = new Date();
    const labels = [];
    const prihodi = [];
    const rashodi = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      labels.push(SR_MONTHS[d.getMonth()]);
      const m = getMonthlyData()[key] || { prihodi: 0, rashodi: 0 };
      prihodi.push(m.prihodi);
      rashodi.push(m.rashodi);
    }

    return { labels, prihodi, rashodi };
  };

  /**
   * Get category-based expense data
   */
  const getCategoryData = () => {
    const k = {};
    Transactions.getAll()
      .filter(t => t.tip === 'rashod')
      .forEach(t => {
        k[t.kat] = (k[t.kat] || 0) + t.iznos;
      });
    return k;
  };

  /**
   * Render bar chart (income vs expenses, last 6 months)
   */
  const renderBarChart = () => {
    const { labels, prihodi, rashodi } = getLast6Months();
    const ctx = document.getElementById('chartBar');
    if (!ctx) return;

    if (barChart) barChart.destroy();
    barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Prihodi', data: prihodi, backgroundColor: '#16a34a' },
          { label: 'Rashodi', data: rashodi, backgroundColor: '#dc2626' }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#666', font: { size: 11 }, boxWidth: 10 } }
        },
        scales: {
          x: {
            ticks: { color: '#555', font: { size: 11 } },
            grid: { color: '#1e1e2a' }
          },
          y: {
            ticks: { color: '#555', font: { size: 11 }, callback: v => v.toLocaleString() },
            grid: { color: '#1e1e2a' }
          }
        }
      }
    });
  };

  /**
   * Render pie chart (expenses by category)
   */
  const renderPieChart = () => {
    const katData = getCategoryData();
    const ctx = document.getElementById('chartPie');
    if (!ctx || Object.keys(katData).length === 0) return;

    if (pieChart) pieChart.destroy();
    pieChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(katData),
        datasets: [{
          data: Object.values(katData),
          backgroundColor: KAT_COLORS
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#666', font: { size: 10 }, boxWidth: 8, padding: 6 }
          }
        }
      }
    });
  };

  /**
   * Render category bar chart
   */
  const renderCategoryChart = () => {
    const katData = getCategoryData();
    const ctx = document.getElementById('chartKat');
    if (!ctx || Object.keys(katData).length === 0) return;

    if (katChart) katChart.destroy();
    katChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(katData),
        datasets: [{
          data: Object.values(katData),
          backgroundColor: KAT_COLORS
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            ticks: { color: '#555', font: { size: 11 } },
            grid: { color: '#1e1e2a' }
          },
          y: {
            ticks: { color: '#555', font: { size: 11 }, callback: v => v.toLocaleString() },
            grid: { color: '#1e1e2a' }
          }
        }
      }
    });
  };

  /**
   * Render all charts
   */
  const renderAll = () => {
    renderBarChart();
    renderPieChart();
    renderCategoryChart();
  };

  return {
    renderBarChart,
    renderPieChart,
    renderCategoryChart,
    renderAll,
    getMonthlyData,
    getCategoryData
  };
})();

// ===== RENDER MODULE =====
const Render = (() => {
  /**
   * Render metrics (totals)
   */
  const renderMetrics = () => {
    const txns = Transactions.getAll();
    const p = txns.filter(t => t.tip === 'prihod').reduce((a, t) => a + t.iznos, 0);
    const r = txns.filter(t => t.tip === 'rashod').reduce((a, t) => a + t.iznos, 0);
    const s = p - r;

    const mPrihodi = document.getElementById('m-prihodi');
    const mRashodi = document.getElementById('m-rashodi');
    const mStanje = document.getElementById('m-stanje');

    if (mPrihodi) mPrihodi.textContent = UI.fmt(p);
    if (mRashodi) mRashodi.textContent = UI.fmt(r);
    if (mStanje) {
      mStanje.textContent = UI.fmt(s);
      mStanje.style.color = s >= 0 ? '#60a5fa' : '#f87171';
    }
  };

  /**
   * Render recent transactions on dashboard
   */
  const renderRecent = () => {
    const el = document.getElementById('recent-list');
    if (!el) return;

    const recent = Transactions.getAll().slice(0, 5);
    el.innerHTML = recent.length
      ? recent.map(t => createTransactionHTML(t, false)).join('')
      : '<div class="empty">Nema transakcija</div>';
  };

  /**
   * Create transaction HTML item
   */
  const createTransactionHTML = (t, showActions = true) => {
    const col = t.tip === 'prihod' ? '#4ade80' : '#f87171';
    const sign = t.tip === 'prihod' ? '+' : '-';

    return `
      <div class="tx-item">
        <div class="tx-info">
          <div class="tx-dot" style="background:${col}"></div>
          <div>
            <div class="tx-desc">${t.opis}</div>
            <div class="tx-cat">${t.kat}</div>
          </div>
        </div>
        <div>
          <div class="tx-amount" style="color:${col}">${sign}${UI.fmt(t.iznos)}</div>
          <div class="tx-date">${t.datum}</div>
        </div>
        ${showActions ? `
          <div class="tx-actions">
            <button class="tx-btn" onclick="openEditTransaction(${t.id})" title="Uredi">✎</button>
            <button class="tx-btn delete" onclick="deleteTransaction(${t.id})" title="Obriši">×</button>
          </div>
        ` : ''}
      </div>
    `;
  };

  /**
   * Render history/list of all transactions
   */
  const renderIstorija = () => {
    const tip = document.getElementById('filter-tip')?.value || '';
    const kat = document.getElementById('filter-kat')?.value || '';
    const search = document.getElementById('filter-search')?.value || '';

    let filtered = Transactions.filter(tip, kat, search);

    const el = document.getElementById('istorija-list');
    if (!el) return;

    el.innerHTML = filtered.length
      ? filtered.map(t => createTransactionHTML(t, true)).join('')
      : '<div class="empty">Nema rezultata</div>';
  };

  /**
   * Render monthly table
   */
  const renderMonthly = () => {
    const monthlyData = Charts.getMonthlyData();
    const keys = Object.keys(monthlyData).sort().reverse().slice(0, 12);
    const tbody = document.getElementById('monthly-body');
    if (!tbody) return;

    if (!keys.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty">Nema podataka</td></tr>';
      return;
    }

    const SR_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Avg', 'Sep', 'Okt', 'Nov', 'Dec'];
    tbody.innerHTML = keys.map(k => {
      const [y, m] = k.split('-');
      const { prihodi, rashodi } = monthlyData[k];
      const diff = prihodi - rashodi;
      return `
        <tr>
          <td>${SR_MONTHS[parseInt(m) - 1]} ${y}</td>
          <td class="r" style="color:#4ade80">${UI.fmt(prihodi)}</td>
          <td class="r" style="color:#f87171">${UI.fmt(rashodi)}</td>
          <td class="r" style="color:${diff >= 0 ? '#4ade80' : '#f87171'}">${UI.fmt(diff)}</td>
        </tr>
      `;
    }).join('');
  };

  /**
   * Render category lists
   */
  const renderCategoryLists = () => {
    const cats = Categories.getAll();
    ['prihod', 'rashod'].forEach(type => {
      const el = document.getElementById(`kat-list-${type}`);
      if (!el) return;

      el.innerHTML = cats[type]
        .map(k => `
          <div class="kat-item">
            <span class="kat-name">${k}</span>
            <button class="tx-btn" onclick="deleteCategory('${type}', '${k.replace(/'/g, "\\'")}')">×</button>
          </div>
        `)
        .join('');
    });
  };

  /**
   * Update filter category select
   */
  const updateFilterCategories = () => {
    const allKats = [...new Set(Transactions.getAll().map(t => t.kat))].sort();
    const sel = document.getElementById('filter-kat');
    if (!sel) return;

    const current = sel.value;
    sel.innerHTML = '<option value="">Sve kategorije</option>' +
      allKats.map(k => `<option value="${k}">${k}</option>`).join('');

    if (current && allKats.includes(current)) {
      sel.value = current;
    }
  };

  /**
   * Render everything (full refresh)
   */
  const renderAll = () => {
    renderMetrics();
    renderRecent();
    renderIstorija();
    updateFilterCategories();
    renderMonthly();
    renderCategoryLists();
    Charts.renderAll();
  };

  return {
    renderMetrics,
    renderRecent,
    renderIstorija,
    renderMonthly,
    renderCategoryLists,
    updateFilterCategories,
    renderAll,
    createTransactionHTML
  };
})();

// ===== GLOBAL EVENT HANDLERS =====

/**
 * Set transaction type
 */
function setType(t) {
  Transactions.setType(t);
  const btnPrihod = document.getElementById('btn-prihod');
  const btnRashod = document.getElementById('btn-rashod');
  if (btnPrihod) btnPrihod.style.opacity = t === 'prihod' ? '1' : '0.4';
  if (btnRashod) btnRashod.style.opacity = t === 'rashod' ? '1' : '0.4';
  UI.updateCategorySelect(t, Categories.getAll());
}

/**
 * Add new transaction
 */
function dodajTx() {
  // Clear previous errors
  UI.clearErrors();

  const iznos = document.getElementById('f-iznos').value;
  const datum = document.getElementById('f-datum').value;
  const opis = document.getElementById('f-opis').value.trim();
  const kat = document.getElementById('f-kat').value;

  const result = Transactions.add(iznos, datum, opis, kat);

  if (!result.success) {
    // Show field errors
    Object.entries(result.errors).forEach(([field, message]) => {
      UI.showFieldError(field, message);
    });
    return;
  }

  // Success
  UI.notify(result.message);
  UI.clearForm();
  Render.renderAll();
  UI.showTab('dashboard');
}

/**
 * Delete transaction
 */
function deleteTransaction(id) {
  const result = Transactions.remove(id);
  
  if (result.success) {
    UI.notify(result.message);
    Render.renderAll();
  }
}

/**
 * Open edit transaction modal
 */
function openEditTransaction(id) {
  const tx = Transactions.getById(id);
  if (!tx) {
    UI.showError('Transakcija nije pronađena');
    return;
  }

  // Clear previous errors
  document.querySelectorAll('[id^="err-edit-"]').forEach(el => {
    el.textContent = '';
  });

  // Store transaction ID in data attribute
  const modal = document.getElementById('edit-modal');
  modal.dataset.txId = id;

  // Populate form with transaction data
  document.getElementById('edit-iznos').value = tx.iznos;
  document.getElementById('edit-datum').value = tx.datum;
  document.getElementById('edit-opis').value = tx.opis === tx.kat ? '' : tx.opis;
  
  // Show transaction type
  const typeDisplay = document.getElementById('edit-type-display');
  typeDisplay.textContent = tx.tip === 'prihod' ? '✅ Prihod' : '❌ Rashod';
  typeDisplay.style.color = tx.tip === 'prihod' ? '#4ade80' : '#f87171';

  // Update category select for this type
  const katSelect = document.getElementById('edit-kat');
  const cats = Categories.getByType(tx.tip);
  katSelect.innerHTML = cats.map(k => `<option value="${k}" ${k === tx.kat ? 'selected' : ''}>${k}</option>`).join('');
  katSelect.value = tx.kat;

  // Show modal
  modal.style.display = 'flex';
}

/**
 * Close edit modal
 */
function closeEditModal() {
  const modal = document.getElementById('edit-modal');
  modal.style.display = 'none';
  delete modal.dataset.txId;
}

/**
 * Save edited transaction
 */
function saveEditTransaction() {
  const modal = document.getElementById('edit-modal');
  const txId = parseInt(modal.dataset.txId);

  if (!txId) {
    UI.showError('Greška: ID transakcije nije pronađen');
    return;
  }

  // Clear previous errors
  document.querySelectorAll('[id^="err-edit-"]').forEach(el => {
    el.textContent = '';
  });

  const iznos = document.getElementById('edit-iznos').value;
  const datum = document.getElementById('edit-datum').value;
  const opis = document.getElementById('edit-opis').value.trim();
  const kat = document.getElementById('edit-kat').value;
  
  const tx = Transactions.getById(txId);
  const result = Transactions.update(txId, iznos, datum, opis, kat, tx.tip);

  if (!result.success) {
    // Show field errors
    if (result.errors) {
      Object.entries(result.errors).forEach(([field, message]) => {
        const errorEl = document.getElementById(`err-edit-${field}`);
        if (errorEl) {
          errorEl.textContent = message;
        }
      });
    } else {
      UI.showError(result.message);
    }
    return;
  }

  // Success
  UI.notify(result.message);
  closeEditModal();
  Render.renderAll();
}

// Close modal on background click
document.addEventListener('click', (e) => {
  const modal = document.getElementById('edit-modal');
  if (e.target === modal) {
    closeEditModal();
  }
});

/**
 * Add category
 */
function dodajKat(tip) {
  const inp = document.getElementById(`new-kat-${tip}`);
  const name = inp.value.trim();

  const result = Categories.add(tip, name);
  
  if (!result.success) {
    UI.showError(result.message);
    return;
  }

  UI.notify(result.message);
  inp.value = '';
  Render.renderCategoryLists();
  UI.updateCategorySelect(Transactions.getType(), Categories.getAll());
}

/**
 * Delete category
 */
function deleteCategory(tip, name) {
  const result = Categories.remove(tip, name);
  
  if (result.success) {
    UI.notify(result.message);
    Render.renderCategoryLists();
    Render.updateFilterCategories();
  }
}

/**
 * Show tab
 */
function showTab(name) {
  UI.showTab(name);
  if (name === 'izvestaj') {
    setTimeout(() => Charts.renderAll(), 50);
  }
}

/**
 * Show subtab
 */
function showSubtab(name) {
  UI.showSubtab(name);
}

/**
 * Re-render history when filters change
 */
function renderIstorija() {
  Render.renderIstorija();
}

/**
 * Export data as JSON
 */
function exportDataJSON() {
  const json = Storage.exportJSON();
  downloadFile(json, 'finansije-backup.json', 'application/json');
  UI.notify('Backup sačuvan');
}

/**
 * Export data as CSV
 */
function exportDataCSV() {
  const csv = Storage.exportCSV();
  downloadFile(csv, 'finansije-export.csv', 'text/csv');
  UI.notify('CSV izvezeno');
}

/**
 * Download file helper
 */
function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import JSON file
 */
function importDataJSON() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = Storage.importJSON(evt.target.result, false);
      if (result.success) {
        Transactions.reload();
        Categories.reload();
        Render.renderAll();
        UI.notify(result.message);
      } else {
        UI.showError(result.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

/**
 * Import CSV file
 */
function importDataCSV() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = Storage.importCSV(evt.target.result, false);
      if (result.success) {
        Transactions.reload();
        Render.renderAll();
        UI.notify(result.message);
      } else {
        UI.showError(result.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

/**
 * Clear all data
 */
function clearAllData() {
  if (Storage.clearAll()) {
    Transactions.reload();
    Categories.reload();
    Render.renderAll();
    UI.notify('Svi podaci su obrisani');
  }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  // Set today as default date
  const dateInput = document.getElementById('f-datum');
  if (dateInput) {
    dateInput.valueAsDate = new Date();
  }

  // Initialize categories and render
  UI.updateCategorySelect('prihod', Categories.getAll());
  Render.renderAll();

  // Set initial type
  setType('prihod');
});
