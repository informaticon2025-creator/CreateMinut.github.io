// Listas globales que se llenarán dinámicamente con los archivos de texto
let listaLibros = [];
let listaProyectos = [];

// Enlace base de contacto
const tlf = "https://wa.me/584264214126";

// Selección de elementos del DOM
const contenedorLibros = document.getElementById('contenedor-libros');
const contenedorProyectos = document.getElementById('contenedor-proyectos');
const inputBuscar = document.getElementById('input-buscar');

const btnContacto = document.getElementById('btn-contacto');
const modalContacto = document.getElementById('modal-contacto');
const btnCerrarModal = document.getElementById('btn-cerrar-modal');

const btnFooterOpen = document.getElementById('btn-footer-open');
const modalFooter = document.getElementById('modal-footer');
const btnCerrarFooter = document.getElementById('btn-cerrar-footer');

const modalBusqueda = document.getElementById('modal-busqueda');
const btnCerrarBusqueda = document.getElementById('btn-cerrar-busqueda');
const resultadosBusqueda = document.getElementById('busqueda-resultados');

// ==================== Carga Dinámica desde Archivos TXT ====================

async function cargarRecursos() {
    if (!contenedorLibros) return;
    
    try {
        let contador = 1;
        let archivosEncontrados = [];
        let ejecutando = true;

        // Buscamos secuencialmente en: date/recursos/recurso.txt, recurso2.txt...
        while (ejecutando) {
            const nombreArchivo = contador === 1 ? 'recurso.txt' : `recurso${contador}.txt`;
            
            try {
                const respuestaTxt = await fetch(`date/TXT/recursos/${nombreArchivo}?v=${Date.now()}`);
                if (respuestaTxt.ok) {
                    const textoCompleto = await respuestaTxt.text();
                    archivosEncontrados.push(textoCompleto);
                    contador++;
                } else {
                    ejecutando = false;
                }
            } catch (e) {
                ejecutando = false;
            }
            if (contador > 100) break;
        }

        listaLibros = [];

        archivosEncontrados.forEach(textoCompleto => {
            let recurso = { titulo: "", autor: "", imgs: "", descripcion: "", categoria: "", archivopdf: "" };
            const lineas = textoCompleto.split('\n').map(l => l.trim());
            let etiquetaActual = "";
            let bloquesContenido = [];

            for (let i = 0; i < lineas.length; i++) {
                const linea = lineas[i];
                const lineaLimpia = linea.replace(/[\[\]]/g, '').toUpperCase();
                
                if (['TITULO', 'AUTOR', 'IMGS', 'DESCRIPCION', 'CATEGORIA', 'ARCHIVOPDF'].includes(lineaLimpia)) {
                    if (etiquetaActual) {
                        recurso[etiquetaActual] = bloquesContenido.join('\n').trim();
                    }
                    etiquetaActual = lineaLimpia.toLowerCase();
                    bloquesContenido = [];
                } else if (etiquetaActual) {
                    bloquesContenido.push(linea);
                }
            }
            if (etiquetaActual) {
                recurso[etiquetaActual] = bloquesContenido.join('\n').trim();
            }

            listaLibros.push({
                titulo: recurso.titulo || "Sin Título",
                autor: recurso.autor || "Desconocido",
                imgs: recurso.imgs || "",
                descripcion: recurso.descripcion || "",
                categoria: recurso.categoria || "Recurso",
                archivoPdf: recurso.archivopdf || "#"
            });
        });

        pintarLibros(listaLibros);
        
    } catch (error) {
        console.error("Error al procesar los recursos dinámicos:", error);
    }
}

async function cargarProyectosDinamicos() {
    if (!contenedorProyectos) return;
    
    try {
        let contador = 1;
        let archivosEncontrados = [];
        let ejecutando = true;

        // Buscamos secuencialmente en: date/proyecto/proyecto.txt, proyecto2.txt...
        while (ejecutando) {
            const nombreArchivo = contador === 1 ? 'proyectos.txt' : `proyectos${contador}.txt`;
            
            try {
                const respuestaTxt = await fetch(`date/TXT/proyectos/${nombreArchivo}?v=${Date.now()}`);
                if (respuestaTxt.ok) {
                    const textoCompleto = await respuestaTxt.text();
                    archivosEncontrados.push(textoCompleto);
                    contador++;
                } else {
                    ejecutando = false;
                }
            } catch (e) {
                ejecutando = false;
            }
            if (contador > 100) break;
        }

        listaProyectos = [];

        archivosEncontrados.forEach(textoCompleto => {
            let prj = { nombre: "", descripcion: "", tecnologias: "", linkdemo: "", linkcodigo: "" };
            const lineas = textoCompleto.split('\n').map(l => l.trim());
            let etiquetaActual = "";
            let bloquesContenido = [];

            for (let i = 0; i < lineas.length; i++) {
                const linea = lineas[i];
                const lineaLimpia = linea.replace(/[\[\]]/g, '').toUpperCase();
                
                if (['NOMBRE', 'DESCRIPCION', 'TECNOLOGIAS', 'LINKDEMO', 'LINKCODIGO'].includes(lineaLimpia)) {
                    if (etiquetaActual) {
                        prj[etiquetaActual] = bloquesContenido.join('\n').trim();
                    }
                    etiquetaActual = lineaLimpia.toLowerCase();
                    bloquesContenido = [];
                } else if (etiquetaActual) {
                    bloquesContenido.push(linea);
                }
            }
            if (etiquetaActual) {
                prj[etiquetaActual] = bloquesContenido.join('\n').trim();
            }

            let arrayTechs = prj.tecnologias ? prj.tecnologias.split(',').map(t => t.trim()) : [];

            listaProyectos.push({
                nombre: prj.nombre || "Proyecto sin nombre",
                descripcion: prj.descripcion || "",
                tecnologias: arrayTechs,
                linkDemo: prj.linkdemo || "#",
                linkCodigo: prj.linkcodigo || tlf
            });
        });

        pintarProyectos(listaProyectos);
        
    } catch (error) {
        console.error("Error al procesar los proyectos dinámicos:", error);
    }
}

// ==================== FUNCIONES DE RENDERIZADO INTACTAS ====================
function pintarLibros(libros) {
    contenedorLibros.innerHTML = '';
    if (libros.length === 0) {
        contenedorLibros.innerHTML = `<p class="autor-card">No se encontraron libros que coincidan.</p>`;
        return;
    }
    libros.forEach(libro => {
        const tarjetaHtml = `
            <article class="card">
                <div>
                    <span class="badge">${libro.categoria}</span>
                    <h3 style="margin-top: 0.5rem;">${libro.titulo}</h3>
                    <p class="autor-card">Autor: ${libro.autor}</p>
                    <img src="${libro.imgs}" alt="IMG">
                    <p>${libro.descripcion}</p>
                </div>
                <div class="card-buttons">
                    <a href="${libro.archivoPdf}" target="_blank" class="btn btn-primary">
                        <i class="fa-solid fa-file-download"></i> Descargar
                    </a>
                </div>
            </article>
        `;
        contenedorLibros.innerHTML += tarjetaHtml;
    });
}

function pintarProyectos(proyectos) {
    contenedorProyectos.innerHTML = '';
    if (proyectos.length === 0) {
        contenedorProyectos.innerHTML = `<p class="autor-card">No se encontraron proyectos que coincidan.</p>`;
        return;
    }
    proyectos.forEach(proyecto => {
        let badgesTecnologias = '';
        proyecto.tecnologias.forEach(tech => {
            badgesTecnologias += `<span class="badge">${tech}</span>`;
        });
        const tarjetaHtml = `
            <article class="card">
                <div>
                    <div class="tech-container">${badgesTecnologias}</div>
                    <h3>${proyecto.nombre}</h3>
                    <p>${proyecto.descripcion}</p>
                </div>
                <div class="card-buttons">
                    <a href="${proyecto.linkDemo}" target="_blank" class="btn btn-primary">PDF</a>
                </div>
            </article>
        `;
        contenedorProyectos.innerHTML += tarjetaHtml;
    });
}

function pintarResultadosBusqueda(libros, proyectos) {
    let html = '';

    if (libros.length === 0 && proyectos.length === 0) {
        html = `<p class="autor-card">No se encontraron resultados para tu búsqueda.</p>`;
    } else {
        if (libros.length > 0) {
            html += `<section class="search-section"><h3>Busca lo que nesesitas</h3><div class="search-grid">`;
            libros.forEach(libro => {
                html += `
                    <article class="card search-card">
                        <div>
                            <span class="badge">${libro.categoria}</span>
                            <h3>${libro.titulo}</h3>
                            <p class="autor-card">Autor: ${libro.autor}</p>
                            <img src="${libro.imgs}" alt="imgss">
                            <p>${libro.descripcion}</p>
                        </div>
                        <div class="card-buttons">
                            <a href="${libro.archivoPdf}" target="_blank" class="btn btn-primary">
                                <i class="fa-solid fa-file-pdf"></i> Descargar
                            </a>
                        </div>
                    </article>
                `;
            });
            html += `</div></section>`;
        }

        if (proyectos.length > 0) {
            html += `<section class="search-section"><h3>Libros</h3><div class="search-grid">`;
            proyectos.forEach(proyecto => {
                const badgesTecnologias = project => proyecto.tecnologias.map(tech => `<span class="badge">${tech}</span>`).join('');
                html += `
                    <article class="card search-card">
                        <div>
                            <div class="tech-container">${proyecto.tecnologias.map(tech => `<span class="badge">${tech}</span>`).join('')}</div>
                            <h3>${proyecto.nombre}</h3>
                            <p>${proyecto.descripcion}</p>
                        </div>
                        <div class="card-buttons">
                            <a href="${proyecto.linkDemo}" target="_blank" class="btn btn-primary">DOC</a>
                        </div>
                    </article>
                `;
            });
            html += `</div></section>`;
        }
    }

    resultadosBusqueda.innerHTML = html;
}

// ==================== EVENTOS Y ESCUCHADORES INTACTOS ====================

inputBuscar.addEventListener('input', (evento) => {
    const textoUsuario = evento.target.value.toLowerCase().trim();
    const librosFiltrados = listaLibros.filter(libro => 
        libro.titulo.toLowerCase().includes(textoUsuario) ||
        libro.autor.toLowerCase().includes(textoUsuario) ||
        libro.categoria.toLowerCase().includes(textoUsuario)
    );
    const proyectosFiltrados = listaProyectos.filter(proyecto => 
        proyecto.nombre.toLowerCase().includes(textoUsuario) ||
        proyecto.descripcion.toLowerCase().includes(textoUsuario) ||
        proyecto.tecnologias.some(tech => tech.toLowerCase().includes(textoUsuario))
    );

    pintarLibros(librosFiltrados);
    pintarProyectos(proyectosFiltrados);

    if (textoUsuario === '') {
        modalBusqueda.classList.remove('active');
        resultadosBusqueda.innerHTML = '';
        return;
    }

    pintarResultadosBusqueda(librosFiltrados, proyectosFiltrados);
    modalBusqueda.classList.add('active');
});

btnCerrarBusqueda.addEventListener('click', () => {
    modalBusqueda.classList.remove('active');
});

document.addEventListener('DOMContentLoaded', () => {
    cargarRecursos(); 
    cargarProyectosDinamicos(); 
    cargarNoticias();

    const navContainer = document.querySelector('.nav-container');
    const navMenu = document.querySelector('.nav-menu');
    if (navContainer && navMenu) {
        if (!document.getElementById('btn-hamburger')) {
            const btn = document.createElement('button');
            btn.id = 'btn-hamburger';
            btn.className = 'hamburger-button';
            btn.setAttribute('aria-label', 'Abrir menú');
            btn.innerHTML = '<i class="fa-solid fa-bars"></i>';
            navContainer.appendChild(btn);

            btn.addEventListener('click', (e) => {
                e.preventDefault();
                navMenu.classList.toggle('open');
            });

            window.addEventListener('click', (e) => {
                if (!navContainer.contains(e.target)) {
                    navMenu.classList.remove('open');
                }
            });
        }
    }
});

btnContacto.addEventListener('click', (e) => { 
    e.preventDefault(); 
    modalContacto.classList.add('active'); 
});

btnCerrarModal.addEventListener('click', () => { 
    modalContacto.classList.remove('active'); 
});

btnFooterOpen.addEventListener('click', (e) => {
    e.preventDefault();
    modalFooter.classList.add('active');
});

btnCerrarFooter.addEventListener('click', () => {
    modalFooter.classList.remove('active');
});

window.addEventListener('click', (e) => { 
    if (e.target === modalContacto) { 
        modalContacto.classList.remove('active'); 
    }
    if (e.target === modalFooter) {
        modalFooter.classList.remove('active');
    }
    if (e.target === modalBusqueda) {
        modalBusqueda.classList.remove('active');
    }
});

const btnAbrir = document.getElementById('btnAbrir');
const ventanaFlotante = document.getElementById('ventanaFlotante');
const btnCerrar = document.getElementById('btnCerrar');
const linkWS = document.getElementById('linkWS');
const linkTG = document.getElementById('linkTG');
const btnCopiar = document.getElementById('btnCopiar');

// 1. Abrir la ventana flotante
btnAbrir.addEventListener('click', () => {
  ventanaFlotante.classList.remove('divHidden');
  
  // Capturamos el link donde esté corriendo la página en este instante
  const urlActual = encodeURIComponent(window.location.href);
  const mensaje = encodeURIComponent("Esta web donde puedes conseguir!");

  // Armamos las rutas directas
  linkWS.href = `https://api.whatsapp.com/send?text=${mensaje}%20${urlActual}`;
  linkTG.href = `https://t.me/share/url?url=${urlActual}&text=${mensaje}`;
});

// 2. Cerrar la ventana flotante con el botón "Cerrar"
btnCerrar.addEventListener('click', () => {
  ventanaFlotante.classList.add('divHidden');
});

// 3. Cerrar también si hacen clic fuera de la caja blanca (en el fondo oscuro)
ventanaFlotante.addEventListener('click', (e) => {
  if (e.target === ventanaFlotante) {
    ventanaFlotante.classList.add('divHidden');
  }
});

// 4. Copiar enlace al portapapeles
btnCopiar.addEventListener('click', () => {
  navigator.clipboard.writeText(window.location.href)
    .then(() => {
      alert("¡Enlace copiado al portapapeles con éxito!");
      ventanaFlotante.classList.add('divHidden'); // Se cierra al copiar
    })
    .catch(err => {
      console.error("Error al copiar el enlace: ", err);
    });
});