document.addEventListener('DOMContentLoaded', async () => {
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

    // 3. Si no está en LocalStorage (modo pruebas local), buscar en el archivo JSON directamente
    if (!cancion) {
        try {
            const response = await fetch('json/canciones.json');
            const listaRemota = await response.json();
            cancion = listaRemota.find(c => c.id === idCancion);
        } catch (error) {
            console.log("No se pudo cargar canciones.json localmente.");
        }
    }

    if (cancion) {
        renderizarCancion(cancion);
    } else {
        document.getElementById('titulo').innerText = "Canción no encontrada";
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
    
    // Cargar usuarios para obtener el nombre completo y el rol
    fetch('json/usuarios.json')
        .then(response => response.json())
        .then(usuarios => {
            const implementador = usuarios.find(u => u.nombredeusuario === c.creadoPor);
            const editor = usuarios.find(u => u.nombredeusuario === c.editadoPor);

            if (c.creadoPor) {
                const nombreImplementador = implementador ? `${implementador.roles.replace(/-/g, ' ')} ${implementador.nombrecompleto}` : c.creadoPor;
                infoImpl.innerHTML = `Implementado por: <strong>${nombreImplementador}</strong> el ${c.fechaCreacion}`;
            }
            if (c.editadoPor) {
                const nombreEditor = editor ? `${editor.roles.replace(/-/g, ' ')} ${editor.nombrecompleto}` : c.editadoPor;
                infoEdic.innerHTML = `Última revisión por: <strong>${nombreEditor}</strong> el ${c.fechaEdicion}`;
            }
        })
        .catch(error => {
            console.error('Error al cargar usuarios:', error);
            // Si falla la carga de usuarios, mostrar solo el nombre de usuario
            if (c.creadoPor) {
                infoImpl.innerHTML = `Implementado por: <strong>${c.creadoPor}</strong> el ${c.fechaCreacion}`;
            }
            if (c.editadoPor) {
                infoEdic.innerHTML = `Última revisión por: <strong>${c.editadoPor}</strong> el ${c.fechaEdicion}`;
            }
        });
}

// ... (resto de funciones como procesarTextoCancion, etc.)
