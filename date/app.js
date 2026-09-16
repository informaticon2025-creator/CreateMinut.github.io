document.addEventListener('DOMContentLoaded', () => {
  function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  refreshIcons();

  // --- LÓGICA DE REORDENAMIENTO CORREGIDA (MOUSE + TOUCH NATIVO) ---
  let draggedItem = null;

  function attachDragAndDropEvents(container) {
    if (!container) return;

    // --- ARRASTRE CON MOUSE (PC) ---
    container.addEventListener('dragstart', (e) => {
      const targetRow = e.target.closest('.dynamic-field-row');
      if (!targetRow || targetRow.classList.contains('locked')) {
        e.preventDefault();
        return;
      }
      draggedItem = targetRow;
      setTimeout(() => targetRow.classList.add('dragging'), 0);
    });

    container.addEventListener('dragend', (e) => {
      const targetRow = e.target.closest('.dynamic-field-row');
      if (targetRow) {
        targetRow.classList.remove('dragging');
      }
      draggedItem = null;
    });

    container.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (!draggedItem) return;

      const afterElement = getDragAfterElement(container, e.clientY);
      if (afterElement == null) {
        container.appendChild(draggedItem);
      } else {
        container.insertBefore(draggedItem, afterElement);
      }
    });

    // --- ARRASTRE TÁCTIL NATIVO (TELÉFONOS / HIOS) ---
    container.addEventListener('touchstart', (e) => {
      const targetRow = e.target.closest('.dynamic-field-row');
      if (!targetRow || targetRow.classList.contains('locked')) return;

      draggedItem = targetRow;
      draggedItem.classList.add('dragging');
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
      if (!draggedItem) return;

      // Desactiva el scroll vertical de la pantalla mientras se arrastra la fila
      if (e.cancelable) e.preventDefault();

      const touchLocation = e.touches[0];
      const afterElement = getDragAfterElement(container, touchLocation.clientY);

      if (afterElement == null) {
        container.appendChild(draggedItem);
      } else {
        container.insertBefore(draggedItem, afterElement);
      }
    }, { passive: false });

    container.addEventListener('touchend', () => {
      if (draggedItem) {
        draggedItem.classList.remove('dragging');
        draggedItem = null;
      }
    });
  }

  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.dynamic-field-row:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  // Las notificaciones automáticas y el recordatorio periódico están desactivados.

  // --- TEMAS Y TAMAÑO DE FUENTE ---
  const themeSelect = document.getElementById('theme-select');
  const fontSizeSelect = document.getElementById('font-size-select');

  const availableThemes = new Set([
    'theme-tecno', 'theme-robotico', 'theme-femenino', 'theme-matrix',
    'theme-vscode', 'theme-retro', 'theme-minimal', 'theme-excel',
    'theme-whatsapp', 'theme-facebook', 'theme-xp'
  ]);
  const savedThemeValue = localStorage.getItem('app_selected_theme');
  const savedTheme = availableThemes.has(savedThemeValue) ? savedThemeValue : 'theme-retro';
  const savedFontSize = localStorage.getItem('app_font_size') || 'font-sm';

  function applyAppearance(theme, fontSize) {
    document.body.classList.remove(...availableThemes, 'font-xxs', 'font-xs', 'font-sm', 'font-lg', 'font-xl');
    document.body.classList.add(theme, fontSize);
  }

  applyAppearance(savedTheme, savedFontSize);

  if (themeSelect) themeSelect.value = savedTheme;
  if (fontSizeSelect) fontSizeSelect.value = savedFontSize;

  if (themeSelect) {
    themeSelect.addEventListener('change', async (e) => {
      const selectedTheme = e.target.value;
      const currentFontSize = fontSizeSelect ? fontSizeSelect.value : 'font-sm';
      const validTheme = availableThemes.has(selectedTheme) ? selectedTheme : 'theme-retro';
      applyAppearance(validTheme, currentFontSize);
      localStorage.setItem('app_selected_theme', validTheme);
      renderTableBuilder();
    });
  }

  if (fontSizeSelect) {
    fontSizeSelect.addEventListener('change', async (e) => {
      const selectedFont = e.target.value;
      const currentTheme = themeSelect ? themeSelect.value : 'theme-retro';
      applyAppearance(currentTheme, selectedFont);
      localStorage.setItem('app_font_size', selectedFont);
      renderTableBuilder();
    });
  }

  // --- PERMISOS NATIVOS ---
  async function solicitarPermisosNativos() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.warn("Permiso de cámara no disponible:", err);
      }
    }
  }

  // --- NAVEGACIÓN Y MENÚ ---
  const navItems = document.querySelectorAll('.nav-item');
  const tabViews = document.querySelectorAll('.tab-view');

  function activateTab(tabId) {
    navItems.forEach(nav => {
      const target = nav.getAttribute('data-tab');
      nav.classList.toggle('active', target === tabId);
    });
    tabViews.forEach(view => view.classList.toggle('active', view.id === tabId));
    if (tabId !== 'view-inicio') {
      document.documentElement.classList.remove('table-view-mode');
    }
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      activateTab(item.getAttribute('data-tab'));
    });
  });

  const hamburgerBtn = document.getElementById('hamburger-btn');
  const closeMenuBtn = document.getElementById('close-menu-btn');
  const sideMenu = document.getElementById('side-menu');
  const overlay = document.getElementById('overlay');

  function toggleMenu() {
    if (sideMenu) sideMenu.classList.toggle('open');
    if (overlay) overlay.classList.toggle('show');
  }

  if (hamburgerBtn) hamburgerBtn.addEventListener('click', toggleMenu);
  if (closeMenuBtn) closeMenuBtn.addEventListener('click', toggleMenu);
  if (overlay) overlay.addEventListener('click', toggleMenu);

  // --- MODALES ---
  const modalAbout = document.getElementById('modal-about');
  const btnAboutApp = document.getElementById('btn-about-app');
  const btnCloseAbout = document.getElementById('btn-close-about');
  if (btnAboutApp && modalAbout) {
    btnAboutApp.addEventListener('click', (e) => {
      e.preventDefault(); toggleMenu(); modalAbout.classList.add('open');
    });
  }
  if (btnCloseAbout && modalAbout) {
    btnCloseAbout.addEventListener('click', () => modalAbout.classList.remove('open'));
  }

  const modalTemplates = document.getElementById('modal-templates');
  const btnOpenTemplates = document.getElementById('btn-open-templates');
  const btnCloseTemplates = document.getElementById('btn-close-templates');
  if (btnOpenTemplates && modalTemplates) {
    btnOpenTemplates.addEventListener('click', (e) => {
      e.preventDefault(); toggleMenu(); modalTemplates.classList.add('open');
    });
  }
  if (btnCloseTemplates && modalTemplates) {
    btnCloseTemplates.addEventListener('click', () => modalTemplates.classList.remove('open'));
  }

  const modalProtocols = document.getElementById('modal-protocols');
  const btnOpenProtocols = document.getElementById('btn-open-protocols');
  const btnCloseProtocols = document.getElementById('btn-close-protocols');
  if (btnOpenProtocols && modalProtocols) {
    btnOpenProtocols.addEventListener('click', (e) => {
      e.preventDefault(); toggleMenu(); modalProtocols.classList.add('open');
    });
  }
  if (btnCloseProtocols && modalProtocols) {
    btnCloseProtocols.addEventListener('click', () => modalProtocols.classList.remove('open'));
  }

  const btnShareAppLink = document.getElementById('btn-share-app-link');
  if (btnShareAppLink) {
    btnShareAppLink.addEventListener('click', async (e) => {
      e.preventDefault(); toggleMenu();
      const currentUrl = window.location.href;
      if (navigator.share) {
        try {
          await navigator.share({ title: 'CreatorMinut', text: `Accede a CreatorMinut:\n${currentUrl}` });
        } catch (err) {
          if (err.name !== 'AbortError') {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              await navigator.clipboard.writeText(currentUrl);
            }
            alert('Enlace copiado al portapapeles.');
          }
        }
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(currentUrl);
        alert('Enlace copiado al portapapeles.');
      }
    });
  }

  // --- FORMULARIO Y CAMPOS DINÁMICOS EXTRAS ---
  const inputs = {
    ciudad: document.getElementById('f-ciudad'),
    fecha: document.getElementById('f-fecha'),
    hora: document.getElementById('f-hora'),
    lugar: document.getElementById('f-lugar'),
    informa: document.getElementById('f-informa'),
    resumen: document.getElementById('f-resumen'),
    lema: document.getElementById('f-lema')
  };

  function normalizeSummaryText(value) {
    if (!value) return '';
    return value
      .replace(/\s+/g, ' ')
      .replace(/\bse realiz[oó]\b/gi, 'Se realizó')
      .replace(/\bse dio\b/gi, 'Se realizó')
      .replace(/\bse procedi[oó]\b/gi, 'Se procedió')
      .replace(/\bse verific[oó]\b/gi, 'Se verificó')
      .replace(/\bse revis[oó]\b/gi, 'Se revisó')
      .replace(/\bse coordino\b/gi, 'Se coordinó')
      .replace(/\bse atendio\b/gi, 'Se atendió')
      .replace(/\bquedo\b/gi, 'quedó')
      .replace(/\bq\s*ue\b/gi, 'que')
      .replace(/\bpor medio de\b/gi, 'mediante')
      .replace(/\bcon el fin de\b/gi, 'con el propósito de')
      .trim();
  }

  function showHomeSelector() {
    const form = document.getElementById('minuta-form');
    const tablePanel = document.getElementById('table-builder-panel');
    const actaPanel = document.getElementById('actas-builder-panel');
    const homeSelector = document.getElementById('home-type-selector');
    document.documentElement.classList.remove('table-view-mode');
    if (form) form.style.display = 'none';
    if (tablePanel) tablePanel.style.display = 'none';
    if (actaPanel) actaPanel.style.display = 'none';
    if (homeSelector) homeSelector.style.display = 'block';
  }

  function showTableBuilder() {
    const form = document.getElementById('minuta-form');
    const tablePanel = document.getElementById('table-builder-panel');
    const actaPanel = document.getElementById('actas-builder-panel');
    const homeSelector = document.getElementById('home-type-selector');
    document.documentElement.classList.add('table-view-mode');
    if (form) form.style.display = 'none';
    if (tablePanel) tablePanel.style.display = 'block';
    if (actaPanel) actaPanel.style.display = 'none';
    if (homeSelector) homeSelector.style.display = 'none';
    renderTableBuilder();
  }

  function showMinutaForm(templateKey = '') {
    const form = document.getElementById('minuta-form');
    const tablePanel = document.getElementById('table-builder-panel');
    const actaPanel = document.getElementById('actas-builder-panel');
    document.documentElement.classList.remove('table-view-mode');
    if (form) form.style.display = 'none';
    if (tablePanel) tablePanel.style.display = 'none';
    if (actaPanel) actaPanel.style.display = 'none';

    if (templateKey === 'plantillas') {
      const modalTemplates = document.getElementById('modal-templates');
      if (modalTemplates) modalTemplates.classList.add('open');
      return;
    }

    if (templateKey === 'table') {
      showTableBuilder();
      return;
    }

    if (templateKey === 'actas') {
      const homeSelector = document.getElementById('home-type-selector');
      if (homeSelector) homeSelector.style.display = 'none';
      if (actaPanel) actaPanel.style.display = 'block';
      return;
    }

    if (!form) return;
    form.style.display = 'block';

    if (!templateKey) return;

    const templateMap = {
      general: {
        ciudad: 'MINUTA GENERAL',
        lugar: 'OFICINA / ÁREA DE TRABAJO',
        informa: localStorage.getItem('app_user_name') || 'RESPONSABLE DEL ÁREA',
        resumen: 'Se realizó la revisión del tema solicitado, se analizaron las condiciones actuales y se definieron las acciones correspondientes para continuar con el proceso de forma ordenada y documentada.',
        lema: 'SEGUIMIENTO Y CONTROL'
      }
    };

    const selected = templateMap[templateKey];
    if (!selected) return;

    inputs.ciudad.value = selected.ciudad;
    inputs.lugar.value = selected.lugar;
    inputs.informa.value = selected.informa;
    inputs.resumen.value = selected.resumen;
    inputs.lema.value = selected.lema;
    renderMinuta();
  }

  document.querySelectorAll('.home-option-btn').forEach(button => {
    button.addEventListener('click', () => {
      const type = button.getAttribute('data-home-template');
      showMinutaForm(type);
    });
  });

  document.getElementById('btn-back-from-acta')?.addEventListener('click', showHomeSelector);
  const actaDateInput = document.getElementById('acta-date');
  if (actaDateInput && !actaDateInput.value) actaDateInput.value = new Date().toISOString().slice(0, 10);

  const tableDefaults = {
    columns: ['Nombre', 'Apellido', 'C.I', 'Teléfono', 'Dirección'],
    rows: 20
  };

  let tableSelection = null;
  let tableSearchTerm = '';

  function createDefaultTableState() {
    return {
      title: 'TABLE DATE',
      columns: tableDefaults.columns.map(() => ''),
      rows: tableDefaults.rows,
      data: Array.from({ length: tableDefaults.rows }, () => Array(tableDefaults.columns.length).fill('')),
      columnTypes: Array(tableDefaults.columns.length).fill('general'),
      cellTypes: {},
      formulas: {},
      merges: []
    };
  }

  function getColumnLabel(index) {
    let label = '';
    let value = index;
    do {
      label = String.fromCharCode(65 + (value % 26)) + label;
      value = Math.floor(value / 26) - 1;
    } while (value >= 0);
    return label;
  }

  function getColumnIndex(label) {
    return label.split('').reduce((total, character) => total * 26 + character.charCodeAt(0) - 64, 0) - 1;
  }

  function getCellReference(rowIndex, colIndex) {
    return `${getColumnLabel(colIndex)}${rowIndex + 1}`;
  }

  function getCellDataType(state, rowIndex, colIndex) {
    return state.cellTypes[`${rowIndex}|${colIndex}`] || state.columnTypes[colIndex] || 'general';
  }

  function evaluateFormula(expression, state, resolving = new Set()) {
    const match = String(expression).trim().match(/^==\(\s*([A-Z]+\d+)(?:\s*([+\-*/])\s*([A-Z]+\d+))+\s*\)$/i);
    if (!match) return { valid: false, value: '' };
    const formulaBody = match[1] + expression.trim().slice(expression.trim().indexOf(match[1]) + match[1].length, -1);
    const tokens = formulaBody.match(/[A-Z]+\d+|[+\-*/]/gi) || [];
    let result = null;
    let operator = null;
    for (const token of tokens) {
      if (/^[A-Z]+\d+$/i.test(token)) {
        const reference = token.match(/^([A-Z]+)(\d+)$/i);
        const rowNumber = reference[2];
        const numericRow = Number(rowNumber);
        const rowIndex = numericRow === 0 || (rowNumber.length > 1 && rowNumber.startsWith('0')) ? numericRow : numericRow - 1;
        const colIndex = getColumnIndex(reference[1].toUpperCase());
        if (rowIndex < 0 || colIndex < 0 || rowIndex >= state.data.length || colIndex >= state.columns.length) return { valid: false, value: '' };
        const cellKey = `${rowIndex}|${colIndex}`;
        const cellType = getCellDataType(state, rowIndex, colIndex);
        if (cellType !== 'general' && cellType !== 'number') return { valid: false, value: '' };
        if (state.formulas[cellKey]) {
          if (resolving.has(cellKey)) return { valid: false, value: '' };
          const nested = evaluateFormula(state.formulas[cellKey], state, new Set([...resolving, cellKey]));
          if (!nested.valid) return { valid: false, value: '' };
          state.data[rowIndex][colIndex] = nested.value;
        }
        const rawValue = state.data[rowIndex]?.[colIndex];
        const numberValue = rawValue === '' || rawValue === null || rawValue === undefined ? 0 : Number(rawValue);
        if (!Number.isFinite(numberValue)) return { valid: false, value: '' };
        if (result === null) result = numberValue;
        else if (operator === '+') result += numberValue;
        else if (operator === '-') result -= numberValue;
        else if (operator === '*') result *= numberValue;
        else if (operator === '/') {
          if (numberValue === 0) return { valid: false, value: '' };
          result /= numberValue;
        }
      } else {
        operator = token;
      }
    }
    return { valid: result !== null, value: result === null ? '' : String(result) };
  }

  function recalculateFormulas(state) {
    state.formulas = state.formulas || {};
    Object.entries(state.formulas).forEach(([cellKey, formula]) => {
      const evaluated = evaluateFormula(formula, state, new Set([cellKey]));
      state.data[cellKey.split('|')[0]][cellKey.split('|')[1]] = evaluated.valid ? evaluated.value : '0';
    });
    return state;
  }

  function getTablePalette() {
    const bodyClasses = document.body.className || '';

    if (bodyClasses.includes('theme-excel')) {
      return { header: '#e2f0d9', body: '#ffffff', border: '#b7c9b0', text: '#1f2937', indexText: '#6b7280' };
    }
    if (bodyClasses.includes('theme-whatsapp')) {
      return { header: '#d7f7dc', body: '#f3fff7', border: '#b2d9bf', text: '#123127', indexText: '#6b7280' };
    }
    if (bodyClasses.includes('theme-facebook')) {
      return { header: '#e4efff', body: '#f7f9fc', border: '#b1c8f1', text: '#1b2a41', indexText: '#6b7280' };
    }
    if (bodyClasses.includes('theme-xp')) {
      return { header: '#dfeeff', body: '#f5f9ff', border: '#9ab8e6', text: '#183153', indexText: '#64748b' };
    }
    if (bodyClasses.includes('theme-vscode')) {
      return { header: '#2d2d30', body: '#1e1f22', border: '#474d5a', text: '#ececec', indexText: '#9ca3af' };
    }
    if (bodyClasses.includes('theme-matrix')) {
      return { header: '#1d4d32', body: '#0f241b', border: '#345b49', text: '#d1f7d4', indexText: '#86a991' };
    }
    if (bodyClasses.includes('theme-tecno')) return { header: '#16324f', body: '#0d1b2a', border: '#28527a', text: '#dbeafe', indexText: '#94a3b8' };
    if (bodyClasses.includes('theme-robotico')) return { header: '#3a404b', body: '#252a32', border: '#5c6370', text: '#e5e7eb', indexText: '#9ca3af' };
    if (bodyClasses.includes('theme-femenino')) return { header: '#ffe0ee', body: '#fff7fb', border: '#f3c9dd', text: '#7a1f4d', indexText: '#a16b86' };

    return { header: '#e5e7eb', body: '#ffffff', border: '#cbd5e1', text: '#1f2937', indexText: '#6b7280' };
  }

  function getTableState() {
    const stored = localStorage.getItem('table_date_state');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.columns) && parsed.columns.length > 0 && Number.isInteger(parsed.rows) && parsed.rows > 0) {
          if (parsed.columns.every((column) => tableDefaults.columns.includes(column))) parsed.columns = parsed.columns.map(() => '');
          return parsed;
        }
      } catch (e) {
        console.warn('No se pudo leer la tabla guardada:', e);
      }
    }

    return createDefaultTableState();
  }

  function resetTableData() {
    const freshState = createDefaultTableState();
    saveTableState(freshState);
    renderTableBuilder();
  }

  function saveTableState(state) {
    localStorage.setItem('table_date_state', JSON.stringify(state));
  }

  function ensureTableData(state) {
    const columnCount = state.columns.length;
    const rowCount = state.rows;
    if (!Array.isArray(state.data)) {
      state.data = Array.from({ length: rowCount }, () => Array(columnCount).fill(''));
      return state;
    }

    while (state.data.length < rowCount) {
      state.data.push(Array(columnCount).fill(''));
    }

    while (state.data.length > rowCount) {
      state.data.pop();
    }

    state.data.forEach((row) => {
      while (row.length < columnCount) row.push('');
      while (row.length > columnCount) row.pop();
    });

    if (!Array.isArray(state.columnTypes)) state.columnTypes = [];
    while (state.columnTypes.length < columnCount) state.columnTypes.push('general');
    state.columnTypes = state.columnTypes.slice(0, columnCount);
    state.cellTypes = state.cellTypes || {};
    state.formulas = state.formulas || {};
    state.merges = Array.isArray(state.merges) ? state.merges : [];

    return state;
  }

  function renderTableBuilder() {
    const tablePanel = document.getElementById('table-builder-panel');
    if (!tablePanel) return;

    const table = document.getElementById('dynamic-data-table');
    const tableNameInput = document.getElementById('table-name-input');
    if (!table) return;

    let state = getTableState();
    state = ensureTableData(state);
    state = recalculateFormulas(state);
    if (tableNameInput && state.title) tableNameInput.value = state.title;
    saveTableState(state);

    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    if (!thead || !tbody) return;

    thead.innerHTML = '';
    tbody.innerHTML = '';

    const palette = getTablePalette();
    table.style.background = palette.body;
    table.style.color = palette.text;
    const tableScroll = table.closest('.table-scroll');
    if (tableScroll) tableScroll.style.background = palette.body;

    const headerRow = document.createElement('tr');
    const idHeader = document.createElement('th');
    idHeader.style.border = `1px solid ${palette.border}`;
    idHeader.style.padding = '4px 3px';
    idHeader.style.width = '28px';
    idHeader.style.minWidth = '28px';
    idHeader.style.background = palette.header;
    idHeader.style.color = palette.indexText;
    idHeader.style.fontWeight = '700';
    idHeader.style.fontSize = '0.7rem';
    idHeader.textContent = '#';
    headerRow.appendChild(idHeader);

    state.columns.forEach((col, index) => {
      const th = document.createElement('th');
      th.style.border = `1px solid ${palette.border}`;
      th.style.padding = '4px 6px';
      th.style.minWidth = '120px';
      th.style.background = palette.header;
      th.style.color = palette.indexText;
      th.style.fontWeight = '700';
      th.style.fontSize = '0.72rem';
      th.textContent = getColumnLabel(index);
      headerRow.appendChild(th);
    });

    const actionCell = document.createElement('th');
    actionCell.style.border = `1px solid ${palette.border}`;
    actionCell.style.padding = '4px 3px';
    actionCell.style.width = '28px';
    actionCell.style.minWidth = '28px';
    actionCell.style.background = palette.header;
    actionCell.style.color = palette.indexText;
    actionCell.style.fontWeight = '700';
    actionCell.style.fontSize = '0.7rem';
    actionCell.textContent = '';
    headerRow.appendChild(actionCell);
    thead.appendChild(headerRow);

    function hideContextMenu() {
      const contextMenu = document.getElementById('table-context-menu');
      if (contextMenu) {
        contextMenu.style.display = 'none';
        contextMenu.classList.add('hidden');
      }
      document.querySelectorAll('.table-submenu').forEach((menu) => menu.classList.add('hidden'));
    }

    function setSelectedCell(rowIndex, colIndex, targetCell) {
      tableSelection = { rowIndex, colIndex };
      document.querySelectorAll('.table-selected-cell').forEach((cell) => cell.classList.remove('table-selected-cell'));
      if (targetCell) targetCell.classList.add('table-selected-cell');
    }

    document.removeEventListener('click', handleTableDocumentClick);
    document.addEventListener('click', handleTableDocumentClick);

    document.querySelectorAll('.table-menu-main[data-submenu]').forEach((button) => {
      button.onclick = (event) => {
        event.stopPropagation();
        const panelName = button.dataset.submenu;
        const submenu = document.querySelector(`[data-submenu-panel="${panelName}"]`);
        document.querySelectorAll('.table-submenu').forEach((menu) => {
          if (menu !== submenu) menu.classList.add('hidden');
        });
        if (submenu) submenu.classList.toggle('hidden');
      };
    });

    function getSelectedCells() {
      if (tableSelection && Array.isArray(tableSelection.cells) && tableSelection.cells.length) return tableSelection.cells;
      if (tableSelection && tableSelection.rowIndex !== undefined && tableSelection.colIndex !== null) {
        return [{ rowIndex: tableSelection.rowIndex, colIndex: tableSelection.colIndex }];
      }
      return [];
    }

    function selectCells(cells, targetCell) {
      tableSelection = { rowIndex: cells[0].rowIndex, colIndex: cells[0].colIndex, cells };
      const typeSelect = document.getElementById('table-data-type');
      if (typeSelect) typeSelect.value = state.cellTypes[`${cells[0].rowIndex}|${cells[0].colIndex}`] || state.columnTypes[cells[0].colIndex] || 'general';
      document.querySelectorAll('.table-selected-cell').forEach((cell) => cell.classList.remove('table-selected-cell'));
      cells.forEach(({ rowIndex, colIndex }) => {
        const cell = table.querySelector(`td[data-row-index="${rowIndex}"][data-col-index="${colIndex}"]`);
        if (cell) cell.classList.add('table-selected-cell');
      });
      if (targetCell) targetCell.classList.add('table-selected-cell');
    }

    function selectCompleteColumn(colIndex, targetCell) {
      const cells = state.data.map((row, rowIndex) => ({ rowIndex, colIndex }));
      selectCells(cells, targetCell);
    }

    function selectCompleteRow(rowIndex, targetCell) {
      const cells = state.columns.map((column, colIndex) => ({ rowIndex, colIndex }));
      selectCells(cells, targetCell);
    }

    idHeader.dataset.indexHeader = 'row-label';
    idHeader.title = 'Seleccionar toda la tabla';
    idHeader.addEventListener('click', () => {
      const cells = [];
      state.data.forEach((row, rowIndex) => {
        state.columns.forEach((column, colIndex) => cells.push({ rowIndex, colIndex }));
      });
      selectCells(cells, idHeader);
    });

    headerRow.querySelectorAll('th').forEach((header, headerIndex) => {
      if (headerIndex === 0) return;
      header.title = `Seleccionar columna ${getColumnLabel(headerIndex - 1)}`;
      header.addEventListener('click', () => selectCompleteColumn(headerIndex - 1, header));
    });

    const mergeMap = {};
    state.merges.forEach((merge) => {
      merge.cells.forEach((cell) => { mergeMap[`${cell.rowIndex}|${cell.colIndex}`] = merge; });
    });

    const normalizedSearch = tableSearchTerm.trim().toLocaleLowerCase();
    state.data.forEach((row, rowIndex) => {
      const searchableRow = [`${rowIndex}`.padStart(2, '0'), ...row].join(' ').toLocaleLowerCase();
      if (normalizedSearch && !searchableRow.includes(normalizedSearch)) return;

      const tr = document.createElement('tr');
      const idCell = document.createElement('td');
      idCell.style.border = `1px solid ${palette.border}`;
      idCell.style.padding = '4px 3px';
      idCell.style.width = '28px';
      idCell.style.background = palette.body;
      idCell.style.color = palette.indexText;
      idCell.style.fontWeight = '700';
      idCell.style.fontSize = '0.7rem';
      idCell.textContent = String(rowIndex).padStart(2, '0');
      idCell.title = `Seleccionar fila ${String(rowIndex).padStart(2, '0')}`;
      idCell.addEventListener('click', (event) => {
        event.stopPropagation();
        selectCompleteRow(rowIndex, idCell);
        hideContextMenu();
      });
      tr.appendChild(idCell);
      row.forEach((value, colIndex) => {
        const merge = mergeMap[`${rowIndex}|${colIndex}`];
        if (merge && (merge.rowIndex !== rowIndex || merge.colIndex !== colIndex)) return;
        const td = document.createElement('td');
        td.dataset.rowIndex = String(rowIndex);
        td.dataset.colIndex = String(colIndex);
        td.style.border = `1px solid ${palette.border}`;
        td.style.padding = '8px';
        td.style.background = state.cellStyles && state.cellStyles[`${rowIndex}|${colIndex}`] ? state.cellStyles[`${rowIndex}|${colIndex}`] : palette.body;
        if (merge) {
          td.rowSpan = merge.rowSpan;
          td.colSpan = merge.colSpan;
        }

        const input = document.createElement('input');
        input.type = 'text';
        input.value = value;
        input.placeholder = '...';
        input.style.width = '100%';
        input.style.minWidth = '120px';
        input.style.background = 'transparent';
        input.style.color = palette.text;
        input.style.border = 'none';
        const cellType = state.cellTypes[`${rowIndex}|${colIndex}`] || state.columnTypes[colIndex] || 'general';
        input.type = cellType === 'date' ? 'date' : cellType === 'time' ? 'time' : cellType === 'number' ? 'number' : 'text';
        input.addEventListener('input', (e) => {
          if (cellType === 'number' && e.target.value !== '' && Number.isNaN(Number(e.target.value))) {
            e.target.value = state.data[rowIndex][colIndex];
            showToast('Tipo de dato no válido');
            return;
          }
          const formulaKey = `${rowIndex}|${colIndex}`;
          const formulaValuesBefore = Object.keys(state.formulas).map((key) => `${key}:${state.data[key.split('|')[0]][key.split('|')[1]]}`);
          if (state.formulas[formulaKey]) delete state.formulas[formulaKey];
          state.data[rowIndex][colIndex] = e.target.value;
          recalculateFormulas(state);
          saveTableState(state);
          const formulaValuesAfter = Object.keys(state.formulas).map((key) => `${key}:${state.data[key.split('|')[0]][key.split('|')[1]]}`);
          if (formulaValuesBefore.join('|') !== formulaValuesAfter.join('|')) renderTableBuilder();
        });
        input.addEventListener('keydown', (event) => {
          if (event.key !== 'Enter' || !String(input.value).trim().startsWith('==')) return;
          event.preventDefault();
          openFormulaModal(String(input.value).trim(), [{ rowIndex, colIndex }]);
        });
        input.addEventListener('focus', () => {
          setTimeout(() => input.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' }), 150);
        });

        const showCellMenu = (e) => {
          e.preventDefault();
          tableSelection = { rowIndex, colIndex };
          setSelectedCell(rowIndex, colIndex, td);
          const contextMenu = document.getElementById('table-context-menu');
          if (!contextMenu) return;
          contextMenu.style.left = `${e.clientX}px`;
          contextMenu.style.top = `${e.clientY}px`;
          contextMenu.style.display = 'block';
          contextMenu.classList.remove('hidden');
          document.querySelectorAll('.table-submenu').forEach((menu) => menu.classList.add('hidden'));
        };

        input.addEventListener('contextmenu', showCellMenu);
        td.addEventListener('contextmenu', showCellMenu);
        td.addEventListener('click', (event) => {
          const previous = tableSelection && tableSelection.cells && tableSelection.cells[0];
          if (event.shiftKey && previous) {
            const minRow = Math.min(previous.rowIndex, rowIndex);
            const maxRow = Math.max(previous.rowIndex, rowIndex);
            const minCol = Math.min(previous.colIndex, colIndex);
            const maxCol = Math.max(previous.colIndex, colIndex);
            const cells = [];
            for (let selectedRow = minRow; selectedRow <= maxRow; selectedRow += 1) {
              for (let selectedCol = minCol; selectedCol <= maxCol; selectedCol += 1) cells.push({ rowIndex: selectedRow, colIndex: selectedCol });
            }
            selectCells(cells, td);
          } else {
            selectCells([{ rowIndex, colIndex }], td);
          }
          hideContextMenu();
        });

        td.appendChild(input);
        tr.appendChild(td);
      });

      const actionTd = document.createElement('td');
      actionTd.style.border = `1px solid ${palette.border}`;
      actionTd.style.padding = '8px';
      actionTd.style.background = palette.body;
      actionTd.style.textAlign = 'center';
      actionTd.innerHTML = '<span style="font-size: 1.2rem; opacity: 0.7; cursor: pointer;">⋮</span>';
      actionTd.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        tableSelection = { rowIndex, colIndex: null };
        const contextMenu = document.getElementById('table-context-menu');
        if (!contextMenu) return;
        contextMenu.style.left = `${e.clientX}px`;
        contextMenu.style.top = `${e.clientY}px`;
        contextMenu.style.display = 'block';
        contextMenu.classList.remove('hidden');
      });
      tr.appendChild(actionTd);
      tbody.appendChild(tr);
    });

    if (state.data.length === 0) {
      const emptyRow = document.createElement('tr');
      const emptyCell = document.createElement('td');
      emptyCell.colSpan = state.columns.length + 2;
      emptyCell.textContent = normalizedSearch ? 'No hay coincidencias' : 'Sin filas';
      emptyCell.style.padding = '18px';
      emptyCell.style.textAlign = 'center';
      emptyCell.style.background = palette.body;
      emptyCell.style.color = palette.text;
      emptyRow.appendChild(emptyCell);
      tbody.appendChild(emptyRow);
    }
  }

  function handleTableDocumentClick(event) {
    const isTableAction = event.target.closest('.table-menu-action') || event.target.closest('.table-menu-main') || event.target.closest('.table-submenu');
    const isCellClick = event.target.closest('td') || event.target.closest('th');
    if (!isTableAction && !isCellClick) {
      const contextMenu = document.getElementById('table-context-menu');
      if (contextMenu) {
        contextMenu.style.display = 'none';
        contextMenu.classList.add('hidden');
      }
      document.querySelectorAll('.table-submenu').forEach((menu) => menu.classList.add('hidden'));
    }
  }

  function closeTableContextMenu() {
    const contextMenu = document.getElementById('table-context-menu');
    if (contextMenu) {
      contextMenu.style.display = 'none';
      contextMenu.classList.add('hidden');
    }
    document.querySelectorAll('.table-submenu').forEach((menu) => menu.classList.add('hidden'));
  }

  document.getElementById('table-context-menu')?.addEventListener('click', (event) => {
    const button = event.target.closest('.table-menu-action');
    if (!button) return;

    event.stopPropagation();
    const action = button.dataset.action;
    const state = getTableState();
    const selectedCells = tableSelection && Array.isArray(tableSelection.cells) ? tableSelection.cells : [];

    if (action === 'delete' && selectedCells.length > 1) {
      selectedCells.forEach(({ rowIndex, colIndex }) => {
        state.data[rowIndex][colIndex] = '';
        delete state.formulas[`${rowIndex}|${colIndex}`];
      });
      saveTableState(state);
      renderTableBuilder();
      closeTableContextMenu();
      return;
    }

    if (action === 'add-column') {
      state.columns.push(`Columna ${state.columns.length + 1}`);
      state.data = state.data.map((row) => [...row, '']);
      saveTableState(state);
      renderTableBuilder();
      closeTableContextMenu();
      return;
    }

    if (action === 'add-row') {
      state.data.push(Array(state.columns.length || 1).fill(''));
      state.rows = state.data.length;
      saveTableState(state);
      renderTableBuilder();
      closeTableContextMenu();
      return;
    }

    if (action === 'clear-data') {
      state.data = state.data.map((row) => row.map(() => ''));
      state.cellStyles = {};
      saveTableState(state);
      renderTableBuilder();
      closeTableContextMenu();
      return;
    }

    if (action === 'clear-row' && tableSelection) {
      const selectedRows = [...new Set((selectedCells.length ? selectedCells : [tableSelection]).map((cell) => cell.rowIndex))];
      selectedRows.forEach((rowIndex) => { state.data[rowIndex] = state.data[rowIndex].map(() => ''); });
      Object.keys(state.cellStyles || {}).forEach((key) => {
        if (selectedRows.some((rowIndex) => key.startsWith(`${rowIndex}|`))) delete state.cellStyles[key];
      });
      Object.keys(state.formulas || {}).forEach((key) => {
        if (selectedRows.some((rowIndex) => key.startsWith(`${rowIndex}|`))) delete state.formulas[key];
      });
      saveTableState(state);
      renderTableBuilder();
      closeTableContextMenu();
      return;
    }

    if (action === 'clear-column' && tableSelection && tableSelection.colIndex !== null && tableSelection.colIndex !== undefined) {
      const selectedColumns = [...new Set((selectedCells.length ? selectedCells : [tableSelection]).map((cell) => cell.colIndex))];
      state.data.forEach((row) => { selectedColumns.forEach((colIndex) => { row[colIndex] = ''; }); });
      Object.keys(state.cellStyles || {}).forEach((key) => {
        if (selectedColumns.some((colIndex) => key.endsWith(`|${colIndex}`))) delete state.cellStyles[key];
      });
      Object.keys(state.formulas || {}).forEach((key) => {
        if (selectedColumns.some((colIndex) => key.endsWith(`|${colIndex}`))) delete state.formulas[key];
      });
      saveTableState(state);
      renderTableBuilder();
      closeTableContextMenu();
      return;
    }

    if (!tableSelection || tableSelection.colIndex === null || tableSelection.colIndex === undefined) {
      if (action === 'delete' && tableSelection) {
        const rowIndex = tableSelection.rowIndex;
        state.data.splice(rowIndex, 1);
        state.rows = state.data.length;
        saveTableState(state);
        renderTableBuilder();
      }
      const contextMenu = document.getElementById('table-context-menu');
      if (contextMenu) {
        contextMenu.style.display = 'none';
        contextMenu.classList.add('hidden');
      }
      return;
    }

    const rowIndex = tableSelection.rowIndex;
    const colIndex = tableSelection.colIndex;

    if (action === 'delete') {
      state.data[rowIndex][colIndex] = '';
      saveTableState(state);
      renderTableBuilder();
    }

    if (action === 'mark-yellow') {
      state.cellStyles = state.cellStyles || {};
      state.cellStyles[`${rowIndex}|${colIndex}`] = '#fef3c7';
      saveTableState(state);
      renderTableBuilder();
    }

    if (action === 'mark-green') {
      state.cellStyles = state.cellStyles || {};
      state.cellStyles[`${rowIndex}|${colIndex}`] = '#bbf7d0';
      saveTableState(state);
      renderTableBuilder();
    }

    if (action === 'mark-red') {
      state.cellStyles = state.cellStyles || {};
      state.cellStyles[`${rowIndex}|${colIndex}`] = '#fecaca';
      saveTableState(state);
      renderTableBuilder();
    }

    if (action === 'mark-orange') {
      state.cellStyles = state.cellStyles || {};
      state.cellStyles[`${rowIndex}|${colIndex}`] = '#fed7aa';
      saveTableState(state);
      renderTableBuilder();
    }

    if (action === 'mark-fuchsia') {
      state.cellStyles = state.cellStyles || {};
      state.cellStyles[`${rowIndex}|${colIndex}`] = '#fbcfe8';
      saveTableState(state);
      renderTableBuilder();
    }

    if (action === 'mark-purple') {
      state.cellStyles = state.cellStyles || {};
      state.cellStyles[`${rowIndex}|${colIndex}`] = '#ddd6fe';
      saveTableState(state);
      renderTableBuilder();
    }

    if (action === 'mark-blue') {
      state.cellStyles = state.cellStyles || {};
      state.cellStyles[`${rowIndex}|${colIndex}`] = '#bfdbfe';
      saveTableState(state);
      renderTableBuilder();
    }

    if (action === 'mark-brown') {
      state.cellStyles = state.cellStyles || {};
      state.cellStyles[`${rowIndex}|${colIndex}`] = '#e7d8c9';
      saveTableState(state);
      renderTableBuilder();
    }

    if (action === 'move-up') {
      if (rowIndex > 0) {
        [state.data[rowIndex][colIndex], state.data[rowIndex - 1][colIndex]] = [state.data[rowIndex - 1][colIndex], state.data[rowIndex][colIndex]];
        saveTableState(state);
        renderTableBuilder();
      }
    }

    if (action === 'move-down') {
      if (rowIndex < state.data.length - 1) {
        [state.data[rowIndex][colIndex], state.data[rowIndex + 1][colIndex]] = [state.data[rowIndex + 1][colIndex], state.data[rowIndex][colIndex]];
        saveTableState(state);
        renderTableBuilder();
      }
    }

    if (action === 'move-left') {
      if (colIndex > 0) {
        [state.data[rowIndex][colIndex], state.data[rowIndex][colIndex - 1]] = [state.data[rowIndex][colIndex - 1], state.data[rowIndex][colIndex]];
        saveTableState(state);
        renderTableBuilder();
      }
    }

    if (action === 'move-right') {
      if (colIndex < state.columns.length - 1) {
        [state.data[rowIndex][colIndex], state.data[rowIndex][colIndex + 1]] = [state.data[rowIndex][colIndex + 1], state.data[rowIndex][colIndex]];
        saveTableState(state);
        renderTableBuilder();
      }
    }

    const contextMenu = document.getElementById('table-context-menu');
    if (contextMenu) {
      contextMenu.style.display = 'none';
      contextMenu.classList.add('hidden');
    }
    document.querySelectorAll('.table-submenu').forEach((menu) => menu.classList.add('hidden'));
  });

  function requestTableName() {
    const state = getTableState();
    const requestedName = window.prompt('Nombre de la tabla', state.title === 'TABLE DATE' ? '' : state.title);
    if (requestedName === null) return null;
    state.title = requestedName.trim() || 'TABLE DATE';
    saveTableState(state);
    return state;
  }

  document.getElementById('table-search-input')?.addEventListener('input', (event) => {
    tableSearchTerm = event.target.value || '';
    renderTableBuilder();
    const searchInput = document.getElementById('table-search-input');
    if (searchInput) {
      searchInput.focus();
      searchInput.setSelectionRange(tableSearchTerm.length, tableSearchTerm.length);
    }
  });

  function getToolbarSelection() {
    if (tableSelection && Array.isArray(tableSelection.cells) && tableSelection.cells.length) return tableSelection.cells;
    if (tableSelection && tableSelection.rowIndex !== undefined && tableSelection.colIndex !== null) return [{ rowIndex: tableSelection.rowIndex, colIndex: tableSelection.colIndex }];
    return [];
  }

  function applyFormula(formula, cells) {
    const state = getTableState();
    const target = cells[0];
    const targetType = getCellDataType(state, target.rowIndex, target.colIndex);
    if (targetType !== 'general' && targetType !== 'number') return { ok: false, error: 'Las fórmulas solo funcionan en celdas General o Número.' };
    state.formulas[`${target.rowIndex}|${target.colIndex}`] = formula.trim();
    recalculateFormulas(state);
    const evaluated = evaluateFormula(formula, state);
    if (!evaluated.valid) {
      delete state.formulas[`${target.rowIndex}|${target.colIndex}`];
      return { ok: false, error: 'Fórmula no válida. Usa referencias numéricas y operadores +, -, * o /.' };
    }
    saveTableState(state);
    renderTableBuilder();
    showToast('Fórmula aplicada');
    return { ok: true };
  }

  function openFormulaModal(initialValue = '==(', targetCells = getToolbarSelection()) {
    if (targetCells.length !== 1) {
      showToast('Selecciona una celda para el resultado');
      return;
    }
    const formulaModal = document.getElementById('formula-modal');
    const formulaInput = document.getElementById('formula-input');
    const formulaError = document.getElementById('formula-error');
    if (!formulaModal || !formulaInput) return;
    formulaModal.dataset.targetCells = JSON.stringify(targetCells);
    formulaInput.value = initialValue;
    if (formulaError) formulaError.textContent = '';
    formulaModal.classList.add('open');
    formulaModal.setAttribute('aria-hidden', 'false');
    setTimeout(() => {
      formulaInput.focus();
      formulaInput.select();
    }, 0);
  }

  function closeFormulaModal() {
    const formulaModal = document.getElementById('formula-modal');
    if (!formulaModal) return;
    formulaModal.classList.remove('open');
    formulaModal.setAttribute('aria-hidden', 'true');
  }

  document.getElementById('btn-apply-formula')?.addEventListener('click', () => {
    const formulaModal = document.getElementById('formula-modal');
    const formulaInput = document.getElementById('formula-input');
    const formulaError = document.getElementById('formula-error');
    if (!formulaModal || !formulaInput) return;
    const formula = formulaInput.value.trim();
    const targetCells = JSON.parse(formulaModal.dataset.targetCells || '[]');
    const formulaResult = applyFormula(formula, targetCells);
    if (!formulaResult.ok) {
      if (formulaError) formulaError.textContent = formulaResult.error;
      formulaInput.focus();
      return;
    }
    closeFormulaModal();
  });

  document.getElementById('formula-input')?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      document.getElementById('btn-apply-formula')?.click();
    }
  });
  document.getElementById('btn-close-formula')?.addEventListener('click', closeFormulaModal);
  document.getElementById('btn-cancel-formula')?.addEventListener('click', closeFormulaModal);

  document.getElementById('table-data-type')?.addEventListener('change', (event) => {
    const cells = getToolbarSelection();
    if (!cells.length) {
      showToast('Selecciona una celda primero');
      event.target.value = 'general';
      return;
    }
    const state = getTableState();
    const selectedType = event.target.value;
    cells.forEach(({ rowIndex, colIndex }) => {
      state.cellTypes = state.cellTypes || {};
      state.cellTypes[`${rowIndex}|${colIndex}`] = selectedType;
      if (selectedType !== 'general' && selectedType !== 'number') delete state.formulas[`${rowIndex}|${colIndex}`];
      if (!state.data[rowIndex][colIndex]) {
        if (selectedType === 'date') state.data[rowIndex][colIndex] = new Date().toISOString().slice(0, 10);
        if (selectedType === 'time') state.data[rowIndex][colIndex] = new Date().toTimeString().slice(0, 5);
      }
    });
    saveTableState(state);
    renderTableBuilder();
  });

  document.getElementById('btn-merge-cells')?.addEventListener('click', () => {
    const cells = getToolbarSelection();
    if (cells.length < 2) {
      const state = getTableState();
      const selected = cells[0];
      const mergeIndex = selected ? state.merges.findIndex((merge) => merge.cells.some((cell) => cell.rowIndex === selected.rowIndex && cell.colIndex === selected.colIndex)) : -1;
      if (mergeIndex >= 0) {
        state.merges.splice(mergeIndex, 1);
        saveTableState(state);
        renderTableBuilder();
        showToast('Celdas descombinadas');
        return;
      }
      showToast('Selecciona dos o más celdas contiguas');
      return;
    }
    const state = getTableState();
    const selectedMergeIndex = state.merges.findIndex((merge) => merge.cells.some((cell) => cells.some((selected) => selected.rowIndex === cell.rowIndex && selected.colIndex === cell.colIndex)));
    if (selectedMergeIndex >= 0) {
      state.merges.splice(selectedMergeIndex, 1);
      saveTableState(state);
      renderTableBuilder();
      showToast('Celdas descombinadas');
      return;
    }
    const rowIndexes = cells.map((cell) => cell.rowIndex);
    const colIndexes = cells.map((cell) => cell.colIndex);
    const minRow = Math.min(...rowIndexes);
    const maxRow = Math.max(...rowIndexes);
    const minCol = Math.min(...colIndexes);
    const maxCol = Math.max(...colIndexes);
    const expected = (maxRow - minRow + 1) * (maxCol - minCol + 1);
    if (expected !== cells.length || state.merges.some((merge) => merge.cells.some((cell) => cells.some((selected) => selected.rowIndex === cell.rowIndex && selected.colIndex === cell.colIndex)))) {
      showToast('Las celdas deben estar juntas y sin combinar');
      return;
    }
    state.merges.push({ rowIndex: minRow, colIndex: minCol, rowSpan: maxRow - minRow + 1, colSpan: maxCol - minCol + 1, cells });
    saveTableState(state);
    renderTableBuilder();
  });

  document.getElementById('btn-formula')?.addEventListener('click', () => {
    openFormulaModal();
  });

  document.getElementById('btn-back-to-home')?.addEventListener('click', () => {
    if (document.getElementById('exc-table-page')) {
      window.location.href = 'index.html';
      return;
    }
    showHomeSelector();
  });

  document.getElementById('btn-add-table-column')?.addEventListener('click', () => {
    const state = getTableState();
    state.columns.push(`Columna ${state.columns.length + 1}`);
    state.data = state.data.map((row) => [...row, '']);
    saveTableState(state);
    renderTableBuilder();
  });

  document.getElementById('btn-add-table-row')?.addEventListener('click', () => {
    const state = getTableState();
    const columnCount = state.columns.length || 1;
    state.data.push(Array(columnCount).fill(''));
    state.rows = state.data.length;
    saveTableState(state);
    renderTableBuilder();
  });

  const resetTableModal = document.getElementById('reset-table-modal');

  function showResetTableModal() {
    if (resetTableModal) {
      resetTableModal.classList.add('open');
      resetTableModal.style.display = 'flex';
    }
  }

  function hideResetTableModal() {
    if (resetTableModal) {
      resetTableModal.classList.remove('open');
      resetTableModal.style.display = 'none';
    }
  }

  document.getElementById('btn-reset-table')?.addEventListener('click', showResetTableModal);
  document.getElementById('btn-reset-confirm-no')?.addEventListener('click', hideResetTableModal);
  document.getElementById('btn-reset-confirm-yes')?.addEventListener('click', () => {
    resetTableData();
    hideResetTableModal();
  });

  if (document.getElementById('exc-table-page')) {
    document.documentElement.classList.add('table-view-mode');
    renderTableBuilder();
  }

  function descargarBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      link.remove();
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function exportTableState(stateToExport, requestedName = '') {
    const state = ensureTableData(JSON.parse(JSON.stringify(stateToExport)));
    const title = (state.title || requestedName || 'TABLE DATE').toUpperCase();
    const safeName = (requestedName || state.title || 'table_date').trim().replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_').toLowerCase() || 'table_date';
    const escapeExcelValue = (value) => {
      const escaped = String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return escaped || '&nbsp;';
    };

    const tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; margin: 0; }
          table { border-collapse: collapse; width: 100%; table-layout: fixed; background: #d9f0c6; }
          th, td { width: 140px; height: 30px; border: 1px solid #6d7d5b; padding: 8px 10px; text-align: left; vertical-align: top; font-size: 12px; color: #1b2d12; }
          th { background: #bfe68d; font-weight: bold; }
          td { background: #edf9d5; }
        </style>
      </head>
      <body>
        <div style="font-weight:bold; font-size:18px; padding: 10px 0 8px; color: #1b2d12;">${title}</div>
        <table>
          <tr>
            <th style="width: 55px; height: 30px; border: 1px solid #6d7d5b; background: #bfe68d; padding: 8px 10px;">ID</th>
            ${state.columns.map((cell) => `<th style="width: 140px; height: 30px; border: 1px solid #6d7d5b; background: #bfe68d; padding: 8px 10px;">${escapeExcelValue(cell)}</th>`).join('')}
          </tr>
          ${state.data.map((row, rowIndex) => `
            <tr>
              <td style="width: 55px; height: 30px; border: 1px solid #6d7d5b; background: #edf9d5; padding: 8px 10px;">${String(rowIndex).padStart(2, '0')}</td>
              ${row.map((cell, colIndex) => {
                const key = `${rowIndex}|${colIndex}`;
                const background = state.cellStyles && state.cellStyles[key] ? state.cellStyles[key] : '#edf9d5';
                return `<td style="width: 140px; height: 30px; border: 1px solid #6d7d5b; background: ${background}; padding: 8px 10px;">${escapeExcelValue(cell)}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
    descargarBlob(blob, `${safeName}.xls`);
    showToast('Archivo Excel descargado');
  }

  function exportTableToCsv() {
    exportTableState(getTableState());
  }

  document.getElementById('btn-save-table')?.addEventListener('click', () => {
    const namedState = requestTableName();
    if (!namedState) return;
    const state = ensureTableData(namedState);
    const savedTable = {
      type: 'table',
      title: state.title || 'TABLE DATE',
      body: `Tabla guardada: ${state.title || 'TABLE DATE'}`,
      tableData: JSON.parse(JSON.stringify(state)),
      date: new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })
    };
    notes.unshift(savedTable);
    saveNotesToStorage();
    renderNotesList();
    showToast('Tabla guardada en Notas');
  });

  document.getElementById('btn-export-table')?.addEventListener('click', () => {
    const namedState = requestTableName();
    if (!namedState) return;
    if (document.getElementById('exc-table-page')) {
      exportTableState(namedState, namedState.title);
      return;
    }
    window.location.href = 'exc.html';
  });

  const dynamicFieldsContainer = document.getElementById('dynamic-fields-container');
  const dynamicNotesContainer = document.getElementById('dynamic-notes-container');
  const dynamicInstitutionsContainer = document.getElementById('dynamic-institutions-container');
  const dynamicFormatoFieldsContainer = document.getElementById('dynamic-formato-fields-container');
  const fmtFieldType = document.getElementById('fmt-field-type');
  const fmtTituloSuperior = document.getElementById('fmt-ciudad');
  const fmtTituloInferior = document.getElementById('fmt-lema');

  attachDragAndDropEvents(dynamicFieldsContainer);
  attachDragAndDropEvents(dynamicNotesContainer);
  attachDragAndDropEvents(dynamicInstitutionsContainer);
  attachDragAndDropEvents(dynamicFormatoFieldsContainer);

  const btnAddField = document.getElementById('btn-add-field');
  const btnAddNote = document.getElementById('btn-add-note');
  const btnAddInstitution = document.getElementById('btn-add-institution');
  const btnCreate = document.getElementById('btn-create');
  const btnAddFormatoField = document.getElementById('btn-add-formato-field');
  const btnCreateFormato = document.getElementById('btn-create-formato');

  const modalPreview = document.getElementById('modal-preview');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const minutaOutput = document.getElementById('minuta-output');

  function setDefaultDateTime() {
    const now = new Date();
    const defaultDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (inputs.fecha && !inputs.fecha.value) {
      inputs.fecha.value = defaultDate;
    }
    if (inputs.hora && !inputs.hora.value) {
      inputs.hora.value = defaultTime;
    }

    return { defaultDate, defaultTime };
  }

  const { defaultDate, defaultTime } = setDefaultDateTime();

  if (inputs.fecha) {
    inputs.fecha.addEventListener('focus', setDefaultDateTime);
  }
  if (inputs.hora) {
    inputs.hora.addEventListener('focus', setDefaultDateTime);
  }

  // FUNCIÓN PARA CREAR CUALQUIER EXTRA
  function createDynamicRow(container, innerHTML) {
    const row = document.createElement('div');
    row.className = 'dynamic-field-row locked';
    row.setAttribute('draggable', 'false');

    row.innerHTML = `
      ${innerHTML}
      <div class="dynamic-row-actions">
        <button type="button" class="btn-toggle-drag" title="Bloquear / Desbloquear para mover">
          <i data-lucide="lock"></i>
        </button>
        <button type="button" class="btn-remove-field" title="Eliminar">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    `;

    container.appendChild(row);
    container.scrollTop = container.scrollHeight;
    refreshIcons();

    // Eliminar
    row.querySelector('.btn-remove-field').addEventListener('click', () => row.remove());

    // Botón alternar candado/mover
    const btnToggle = row.querySelector('.btn-toggle-drag');
    btnToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isLocked = row.classList.contains('locked');
      
      if (isLocked) {
        row.classList.remove('locked');
        row.classList.add('unlocked');
        row.setAttribute('draggable', 'true');
        btnToggle.innerHTML = '<i data-lucide="move"></i>';
      } else {
        row.classList.remove('unlocked', 'dragging');
        row.classList.add('locked');
        row.setAttribute('draggable', 'false');
        btnToggle.innerHTML = '<i data-lucide="lock"></i>';
      }
      refreshIcons();
    });

    return row;
  }

  if (btnAddField) {
    btnAddField.addEventListener('click', () => {
      const html = `
        <div class="form-group">
          <label>Título Campo</label>
          <input type="text" class="extra-title" placeholder="Ej: NOVEDAD">
        </div>
        <div class="form-group">
          <label>Contenido</label>
          <input type="text" class="extra-value" placeholder="Información">
        </div>
      `;
      createDynamicRow(dynamicFieldsContainer, html);
    });
  }

  if (btnAddNote) {
    btnAddNote.addEventListener('click', () => {
      const html = `
        <div class="form-group">
          <label>Nota Adicional</label>
          <input type="text" class="extra-value" placeholder="Escriba la nota aquí...">
        </div>
      `;
      createDynamicRow(dynamicNotesContainer, html);
    });
  }

  if (btnAddInstitution) {
    btnAddInstitution.addEventListener('click', () => {
      const html = `
        <div class="form-group">
          <label>Institución</label>
          <input type="text" class="extra-title" placeholder="Ej: DIP">
        </div>
        <div class="form-group">
          <label>Cantidad</label>
          <input type="text" class="extra-value" placeholder="Ej: 02">
        </div>
      `;
      createDynamicRow(dynamicInstitutionsContainer, html);
    });
  }

  function createFormatoField(type) {
    let rowHtml = '';
    let labelText = '';

    if (type === 'titulo') {
      labelText = 'TÍTULO';
      rowHtml = `
        <div class="form-group"><label>${labelText}</label></div>
        <div class="form-group"><input type="text" class="extra-value" placeholder="Escribe el título..."></div>
      `;
    } else if (type === 'fecha') {
      labelText = 'FECHA';
      rowHtml = `
        <div class="form-group"><label>${labelText}</label></div>
        <div class="form-group"><input type="date" class="extra-value" value="${defaultDate}"></div>
      `;
    } else if (type === 'hora') {
      labelText = 'HORA';
      rowHtml = `
        <div class="form-group"><label>${labelText}</label></div>
        <div class="form-group"><input type="time" class="extra-value" value="${defaultTime}"></div>
      `;
    } else if (type === 'informa') {
      labelText = 'INFORMA';
      rowHtml = `
        <div class="form-group"><label>${labelText}</label></div>
        <div class="form-group"><input type="text" class="extra-value" placeholder="Quién informa..."></div>
      `;
    } else if (type === 'resumen') {
      labelText = 'RESUMEN';
      rowHtml = `
        <div class="form-group"><label>${labelText}</label></div>
        <div class="form-group"><textarea class="extra-value" rows="3" placeholder="Escribe el resumen..."></textarea></div>
      `;
    } else if (type === 'nota') {
      labelText = 'NOTA OBSERVACIÓN';
      rowHtml = `
        <div class="form-group"><label>${labelText}</label></div>
        <div class="form-group"><textarea class="extra-value" rows="3" placeholder="Escribe la nota u observación..."></textarea></div>
      `;
    } else if (type === 'instituto') {
      labelText = 'INSTITUTO';
      rowHtml = `
        <div class="form-group"><label>${labelText}</label></div>
        <div class="form-group"><input type="text" class="extra-value" placeholder="Institución..."></div>
      `;
    } else if (type === 'personalizado') {
      labelText = 'PERSONALIZADO';
      rowHtml = `
        <div class="form-group"><label>Etiqueta</label><input type="text" class="extra-title" placeholder="Nombre del campo..."></div>
        <div class="form-group"><label>Valor</label><input type="text" class="extra-value" placeholder="Contenido..."></div>
      `;
    } else if (type === 'extra') {
      labelText = 'EXTRA';
      rowHtml = `
        <div class="form-group">
          <label>Título Campo</label>
          <input type="text" class="extra-title" placeholder="Ej: NOVEDAD">
        </div>
        <div class="form-group">
          <label>Contenido</label>
          <input type="text" class="extra-value" placeholder="Información...">
        </div>
      `;
    } else {
      labelText = 'EXTRA';
      rowHtml = `
        <div class="form-group"><label>${labelText}</label></div>
        <div class="form-group"><input type="text" class="extra-value" placeholder="Información..."></div>
      `;
    }

    const row = createDynamicRow(dynamicFormatoFieldsContainer, rowHtml);
    row.dataset.formatType = type;
    row.dataset.fieldLabel = labelText;
  }

  if (fmtFieldType) {
    fmtFieldType.addEventListener('change', (e) => {
      const selectedType = e.target.value;
      if (!selectedType) return;
      createFormatoField(selectedType);
      e.target.value = '';
    });
  }

  if (btnAddFormatoField) {
    btnAddFormatoField.addEventListener('click', () => {
      createFormatoField('extra');
    });
  }

  // PLANTILLAS
  document.querySelectorAll('.btn-use-template').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const type = e.currentTarget.getAttribute('data-type');
      if (modalTemplates) modalTemplates.classList.remove('open');
      if (dynamicFieldsContainer) dynamicFieldsContainer.innerHTML = '';
      if (dynamicNotesContainer) dynamicNotesContainer.innerHTML = '';
      if (dynamicInstitutionsContainer) dynamicInstitutionsContainer.innerHTML = '';

      if (type === 'police') {
        inputs.ciudad.value = 'CARACAS - CPNB';
        inputs.lugar.value = 'PUNTO DE CONTROL VIAL';
        inputs.informa.value = localStorage.getItem('app_user_name') || 'OFICIAL ROMERO';
        inputs.resumen.value = 'Se realizó inspección preventiva a vehículos y verificación de ciudadanos mediante sistema de verificación de antecedentes, sin novedades de impacto.';
        inputs.lema.value = 'PROTEGER Y DEFENDER';
      } else if (type === 'tech') {
        inputs.ciudad.value = 'SOPORTE IT';
        inputs.lugar.value = 'SERVIDOR CENTRAL / RACK 2';
        inputs.informa.value = localStorage.getItem('app_user_name') || 'TÉCNICO DE SISTEMAS';
        inputs.resumen.value = 'Diagnóstico y corrección de bucle de arranque en firmware BIOS. Sustitución de unidad SSD defectuosa y restauración completa del sistema.';
        inputs.lema.value = 'SOPORTE OPERATIVO GARANTIZADO';
      } else if (type === 'business') {
        inputs.ciudad.value = 'OFICINA CENTRAL';
        inputs.lugar.value = 'SALA DE CONFERENCIAS';
        inputs.informa.value = localStorage.getItem('app_user_name') || 'GERENCIA DE OPERACIONES';
        inputs.resumen.value = 'Reunión de seguimiento mensual de proyectos web. Evaluación de entregables y asignación de presupuesto para desarrollo frontend.';
        inputs.lema.value = 'EXCELENCIA CORPORATIVA';
      } else if (type === 'admin') {
        inputs.ciudad.value = 'GERENCIA ADMINISTRATIVA';
        inputs.lugar.value = 'OFICINA CENTRAL';
        inputs.informa.value = localStorage.getItem('app_user_name') || 'COORDINADOR ADMINISTRATIVO';
        inputs.resumen.value = 'Seguimiento de documentos, control de pagos y revisión de trámites administrativos con cumplimiento de los tiempos establecidos.';
        inputs.lema.value = 'ORDEN Y CONTROL';
      } else if (type === 'rrhh') {
        inputs.ciudad.value = 'DEPARTAMENTO DE RRHH';
        inputs.lugar.value = 'ÁREA DE TALENTO HUMANO';
        inputs.informa.value = localStorage.getItem('app_user_name') || 'ANALISTA RRHH';
        inputs.resumen.value = 'Revisión de procesos de contratación, seguimiento de personal y evaluación de cumplimiento de políticas internas.';
        inputs.lema.value = 'PERSONAL ALTAMENTE COMPETENTE';
      } else if (type === 'operations') {
        inputs.ciudad.value = 'ÁREA DE OPERACIONES';
        inputs.lugar.value = 'PLANTA DE PRODUCCIÓN';
        inputs.informa.value = localStorage.getItem('app_user_name') || 'SUPERVISOR OPERATIVO';
        inputs.resumen.value = 'Control de procesos productivos, cumplimiento de metas diarias y revisión de condiciones operativas del turno.';
        inputs.lema.value = 'EFICIENCIA OPERATIVA';
      } else if (type === 'safety') {
        inputs.ciudad.value = 'SEGURIDAD INTERNA';
        inputs.lugar.value = 'PUNTO DE CONTROL';
        inputs.informa.value = localStorage.getItem('app_user_name') || 'ENCARGADO DE SEGURIDAD';
        inputs.resumen.value = 'Monitoreo preventivo de accesos, revisión de protocolos y seguimiento de medidas de protección del área.';
        inputs.lema.value = 'PROTECCIÓN Y PREVENCIÓN';
      } else if (type === 'education') {
        inputs.ciudad.value = 'DEPARTAMENTO ACADÉMICO';
        inputs.lugar.value = 'AULA MAGNA';
        inputs.informa.value = localStorage.getItem('app_user_name') || 'DOCENTE RESPONSABLE';
        inputs.resumen.value = 'Revisión de contenidos, seguimiento de actividades pedagógicas y coordinación de procesos de formación.';
        inputs.lema.value = 'FORMACIÓN CON CALIDAD';
      }
      navItems[0].click();
    });
  });

  function renderMinuta() {
    let extraFieldsText = '';
    dynamicFieldsContainer.querySelectorAll('.dynamic-field-row').forEach(row => {
      const titleInput = row.querySelector('.extra-title');
      const valInput = row.querySelector('.extra-value');
      if (titleInput && valInput && titleInput.value.trim() !== '') {
        extraFieldsText += `${titleInput.value.trim().toUpperCase()}: ${valInput.value.toUpperCase()}\n\n`;
      }
    });

    let extraNotesText = '';
    dynamicNotesContainer.querySelectorAll('.dynamic-field-row').forEach(row => {
      const valInput = row.querySelector('.extra-value');
      if (valInput && valInput.value.trim() !== '') {
        extraNotesText += `NOTA: ${valInput.value.toUpperCase()}\n\n`;
      }
    });

    let extraInstitutionsText = '';
    dynamicInstitutionsContainer.querySelectorAll('.dynamic-field-row').forEach(row => {
      const titleInput = row.querySelector('.extra-title');
      const valInput = row.querySelector('.extra-value');
      if (titleInput && valInput && titleInput.value.trim() !== '') {
        extraInstitutionsText += `${titleInput.value.trim().toUpperCase()} (${valInput.value.trim().toUpperCase()})\n`;
      }
    });

    let formattedDate = inputs.fecha.value;
    if (inputs.fecha.value) {
      const parts = inputs.fecha.value.split('-');
      if (parts.length === 3) formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    const valCiudad = inputs.ciudad.value.trim() ? inputs.ciudad.value.toUpperCase() : '';
    const valLugar = inputs.lugar.value.trim() ? inputs.lugar.value.toUpperCase() : '';
    const valInforma = inputs.informa.value.trim() ? inputs.informa.value.toUpperCase() : '';
    const valResumen = inputs.resumen.value.trim() ? normalizeSummaryText(inputs.resumen.value) : '';
    const valLema = inputs.lema.value.trim() ? inputs.lema.value.toUpperCase() : '';

    minutaOutput.innerText = `${valCiudad}\n\nFECHA: ${formattedDate}\n\nHORA: ${inputs.hora.value}\n\nLUGAR: ${valLugar}\n\nINFORMA: ${valInforma}\n\n${extraFieldsText}RESUMEN:\n${valResumen}\n\n${extraNotesText}${extraInstitutionsText}\n${valLema}`;
  }

  function renderFormato() {
    let formatoText = '';
    if (fmtTituloSuperior && fmtTituloSuperior.value.trim()) {
      formatoText += `${fmtTituloSuperior.value.trim().toUpperCase()}\n\n`;
    }

    if (!dynamicFormatoFieldsContainer) {
      minutaOutput.innerText = formatoText;
      return;
    }

    dynamicFormatoFieldsContainer.querySelectorAll('.dynamic-field-row').forEach(row => {
      const titleInput = row.querySelector('.extra-title, input.extra-title, textarea.extra-title');
      const valueInput = row.querySelector('input.extra-value, textarea.extra-value');
      const dataLabel = row.dataset.fieldLabel || '';
      let label = '';

      if (titleInput && titleInput.value.trim()) {
        label = titleInput.value.trim().toUpperCase();
      } else if (dataLabel && dataLabel !== 'EXTRA') {
        label = dataLabel.trim().toUpperCase();
      } else {
        const firstLabel = row.querySelector('label')?.innerText || '';
        label = firstLabel.trim().toUpperCase();
      }

      if (!label || !valueInput) return;
      const value = valueInput.value.trim();
      if (!value) return;

      if (valueInput.type === 'date' && value) {
        const parts = value.split('-');
        formatoText += `${label}: ${parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : value}\n`;
      } else if (valueInput.type === 'time' && value) {
        formatoText += `${label}: ${value}\n`;
      } else {
        formatoText += `${label}: ${value}\n`;
      }
    });

    if (fmtTituloInferior && fmtTituloInferior.value.trim()) {
      formatoText += `\n${fmtTituloInferior.value.trim().toUpperCase()}`;
    }

    minutaOutput.innerText = formatoText;
  }

  async function guardarMinutaLocal(datosMinuta) {
    const key = 'creatorMinut_local_minutas';
    const guardadas = JSON.parse(localStorage.getItem(key) || '[]');
    guardadas.unshift({
      ...datosMinuta,
      fechaGuardado: new Date().toISOString()
    });
    localStorage.setItem(key, JSON.stringify(guardadas.slice(0, 25)));
    return { status: 'ok', localOnly: true };
  }

  if (btnCreate) {
    btnCreate.addEventListener('click', async () => {
      renderMinuta();
      if (modalPreview) modalPreview.classList.add('open');

      const datosMinuta = {
        ciudad: inputs.ciudad.value.trim(),
        fecha: inputs.fecha.value,
        hora: inputs.hora.value,
        lugar: inputs.lugar.value.trim(),
        informa: inputs.informa.value.trim(),
        resumen: normalizeSummaryText(inputs.resumen.value.trim()),
        lema: inputs.lema.value.trim()
      };

      const localResult = await guardarMinutaLocal(datosMinuta);
      if (localResult.status === 'ok') {
        showToast('Minuta guardada en este dispositivo');
      }
    });
  }

  const btnSaveMinutaNote = document.getElementById('btn-save-minuta-note');

  function showToast(message) {
    const toast = document.getElementById('toast-message');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('hidden');
    toast.classList.add('visible');
    setTimeout(() => {
      toast.classList.remove('visible');
      toast.classList.add('hidden');
    }, 2200);
  }

  function hasFormatoContent() {
    if (fmtTituloSuperior && fmtTituloSuperior.value.trim()) return true;
    if (fmtTituloInferior && fmtTituloInferior.value.trim()) return true;

    const rows = dynamicFormatoFieldsContainer ? dynamicFormatoFieldsContainer.querySelectorAll('.dynamic-field-row') : [];
    return Array.from(rows).some(row => {
      const titleInput = row.querySelector('.extra-title');
      const valueInput = row.querySelector('input.extra-value, textarea.extra-value');
      return valueInput && valueInput.value.trim();
    });
  }

  if (btnCreateFormato) {
    btnCreateFormato.addEventListener('click', () => {
      if (!hasFormatoContent()) {
        showToast('No has rellenado la minuta');
        return;
      }
      renderFormato();
      if (modalPreview) modalPreview.classList.add('open');
    });
  }

  if (btnSaveMinutaNote) {
    btnSaveMinutaNote.addEventListener('click', async () => {
      if (!minutaOutput || !minutaOutput.innerText.trim()) {
        showToast('No hay minuta generada para guardar');
        return;
      }

      const title = fmtTituloSuperior && fmtTituloSuperior.value.trim()
        ? fmtTituloSuperior.value.trim()
        : 'Minuta Guardada';
      const body = minutaOutput.innerText.trim();

      if (!noteTitleInput || !noteBodyInput || !btnSaveNote) return;

      noteTitleInput.value = title;
      noteBodyInput.value = body;
      btnSaveNote.click();
      showToast('Minuta guardada en Bloc');
      if (modalPreview) modalPreview.classList.remove('open');
      activateTab('view-bloc');
    });
  }

  if (btnCloseModal) {
    btnCloseModal.addEventListener('click', () => {
      if (modalPreview) modalPreview.classList.remove('open');
    });
  }

  const btnCopy = document.getElementById('btn-copy');
  const btnDownloadMinutaImage = document.getElementById('btn-download-minuta-image');
  const btnExportCsv = document.getElementById('btn-export-csv');
  const btnShare = document.getElementById('btn-share');

  function exportMinutaAsCsv() {
    const rows = [
      ['Campo', 'Valor']
    ];

    const addRow = (label, value) => {
      rows.push([label, String(value ?? '').replace(/\n/g, ' | ') ]);
    };

    addRow('Título superior', inputs.ciudad.value.trim());
    addRow('Fecha', inputs.fecha.value ? new Date(`${inputs.fecha.value}T00:00:00`).toLocaleDateString('es-ES') : '');
    addRow('Hora', inputs.hora.value);
    addRow('Lugar', inputs.lugar.value.trim());
    addRow('Informa', inputs.informa.value.trim());
    addRow('Resumen', normalizeSummaryText(inputs.resumen.value.trim()));
    addRow('Título inferior', inputs.lema.value.trim());

    dynamicFieldsContainer?.querySelectorAll('.dynamic-field-row').forEach(row => {
      const titleInput = row.querySelector('.extra-title');
      const valInput = row.querySelector('.extra-value');
      if (titleInput && valInput) {
        const title = titleInput.value.trim();
        const value = valInput.value.trim();
        if (title || value) addRow(title || 'Campo adicional', value);
      }
    });

    const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'minuta_general.csv';
    link.click();
    URL.revokeObjectURL(url);
    showToast('Archivo CSV descargado');
  }

  if (btnCopy) {
    btnCopy.addEventListener('click', async () => {
      if (minutaOutput && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(minutaOutput.innerText);
        showToast('Minuta copiada al portapapeles');
      }
    });
  }

  if (btnDownloadMinutaImage) {
    btnDownloadMinutaImage.addEventListener('click', () => {
      if (!minutaOutput || !window.html2canvas) {
        showToast('No se puede generar imagen de la minuta.');
        return;
      }
      window.html2canvas(minutaOutput, { scale: 2 }).then(canvas => {
        descargarBlob(dataUrlToBlob(canvas.toDataURL('image/png')), `minuta_${Date.now()}.png`);
      }).catch(() => {
        showToast('Error al generar la imagen.');
      });
    });
  }

  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', () => {
      const hasData = inputs.ciudad.value.trim() || inputs.resumen.value.trim() || inputs.informa.value.trim();
      if (!hasData) {
        showToast('No hay datos para exportar');
        return;
      }
      exportMinutaAsCsv();
    });
  }

  if (btnShare) {
    btnShare.addEventListener('click', async () => {
      const textToShare = minutaOutput ? minutaOutput.innerText : '';
      if (navigator.share) {
        try {
          await navigator.share({ title: 'Minuta Operacional', text: textToShare });
        } catch (err) {
          if (err.name !== 'AbortError' && navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(textToShare);
            alert('Minuta copiada al portapapeles.');
          }
        }
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToShare);
        alert('Texto copiado al portapapeles.');
      }
    });
  }

  // --- BLOC DE NOTAS ---
  const noteTitleInput = document.getElementById('note-title');
  const noteBodyInput = document.getElementById('note-body');
  const btnSaveNote = document.getElementById('btn-save-note');
  const savedNotesList = document.getElementById('saved-notes-list');

  let notes = JSON.parse(localStorage.getItem('app_saved_notes') || '[]');

  function saveNotesToStorage() { localStorage.setItem('app_saved_notes', JSON.stringify(notes)); }

  function createSavedTablePreview(tableData) {
    const preview = document.createElement('div');
    preview.className = 'saved-table-preview';
    const table = document.createElement('table');
    const head = document.createElement('thead');
    const body = document.createElement('tbody');
    const visibleColumns = tableData.columns.slice(0, 6);
    const headerRow = document.createElement('tr');
    ['ID', ...visibleColumns].forEach((column) => {
      const cell = document.createElement('th');
      cell.textContent = column;
      headerRow.appendChild(cell);
    });
    head.appendChild(headerRow);

    tableData.data.slice(0, 5).forEach((row, rowIndex) => {
      const tableRow = document.createElement('tr');
      [String(rowIndex).padStart(2, '0'), ...row.slice(0, 6)].forEach((value) => {
        const cell = document.createElement('td');
        cell.textContent = value || '...';
        tableRow.appendChild(cell);
      });
      body.appendChild(tableRow);
    });

    table.append(head, body);
    preview.appendChild(table);
    return preview;
  }

  function dataUrlToBlob(dataUrl) {
    const [header, data] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)[1];
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return new Blob([bytes], { type: mime });
  }

  function exportTablePdf(tableData, fileName) {
    if (!window.html2pdf) {
      showToast('No se pudo preparar el PDF');
      return;
    }

    const state = ensureTableData(JSON.parse(JSON.stringify(tableData)));
    const exportSurface = document.createElement('div');
    exportSurface.className = 'table-image-export-surface';
    const title = document.createElement('h2');
    title.textContent = state.title || 'TABLE DATE';
    exportSurface.appendChild(title);

    const table = document.createElement('table');
    const headerRow = document.createElement('tr');
    ['ID', ...state.columns].forEach((column) => {
      const cell = document.createElement('th');
      cell.textContent = column;
      headerRow.appendChild(cell);
    });
    table.appendChild(headerRow);

    state.data.forEach((row, rowIndex) => {
      const tableRow = document.createElement('tr');
      [String(rowIndex).padStart(2, '0'), ...row].forEach((value, colIndex) => {
        const cell = document.createElement('td');
        const styleKey = colIndex > 0 ? `${rowIndex}|${colIndex - 1}` : '';
        if (styleKey && state.cellStyles && state.cellStyles[styleKey]) {
          cell.style.backgroundColor = state.cellStyles[styleKey];
        }
        cell.textContent = value || '...';
        tableRow.appendChild(cell);
      });
      table.appendChild(tableRow);
    });

    exportSurface.appendChild(table);
    document.body.appendChild(exportSurface);
    window.html2pdf().set({
      margin: 0.35,
      filename: `${fileName || 'tabla'}.pdf`,
      image: { type: 'jpeg', quality: 0.96 },
      html2canvas: { scale: 1.5, backgroundColor: '#ffffff', useCORS: true, scrollX: 0, scrollY: 0 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    }).from(exportSurface).save().then(() => {
      showToast('PDF descargado');
    }).catch(() => {
      showToast('No se pudo generar el PDF');
    }).finally(() => exportSurface.remove());
  }

  function renderNotesList() {
    if (!savedNotesList) return;
    savedNotesList.innerHTML = '';
    if (notes.length === 0) {
      savedNotesList.innerHTML = '<p style="color: var(--secondary-color); font-size: 0.85rem;">No hay notas guardadas.</p>';
      return;
    }

    notes.forEach((note, index) => {
      const card = document.createElement('div');
      card.className = 'note-card';
      card.id = `note-card-${index}`;
      const stickerClass = ['note-sticker-blue', 'note-sticker-pink', 'note-sticker-green'][index % 3];
      const isSavedTable = note.type === 'table' && note.tableData;
      card.innerHTML = `
        <div class="note-sticker ${stickerClass}"></div>
        <div class="note-header">
          <span>${isSavedTable ? 'Tabla: ' : ''}${note.title || 'Nota sin título'}</span>
          <span class="note-date">${note.date}</span>
        </div>
        <div class="note-content">${isSavedTable ? '' : note.body}</div>
        <div class="note-actions">
          ${isSavedTable ? `<button class="btn btn-primary btn-export-table-note" data-index="${index}"><i data-lucide="file-spreadsheet"></i> Excel</button>` : ''}
          <button class="btn btn-secondary btn-export-img" data-index="${index}"><i data-lucide="file-down"></i> ${isSavedTable ? 'PDF' : 'Exportar'}</button>
          <button class="btn btn-danger btn-delete-note" data-index="${index}"><i data-lucide="trash-2"></i> Eliminar</button>
        </div>
      `;
      if (isSavedTable) card.querySelector('.note-content').appendChild(createSavedTablePreview(note.tableData));
      savedNotesList.appendChild(card);
    });

    refreshIcons();

    document.querySelectorAll('.btn-delete-note').forEach(btn => {
      btn.addEventListener('click', (e) => {
        notes.splice(e.currentTarget.getAttribute('data-index'), 1);
        saveNotesToStorage(); renderNotesList();
      });
    });

    document.querySelectorAll('.btn-export-img').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = e.currentTarget.getAttribute('data-index');
        const note = notes[Number(idx)];
        if (note && note.type === 'table' && note.tableData) {
          exportTablePdf(note.tableData, (note.title || 'tabla').replace(/[^a-zA-Z0-9_-]+/g, '_'));
          return;
        }
        const element = document.getElementById(`note-card-${idx}`);
        if (window.html2canvas && element) {
          window.html2canvas(element, { scale: 2 }).then(canvas => {
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = `nota_${Date.now()}.png`;
            link.click();
          });
        }
      });
    });

    document.querySelectorAll('.btn-export-table-note').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const note = notes[Number(e.currentTarget.getAttribute('data-index'))];
        if (note && note.tableData) exportTableState(note.tableData, note.title || 'tabla');
      });
    });
  }

  const actaContent = document.getElementById('acta-content');
  const actaStatus = document.getElementById('acta-status');
  const btnActaDictate = document.getElementById('btn-acta-dictate');
  let actaRecognition = null;

  function generateActaDocx() {
    if (!window.docx) {
      showToast('No se pudo cargar el generador DOCX');
      return;
    }

    const title = document.getElementById('acta-title')?.value.trim() || 'ACTA DE REUNIÓN';
    const date = document.getElementById('acta-date')?.value || new Date().toISOString().slice(0, 10);
    const place = document.getElementById('acta-place')?.value.trim() || 'No indicado';
    const responsible = document.getElementById('acta-responsible')?.value.trim() || 'No indicado';
    const participants = document.getElementById('acta-participants')?.value.trim() || 'No indicados';
    const content = actaContent?.value.trim() || 'Sin contenido registrado.';
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = window.docx;
    const paragraphs = content.split(/\n+/).filter(Boolean).map((line) => new Paragraph({ text: line, spacing: { after: 160 } }));
    const documentFile = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({ text: title.toUpperCase(), heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 260 } }),
          new Paragraph({ children: [new TextRun({ text: 'Fecha: ', bold: true }), new TextRun(date)] }),
          new Paragraph({ children: [new TextRun({ text: 'Lugar: ', bold: true }), new TextRun(place)] }),
          new Paragraph({ children: [new TextRun({ text: 'Responsable: ', bold: true }), new TextRun(responsible)] }),
          new Paragraph({ children: [new TextRun({ text: 'Participantes: ', bold: true }), new TextRun(participants)], spacing: { after: 260 } }),
          new Paragraph({ text: 'DESARROLLO Y ACUERDOS', heading: HeadingLevel.HEADING_2, spacing: { after: 160 } }),
          ...paragraphs,
          new Paragraph({ text: 'Firma del responsable: ________________________________', spacing: { before: 500 } })
        ]
      }]
    });
    const safeName = title.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ_-]+/g, '_').replace(/^_+|_+$/g, '') || 'acta_reunion';
    Packer.toBlob(documentFile).then((blob) => {
      descargarBlob(blob, `${safeName}.docx`);
      showToast('Acta DOCX generada');
    });
  }

  document.getElementById('btn-generate-acta')?.addEventListener('click', generateActaDocx);

  if (btnActaDictate) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      btnActaDictate.disabled = true;
      btnActaDictate.title = 'El navegador no admite dictado por voz';
    } else {
      actaRecognition = new SpeechRecognition();
      actaRecognition.lang = 'es-ES';
      actaRecognition.continuous = true;
      actaRecognition.interimResults = false;
      actaRecognition.onresult = (event) => {
        const text = Array.from(event.results).slice(event.resultIndex).map((result) => result[0].transcript).join(' ');
        if (actaContent) actaContent.value = `${actaContent.value.trim()} ${text}`.trim();
      };
      actaRecognition.onstart = () => {
        btnActaDictate.classList.add('is-recording');
        btnActaDictate.innerHTML = '<i data-lucide="square"></i> Detener dictado';
        refreshIcons();
        if (actaStatus) actaStatus.textContent = 'Dictado activo. Hable para agregar contenido.';
      };
      actaRecognition.onend = () => {
        btnActaDictate.classList.remove('is-recording');
        btnActaDictate.innerHTML = '<i data-lucide="mic"></i> Grabar / dictar';
        refreshIcons();
      };
      btnActaDictate.addEventListener('click', () => {
        if (btnActaDictate.classList.contains('is-recording')) actaRecognition.stop();
        else actaRecognition.start();
      });
    }
  }

  if (btnSaveNote) {
    btnSaveNote.addEventListener('click', () => {
      const title = noteTitleInput ? noteTitleInput.value.trim() : '';
      const body = noteBodyInput ? noteBodyInput.value.trim() : '';
      if (!body) { alert('Escriba algún contenido en la nota.'); return; }

      notes.unshift({
        title: title,
        body: body,
        date: new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })
      });
      saveNotesToStorage();
      renderNotesList();

      showToast('Nota guardada en este dispositivo');

      if (noteTitleInput) noteTitleInput.value = '';
      if (noteBodyInput) noteBodyInput.value = '';
    });
  }

  renderNotesList();

  // --- PERFIL DE USUARIO ---
  const userAvatarInput = document.getElementById('user-avatar-input');
  const userAvatarPreview = document.getElementById('user-avatar-preview');
  const avatarPlaceholder = document.getElementById('avatar-placeholder');
  const userNameDisplay = document.getElementById('user-name-display');
  const btnToggleNameLock = document.getElementById('btn-toggle-name-lock');
  const modalEditProfile = document.getElementById('modal-edit-profile');
  const btnCloseEditProfile = document.getElementById('btn-close-edit-profile');
  const editFirstNameInput = document.getElementById('edit-firstname');
  const editLastNameInput = document.getElementById('edit-lastname');
  const editBirthInput = document.getElementById('edit-birthdate');
  const btnSaveProfile = document.getElementById('btn-save-profile');

  const savedAvatar = localStorage.getItem('app_user_avatar');
  const savedFirst = localStorage.getItem('app_user_firstname');
  const savedLast = localStorage.getItem('app_user_lastname');
  const savedBirth = localStorage.getItem('app_user_birth');

  function updateUserNameDisplay() {
    const stored = localStorage.getItem('app_user_name');
    if (userNameDisplay) {
      if (stored && stored.trim()) userNameDisplay.textContent = stored;
      else if ((savedFirst || savedLast)) userNameDisplay.textContent = `${savedFirst || ''} ${savedLast || ''}`.trim();
      else userNameDisplay.textContent = 'Sin datos';
    }
  }

  function openEditProfileModal() {
    if (!modalEditProfile) return;
    // populate
    editFirstNameInput.value = localStorage.getItem('app_user_firstname') || '';
    editLastNameInput.value = localStorage.getItem('app_user_lastname') || '';
    editBirthInput.value = localStorage.getItem('app_user_birth') || '';
    modalEditProfile.classList.add('open');
  }

  function closeEditProfileModal() {
    if (!modalEditProfile) return;
    modalEditProfile.classList.remove('open');
  }

  if (savedAvatar) {
    userAvatarPreview.src = savedAvatar;
    userAvatarPreview.classList.remove('hidden');
    avatarPlaceholder.style.display = 'none';
  }

  // set 'informa' field from stored name if available
  const storedName = localStorage.getItem('app_user_name');
  if (storedName && inputs && inputs.informa) inputs.informa.value = storedName;

  // initialize display name
  if (savedFirst || savedLast) {
    const combined = `${savedFirst || ''} ${savedLast || ''}`.trim();
    if (combined) localStorage.setItem('app_user_name', combined);
  }
  updateUserNameDisplay();
  
  if (btnToggleNameLock) {
    btnToggleNameLock.addEventListener('click', (e) => {
      e.preventDefault();
      openEditProfileModal();
    });
  }
  
  if (btnCloseEditProfile) btnCloseEditProfile.addEventListener('click', closeEditProfileModal);
  
  if (btnSaveProfile) {
    btnSaveProfile.addEventListener('click', () => {
      const fn = editFirstNameInput.value.trim();
      const ln = editLastNameInput.value.trim();
      const bd = editBirthInput.value || '';
      localStorage.setItem('app_user_firstname', fn);
      localStorage.setItem('app_user_lastname', ln);
      localStorage.setItem('app_user_birth', bd);
      const combined = `${fn} ${ln}`.trim();
      if (combined) localStorage.setItem('app_user_name', combined);
      updateUserNameDisplay();
      closeEditProfileModal();
      showToast('Datos guardados');
    });
  }
  if (userAvatarInput) {
    userAvatarInput.addEventListener('click', async () => { await solicitarPermisosNativos(); });

    userAvatarInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64Image = event.target.result;
          userAvatarPreview.src = base64Image;
          userAvatarPreview.classList.remove('hidden');
          avatarPlaceholder.style.display = 'none';
          localStorage.setItem('app_user_avatar', base64Image);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // legacy name input handlers removed; editing handled via Edit Profile modal
});
