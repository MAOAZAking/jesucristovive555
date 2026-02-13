window.addEventListener('scroll', function () {
    document.querySelector('.navbar')
        .classList.toggle('barra-activa', window.scrollY > 50);

    document.getElementById('boton-subir').style.display =
        window.scrollY > 300 ? 'block' : 'none';
});

document.getElementById('boton-subir')
.addEventListener('click', function () {

    const duracion = 800;
    const inicio = window.scrollY;
    const inicioTiempo = performance.now();

    function animarScroll(tiempoActual) {

        const tiempoTranscurrido = tiempoActual - inicioTiempo;
        const progreso = Math.min(tiempoTranscurrido / duracion, 1);

        const ease = progreso < 0.5
            ? 2 * progreso * progreso
            : 1 - Math.pow(-2 * progreso + 2, 2) / 2;

        window.scrollTo(0, inicio * (1 - ease));

        if (progreso < 1) {
            requestAnimationFrame(animarScroll);
        }
    }

    requestAnimationFrame(animarScroll);
});

const elements = document.querySelectorAll('.animacion-scroll');

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.2 });

elements.forEach(el => observer.observe(el));

document.getElementById('formulario-contacto')
.addEventListener('submit', function (e) {

    e.preventDefault();

    const mensaje = document.getElementById('mensaje').value.trim();

    if (mensaje === "") return;

    const numero = "573168721412";
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;

    window.open(url, "_blank");

    this.reset();
});
