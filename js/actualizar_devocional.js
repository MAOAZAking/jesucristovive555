const fs = require('fs');
const path = require('path');

// Importamos la base de datos de citas para evitar errores
const citasBiblicas = require('./citas_del_mes');

// Leemos las credenciales desde las variables de entorno (GitHub Secrets)
const API_KEY = process.env.API_KEY;
const CHANNEL_ID = process.env.CHANNEL_ID;
let skipYoutube = false;

if (!API_KEY || !CHANNEL_ID) {
    console.warn("⚠️ Advertencia: No se encontraron las credenciales de YouTube. Se omitirá la actualización del video, pero se actualizarán la cita y la galería.");
    skipYoutube = true;
}

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

    // --- LÓGICA DE LA CITA BÍBLICA ---
    const diaInt = parseInt(dia, 10);
    const indice = (diaInt - 1) % citasBiblicas.length;
    const citaDelDia = citasBiblicas[indice];
    console.log(`📖 Cita del día seleccionada: ${citaDelDia.ref}`);
    // Reemplazamos los números de los versículos para poder darles estilo.
    let textoPasaje = citaDelDia.texto.replace(/(\d+)/g, '<span class="numero-versiculo-rojo">$1</span>');

    // 2. Consultar API YouTube
    // Agregamos order=date para priorizar los videos más recientes
    let nuevoLink = null;

    if (!skipYoutube) {
        const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&type=video&maxResults=1&q=${encodeURIComponent(tituloBusqueda)}`;
        try {
            const response = await fetch(url);
            const data = await response.json();

            // VERIFICACIÓN DE ERRORES DE LA API
            if (data.error) {
                console.log("--------------------------------------------------");
                console.log("❌ ERROR CRÍTICO EN LA API DE YOUTUBE");
                console.log(`Código: ${data.error.code}`);
                console.log(`Mensaje: ${data.error.message}`);
                console.log("Posible causa: API Key restringida (Referer/IP), cuota excedida o clave inválida.");
                console.log("--------------------------------------------------");
                // No hacemos return para permitir que se actualice la galería
            } else if (data.items && data.items.length > 0) {
                const videoEncontrado = data.items[0];
                const videoId = videoEncontrado.id.videoId;
                const tituloEncontrado = videoEncontrado.snippet.title;

                console.log(`✅ ¡VIDEO ENCONTRADO!`);
                console.log(`📺 Título real del video: "${tituloEncontrado}"`);
                console.log(`🆔 ID del video: ${videoId}`);
                
                nuevoLink = `https://www.youtube.com/embed/${videoId}?rel=0`;
            } else {
                console.log(`❌ RESULTADO NEGATIVO`);
                console.log(`No se encontró ningún video que coincida con: "${tituloBusqueda}"`);
                console.log("Respuesta cruda de YouTube:", JSON.stringify(data, null, 2));
                console.log(`Nota: Asegúrate de que el video ya esté público en el canal.`);
            }
        } catch (error) {
            console.error("❌ Error en la consulta:", error);
        }
    } else {
        console.log("⏭️ Saltando consulta a YouTube (sin credenciales).");
    }

    // 3. Buscar todos los archivos .html en la carpeta raíz
    const rootPath = path.join(__dirname, '..');
    const archivos = fs.readdirSync(rootPath);
    const archivosHtml = archivos.filter(archivo => path.extname(archivo).toLowerCase() === '.html');

    console.log(`📂 Analizando ${archivosHtml.length} archivos HTML...`);

    // 4. Recorrer cada archivo y actualizar
    archivosHtml.forEach(archivo => {
        const rutaArchivo = path.join(rootPath, archivo);
        let contenidoHtml = fs.readFileSync(rutaArchivo, 'utf8');
        let modificado = false;

        // Actualizar Video (solo si se encontró uno nuevo)
        if (nuevoLink) {
            const regexVideo = /(<iframe[^>]*class="[^"]*iframde-devocional-diario[^"]*"[^>]*src=")([^"]*)(")/g;
            if (regexVideo.test(contenidoHtml)) {
                contenidoHtml = contenidoHtml.replace(regexVideo, `$1${nuevoLink}$3`);
                modificado = true;
            }
        }

        // Actualizar Cita Bíblica (SIEMPRE, independientemente del video)
        const regexTitulo = /(<h5[^>]*id="titulo-cita"[^>]*>)(.*?)(<\/h5>)/;
        const regexTexto = /(<p[^>]*id="texto-cita"[^>]*>)(.*?)(<\/p>)/s;

        if (regexTitulo.test(contenidoHtml)) {
            contenidoHtml = contenidoHtml.replace(regexTitulo, `$1${citaDelDia.ref}$3`);
            contenidoHtml = contenidoHtml.replace(regexTexto, `$1${textoPasaje}$3`);
            modificado = true;
        }

        if (modificado) {
            fs.writeFileSync(rutaArchivo, contenidoHtml, 'utf8');
            console.log(`✅ Actualizado: ${archivo}`);
        }
    });
    
    console.log(`🎉 Proceso terminado.`);
}

actualizar();