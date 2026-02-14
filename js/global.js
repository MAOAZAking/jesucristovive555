/******************SCRIPT PARA ACTUALIZAR DÍA A DÍA EL DEVOCIONAL********************************/
// El video ahora se actualiza automáticamente en el servidor mediante GitHub Actions.
// El HTML ya contiene el enlace correcto.
console.log("Devocional cargado estáticamente.");

//////////////////////////////////////////CONTROLES DE AUDIO CON SVG//////////////////////////////////////////

const audio = document.getElementById("audioPrincipal");
const botonReproducir = document.getElementById("boton-reproducir");
const iconoReproducir = document.getElementById("icono-reproducir");

const botonSilenciar = document.getElementById("boton-silenciar");
const iconoBocina = document.getElementById("icono-bocina");

const barraProgreso = document.getElementById("barra-progreso");
const barraVolumen = document.getElementById("barra-volumen");

const botonOpciones = document.getElementById("boton-opciones");
const menuOpciones = document.getElementById("menu-opciones");
const opcionesVelocidad = document.querySelectorAll(".velocidad-opcion");

// Reproducir / pausar
botonReproducir.addEventListener("click", () => {
    if(audio.paused){
        audio.play();
        iconoReproducir.src = "multimedia/svg/svg-pausar-rojo.svg";
    } else {
        audio.pause();
        iconoReproducir.src = "multimedia/svg/svg-reproducir-rojo.svg";
    }
});

// Silenciar / activar sonido
botonSilenciar.addEventListener("click", () => {
    audio.muted = !audio.muted;
    iconoBocina.src = audio.muted 
        ? "multimedia/svg/svg-bocina-muteada-rojo.svg"
        : "multimedia/svg/svg-bocina-con-volumen-rojo.svg";
});

// Actualizar barra de progreso mientras se reproduce
audio.addEventListener("timeupdate", () => {

    if (!audio.duration) return; // evita error si aún no carga

    const porcentaje = (audio.currentTime / audio.duration) * 100;
    barraProgreso.value = porcentaje;

    barraProgreso.style.background = `linear-gradient(
        to right,
        rgb(255,100,100) 0%,
        rgb(255,100,100) ${porcentaje}%,
        #ddd ${porcentaje}%,
        #ddd 100%
    )`;
});


barraProgreso.addEventListener("input", () => {

    if (!audio.duration) return;

    const porcentaje = barraProgreso.value;

    audio.currentTime = (porcentaje / 100) * audio.duration;

    barraProgreso.style.background = `linear-gradient(
        to right,
        rgb(255,100,100) 0%,
        rgb(255,100,100) ${porcentaje}%,
        #ddd ${porcentaje}%,
        #ddd 100%
    )`;
});


// Control de volumen
barraVolumen.addEventListener("input", () => {
    audio.volume = barraVolumen.value;
    audio.muted = barraVolumen.value == 0;
    iconoBocina.src = audio.muted 
        ? "multimedia/svg/svg-bocina-muteada-rojo.svg"
        : "multimedia/svg/svg-bocina-con-volumen-rojo.svg";
});

// Mostrar barra de volumen al hover (PC)
botonSilenciar.addEventListener("mouseenter", () => {
    barraVolumen.style.display = "block";
});
botonSilenciar.addEventListener("mouseleave", () => {
    barraVolumen.style.display = "none";
});

// Mobile: tap & hold para mostrar barra
let timeoutTocar;
botonSilenciar.addEventListener("touchstart", () => {
    timeoutTocar = setTimeout(() => {
        barraVolumen.style.display = "block";
    }, 500); 
});
botonSilenciar.addEventListener("touchend", () => {
    clearTimeout(timeoutTocar);
});

// Mostrar / ocultar menú al hacer click
botonOpciones.addEventListener("click", () => {
    menuOpciones.style.display = menuOpciones.style.display === "block" ? "none" : "block";
});

// Cambiar velocidad cuando se selecciona una opción
opcionesVelocidad.forEach(boton => {
    boton.addEventListener("click", () => {
        const velocidad = parseFloat(boton.dataset.velocidad);
        audio.playbackRate = velocidad;
        menuOpciones.style.display = "none";
    });
});

// Opcional: cerrar menú si se hace click afuera
document.addEventListener("click", (e) => {
    if(!botonOpciones.contains(e.target) && !menuOpciones.contains(e.target)){
        menuOpciones.style.display = "none";
    }
});