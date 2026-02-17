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

    // 3. Buscar y actualizar archivos HTML
    // Buscamos los archivos HTML en la carpeta raíz (un nivel arriba)
    const rootPath = path.join(__dirname, '..');
    const archivos = fs.readdirSync(rootPath);
    const archivosHtml = archivos.filter(archivo => path.extname(archivo).toLowerCase() === '.html');

    console.log(`\n📂 Analizando y actualizando ${archivosHtml.length} archivos HTML...`);

    archivosHtml.forEach(archivo => {
        const rutaArchivo = path.join(rootPath, archivo);
        let contenidoHtml = fs.readFileSync(rutaArchivo, 'utf8');
        let modificado = false;

        // Expresiones regulares para la cita
        const regexTitulo = /(<h5[^>]*id="titulo-cita"[^>]*>)(.*?)(<\/h5>)/;
        const regexTexto = /(<p[^>]*id="texto-cita"[^>]*>)(.*?)(<\/p>)/s;

        // 1. Actualiza la cita si el contenedor existe en el archivo
        if (regexTitulo.test(contenidoHtml)) {
            contenidoHtml = contenidoHtml.replace(regexTitulo, `$1${citaDelDia.ref}$3`);
            contenidoHtml = contenidoHtml.replace(regexTexto, `$1${textoPasaje}$3`);
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