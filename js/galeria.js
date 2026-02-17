document.addEventListener('DOMContentLoaded', function() {
    const galeriaContenedor = document.querySelector('#subseccion-labor-social .galeria-imagenes');

    if (!galeriaContenedor) return;

    // --- PREVENIR SALTO DE POSICIÓN AL CARGAR IMÁGENES ---
    // Si el usuario está viendo contenido más abajo, ajustamos el scroll cuando la galería cambia de tamaño.
    let alturaPrevia = galeriaContenedor.offsetHeight;
    
    const observadorAltura = new ResizeObserver(() => {
        const alturaActual = galeriaContenedor.offsetHeight;
        const diferencia = alturaActual - alturaPrevia;
        
        // Si hubo cambio de tamaño
        if (diferencia !== 0) {
            const rect = galeriaContenedor.getBoundingClientRect();
            
            // Si la parte inferior de la galería está por encima del viewport (el usuario scrolleó hacia abajo)
            if (rect.bottom < 0) {
                window.scrollBy(0, diferencia);
            }
            
            alturaPrevia = alturaActual;
        }
    });
    
    observadorAltura.observe(galeriaContenedor);

    // Configuración del repositorio para leer la carpeta automáticamente
    const owner = 'MAOAZAking';
    const repo = 'jesucristovive555';
    const path = 'multimedia/img/labor_social';
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    console.log("Cargando galería desde GitHub...");

    // Mostrar mensaje de carga antes de iniciar la petición
    galeriaContenedor.innerHTML = `
        <div class="col-12 text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-2" style="font-family: 'Playball', cursive; color: rgb(0, 0, 138); transform: skewX(20deg); font-weight: 700; letter-spacing: 1px; font-size: 30px; display: inline-block;">Cargando imágenes, por favor espere...</p>
        </div>`;

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
            galeriaContenedor.innerHTML = '<p class="text-center col-12 text-danger">No se pudieron cargar las imágenes. Verifique su conexión.</p>';
        });
});