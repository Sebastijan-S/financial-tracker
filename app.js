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
    rashod: ['Plate', 'Kirija', 'Atlantic', 'Ramada', 'Knjigovođa', 'Komunalije', 'Sokoj', 'Smart PH', 'Payspot', 'Konty', 'Ostalo']
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

  /**
   * Generic get for any localStorage key
   */
  const get = (key) => {
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (e) {
      console.error(`Error loading ${key}:`, e);
      return [];
    }
  };

  /**
   * Generic set for any localStorage key
   */
  const set = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error(`Error saving ${key}:`, e);
      return false;
    }
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
    get,
    set,
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
    const validTabs = ['dashboard', 'dodaj', 'istorija', 'izvestaj', 'zaposleni', 'magacin', 'prihodna'];
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
    const validSubtabs = ['nova', 'kategorije', 'lista-zaposlenih', 'nova-plata', 'lista-proizvoda', 'prijem-robe', 'prodaja', 'nepaid-receipts', 'paid-receipts'];
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

// ===== EMPLOYEES MODULE =====
const Employees = (() => {
  const getAll = () => {
    const data = Storage.get('employees') || [];
    return data;
  };

  const add = (name, position, email, phone, hireDate) => {
    const employees = getAll();
    if (!name || !position) return { success: false, errors: { name: 'Ime i pozicija su obavezni' } };
    
    const newEmp = {
      id: Date.now().toString(),
      name,
      position,
      email: email || '',
      phone: phone || '',
      hireDate: hireDate || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };
    
    employees.push(newEmp);
    Storage.set('employees', employees);
    return { success: true, data: newEmp };
  };

  const update = (id, name, position, email, phone, hireDate) => {
    const employees = getAll();
    const emp = employees.find(e => e.id === id);
    if (!emp) return { success: false, message: 'Zaposleni nije pronađen' };
    if (!name || !position) return { success: false, errors: { name: 'Ime i pozicija su obavezni' } };
    
    emp.name = name;
    emp.position = position;
    emp.email = email || '';
    emp.phone = phone || '';
    emp.hireDate = hireDate;
    
    Storage.set('employees', employees);
    return { success: true, data: emp };
  };

  const remove = (id) => {
    const employees = getAll();
    const filtered = employees.filter(e => e.id !== id);
    Storage.set('employees', filtered);
    
    // Also remove salary records
    SalaryRecords.removeSalaryRecordsForEmployee(id);
    
    return { success: true };
  };

  const getById = (id) => {
    return getAll().find(e => e.id === id);
  };

  const reload = () => {
    return getAll();
  };

  return { add, update, remove, getAll, getById, reload };
})();

// ===== SALARY RECORDS MODULE =====
const SalaryRecords = (() => {
  const getAll = () => {
    const data = Storage.get('salaryRecords') || [];
    return data;
  };

  const add = (employeeId, datum, bruto, tax, insurance, other) => {
    if (!employeeId || !datum || !bruto || bruto <= 0) {
      return { success: false, errors: { amount: 'Iznos plate mora biti unet' } };
    }

    const records = getAll();
    const neto = bruto - (tax || 0) - (insurance || 0) - (other || 0);

    const newRecord = {
      id: Date.now().toString(),
      employeeId,
      datum,
      bruto: parseFloat(bruto),
      tax: parseFloat(tax) || 0,
      insurance: parseFloat(insurance) || 0,
      other: parseFloat(other) || 0,
      neto: Math.max(0, neto),
      createdAt: new Date().toISOString()
    };

    records.push(newRecord);
    Storage.set('salaryRecords', records);

    // Auto-add to Finance as expense
    const emp = Employees.getById(employeeId);
    if (emp) {
      const result = Transactions.add(neto, datum, `Plata: ${emp.name}`, 'Plate', 'rashod');
      if (!result.success) {
        Storage.set('salaryRecords', records.filter(r => r.id !== newRecord.id));
        return { success: false, message: 'Greška pri dodavanju u finansije' };
      }
    }

    return { success: true, data: newRecord };
  };

  const getByEmployeeId = (employeeId) => {
    return getAll().filter(r => r.employeeId === employeeId).sort((a, b) => new Date(b.datum) - new Date(a.datum));
  };

  const remove = (recordId) => {
    const records = getAll();
    const record = records.find(r => r.id === recordId);
    
    if (record) {
      // Remove from transactions
      const allTx = Transactions.getAll();
      const txToRemove = allTx.find(t => 
        t.opis.includes('Plata:') && 
        t.iznos === record.neto && 
        t.tip === 'rashod'
      );
      if (txToRemove) {
        Transactions.remove(txToRemove.id);
      }
    }

    Storage.set('salaryRecords', records.filter(r => r.id !== recordId));
    return { success: true };
  };

  const removeSalaryRecordsForEmployee = (employeeId) => {
    const records = getAll();
    const toRemove = records.filter(r => r.employeeId === employeeId);
    
    toRemove.forEach(record => {
      const allTx = Transactions.getAll();
      const txToRemove = allTx.find(t => 
        t.opis.includes('Plata:') && 
        t.iznos === record.neto && 
        t.tip === 'rashod'
      );
      if (txToRemove) {
        Transactions.remove(txToRemove.id);
      }
    });

    Storage.set('salaryRecords', records.filter(r => r.employeeId !== employeeId));
  };

  return { add, remove, getAll, getByEmployeeId, removeSalaryRecordsForEmployee };
})();

// ===== INVENTORY MODULE =====
const Inventory = (() => {
  const getAll = () => Storage.get('inventory') || [];

  const add = (name, quantity, unitCost, salePrice, minStock) => {
    if (!name || !unitCost || !salePrice) return { success: false, errors: { name: 'Svi podaci su obavezni' } };
    const products = getAll();
    const product = {
      id: Date.now().toString(),
      name,
      quantity: parseInt(quantity) || 0,
      unitCost: parseFloat(unitCost),
      salePrice: parseFloat(salePrice),
      minStock: parseInt(minStock) || 0,
      createdAt: new Date().toISOString()
    };
    products.push(product);
    Storage.set('inventory', products);
    return { success: true, data: product };
  };

  const update = (id, name, quantity, unitCost, salePrice, minStock) => {
    const products = getAll();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return { success: false, message: 'Proizvod nije pronađen' };
    products[idx] = { ...products[idx], name, quantity: parseInt(quantity), unitCost: parseFloat(unitCost), salePrice: parseFloat(salePrice), minStock: parseInt(minStock) };
    Storage.set('inventory', products);
    return { success: true, data: products[idx] };
  };

  const remove = (id) => {
    const products = getAll().filter(p => p.id !== id);
    Storage.set('inventory', products);
    StockMovements.removeByProduct(id);
    return { success: true };
  };

  const getById = (id) => getAll().find(p => p.id === id);

  const updateQuantity = (id, newQty) => {
    const products = getAll();
    const idx = products.findIndex(p => p.id === id);
    if (idx !== -1) {
      products[idx].quantity = newQty;
      Storage.set('inventory', products);
    }
  };

  return { add, update, remove, getAll, getById, updateQuantity };
})();

// ===== STOCK MOVEMENTS MODULE =====
const StockMovements = (() => {
  const getAll = () => Storage.get('stockMovements') || [];

  const add = (productId, type, quantity, date) => {
    const movements = getAll();
    const product = Inventory.getById(productId);
    if (!product) return { success: false, message: 'Proizvod nije pronađen' };

    const movement = {
      id: Date.now().toString(),
      productId,
      type, // 'in', 'out', 'adjust'
      quantity: parseInt(quantity),
      date,
      createdAt: new Date().toISOString()
    };
    movements.push(movement);
    Storage.set('stockMovements', movements);
    return { success: true, data: movement };
  };

  const getByProduct = (productId) => {
    return getAll().filter(m => m.productId === productId).sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const remove = (id) => {
    Storage.set('stockMovements', getAll().filter(m => m.id !== id));
  };

  const removeByProduct = (productId) => {
    Storage.set('stockMovements', getAll().filter(m => m.productId !== productId));
  };

  return { add, getAll, getByProduct, remove, removeByProduct };
})();

// ===== RECEIPTS MODULE =====
const Receipts = (() => {
  const getAll = () => Storage.get('receipts') || [];

  const add = (vendor, amount, category, dateReceived, dueDate, notes, status = 'unpaid') => {
    const receipts = getAll();
    if (!vendor || !amount || !category || !dateReceived || !dueDate) {
      return { success: false, errors: { vendor: 'Svi obavezni podaci moraju biti uneseni' } };
    }

    const receipt = {
      id: Date.now().toString(),
      vendor,
      amount: parseFloat(amount),
      category,
      dateReceived,
      dueDate,
      notes: notes || '',
      status, // 'unpaid', 'paid'
      paidDate: null,
      expenseTransactionId: null,
      createdAt: new Date().toISOString()
    };

    receipts.push(receipt);
    Storage.set('receipts', receipts);
    return { success: true, data: receipt };
  };

  const update = (id, vendor, amount, category, dateReceived, dueDate, notes) => {
    const receipts = getAll();
    const idx = receipts.findIndex(r => r.id === id);
    if (idx === -1) return { success: false, message: 'Prihodna nije pronađena' };

    receipts[idx] = {
      ...receipts[idx],
      vendor,
      amount: parseFloat(amount),
      category,
      dateReceived,
      dueDate,
      notes
    };

    Storage.set('receipts', receipts);
    return { success: true, data: receipts[idx] };
  };

  const markAsPaid = (id, paidDate) => {
    const receipts = getAll();
    const idx = receipts.findIndex(r => r.id === id);
    if (idx === -1) return { success: false, message: 'Prihodna nije pronađena' };

    const receipt = receipts[idx];
    
    // Create expense transaction using receipt's category
    const txResult = Transactions.add(receipt.amount, paidDate, `Prihodna: ${receipt.vendor}`, receipt.category, 'rashod');
    
    if (txResult.success) {
      receipts[idx] = {
        ...receipts[idx],
        status: 'paid',
        paidDate
      };
      Storage.set('receipts', receipts);
      return { success: true, data: receipts[idx] };
    } else {
      return { success: false, message: 'Greška pri kreiranju transakcije' };
    }
  };

  const remove = (id) => {
    const receipts = getAll();
    const receipt = receipts.find(r => r.id === id);
    
    // If paid, remove associated transaction
    if (receipt && receipt.status === 'paid' && receipt.expenseTransactionId) {
      Transactions.remove(receipt.expenseTransactionId);
    }

    Storage.set('receipts', receipts.filter(r => r.id !== id));
    return { success: true };
  };

  const getById = (id) => getAll().find(r => r.id === id);

  const getByStatus = (status) => {
    return getAll().filter(r => r.status === status).sort((a, b) => new Date(b.dateReceived) - new Date(a.dateReceived));
  };

  const getOverdue = () => {
    const today = new Date().toISOString().split('T')[0];
    return getAll().filter(r => r.status === 'unpaid' && r.dueDate < today);
  };

  const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diff = due - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getCategories = () => Storage.get('receiptCategories') || getDefaultCategories();

  const getDefaultCategories = () => [
    'Zakup', 'Zarade', 'Atlantic', 'Elit Pak', 'Freshkica', 'Ilovezr',
    'Kirija', 'Knjigovodja', 'Komunalije', 'Konty', 'Payspot', 'Ramada',
    'Smart Ph', 'Sokoj'
  ];

  const addCategory = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return { success: false, message: 'Naziv ne može biti prazan' };
    
    const cats = getCategories();
    if (cats.includes(trimmed)) return { success: false, message: 'Kategorija već postoji' };
    
    cats.push(trimmed);
    cats.sort();
    Storage.set('receiptCategories', cats);
    return { success: true, data: cats };
  };

  const removeCategory = (name) => {
    const cats = getCategories();
    const filtered = cats.filter(c => c !== name);
    Storage.set('receiptCategories', filtered);
    return { success: true, data: filtered };
  };

  return { add, update, markAsPaid, remove, getAll, getById, getByStatus, getOverdue, getDaysUntilDue, getCategories, getDefaultCategories, addCategory, removeCategory };
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

// ===== EMPLOYEES TAB HANDLERS =====
function openAddEmployeeModal() {
  document.getElementById('employee-modal-title').textContent = 'Dodaj zaposlenog';
  document.getElementById('emp-name').value = '';
  document.getElementById('emp-position').value = '';
  document.getElementById('emp-email').value = '';
  document.getElementById('emp-phone').value = '';
  document.getElementById('emp-hire-date').valueAsDate = new Date();
  document.getElementById('employee-modal').style.display = 'flex';
  UI.clearErrors();
}

function closeEmployeeModal() {
  document.getElementById('employee-modal').style.display = 'none';
}

function saveEmployee() {
  const name = document.getElementById('emp-name').value.trim();
  const position = document.getElementById('emp-position').value.trim();
  const email = document.getElementById('emp-email').value.trim();
  const phone = document.getElementById('emp-phone').value.trim();
  const hireDate = document.getElementById('emp-hire-date').value;

  UI.clearErrors();

  if (!name) {
    UI.showFieldError('emp-name', 'Ime je obavezno');
    return;
  }
  if (!position) {
    UI.showFieldError('emp-position', 'Pozicija je obavezna');
    return;
  }

  const result = Employees.add(name, position, email, phone, hireDate);
  if (result.success) {
    UI.notify('Zaposleni je dodan ✓', 'success');
    closeEmployeeModal();
    renderEmployeesList();
  } else {
    Object.keys(result.errors || {}).forEach(field => {
      UI.showFieldError(`emp-${field}`, result.errors[field]);
    });
  }
}

function deleteEmployee(id) {
  if (!UI.confirm('Obriši zaposlenog? Sve plate će biti izbrisane.')) return;
  Employees.remove(id);
  UI.notify('Zaposleni je obrisan', 'success');
  renderEmployeesList();
}

function openSalaryModal(empId) {
  const emp = Employees.getById(empId);
  if (!emp) return;

  document.getElementById('salary-emp-name').textContent = emp.name;
  document.getElementById('salary-datum').valueAsDate = new Date();
  document.getElementById('salary-amount').value = '';
  document.getElementById('salary-tax').value = '';
  document.getElementById('salary-insurance').value = '';
  document.getElementById('salary-other').value = '';
  document.getElementById('salary-bruto').textContent = '0 RSD';
  document.getElementById('salary-neto').textContent = '0 RSD';

  document.getElementById('salary-modal').dataset.empId = empId;
  document.getElementById('salary-modal').style.display = 'flex';
  UI.clearErrors();
}

function closeSalaryModal() {
  document.getElementById('salary-modal').style.display = 'none';
}

function calculateNet() {
  const bruto = parseFloat(document.getElementById('salary-amount').value) || 0;
  const tax = parseFloat(document.getElementById('salary-tax').value) || 0;
  const insurance = parseFloat(document.getElementById('salary-insurance').value) || 0;
  const other = parseFloat(document.getElementById('salary-other').value) || 0;

  const neto = Math.max(0, bruto - tax - insurance - other);

  document.getElementById('salary-bruto').textContent = UI.fmt(bruto);
  document.getElementById('salary-neto').textContent = UI.fmt(neto);
}

function saveSalaryPayment() {
  const empId = document.getElementById('salary-modal').dataset.empId;
  const datum = document.getElementById('salary-datum').value;
  const bruto = parseFloat(document.getElementById('salary-amount').value);
  const tax = parseFloat(document.getElementById('salary-tax').value) || 0;
  const insurance = parseFloat(document.getElementById('salary-insurance').value) || 0;
  const other = parseFloat(document.getElementById('salary-other').value) || 0;

  UI.clearErrors();

  if (!bruto || bruto <= 0) {
    UI.showFieldError('salary-amount', 'Iznos je obavezan');
    return;
  }

  const result = SalaryRecords.add(empId, datum, bruto, tax, insurance, other);
  if (result.success) {
    UI.notify('Plata je isplaćena i dodana u finansije ✓', 'success');
    closeSalaryModal();
    renderPayrollList();
    Render.renderAll();
  } else {
    Object.keys(result.errors || {}).forEach(field => {
      UI.showFieldError(`salary-${field}`, result.errors[field]);
    });
  }
}

function deleteSalaryRecord(recordId) {
  if (!UI.confirm('Obriši ovu isplatu? Biće izbrisana i iz finansija.')) return;
  SalaryRecords.remove(recordId);
  UI.notify('Plata je obrisana', 'success');
  renderPayrollList();
  Render.renderAll();
}

function renderEmployeesList() {
  const container = document.getElementById('employees-list');
  const employees = Employees.getAll();

  if (employees.length === 0) {
    container.innerHTML = '<div style="color:#888;padding:20px;text-align:center">Nema zaposlenih. Dodaj prvi zaposlenog</div>';
    return;
  }

  container.innerHTML = employees.map(emp => {
    const salaries = SalaryRecords.getByEmployeeId(emp.id);
    const lastSalary = salaries[0];

    return `
      <div class="employee-card">
        <div class="employee-info">
          <div class="employee-name">${emp.name}</div>
          <div class="employee-detail">Pozicija: <strong>${emp.position}</strong></div>
          ${emp.phone ? `<div class="employee-detail">Telefon: <strong>${emp.phone}</strong></div>` : ''}
          ${emp.email ? `<div class="employee-detail">Email: <strong>${emp.email}</strong></div>` : ''}
          <div class="employee-detail">Od: <strong>${new Date(emp.hireDate).toLocaleDateString('sr-RS')}</strong></div>
          ${lastSalary ? `<div class="employee-detail" style="color:#4ade80">Poslednja plata: <strong>${UI.fmt(lastSalary.neto)}</strong> (${new Date(lastSalary.datum).toLocaleDateString('sr-RS')})</div>` : ''}
          ${salaries.length > 0 ? `
            <div class="salary-history">
              <div style="font-size:11px;color:#999;margin-bottom:8px;font-weight:600">Istorija plata (${salaries.length}):</div>
              ${salaries.slice(0, 3).map(s => `
                <div class="salary-record">
                  <span class="salary-date">${new Date(s.datum).toLocaleDateString('sr-RS')}</span>
                  <div class="salary-values">
                    <span class="salary-bruto">${UI.fmt(s.bruto)}</span>
                    <span class="salary-neto">${UI.fmt(s.neto)}</span>
                  </div>
                  <button class="salary-delete-btn" onclick="deleteSalaryRecord('${s.id}')">✕</button>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
        <div class="employee-actions">
          <button class="btn btn-blue btn-sm" onclick="openSalaryModal('${emp.id}')">💰 Isplati</button>
          <button class="btn btn-red btn-sm" onclick="deleteEmployee('${emp.id}')">✕ Obriši</button>
        </div>
      </div>
    `;
  }).join('');
}

function renderPayrollList() {
  const container = document.getElementById('payroll-list');
  const employees = Employees.getAll();
  const date = document.getElementById('pay-datum').value || new Date().toISOString().split('T')[0];

  if (!date) {
    container.innerHTML = '<div style="color:#888;padding:20px;text-align:center">Izaberi datum za isplate</div>';
    return;
  }

  if (employees.length === 0) {
    container.innerHTML = '<div style="color:#888;padding:20px;text-align:center">Nema zaposlenih</div>';
    return;
  }

  container.innerHTML = employees.map(emp => {
    return `
      <div class="payroll-item">
        <div class="payroll-header">
          <div>
            <div class="payroll-name">${emp.name}</div>
            <div class="payroll-position">${emp.position}</div>
          </div>
        </div>
        <button class="payroll-button" onclick="openSalaryModal('${emp.id}')">💰 Isplati za ${new Date(date).toLocaleDateString('sr-RS')}</button>
      </div>
    `;
  }).join('');
}

// ===== INVENTORY HANDLERS =====
function openProductModal() {
  document.getElementById('product-modal-title').textContent = 'Dodaj proizvod';
  document.getElementById('prod-name').value = '';
  document.getElementById('prod-quantity').value = '0';
  document.getElementById('prod-unit-cost').value = '';
  document.getElementById('prod-sale-price').value = '';
  document.getElementById('prod-min-stock').value = '0';
  document.getElementById('product-modal').style.display = 'flex';
  UI.clearErrors();
}

function closeProductModal() {
  document.getElementById('product-modal').style.display = 'none';
}

function saveProduct() {
  const name = document.getElementById('prod-name').value.trim();
  const quantity = document.getElementById('prod-quantity').value;
  const unitCost = document.getElementById('prod-unit-cost').value;
  const salePrice = document.getElementById('prod-sale-price').value;
  const minStock = document.getElementById('prod-min-stock').value;

  UI.clearErrors();
  if (!name) { UI.showFieldError('prod-name', 'Naziv je obavezan'); return; }
  if (!unitCost) { UI.showFieldError('prod-unit-cost', 'Cena je obavezna'); return; }
  if (!salePrice) { UI.showFieldError('prod-sale-price', 'Prodajna cena je obavezna'); return; }

  const result = Inventory.add(name, quantity, unitCost, salePrice, minStock);
  if (result.success) {
    UI.notify('Proizvod dodan ✓', 'success');
    closeProductModal();
    renderProductsList();
  }
}

function deleteProduct(id) {
  if (!UI.confirm('Obriši proizvod?')) return;
  Inventory.remove(id);
  UI.notify('Proizvod obrisan', 'success');
  renderProductsList();
}

function openStockInModal(productId) {
  const product = Inventory.getById(productId);
  if (!product) return;
  document.getElementById('stock-in-product').textContent = product.name;
  document.getElementById('stock-in-date').valueAsDate = new Date();
  document.getElementById('stock-in-qty').value = '';
  document.getElementById('stock-in-modal').dataset.productId = productId;
  document.getElementById('stock-in-modal').style.display = 'flex';
  UI.clearErrors();
}

function closeStockInModal() {
  document.getElementById('stock-in-modal').style.display = 'none';
}

function saveStockIn() {
  const productId = document.getElementById('stock-in-modal').dataset.productId;
  const date = document.getElementById('stock-in-date').value;
  const qty = parseInt(document.getElementById('stock-in-qty').value);

  UI.clearErrors();
  if (!qty || qty <= 0) { UI.showFieldError('stock-in-qty', 'Količina je obavezna'); return; }

  const movement = StockMovements.add(productId, 'in', qty, date);
  if (movement.success) {
    const product = Inventory.getById(productId);
    Inventory.updateQuantity(productId, product.quantity + qty);
    UI.notify('Roba primljena ✓', 'success');
    closeStockInModal();
    renderProductsList();
    renderStockInList();
  }
}

function openStockOutModal(productId) {
  const product = Inventory.getById(productId);
  if (!product) return;
  document.getElementById('stock-out-product').textContent = product.name;
  document.getElementById('stock-out-date').valueAsDate = new Date();
  document.getElementById('stock-out-qty').value = '';
  document.getElementById('stock-out-modal').dataset.productId = productId;
  document.getElementById('stock-out-modal').style.display = 'flex';
  UI.clearErrors();
}

function closeStockOutModal() {
  document.getElementById('stock-out-modal').style.display = 'none';
}

function saveStockOut() {
  const productId = document.getElementById('stock-out-modal').dataset.productId;
  const date = document.getElementById('stock-out-date').value;
  const qty = parseInt(document.getElementById('stock-out-qty').value);
  const product = Inventory.getById(productId);

  UI.clearErrors();
  if (!qty || qty <= 0) { UI.showFieldError('stock-out-qty', 'Količina je obavezna'); return; }
  if (qty > product.quantity) { UI.notify('Nema dovoljno zalihe!', 'error'); return; }

  const movement = StockMovements.add(productId, 'out', qty, date);
  if (movement.success) {
    Inventory.updateQuantity(productId, product.quantity - qty);
    UI.notify('Prodaja evidentovana ✓', 'success');
    closeStockOutModal();
    renderProductsList();
    renderStockOutList();
  }
}

function openAdjustmentModal(productId) {
  const product = Inventory.getById(productId);
  if (!product) return;
  document.getElementById('adjustment-product').textContent = product.name;
  document.getElementById('adjustment-date').valueAsDate = new Date();
  document.getElementById('adjustment-qty').value = product.quantity;
  document.getElementById('adjustment-modal').dataset.productId = productId;
  document.getElementById('adjustment-modal').style.display = 'flex';
  UI.clearErrors();
}

function closeAdjustmentModal() {
  document.getElementById('adjustment-modal').style.display = 'none';
}

function saveAdjustment() {
  const productId = document.getElementById('adjustment-modal').dataset.productId;
  const date = document.getElementById('adjustment-date').value;
  const newQty = parseInt(document.getElementById('adjustment-qty').value);
  const product = Inventory.getById(productId);

  UI.clearErrors();
  if (newQty < 0) { UI.showFieldError('adjustment-qty', 'Količina ne sme biti negativna'); return; }

  const diff = newQty - product.quantity;
  const type = diff > 0 ? 'in' : (diff < 0 ? 'out' : 'adjust');
  
  if (diff !== 0) {
    StockMovements.add(productId, type, Math.abs(diff), date);
  }
  Inventory.updateQuantity(productId, newQty);
  UI.notify('Zaliha korigovana ✓', 'success');
  closeAdjustmentModal();
  renderProductsList();
  renderAdjustmentList();
}

function deleteMovement(movementId) {
  if (!UI.confirm('Obriši kretanje?')) return;
  StockMovements.remove(movementId);
  UI.notify('Kretanje obrisano', 'success');
  renderStockInList();
  renderStockOutList();
  renderProductsList();
}

function clearAllStockIn() {
  if (!UI.confirm('Obriši SVA primanja robe?')) return;
  const movements = StockMovements.getAll().filter(m => m.type === 'in');
  movements.forEach(m => StockMovements.remove(m.id));
  UI.notify(`Obrisano ${movements.length} primanja`, 'success');
  renderStockInList();
  renderProductsList();
}

function clearAllStockOut() {
  if (!UI.confirm('Obriši SVE prodaje?')) return;
  const movements = StockMovements.getAll().filter(m => m.type === 'out');
  movements.forEach(m => StockMovements.remove(m.id));
  UI.notify(`Obrisano ${movements.length} prodaja`, 'success');
  renderStockOutList();
  renderProductsList();
}

function renderProductsList() {
  const container = document.getElementById('products-list');
  const products = Inventory.getAll();

  if (products.length === 0) {
    container.innerHTML = '<div style="color:#888;padding:20px;text-align:center">Nema proizvoda</div>';
    return;
  }

  container.innerHTML = products.map(p => {
    const isLow = p.quantity < p.minStock;
    const profit = p.salePrice - p.unitCost;
    const margin = ((profit / p.salePrice) * 100).toFixed(0);
    return `
      <div class="product-card ${isLow ? 'low-stock' : ''}">
        <div class="product-name">${p.name}</div>
        <div class="product-stock ${isLow ? 'low' : ''}">Zaliha: ${p.quantity} kom ${isLow ? '(⚠ Nisko)' : ''}</div>
        <div class="product-details">
          <span><strong>Cena:</strong> ${UI.fmt(p.unitCost)}</span>
          <span><strong>Prodajna:</strong> ${UI.fmt(p.salePrice)}</span>
          <span><strong>Profit:</strong> ${UI.fmt(profit)} (${margin}%)</span>
          <span><strong>Min:</strong> ${p.minStock} kom</span>
        </div>
        <div class="product-actions">
          <button class="btn btn-green btn-sm" onclick="openStockInModal('${p.id}')">Prijem</button>
          <button class="btn btn-blue btn-sm" onclick="openStockOutModal('${p.id}')">Prodaja</button>
          <button class="btn btn-blue btn-sm" onclick="openAdjustmentModal('${p.id}')">Korekcija</button>
          <button class="btn btn-red btn-sm" onclick="deleteProduct('${p.id}')">Obriši</button>
        </div>
      </div>
    `;
  }).join('');
}

function renderStockInList() {
  const container = document.getElementById('stock-in-list');
  const products = Inventory.getAll();
  
  let html = '';
  products.forEach(product => {
    const movements = StockMovements.getByProduct(product.id).filter(m => m.type === 'in').slice(0, 3);
    if (movements.length) {
      html += `<div style="margin-bottom:16px"><strong>${product.name}</strong>`;
      movements.forEach(m => {
        html += `<div style="margin-top:4px;padding:6px;background:#1a1a20;border-radius:4px;font-size:11px;display:flex;justify-content:space-between">
          <span>${new Date(m.date).toLocaleDateString('sr-RS')} - +${m.quantity} kom</span>
          <button class="movement-btn" onclick="deleteMovement('${m.id}')">X</button>
        </div>`;
      });
      html += '</div>';
    }
  });
  container.innerHTML = html || '<div style="color:#888;padding:20px;text-align:center">Nema kretanja</div>';
}

function renderStockOutList() {
  const container = document.getElementById('stock-out-list');
  const products = Inventory.getAll();
  
  let html = '';
  products.forEach(product => {
    const movements = StockMovements.getByProduct(product.id).filter(m => m.type === 'out').slice(0, 3);
    if (movements.length) {
      html += `<div style="margin-bottom:16px"><strong>${product.name}</strong>`;
      movements.forEach(m => {
        html += `<div style="margin-top:4px;padding:6px;background:#1a1a20;border-radius:4px;font-size:11px;display:flex;justify-content:space-between">
          <span>${new Date(m.date).toLocaleDateString('sr-RS')} - -${m.quantity} kom</span>
          <button class="movement-btn" onclick="deleteMovement('${m.id}')">X</button>
        </div>`;
      });
      html += '</div>';
    }
  });
  container.innerHTML = html || '<div style="color:#888;padding:20px;text-align:center">Nema kretanja</div>';
}

function renderAdjustmentList() {
  const container = document.getElementById('adjustment-list');
  const products = Inventory.getAll();
  
  let html = '';
  products.forEach(product => {
    const movements = StockMovements.getByProduct(product.id).filter(m => m.type === 'adjust').slice(0, 3);
    if (movements.length) {
      html += `<div style="margin-bottom:16px"><strong>${product.name}</strong>`;
      movements.forEach(m => {
        html += `<div style="margin-top:4px;padding:6px;background:#1a1a20;border-radius:4px;font-size:11px;display:flex;justify-content:space-between">
          <span>${new Date(m.date).toLocaleDateString('sr-RS')} - ${m.quantity} kom</span>
          <button class="movement-btn" onclick="deleteMovement('${m.id}')">X</button>
        </div>`;
      });
      html += '</div>';
    }
  });
  container.innerHTML = html || '<div style="color:#888;padding:20px;text-align:center">Nema korekcija</div>';
}

// ===== RECEIPTS TAB HANDLERS =====
function openReceiptModal(status = 'unpaid') {
  document.getElementById('receipt-modal-title').textContent = 'Dodaj Prihodnu';
  document.getElementById('receipt-vendor').value = '';
  document.getElementById('receipt-amount').value = '';
  document.getElementById('receipt-date-received').valueAsDate = new Date();
  document.getElementById('receipt-due-date').valueAsDate = new Date(Date.now() + 7*24*60*60*1000); // 7 days from now
  document.getElementById('receipt-notes').value = '';
  
  // Populate categories
  const cats = Receipts.getCategories();
  document.getElementById('receipt-category').innerHTML = '<option value="">Izaberi podkategoriju</option>' + 
    cats.map(c => `<option value="${c}">${c}</option>`).join('');
  
  document.getElementById('receipt-modal').style.display = 'flex';
  document.getElementById('receipt-modal').dataset.status = status;
  UI.clearErrors();
}

function closeReceiptModal() {
  document.getElementById('receipt-modal').style.display = 'none';
}

function saveReceipt() {
  const vendor = document.getElementById('receipt-vendor').value.trim();
  const amount = document.getElementById('receipt-amount').value;
  const category = document.getElementById('receipt-category').value;
  const dateReceived = document.getElementById('receipt-date-received').value;
  const dueDate = document.getElementById('receipt-due-date').value;
  const notes = document.getElementById('receipt-notes').value.trim();
  const status = document.getElementById('receipt-modal').dataset.status || 'unpaid';

  UI.clearErrors();

  if (!vendor) { UI.showFieldError('receipt-vendor', 'Naziv dobavljača je obavezan'); return; }
  if (!amount || amount <= 0) { UI.showFieldError('receipt-amount', 'Iznos mora biti veći od 0'); return; }
  if (!category) { UI.showFieldError('receipt-category', 'Kategorija je obavezna'); return; }
  if (!dateReceived) { UI.showFieldError('receipt-date-received', 'Datum primitka je obavezan'); return; }
  if (!dueDate) { UI.showFieldError('receipt-due-date', 'Rok za plaćanje je obavezan'); return; }
  if (new Date(dateReceived) > new Date(dueDate)) { UI.showFieldError('receipt-date-received', 'Datum primitka mora biti pre roka'); return; }

  const result = Receipts.add(vendor, amount, category, dateReceived, dueDate, notes, status);
  
  if (result.success) {
    UI.notify('Prihodna je dodana ✓', 'success');
    closeReceiptModal();
    renderReceiptsList();
  } else {
    Object.keys(result.errors || {}).forEach(field => {
      UI.showFieldError(`receipt-${field}`, result.errors[field]);
    });
  }
}

function deleteReceipt(id) {
  if (!UI.confirm('Obriši prihodnu?')) return;
  Receipts.remove(id);
  UI.notify('Prihodna je obrisana', 'success');
  renderReceiptsList();
}

function openReceiptCategoryManager() {
  document.getElementById('receipt-category-modal').style.display = 'flex';
  renderReceiptCategoryList();
  document.getElementById('new-receipt-category').value = '';
  UI.clearErrors();
}

function closeReceiptCategoryModal() {
  document.getElementById('receipt-category-modal').style.display = 'none';
}

function addReceiptCategory() {
  const name = document.getElementById('new-receipt-category').value.trim();
  UI.clearErrors();
  
  if (!name) {
    UI.showFieldError('new-receipt-category', 'Naziv ne može biti prazan');
    return;
  }

  const result = Receipts.addCategory(name);
  if (result.success) {
    UI.notify('Kategorija dodana ✓', 'success');
    document.getElementById('new-receipt-category').value = '';
    renderReceiptCategoryList();
    
    // Update category dropdown in receipt modal
    const cats = Receipts.getCategories();
    document.getElementById('receipt-category').innerHTML = '<option value="">Izaberi podkategoriju</option>' + 
      cats.map(c => `<option value="${c}">${c}</option>`).join('');
  } else {
    UI.notify(result.message, 'error');
  }
}

function deleteReceiptCategory(name) {
  if (!UI.confirm(`Obriši kategoriju "${name}"?`)) return;
  
  Receipts.removeCategory(name);
  UI.notify('Kategorija obrisana', 'success');
  renderReceiptCategoryList();
  
  // Update category dropdown
  const cats = Receipts.getCategories();
  document.getElementById('receipt-category').innerHTML = '<option value="">Izaberi podkategoriju</option>' + 
    cats.map(c => `<option value="${c}">${c}</option>`).join('');
}

function renderReceiptCategoryList() {
  const container = document.getElementById('receipt-category-list');
  const cats = Receipts.getCategories();
  const defaults = Receipts.getDefaultCategories();

  if (cats.length === 0) {
    container.innerHTML = '<div style="color:#888;padding:20px;text-align:center">Nema kategorija</div>';
    return;
  }

  container.innerHTML = cats.map(cat => {
    const isDefault = defaults.includes(cat);
    return `
      <div class="category-item" style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:#1a1a20;border-radius:6px;margin-bottom:8px">
        <span>${cat} ${isDefault ? '<span style="font-size:10px;color:#999;margin-left:8px">(podrazumevana)</span>' : ''}</span>
        ${!isDefault ? `<button class="btn btn-sm btn-red" onclick="deleteReceiptCategory('${cat}')">Obriši</button>` : ''}
      </div>
    `;
  }).join('');
}

function openMarkPaidModal(id) {
  const receipt = Receipts.getById(id);
  if (!receipt || receipt.status === 'paid') return;

  document.getElementById('mark-paid-vendor').textContent = receipt.vendor;
  document.getElementById('mark-paid-amount').textContent = UI.fmt(receipt.amount);
  document.getElementById('mark-paid-category').textContent = receipt.category;
  document.getElementById('mark-paid-date').valueAsDate = new Date();
  
  document.getElementById('mark-paid-modal').dataset.receiptId = id;
  document.getElementById('mark-paid-modal').style.display = 'flex';
  UI.clearErrors();
}

function closeMarkPaidModal() {
  document.getElementById('mark-paid-modal').style.display = 'none';
}

function saveMarkPaid() {
  const receiptId = document.getElementById('mark-paid-modal').dataset.receiptId;
  const paidDate = document.getElementById('mark-paid-date').value;

  UI.clearErrors();
  if (!paidDate) { UI.showFieldError('mark-paid-date', 'Datum plaćanja je obavezan'); return; }

  const result = Receipts.markAsPaid(receiptId, paidDate);
  
  if (result.success) {
    UI.notify('Prihodna je označena kao plaćena ✓', 'success');
    closeMarkPaidModal();
    renderReceiptsList();
    Render.renderAll();
  } else {
    UI.notify(result.message || 'Greška pri označavanju kao plaćene', 'error');
  }
}

function renderReceiptsList() {
  const unpaidContainer = document.getElementById('unpaid-receipts-list');
  const paidContainer = document.getElementById('paid-receipts-list');

  const unpaidReceipts = Receipts.getByStatus('unpaid');
  const paidReceipts = Receipts.getByStatus('paid');

  // Render unpaid receipts
  if (unpaidReceipts.length === 0) {
    unpaidContainer.innerHTML = '<div style="color:#888;padding:20px;text-align:center">Nema neplaćenih prihoda</div>';
  } else {
    unpaidContainer.innerHTML = unpaidReceipts.map(r => {
      const daysLeft = Receipts.getDaysUntilDue(r.dueDate);
      const isOverdue = daysLeft < 0;
      const daysColor = isOverdue ? '#f87171' : (daysLeft <= 3 ? '#fbbf24' : '#4ade80');
      const daysText = isOverdue ? `${Math.abs(daysLeft)} dana ZAKAŠNJENJA` : `${daysLeft} dana`;
      
      return `
        <div class="receipt-card">
          <div class="receipt-header">
            <div>
              <div class="receipt-vendor">${r.vendor}</div>
              <div class="receipt-category">${r.category}</div>
            </div>
            <div style="text-align:right">
              <div class="receipt-amount">${UI.fmt(r.amount)}</div>
              <div class="receipt-status">Neplaćeno</div>
            </div>
          </div>
          <div class="receipt-details">
            <span style="color:#888;font-size:11px">Primljeno: ${new Date(r.dateReceived).toLocaleDateString('sr-RS')}</span>
            <span style="color:#888;font-size:11px">Rok: ${new Date(r.dueDate).toLocaleDateString('sr-RS')}</span>
          </div>
          <div style="background:#1a1a20;padding:8px;border-radius:4px;margin-top:8px;text-align:center;color:${daysColor};font-weight:bold;font-size:12px">
            ⏰ ${daysText}
          </div>
          ${r.notes ? `<div style="margin-top:8px;padding:8px;background:#1a1a20;border-radius:4px;font-size:11px;color:#aaa">📝 ${r.notes}</div>` : ''}
          <div class="receipt-actions">
            <button class="btn btn-sm btn-blue" onclick="openMarkPaidModal('${r.id}')">✓ Označi Plaćeno</button>
            <button class="btn btn-sm btn-red" onclick="deleteReceipt('${r.id}')">🗑 Obriši</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Render paid receipts
  if (paidReceipts.length === 0) {
    paidContainer.innerHTML = '<div style="color:#888;padding:20px;text-align:center">Nema plaćenih prihoda</div>';
  } else {
    paidContainer.innerHTML = paidReceipts.map(r => {
      return `
        <div class="receipt-card paid">
          <div class="receipt-header">
            <div>
              <div class="receipt-vendor">${r.vendor}</div>
              <div class="receipt-category">${r.category}</div>
            </div>
            <div style="text-align:right">
              <div class="receipt-amount">${UI.fmt(r.amount)}</div>
              <div class="receipt-status paid">✓ Plaćeno</div>
            </div>
          </div>
          <div class="receipt-details">
            <span style="color:#888;font-size:11px">Primljeno: ${new Date(r.dateReceived).toLocaleDateString('sr-RS')}</span>
            <span style="color:#888;font-size:11px">Plaćeno: ${new Date(r.paidDate).toLocaleDateString('sr-RS')}</span>
          </div>
          ${r.notes ? `<div style="margin-top:8px;padding:8px;background:#1a1a20;border-radius:4px;font-size:11px;color:#aaa">📝 ${r.notes}</div>` : ''}
          <div class="receipt-actions">
            <button class="btn btn-sm btn-red" onclick="deleteReceipt('${r.id}')">🗑 Obriši</button>
          </div>
        </div>
      `;
    }).join('');
  }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  // Set today as default date
  const dateInput = document.getElementById('f-datum');
  if (dateInput) {
    dateInput.valueAsDate = new Date();
  }

  // Set payroll date
  const payDatum = document.getElementById('pay-datum');
  if (payDatum) {
    payDatum.valueAsDate = new Date();
  }

  // Initialize categories and render
  UI.updateCategorySelect('prihod', Categories.getAll());
  Render.renderAll();

  // Initialize employees
  renderEmployeesList();
  renderPayrollList();

  // Initialize inventory
  renderProductsList();
  renderStockInList();
  renderStockOutList();

  // Initialize receipts
  renderReceiptsList();

  // Set initial type
  setType('prihod');
});
