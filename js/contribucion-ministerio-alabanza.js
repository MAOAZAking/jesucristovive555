let listaCanciones = [];
let usuarioActual = "Desconocido";

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
    
    document.getElementById('contenido-cancion').addEventListener('input', function() {
        actualizarVistaPrevia(this.value);
    });
    document.getElementById('input-busqueda').addEventListener('input', filtrarCanciones);
});

function mostrarAgregar() {
    document.getElementById('vista-principal').style.display = 'none';
    document.getElementById('editor-cancion').style.display = 'block';
    document.getElementById('titulo-editor').innerText = 'Agregar Nueva Canción';
    
    document.getElementById('id-cancion-actual').value = '';
    document.getElementById('nombre-cancion').value = '';
    document.getElementById('contenido-cancion').value = '';
    document.getElementById('vista-previa-cancion').innerHTML = '';
    
    // Limpiar metadatos ocultos
    document.getElementById('meta-creado-por').value = '';
    document.getElementById('meta-fecha-creacion').value = '';
}

function volverAlMenu() {
    document.getElementById('vista-principal').style.display = 'block';
    document.getElementById('editor-cancion').style.display = 'none';
    filtrarCanciones(); // Refrescar listas
}

function actualizarVistaPrevia(texto) {
    const html = procesarTextoCancion(texto);
    document.getElementById('vista-previa-cancion').innerHTML = html;
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
        item.onclick = () => window.location.href = `visualizar-cancion.html?id=${c.id}`;
        
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
    document.getElementById('contenido-cancion').value = cancion.contenido;
    
    // Cargar metadatos existentes
    document.getElementById('meta-creado-por').value = cancion.creadoPor || '';
    document.getElementById('meta-fecha-creacion').value = cancion.fechaCreacion || '';

    actualizarVistaPrevia(cancion.contenido);
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
    const contenido = document.getElementById('contenido-cancion').value;
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