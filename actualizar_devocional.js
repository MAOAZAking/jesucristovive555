const fs = require('fs');
const path = require('path');

// ⚠️ IMPORTANTE: Coloca tu API KEY aquí (la misma que en global.js)
const API_KEY = "AIzaSyBMRAEdRr6haBFQGo-MKTqtSVykPDHdMx0"; 
const CHANNEL_ID = "UCZRzRrdOC4vxIQYm03US9Wg";

async function actualizar() {
    // 1. Obtener fecha actual en formato ddmmaa
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, '0');
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const anio = String(hoy.getFullYear()).slice(-2);
    const fechaHoy = `${dia}${mes}${anio}`;

    console.log(`📅 Buscando devocional para la fecha: ${fechaHoy}...`);

    // 2. Consultar API YouTube
    const tituloBusqueda = `Dev ${fechaHoy}`;
    const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&type=video&maxResults=1&q=${encodeURIComponent(tituloBusqueda)}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
            const videoId = data.items[0].id.videoId;
            
            // 3. Buscar todos los archivos .html en la carpeta raíz
            const archivos = fs.readdirSync(__dirname);
            const archivosHtml = archivos.filter(archivo => path.extname(archivo).toLowerCase() === '.html');

            console.log(`📂 Analizando ${archivosHtml.length} archivos HTML...`);

            const nuevoLink = `https://www.youtube.com/embed/${videoId}?rel=0`;
            
            // 4. Recorrer cada archivo y actualizar si tiene el iframe
            archivosHtml.forEach(archivo => {
                const rutaArchivo = path.join(__dirname, archivo);
                let contenidoHtml = fs.readFileSync(rutaArchivo, 'utf8');

                // Regex para encontrar el iframe con la clase específica
                const regex = /(<iframe[^>]*class="[^"]*iframde-devocional-diario[^"]*"[^>]*src=")([^"]*)(")/g;

                if (regex.test(contenidoHtml)) {
                    const htmlActualizado = contenidoHtml.replace(regex, `$1${nuevoLink}$3`);
                    fs.writeFileSync(rutaArchivo, htmlActualizado, 'utf8');
                    console.log(`✅ Actualizado: ${archivo}`);
                }
            });
            
            console.log(`🎉 Proceso terminado. Video ID: ${videoId}`);
        } else {
            console.log(`❌ No se encontró video en YouTube con el título: "${tituloBusqueda}"`);
        }
    } catch (error) {
        console.error("❌ Error en la consulta:", error);
    }
}

actualizar();