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

    // Reemplazamos los números de los versículos para poder darles estilo.
    let textoPasaje = citaDelDia.texto.replace(/(\d+)/g, '<span class="numero-versiculo-rojo">$1</span>');
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

    // --- LÓGICA DE LA GALERÍA LABOR SOCIAL ---
    // Usamos '..' para salir de la carpeta 'js' y buscar en la raíz
    const galeriaPath = path.join(__dirname, '../multimedia', 'img', 'labor_social');
    let listaDeImagenes = [];
    try {
        console.log(`\n🔎 Buscando imágenes en: ${galeriaPath}`);
        const archivosGaleria = fs.readdirSync(galeriaPath);
        const imagenes = archivosGaleria
            .filter(file => /\.(jpe?g|png)$/i.test(file))
            .sort();
        
        if (imagenes.length === 0) {
            console.log(`🟡 No se encontraron imágenes válidas (.jpg, .png, .jpeg) en la carpeta.`);
        } else {
            console.log(`🖼️  Encontradas ${imagenes.length} imágenes para la galería.`);
            listaDeImagenes = imagenes.map(img => `multimedia/img/labor_social/${img}`);
        }
    } catch (error) {
        console.error(`❌ ¡Error! No se pudo leer la carpeta de la galería. ¿Existe la ruta "${galeriaPath}"?`, error);
    }

    // 3. Buscar y actualizar archivos HTML
    // Buscamos los archivos HTML en la carpeta raíz (un nivel arriba)
    const rootPath = path.join(__dirname, '..');
    const archivos = fs.readdirSync(rootPath);
    const archivosHtml = archivos.filter(archivo => path.extname(archivo).toLowerCase() === '.html');

    console.log(`\n📂 Analizando y actualizando ${archivosHtml.length} archivos HTML...`);

    // 4. Generar archivo de configuración para la galería
    // Como ya estamos en la carpeta 'js', guardamos el archivo directamente aquí
    const configGaleriasPath = path.join(__dirname, 'config_galeria.js');
    const contenidoConfig = `// Archivo generado automáticamente. No editar manualmente.\nconst imagenesLaborSocial = ${JSON.stringify(listaDeImagenes, null, 2)};`;
    fs.writeFileSync(configGaleriasPath, contenidoConfig, 'utf8');
    console.log(`   -> ✅ Generado archivo de configuración para la galería en 'config_galeria.js'`);

    archivosHtml.forEach(archivo => {
        const rutaArchivo = path.join(rootPath, archivo);
        let contenidoHtml = fs.readFileSync(rutaArchivo, 'utf8');
        let modificado = false;

        // Expresiones regulares para la cita
        const regexTitulo = /(<h5[^>]*id="titulo-cita"[^>]*>)(.*?)(<\/h5>)/;
        const regexTexto = /(<p[^>]*id="texto-cita"[^>]*>)(.*?)(<\/p>)/s;
        const regexLink = /(<a[^>]*id="link-cita"[^>]*href=")([^"]*)("[^>]*>)/;

        // 1. Actualiza la cita si el contenedor existe en el archivo
        if (regexTitulo.test(contenidoHtml)) {
            contenidoHtml = contenidoHtml.replace(regexTitulo, `$1${citaDelDia.ref}$3`);
            contenidoHtml = contenidoHtml.replace(regexTexto, `$1${textoPasaje}$3`);
            contenidoHtml = contenidoHtml.replace(regexLink, `$1${linkBibleGateway}$3`);
            modificado = true;
        }

        // 3. Si se modificó algo, se escribe el archivo
        if (modificado) {
            fs.writeFileSync(rutaArchivo, contenidoHtml, 'utf8');
            console.log(`   ✅ Actualizado: ${archivo}`);
        }
    });
}

actualizarCita();