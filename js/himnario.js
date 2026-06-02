/**
 * Lógica del Himnario Interactivo
 * Ministerio de Restauración Jesucristo ¡VIVE!
 */

let todasLasCanciones = [];
let modoActual = 'Completo';

document.addEventListener('DOMContentLoaded', () => {
    const selector = document.getElementById('selector-himnario');
    const menu = document.getElementById('menu-categorias');
    const inputBusqueda = document.getElementById('busqueda-himno');
    const listaContenedor = document.getElementById('lista-canciones');

    // 1. ACTIVAR INTERFAZ DE INMEDIATO (Incluso si los datos aún no cargan)
    if (selector && menu) {
        selector.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = menu.style.display === 'block';
            menu.style.display = isVisible ? 'none' : 'block';
        });

        // Cerrar menú al tocar fuera
        document.addEventListener('click', () => {
            menu.style.display = 'none';
        });
    }

    // 2. ACTIVAR BUSCADOR
    if (inputBusqueda) {
        inputBusqueda.addEventListener('input', () => {
            renderizarLista();
        });
    }

    // 3. CARGAR DATOS DE FORMA SEGURA
    cargarDatos();

    async function cargarDatos() {
        try {
            const res = await fetch('json/himnario.json');
            
            if (!res.ok) throw new Error("No se pudo cargar el archivo JSON");
            
            const datos = await res.json();
            
            // Validar que los datos sean un array
            todasLasCanciones = Array.isArray(datos) ? datos : [];
            
            // Ordenar alfabéticamente por título
            todasLasCanciones.sort((a, b) => (a.titulo || "").localeCompare(b.titulo || ""));

            // Verificar si hay una búsqueda previa en la URL
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('q')) {
                inputBusqueda.value = urlParams.get('q');
            }

            renderizarLista();
        } catch (error) {
            console.error("Error en el himnario:", error);
            listaContenedor.innerHTML = `
                <div class="alert alert-warning text-center mt-5">
                    <i class="bi bi-exclamation-triangle"></i> No se pudieron cargar las canciones.<br>
                    Verifica que el archivo <code>json/himnario.json</code> exista.
                </div>`;
        }
    }
});

function cambiarModo(modo) {
    modoActual = modo;
    const label = modo === 'Adoracion' ? 'Adoración' : modo;
    document.getElementById('selector-himnario').innerHTML = `Himnario ${label} <i class="bi bi-chevron-down fs-4"></i>`;
    renderizarLista();
}

function renderizarLista() {
    const container = document.getElementById('lista-canciones');
    const busqueda = document.getElementById('busqueda-himno').value.toLowerCase();
    
    if (!container) return;

    // Filtrar por categoría y búsqueda
    let filtradas = todasLasCanciones.filter(c => {
        const coincideModo = (modoActual === 'Completo' || c.tipo === modoActual);
        const coincideBusqueda = (c.titulo.toLowerCase().includes(busqueda) || 
                                 c.letra.toLowerCase().includes(busqueda));
        return coincideModo && coincideBusqueda;
    });

    if (filtradas.length === 0) {
        container.innerHTML = '<p class="text-center text-muted mt-5 py-5">No se encontraron himnos con estos criterios.</p>';
        return;
    }

    container.innerHTML = filtradas.map(c => `
        <a href="visualizar-cancion.html?id=${c.id}" class="item-cancion shadow-sm">
            <i class="bi bi-music-note"></i> ${c.titulo}
            <span class="badge-tipo ${c.tipo === 'Alabanza' ? 'bg-primary' : 'bg-warning text-dark'}">${c.tipo}</span>
        </a>
    `).join('');
}
