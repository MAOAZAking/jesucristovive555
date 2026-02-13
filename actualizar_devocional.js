const fs = require('fs');
const path = require('path');

// ⚠️ IMPORTANTE: Coloca tu API KEY aquí (la misma que en global.js)
const API_KEY = "AIzaSyBMRAEdRr6haBFQGo-MKTqtSVykPDHdMx0"; 
const CHANNEL_ID = "UCZRzRrdOC4vxIQYm03US9Wg";

async function actualizar() {
    // 1. Obtener fecha actual en formato ddmmaa (FORZANDO HORA COLOMBIA)
    const hoy = new Date();
    
    // Usamos Intl para convertir la hora UTC del servidor a la hora de Bogotá
    const opciones = { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' };
    const formato = new Intl.DateTimeFormat('es-CO', opciones);
    const partes = formato.formatToParts(hoy);
    
    const dia = partes.find(p => p.type === 'day').value;
    const mes = partes.find(p => p.type === 'month').value;
    const anio = partes.find(p => p.type === 'year').value.slice(-2);
    const fechaHoy = `${dia}${mes}${anio}`;

    const tituloBusqueda = `Dev ${fechaHoy}`;

    console.log("--------------------------------------------------");
    console.log(`🔍 INICIANDO BÚSQUEDA (Hora Colombia)`);
    console.log(`📅 Fecha objetivo: ${fechaHoy}`);
    console.log(`🔎 Buscando en YouTube: "${tituloBusqueda}"`);
    console.log("--------------------------------------------------");

    // 2. Consultar API YouTube
    const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&type=video&maxResults=1&q=${encodeURIComponent(tituloBusqueda)}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
            const videoEncontrado = data.items[0];
            const videoId = videoEncontrado.id.videoId;
            const tituloEncontrado = videoEncontrado.snippet.title;

            console.log(`✅ ¡VIDEO ENCONTRADO!`);
            console.log(`📺 Título real del video: "${tituloEncontrado}"`);
            console.log(`🆔 ID del video: ${videoId}`);
            
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
            console.log(`❌ RESULTADO NEGATIVO`);
            console.log(`No se encontró ningún video que coincida con: "${tituloBusqueda}"`);
            console.log(`Nota: Asegúrate de que el video ya esté público en el canal.`);
        }
    } catch (error) {
        console.error("❌ Error en la consulta:", error);
    }
}

actualizar();