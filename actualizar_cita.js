const fs = require('fs');
const path = require('path');

// Importamos la base de datos de citas
const citasBiblicas = require('./citas_del_mes');

async function actualizarCita() {
    // 1. Obtener fecha actual (Hora Colombia)
    const hoy = new Date();
    const opciones = { timeZone: 'America/Bogota', day: 'numeric' };
    const formato = new Intl.DateTimeFormat('es-CO', opciones);
    const dia = formato.format(hoy);

    // 2. Seleccionar cita del día
    const diaInt = parseInt(dia, 10);
    const indice = (diaInt - 1) % citasBiblicas.length;
    const citaDelDia = citasBiblicas[indice];
    console.log(`📅 Día: ${dia} | 📖 Cita seleccionada: ${citaDelDia}`);

    let textoPasaje = citaDelDia.texto;
    let linkBibleGateway = "https://www.biblegateway.com/";

    const regexCita = /^(.*)\s+(\d+):(\d+)(?:-(\d+))?$/;
    const matchCita = citaDelDia.ref.match(regexCita);

    if (matchCita) {
        const libro = matchCita[1];
        const capitulo = matchCita[2];
        const versiculoInicio = matchCita[3];
        const versiculoFin = matchCita[4];

        // Construir Link Bible Gateway
        const libroEncoded = encodeURIComponent(libro);
        linkBibleGateway = `https://www.biblegateway.com/passage/?search=${libroEncoded}%20${capitulo}%3A${versiculoInicio}`;
        if (versiculoFin) linkBibleGateway += `-${versiculoFin}`;
        linkBibleGateway += "&version=RVR1960";
    }

    // 3. Buscar y actualizar archivos HTML
    const archivos = fs.readdirSync(__dirname);
    const archivosHtml = archivos.filter(archivo => path.extname(archivo).toLowerCase() === '.html');

    console.log(`📂 Actualizando ${archivosHtml.length} archivos HTML...`);

    archivosHtml.forEach(archivo => {
        const rutaArchivo = path.join(__dirname, archivo);
        let contenidoHtml = fs.readFileSync(rutaArchivo, 'utf8');
        let modificado = false;

        const regexTitulo = /(<h5[^>]*id="titulo-cita"[^>]*>)(.*?)(<\/h5>)/;
        const regexTexto = /(<p[^>]*id="texto-cita"[^>]*>)(.*?)(<\/p>)/s;
        const regexLink = /(<a[^>]*id="link-cita"[^>]*href=")([^"]*)("[^>]*>)/;

        if (regexTitulo.test(contenidoHtml)) {
            contenidoHtml = contenidoHtml.replace(regexTitulo, `$1${citaDelDia.ref}$3`);
            contenidoHtml = contenidoHtml.replace(regexTexto, `$1${textoPasaje}$3`);
            contenidoHtml = contenidoHtml.replace(regexLink, `$1${linkBibleGateway}$3`);
            fs.writeFileSync(rutaArchivo, contenidoHtml, 'utf8');
            console.log(`   ✅ Actualizado: ${archivo}`);
        }
    });
}

actualizarCita();