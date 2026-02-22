document.addEventListener('DOMContentLoaded', () => {
    // 1. Obtener ID de la URL
    const params = new URLSearchParams(window.location.search);
    const idCancion = params.get('id');

    if (!idCancion) {
        document.getElementById('titulo').innerText = "Canción no especificada";
        return;
    }

    // 2. Buscar la canción (Primero en LocalStorage para inmediatez, luego GitHub si hiciera falta)
    const cancionesLocal = localStorage.getItem('canciones_local');
    let cancion = null;

    if (cancionesLocal) {
        const lista = JSON.parse(cancionesLocal);
        cancion = lista.find(c => c.id === idCancion);
    }

    if (cancion) {
        renderizarCancion(cancion);
    } else {
        document.getElementById('titulo').innerText = "Canción no encontrada (o sincronizando...)";
    }
});

function renderizarCancion(c) {
    document.title = `${c.titulo} - Ministerio Jesucristo ¡VIVE!`;
    document.getElementById('titulo').innerText = c.titulo;
    document.getElementById('tipo').innerText = c.tipo;
    document.getElementById('contenido').innerHTML = procesarTextoCancion(c.contenido);
    
    // Mostrar Metadatos
    const infoImpl = document.getElementById('info-implementacion');
    const infoEdic = document.getElementById('info-edicion');
    
    if (c.creadoPor) {
        infoImpl.innerHTML = `Implementado por: <strong>${c.creadoPor}</strong> el ${c.fechaCreacion}`;
    }
    if (c.editadoPor) {
        infoEdic.innerHTML = `Última revisión por: <strong>${c.editadoPor}</strong> el ${c.fechaEdicion}`;
    }
}