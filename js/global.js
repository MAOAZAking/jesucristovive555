/******************SCRIPT PARA ACTUALIZAR DÍA A DÍA EL DEVOCIONAL********************************/
// El video ahora se actualiza automáticamente en el servidor mediante GitHub Actions.
// El HTML ya contiene el enlace correcto.
console.log("Devocional cargado estáticamente.");

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
const imagenesGaleria = document.querySelectorAll('.imagenes-seccion-galeria');
const botonCerrarLightbox = document.querySelector('.cerrar-lightbox');

imagenesGaleria.forEach(imagen => {
    imagen.addEventListener('click', () => {
        lightbox.style.display = 'flex';
        imgLightbox.src = imagen.src;
    });
});

// Cerrar al hacer clic en la X o fuera de la imagen (en el fondo oscuro)
lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target === botonCerrarLightbox) {
        lightbox.style.display = 'none';
    }
});