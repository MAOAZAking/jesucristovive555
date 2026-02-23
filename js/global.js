/******************SCRIPT PARA ACTUALIZAR DÍA A DÍA EL DEVOCIONAL********************************/
// El video ahora se actualiza automáticamente en el servidor mediante GitHub Actions.
// El HTML ya contiene el enlace correcto.
console.log("Devocional cargado estáticamente.");


//CREA ANIMAICON DE CAMBIO DE FONDO DE COLORES A IMAGEN
window.addEventListener("load", function () {
    document.querySelector(".bg-real").classList.add("visible");
});


/****************** PRECARGA DE MODELOS RF ******************/
// Esto descarga los modelos en la caché del navegador para que el login sea instantáneo
window.addEventListener('load', () => {
    if (typeof faceapi !== 'undefined') {
        console.log("Precargando modelos de reconocimiento facial...");
        Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri('modelos_rf'),
            faceapi.nets.faceLandmark68Net.loadFromUri('modelos_rf'),
            faceapi.nets.faceRecognitionNet.loadFromUri('modelos_rf')
        ]).then(() => console.log("Modelos precargados en caché.")).catch(e => console.log("Nota: Precarga fallida (normal si es primera vez u offline)", e));
    }
});


//////////////////////////////////////////CONTROLES DE AUDIO CON SVG//////////////////////////////////////////

// Iteramos sobre todos los reproductores de audio en la página para manejar múltiples instancias
document.querySelectorAll('.reproductor-audio-editable').forEach(contenedor => {
    
    // Buscamos los elementos dentro de ESTE contenedor específico
    // Usamos selectores de atributo [id="..."] para evitar conflictos con IDs duplicados en el HTML
    const audio = contenedor.querySelector('audio');
    const botonReproducir = contenedor.querySelector('[id="boton-reproducir"]');
    const iconoReproducir = contenedor.querySelector('[id="icono-reproducir"]');

    const botonSilenciar = contenedor.querySelector('[id="boton-silenciar"]');
    const iconoBocina = contenedor.querySelector('[id="icono-bocina"]');

    const barraProgreso = contenedor.querySelector('[id="barra-progreso"]');
    const barraVolumen = contenedor.querySelector('[id="barra-volumen"]');

    const botonOpciones = contenedor.querySelector('[id="boton-opciones"]');
    const menuOpciones = contenedor.querySelector('[id="menu-opciones"]');
    const opcionesVelocidad = contenedor.querySelectorAll('.velocidad-opcion');

    // Si falta algún elemento crítico, saltamos este contenedor
    if (!audio || !botonReproducir) return;

    // --- Lógica de Reproducción ---
    botonReproducir.addEventListener("click", () => {
        if(audio.paused){
            // Pausar otros audios para que no suenen al tiempo
            document.querySelectorAll('audio').forEach(a => {
                if(a !== audio) a.pause();
            });
            
            audio.play();
        } else {
            audio.pause();
        }
    });

    // Sincronizar icono si el audio se pausa/reproduce por otros medios (ej. fin del audio)
    audio.addEventListener('play', () => iconoReproducir.src = "multimedia/svg/svg-pausar-rojo.svg");
    audio.addEventListener('pause', () => iconoReproducir.src = "multimedia/svg/svg-reproducir-rojo.svg");

    // --- Lógica de Silencio ---
    botonSilenciar.addEventListener("click", () => {
        if (audio.muted || audio.volume === 0) {
            // Si está silenciado o en 0, restablecer al 50%
            audio.muted = false;
            audio.volume = 0.5;
            barraVolumen.value = 0.5;
        } else {
            audio.muted = true;
        }
        actualizarIconoVolumen();
    });

    function actualizarIconoVolumen() {
        iconoBocina.src = (audio.muted || audio.volume === 0)
            ? "multimedia/svg/svg-bocina-muteada-rojo.svg"
            : "multimedia/svg/svg-bocina-con-volumen-rojo.svg";
    }

    // --- Barra de Progreso ---
    audio.addEventListener("timeupdate", () => {
        if (!audio.duration) return;
        const porcentaje = (audio.currentTime / audio.duration) * 100;
        barraProgreso.value = porcentaje;
        actualizarFondoBarra(barraProgreso, porcentaje);
    });

    barraProgreso.addEventListener("input", () => {
        if (!audio.duration) return;
        const porcentaje = barraProgreso.value;
        audio.currentTime = (porcentaje / 100) * audio.duration;
        actualizarFondoBarra(barraProgreso, porcentaje);
    });

    function actualizarFondoBarra(elemento, porcentaje) {
        elemento.style.background = `linear-gradient(to right, rgb(255,100,100) 0%, rgb(255,100,100) ${porcentaje}%, #ddd ${porcentaje}%, #ddd 100%)`;
    }

    // --- Control de Volumen ---
    barraVolumen.addEventListener("input", () => {
        audio.volume = barraVolumen.value;
        audio.muted = (parseFloat(barraVolumen.value) === 0);
        actualizarIconoVolumen();
    });

    // Bloquear scroll de la página al deslizar volumen en móviles
    barraVolumen.addEventListener('touchstart', () => {
        document.body.style.overflow = 'hidden';
    }, { passive: true });

    barraVolumen.addEventListener('touchend', () => {
        document.body.style.overflow = '';
    });

    // Mostrar barra volumen (Desktop) con retardo para mejor UX
    let timeoutVolumen;
    const mostrarVolumen = () => {
        clearTimeout(timeoutVolumen);
        barraVolumen.style.display = "block";
    };
    const ocultarVolumen = () => {
        timeoutVolumen = setTimeout(() => {
            barraVolumen.style.display = "none";
        }, 300);
    };

    botonSilenciar.addEventListener("mouseenter", mostrarVolumen);
    botonSilenciar.addEventListener("mouseleave", ocultarVolumen);
    barraVolumen.addEventListener("mouseenter", mostrarVolumen);
    barraVolumen.addEventListener("mouseleave", ocultarVolumen);

    // Mobile: tap & hold
    let timeoutTocar;
    botonSilenciar.addEventListener("touchstart", () => {
        timeoutTocar = setTimeout(() => barraVolumen.style.display = "block", 500); 
    });
    botonSilenciar.addEventListener("touchend", () => clearTimeout(timeoutTocar));

    // --- Menú de Opciones y Velocidad ---
    botonOpciones.addEventListener("click", (e) => {
        e.stopPropagation(); // Evita que el click llegue al document
        
        // Cerrar otros menús abiertos
        document.querySelectorAll('.menu-opciones').forEach(m => {
            if(m !== menuOpciones) m.style.display = "none";
        });

        menuOpciones.style.display = (menuOpciones.style.display === "block") ? "none" : "block";
    });

    opcionesVelocidad.forEach(boton => {
        boton.addEventListener("click", (e) => {
            e.stopPropagation();
            const velocidad = parseFloat(boton.dataset.velocidad);
            
            // Aplicar velocidad al audio de ESTE reproductor
            audio.playbackRate = velocidad;
            
            // Feedback visual: resaltar la opción seleccionada
            opcionesVelocidad.forEach(b => b.style.backgroundColor = "transparent");
            boton.style.backgroundColor = "rgba(255,0,0,0.2)";

            menuOpciones.style.display = "none";
        });
    });
});

// Cerrar cualquier menú de opciones al hacer click fuera
document.addEventListener("click", () => {
    document.querySelectorAll('.menu-opciones').forEach(menu => {
        menu.style.display = "none";
    });
});

/* =========================================
   LÓGICA DEL LIGHTBOX (GALERÍA)
   ========================================= */
const lightbox = document.getElementById('lightbox');
const imgLightbox = document.getElementById('img-lightbox');
const botonCerrarLightbox = document.querySelector('.cerrar-lightbox');
const btnAnterior = document.getElementById('anterior');
const btnSiguiente = document.getElementById('siguiente');

let imagenesActuales = [];
let indiceActual = 0;

function actualizarImagenLightbox() {
    if (imagenesActuales.length > 0) {
        imgLightbox.src = imagenesActuales[indiceActual].src;
    }
}

// Event Delegation para detectar clic en imágenes (incluso las dinámicas)
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('imagenes-seccion-galeria')) {
        // Recopilamos todas las imágenes de la galería actual
        imagenesActuales = Array.from(document.querySelectorAll('.imagenes-seccion-galeria'));
        indiceActual = imagenesActuales.indexOf(e.target);
        
        if (indiceActual !== -1 && lightbox) {
            actualizarImagenLightbox();
            lightbox.style.display = 'flex';
        }
    }
});

// Cerrar al hacer clic en la X o fuera de la imagen (en el fondo oscuro)
if (lightbox) {
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target === botonCerrarLightbox) {
            lightbox.style.display = 'none';
        }
    });
}

// Navegación (Bucle infinito)
if (btnSiguiente) btnSiguiente.addEventListener('click', (e) => {
    e.stopPropagation(); // Evita que se cierre el lightbox
    indiceActual = (indiceActual + 1) % imagenesActuales.length;
    actualizarImagenLightbox();
});

if (btnAnterior) btnAnterior.addEventListener('click', (e) => {
    e.stopPropagation(); // Evita que se cierre el lightbox
    indiceActual = (indiceActual - 1 + imagenesActuales.length) % imagenesActuales.length;
    actualizarImagenLightbox();
});

/* =========================================
   LÓGICA COMPARTIDA DE MÚSICA Y ACORDES
   ========================================= */
let instrumentoActual = 'guitarra'; // Instrumento por defecto

function procesarTextoCancion(texto) {
    if (!texto) return '';
    const lineas = texto.split('\n');
    let html = '';
    lineas.forEach(linea => {
        if (esLineaDeAcordes(linea)) {
            const lineaProcesada = linea.replace(/([A-G][#b]?(?:m|maj|min|dim|aug|sus|add|7|9|11|13|5|6)?(?:\/[A-G][#b]?)?)/g, 
                '<a class="acorde-link" onclick="verAcorde(\'$1\')">$1</a>');
            html += `<div class="linea-acordes">${lineaProcesada}</div>`;
        } else {
            html += `<div class="linea-letra">${linea}</div>`;
        }
    });
    return html;
}

function esLineaDeAcordes(linea) {
    const lineaTrim = linea.trim();
    if (lineaTrim.length === 0) return false;
    const palabras = lineaTrim.split(/\s+/);
    const regexAcorde = /^[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|7|9|11|13|5|6)?(?:\/[A-G][#b]?)?$/;
    const conteoAcordes = palabras.filter(p => regexAcorde.test(p)).length;
    return (conteoAcordes / palabras.length) > 0.8;
}

function cambiarInstrumento(instrumento) {
    instrumentoActual = instrumento;
    // Actualizar estilo de botones
    document.querySelectorAll('.btn-instrumento').forEach(btn => btn.classList.remove('activo'));
    const btn = document.getElementById(`btn-${instrumento}`);
    if(btn) btn.classList.add('activo');
}

// La función verAcorde depende del modal en el HTML, se mantiene genérica aquí pero requiere el modal en el DOM
function verAcorde(nombreAcorde) {
    const nombreArchivo = nombreAcorde.replace('#', 's').replace('/', '_'); 
    
    // 1. Intentar usar el nuevo visor en línea (si existe en la página)
    const contenedorVisor = document.getElementById('contenedor-visor-acorde');
    const nombreVisor = document.getElementById('nombre-acorde-visor');
    const imgVisor = document.getElementById('imagen-acorde-visor');

    if (contenedorVisor && nombreVisor && imgVisor) {
        nombreVisor.innerText = `${nombreAcorde}`;
        imgVisor.src = `multimedia/svg/ministerio-de-alabanza/acordes/${instrumentoActual}/${nombreArchivo}.svg`;
        imgVisor.onerror = function() {
            this.src = 'multimedia/img/logo-1-ministerio-de-restauracion-jesucristo-¡vive!.png';
        };
        contenedorVisor.style.display = 'block';
    } else {
        // 2. Fallback: Si no existe el visor, intentar con el modal antiguo (por compatibilidad)
        const modalEl = document.getElementById('modalAcorde');
        if(modalEl) {
            // Lógica antigua omitida, priorizamos el visor
            console.warn("No se encontró el contenedor del visor de acordes.");
        }
    }
}