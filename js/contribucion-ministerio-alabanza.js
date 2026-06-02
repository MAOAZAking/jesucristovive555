let listaCanciones = [];
let usuarioActual = "Desconocido";

// --- START: New functions for live editor ---

/**
* Gets the current cursor position as a line index and offset within that line.
 * This is more robust than character counting for a line-based editor.
 * @param {Node} parent The editor element.
 * @returns {{lineIndex: number, offset: number}|null} The location or null.
 */
function getCursorLocation(parent) {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    let lineNode = range.startContainer;

    // Traverse up the DOM tree to find the direct child of the editor, which represents the line.
    while (lineNode && lineNode.parentNode !== parent) {
        lineNode = lineNode.parentNode;
    }

    // If a line isn't found (e.g., editor is empty or focus is weird), handle fallbacks.
    if (!lineNode || !Array.from(parent.children).includes(lineNode)) {
        // Fallback for when cursor is between lines (e.g., after pressing Enter).
        if (range.startOffset > 0) {
            const nodeBeforeCursor = parent.childNodes[range.startOffset - 1];
            if (nodeBeforeCursor && nodeBeforeCursor.nodeType === Node.ELEMENT_NODE) {
                 return { lineIndex: Array.from(parent.children).indexOf(nodeBeforeCursor), offset: (nodeBeforeCursor.textContent || '').replace(/\u200B/g, '').length };
            }
        }
        return { lineIndex: 0, offset: 0 }; // Default to start.
    }

    const lineIndex = Array.from(parent.children).indexOf(lineNode);

    // To calculate the offset within the line, create a temporary range
    // that spans from the start of the line to the cursor's position.
    const preCaretRange = document.createRange();
    preCaretRange.selectNodeContents(lineNode);
    preCaretRange.setEnd(range.startContainer, range.startOffset);

    // The length of the text in this range is our offset.
    // We remove the ZWSP because it's an internal implementation detail.
    const offset = preCaretRange.toString().replace(/\u200B/g, '').length;

    return { lineIndex, offset };
}

/**
  * Sets the cursor position within the editor based on a line index and character offset.
 * @param {Node} parent The element to set the cursor in.
 * @param {{lineIndex: number, offset: number}} location The target location.
 */
function setCursorLocation(parent, location) {
    if (!location) return;

    // Ensure the target line exists. If not, fallback to the last line.
    const lineIndex = Math.min(location.lineIndex, parent.children.length - 1);
    if (lineIndex < 0) return;
    
    const lineNode = parent.children[lineIndex];
    const targetVisibleOffset = location.offset;
    let visibleCharsCounted = 0;
    const range = document.createRange();
    const selection = window.getSelection();

    // Use a TreeWalker to reliably iterate through all text nodes within the line.
    const walker = document.createTreeWalker(lineNode, NodeFilter.SHOW_TEXT, null, false);
    let currentNode;
    while (currentNode = walker.nextNode()) {
        const text = currentNode.nodeValue;
        for (let i = 0; i < text.length; i++) {
            // If we have found the position corresponding to the visible offset, place the cursor.
            if (visibleCharsCounted === targetVisibleOffset) {
                range.setStart(currentNode, i);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
                return;
            }
            // Increment count only for "visible" characters.
            if (text[i] !== '\u200B') {
                visibleCharsCounted++;
            }
        }
    }

    // If the offset is at the very end of the line, place it there.
    range.selectNodeContents(lineNode);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
}

/**
 * Reliably gets the plain text from the editor by iterating through its line elements.
 * This avoids issues with `innerText` which can produce inconsistent newlines.
 * @param {HTMLElement} editor The editor element.
 * @returns {string} The plain text content.
 */
function getTextFromLineElements(editor) {
    const lines = [];
    if (!editor || !editor.children) {
        return '';
    }
    for (const child of editor.children) {
        // textContent is used to get just the text, ignoring any inner HTML like <a> for chords.
        // The ZWSP character is an internal stabilizer and must be removed from the final text.
        lines.push(child.textContent.replace(/\u200B/g, ''));
    }
    return lines.join('\n');
}

/**
 * Converts the HTML content of the live editor back to plain text format.
 * @returns {string} The plain text content of the song.
 */
function getPlainTextFromEditor() {
    const editor = document.getElementById('editor-vivo');
    // Use the robust function to avoid `innerText` inconsistencies.
    return getTextFromLineElements(editor);
}

/**
 * Handles the input event on the live editor, re-formatting the content
 * while trying to preserve the cursor position.
 */
function handleEditorInput() {
    const editor = document.getElementById('editor-vivo');
    const location = getCursorLocation(editor);
    // Use the robust function to avoid `innerText` creating extra newlines.
    const text = getTextFromLineElements(editor);
    
    // The procesarTextoCancion function is in global.js
    editor.innerHTML = procesarTextoCancion(text);
    
    setCursorLocation(editor, location);
}

// --- END: New functions for live editor ---

document.addEventListener('DOMContentLoaded', async () => {
    // Obtener usuario de la sesión
    const sesion = JSON.parse(sessionStorage.getItem('usuario_actual'));
    if (sesion && sesion.nombredeusuario) {
        usuarioActual = sesion.nombredeusuario;
    }

    // Cargar datos locales y luego remotos
    const localData = localStorage.getItem('canciones_local');
    if (localData) {
        listaCanciones = JSON.parse(localData);
        filtrarCanciones(); // Renderizar inicial
    }
    cargarCancionesDesdeGitHub();

    document.getElementById('editor-vivo').addEventListener('input', handleEditorInput);
    document.getElementById('input-busqueda').addEventListener('input', filtrarCanciones);
});

function mostrarAgregar() {
    document.getElementById('vista-principal').style.display = 'none';
    document.getElementById('editor-cancion').style.display = 'block';
    document.getElementById('titulo-editor').innerText = 'Agregar Nueva Canción';
    
    document.getElementById('id-cancion-actual').value = '';
    document.getElementById('nombre-cancion').value = '';
    // Limpiar el editor en vivo
    document.getElementById('editor-vivo').innerHTML = '';
    
    // Limpiar metadatos ocultos
    document.getElementById('meta-creado-por').value = '';
    document.getElementById('meta-fecha-creacion').value = '';
}

function volverAlMenu() {
    document.getElementById('vista-principal').style.display = 'block';
    document.getElementById('editor-cancion').style.display = 'none';
    filtrarCanciones(); // Refrescar listas
}

function manejarRegreso() {
    const editor = document.getElementById('editor-cancion');
    // Si el editor está visible (en modo 'agregar' o 'editar')
    if (editor.style.display === 'block') {
        volverAlMenu();
    } else {
        // Si está en la vista principal, ir dos pasos atrás en el historial
        history.back();
        history.back();
    }
}

async function cargarCancionesDesdeGitHub() {
    try {
        const url = `https://api.github.com/repos/${CONFIG_GITHUB.OWNER}/${CONFIG_GITHUB.REPO}/contents/${CONFIG_GITHUB.PATH_CANCIONES}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.content) {
            const contenidoDecodificado = decodeURIComponent(escape(window.atob(data.content)));
            listaCanciones = JSON.parse(contenidoDecodificado);
            localStorage.setItem('canciones_local', JSON.stringify(listaCanciones));
            filtrarCanciones(); // Actualizar vista con datos nuevos
        }
    } catch (error) {
        console.error("Error cargando canciones:", error);
    }
}

function filtrarCanciones() {
    const texto = document.getElementById('input-busqueda').value.toLowerCase();
    const listaAlabanza = document.getElementById('lista-alabanza');
    const listaAdoracion = document.getElementById('lista-adoracion');
    
    listaAlabanza.innerHTML = '';
    listaAdoracion.innerHTML = '';

    const filtradas = listaCanciones.filter(c => {
        // Buscar en título O en contenido (letra)
        return c.titulo.toLowerCase().includes(texto) || c.contenido.toLowerCase().includes(texto);
    });

    filtradas.forEach(c => {
        const item = document.createElement('div');
        item.className = 'item-lista-cancion';
        // Clic en la fila lleva a visualizar
        item.onclick = () => window.location.href = `visualizar-cancion-con-acordes?id=${encodeURIComponent(c.id)}`;
        
        item.innerHTML = `
            <span class="titulo-cancion-lista">${c.titulo}</span>
            <button class="btn-editar-lista" onclick="event.stopPropagation(); cargarCancionParaEditar('${c.id}')" title="Editar">
                <i class="bi bi-pencil-square"></i>
            </button>
        `;

        if (c.tipo === 'Alabanza') {
            listaAlabanza.appendChild(item);
        } else if (c.tipo === 'Adoracion') {
            listaAdoracion.appendChild(item);
        }
    });
}

function cargarCancionParaEditar(id) {
    const cancion = listaCanciones.find(c => c.id === id);
    if (!cancion) return;

    document.getElementById('vista-principal').style.display = 'none';
    document.getElementById('editor-cancion').style.display = 'block';
    document.getElementById('titulo-editor').innerText = 'Editar Canción';

    document.getElementById('id-cancion-actual').value = cancion.id;
    document.getElementById('nombre-cancion').value = cancion.titulo;
    document.getElementById('tipo-cancion').value = cancion.tipo;
    // Cargar contenido procesado en el editor en vivo
    document.getElementById('editor-vivo').innerHTML = procesarTextoCancion(cancion.contenido);
    
    // Cargar metadatos existentes
    document.getElementById('meta-creado-por').value = cancion.creadoPor || '';
    document.getElementById('meta-fecha-creacion').value = cancion.fechaCreacion || '';
}

function generarSlug(texto) {
    return texto.toString().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Eliminar tildes y diacríticos (ñ -> n)
        .replace(/[^a-z0-9\s-]/g, '') // Eliminar caracteres especiales
        .trim()
        .replace(/\s+/g, '-'); // Espacios a guiones
}

function generarId(titulo, tipo) {
    return `${generarSlug(titulo)}-${generarSlug(tipo)}`;
}

async function guardarCancion() {
    const btn = document.getElementById('btn-guardar');
    const idActual = document.getElementById('id-cancion-actual').value;
    const titulo = document.getElementById('nombre-cancion').value.trim();
    const tipo = document.getElementById('tipo-cancion').value;
    const contenido = getPlainTextFromEditor();
    const fechaHoy = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

    if (!titulo || !contenido) {
        alert("Por favor completa el título y el contenido.");
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Guardando...';

    try {
        // Generar ID basado en Título y Tipo (Slug) para el link limpio
        const nuevoId = generarId(titulo, tipo);
        let cancionGuardar = {};

        // Verificar duplicados (mismo nombre y mismo tipo)
        const cancionExistente = listaCanciones.find(c => c.id === nuevoId);

        if (cancionExistente) {
            // Conflicto si:
            // 1. Estamos creando nueva (idActual vacío)
            // 2. Estamos editando, pero el ID resultante es diferente al actual (cambió nombre/tipo) y ya existe otra
            if (!idActual || (idActual && idActual !== nuevoId)) {
                alert(`La canción "${titulo}" (${tipo}) ya existe.`);
                if (confirm("¿Deseas cargar la canción existente para verla o editarla?")) {
                    cargarCancionParaEditar(nuevoId);
                }
                // Restaurar botón y salir
                btn.disabled = false;
                btn.innerHTML = '<i class="bi bi-cloud-upload"></i> Guardar Canción';
                return;
            }
        }

        if (idActual) {
            // EDICIÓN
            const index = listaCanciones.findIndex(c => c.id == idActual);
            if (index !== -1) {
                cancionGuardar = {
                    ...listaCanciones[index], // Mantener datos viejos
                    id: nuevoId, // Actualizar ID (Slug) por si cambió el título
                    titulo,
                    tipo,
                    contenido,
                    editadoPor: usuarioActual,
                    fechaEdicion: fechaHoy
                };
                listaCanciones[index] = cancionGuardar;
            }
        } else {
            // CREACIÓN
            cancionGuardar = {
                id: nuevoId,
                titulo,
                tipo,
                contenido,
                creadoPor: usuarioActual,
                fechaCreacion: fechaHoy,
                editadoPor: "",
                fechaEdicion: ""
            };
            listaCanciones.push(cancionGuardar);
        }

        localStorage.setItem('canciones_local', JSON.stringify(listaCanciones));

        // Subir a GitHub
        const url = `https://api.github.com/repos/${CONFIG_GITHUB.OWNER}/${CONFIG_GITHUB.REPO}/contents/${CONFIG_GITHUB.PATH_CANCIONES}`;
        const getResponse = await fetch(url, { headers: { 'Authorization': `Bearer ${CONFIG_GITHUB.TOKEN}` } });
        const getData = await getResponse.json();
        const sha = getData.sha;

        const nuevoContenidoStr = JSON.stringify(listaCanciones, null, 4);
        const nuevoContenidoB64 = window.btoa(unescape(encodeURIComponent(nuevoContenidoStr)));

        const putResponse = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${CONFIG_GITHUB.TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Actualización de canciones: ${titulo} por ${usuarioActual}`,
                content: nuevoContenidoB64,
                sha: sha
            })
        });

        if (putResponse.ok) {
            alert("¡Canción guardada exitosamente!");
            volverAlMenu();
        } else {
            throw new Error("Error en la respuesta de GitHub");
        }
    } catch (error) {
        console.error(error);
        alert("Error al guardar en GitHub. Verifica tu conexión y el token.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-cloud-upload"></i> Guardar Canción';
    }
}