document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const idCancion = urlParams.get('id');
    
    if (!idCancion) {
        window.location.href = 'himnario.html';
        return;
    }

    try {
        const res = await fetch('json/himnario.json');
        const canciones = await res.json();
        const cancion = canciones.find(c => c.id === idCancion);

        if (cancion) {
            document.title = `${cancion.titulo} - Himnario`;
            document.getElementById('titulo').textContent = cancion.titulo;
            document.getElementById('tipo').textContent = cancion.tipo;
            
            // Procesar saltos de línea para el HTML
            const contenido = document.getElementById('contenido');
            contenido.innerHTML = cancion.letra.split('\n').map(linea => `<div>${linea || '&nbsp;'}</div>`).join('');
        } else {
            document.getElementById('titulo').textContent = "Canción no encontrada";
        }
    } catch (e) {
        console.error("Error cargando canción", e);
        document.getElementById('titulo').textContent = "Error de conexión";
    }
});