function getApiBaseUrl() {
  const { protocol, hostname } = window.location;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//localhost/CM`;
  }

  return `${protocol}//${window.location.host}`;
}

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

  // --- NOTIFICACIONES Y VIBRACIÓN ---
  function solicitarPermisoAlCargar() {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          enviarAlertaNotificación("CreatorMinut", "Alertas automáticas activadas.");
        }
      });
    }
  }

  function enviarAlertaNotificación(titulo, mensaje) {
    if ("vibrate" in navigator) {
      navigator.vibrate([100, 50, 100]);
    }

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(titulo, {
        body: mensaje,
        icon: "file/icon.jpg",
        badge: "file/icon.jpg"
      });
    }
  }

  function iniciarRelojMinutas() {
    setInterval(() => {
      const ahora = new Date();
      const horaFormateada = ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      
      enviarAlertaNotificación(
        "Minuta Nueva / Recordatorio", 
        `Atención: Control de tiempo a las ${horaFormateada}. Registre novedades pendientes.`
      );
    }, 60000);
  }

  solicitarPermisoAlCargar();
  iniciarRelojMinutas();

  // --- TEMAS Y TAMAÑO DE FUENTE ---
  const themeSelect = document.getElementById('theme-select');
  const fontSizeSelect = document.getElementById('font-size-select');

  const savedTheme = localStorage.getItem('app_selected_theme') || 'theme-retro';
  const savedFontSize = localStorage.getItem('app_font_size') || 'font-sm';

  document.body.className = '';
  document.body.classList.add(savedTheme, savedFontSize);

  if (themeSelect) themeSelect.value = savedTheme;
  if (fontSizeSelect) fontSizeSelect.value = savedFontSize;

  async function guardarConfiguracionEnBD(nombreUsuario, tema, tamanoFuente) {
    try {
      const res = await fetch(`${getApiBaseUrl()}/date/configuracion.php?v=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre_usuario: nombreUsuario, tema, tamano_fuente: tamanoFuente })
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('Error al guardar configuración:', err);
      return { status: 'error', message: err.message };
    }
  }

  if (themeSelect) {
    themeSelect.addEventListener('change', async (e) => {
      const selectedTheme = e.target.value;
      const currentFontSize = fontSizeSelect ? fontSizeSelect.value : 'font-sm';
      document.body.className = '';
      document.body.classList.add(selectedTheme, currentFontSize);
      localStorage.setItem('app_selected_theme', selectedTheme);
      await guardarConfiguracionEnBD(localStorage.getItem('app_user_name') || '', selectedTheme, currentFontSize);
    });
  }

  if (fontSizeSelect) {
    fontSizeSelect.addEventListener('change', async (e) => {
      const selectedFont = e.target.value;
      const currentTheme = themeSelect ? themeSelect.value : 'theme-retro';
      document.body.className = '';
      document.body.classList.add(currentTheme, selectedFont);
      localStorage.setItem('app_font_size', selectedFont);
      await guardarConfiguracionEnBD(localStorage.getItem('app_user_name') || '', currentTheme, selectedFont);
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

  // --- WIDGET PARA PC / APK ---
  const appWidget = document.getElementById('app-widget');
  const appWidgetToggle = document.getElementById('app-widget-toggle');
  const appWidgetMenu = document.getElementById('app-widget-menu');
  const appOpenInicio = document.getElementById('app-widget-open-inicio');
  const appOpenBloc = document.getElementById('app-widget-open-bloc');
  const appOpenFormato = document.getElementById('app-widget-open-formato');
  const appShare = document.getElementById('app-widget-share');

  function isAppInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true || document.referrer.startsWith('android-app://');
  }

  function shouldShowAppWidget() {
    return isAppInstalled() || window.innerWidth >= 1024;
  }

  function updateAppWidgetVisibility() {
    if (!appWidget) return;
    if (shouldShowAppWidget()) {
      appWidget.classList.remove('hidden');
    } else {
      appWidget.classList.add('hidden');
      appWidget.classList.remove('open');
    }
  }

  if (appWidgetToggle && appWidget) {
    appWidgetToggle.addEventListener('click', () => {
      appWidget.classList.toggle('open');
    });
  }

  if (appOpenInicio) appOpenInicio.addEventListener('click', () => {
    activateTab('view-inicio');
    appWidget.classList.remove('open');
  });
  if (appOpenBloc) appOpenBloc.addEventListener('click', () => {
    activateTab('view-bloc');
    appWidget.classList.remove('open');
  });
  if (appOpenFormato) appOpenFormato.addEventListener('click', () => {
    activateTab('view-formato');
    appWidget.classList.remove('open');
  });
  if (appShare) appShare.addEventListener('click', async () => {
    appWidget.classList.remove('open');
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'CreatorMinut', text: 'Comparte CreatorMinut', url: shareUrl });
      } catch (err) {
        if (err.name !== 'AbortError') {
          navigator.clipboard?.writeText(shareUrl);
          alert('Enlace copiado al portapapeles.');
        }
      }
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(shareUrl);
      alert('Enlace copiado al portapapeles.');
    }
  });

  updateAppWidgetVisibility();
  window.matchMedia('(display-mode: standalone)').addEventListener('change', updateAppWidgetVisibility);
  window.addEventListener('resize', updateAppWidgetVisibility);

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
    const valResumen = inputs.resumen.value.trim() ? inputs.resumen.value : '';
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
        resumen: inputs.resumen.value.trim(),
        lema: inputs.lema.value.trim()
      };

      try {
        const res = await fetch(`${getApiBaseUrl()}/date/minutas.php?v=${Date.now()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosMinuta)
        });

        const text = await res.text();
        let respuesta;
        try {
          respuesta = JSON.parse(text);
        } catch (e) {
          respuesta = { status: 'error', message: text };
        }

        if (respuesta.status === 'ok') {
          enviarAlertaNotificación('Minuta Generada', 'Se guardó con éxito en la base de datos.');
        } else {
          console.error('Error al guardar la minuta:', respuesta.message || respuesta);
          alert('No se pudo guardar la minuta en la base de datos.');
        }
      } catch (err) {
        console.error('Error al guardar la minuta en MySQL:', err);
        alert('No se pudo completar el envío de la minuta.');
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
  const btnShare = document.getElementById('btn-share');

  if (btnCopy) {
    btnCopy.addEventListener('click', async () => {
      if (minutaOutput && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(minutaOutput.innerText);
        enviarAlertaNotificación('Portapapeles', 'Minuta copiada al portapapeles.');
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
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `minuta_${Date.now()}.png`;
        link.click();
      }).catch(() => {
        showToast('Error al generar la imagen.');
      });
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
      card.innerHTML = `
        <div class="note-sticker ${stickerClass}"></div>
        <div class="note-header">
          <span>${note.title || 'Nota sin título'}</span>
          <span class="note-date">${note.date}</span>
        </div>
        <div class="note-content">${note.body}</div>
        <div class="note-actions">
          <button class="btn btn-secondary btn-export-img" data-index="${index}"><i data-lucide="image"></i> Exportar</button>
          <button class="btn btn-danger btn-delete-note" data-index="${index}"><i data-lucide="trash-2"></i> Eliminar</button>
        </div>
      `;
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
  }

  async function guardarNotaEnBD(title, body) {
    try {
      const res = await fetch(`${getApiBaseUrl()}/date/notas.php?v=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: title, contenido: body })
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { status: 'error', message: text };
      }
      return data;
    } catch (err) {
      console.error('Error al guardar la nota en MySQL:', err);
      return { status: 'error', message: err.message };
    }
  }

  if (btnSaveNote) {
    btnSaveNote.addEventListener('click', async () => {
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

      const result = await guardarNotaEnBD(title, body);
      if (result.status === 'ok') {
        enviarAlertaNotificación('Nota Guardada', title || 'Se registró una nueva nota en MySQL.');
      }

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

  // legacy name input handlers removed; editing handled via Edit Profile modal
});

async function probarConexion() {
  try {
    const respuesta = await fetch(`${getApiBaseUrl()}/date/conexion.php`);
    if (respuesta.ok) {
      console.log('✅ Conexión establecida correctamente.');
    }
  } catch (error) {
    console.error('❌ Error al intentar conectar:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  probarConexion();
});