document.addEventListener('DOMContentLoaded', function() {
    const galeriaContenedor = document.querySelector('#seccion-labor-social .galeria-imagenes');

    if (!galeriaContenedor) return;

    // Configuración del repositorio para leer la carpeta automáticamente
    const owner = 'MAOAZAking';
    const repo = 'jesucristovive555';
    const path = 'multimedia/img/labor_social';
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    console.log("Cargando galería desde GitHub...");

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) throw new Error('No se pudo conectar con GitHub');
            return response.json();
        })
        .then(data => {
            // Filtramos para obtener solo imágenes (jpg, png, jpeg)
            const imagenes = data.filter(item => 
                item.type === 'file' && /\.(jpe?g|png)$/i.test(item.name)
            );

            if (imagenes.length === 0) {
                galeriaContenedor.innerHTML = '<p class="text-center col-12">No hay imágenes disponibles.</p>';
                return;
            }

            let galeriaHtml = '';
            imagenes.forEach((imagen, index) => {
                // Construimos la ruta relativa para usar la imagen del sitio web
                const rutaImagen = `multimedia/img/labor_social/${imagen.name}`;
                galeriaHtml += `
                    <div class="col-md-4">
                        <img src="${rutaImagen}" class="img-fluid imagenes-seccion-galeria" alt="Foto de labor social ${index + 1}">
                    </div>`;
            });

            galeriaContenedor.innerHTML = galeriaHtml;

            // Si existe la función de lightbox en global.js, la invocamos o reiniciamos listeners aquí si fuera necesario
            // (El lightbox global funcionará si usa delegación de eventos o si se reinicia)
        })
        .catch(error => {
            console.error('Error cargando galería:', error);
            galeriaContenedor.innerHTML = '<p class="text-center col-12">Cargando imágenes...</p>';
        });
});