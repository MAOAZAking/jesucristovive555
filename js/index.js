            window.addEventListener('scroll', function () {
                document.querySelector('.navbar').classList.toggle('barra-activa', window.scrollY > 50);
                document.getElementById('boton-subir').style.display = window.scrollY > 300 ? 'block' : 'none';
            });

            document.getElementById('boton-subir').addEventListener('click', function () {
                const duration = 800;
                const start = window.scrollY;
                const startTime = performance.now();

                function animate(time) {
                    const progress = Math.min((time - startTime) / duration, 1);
                    const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                    window.scrollTo(0, start * (1 - ease));
                    if (progress < 1) requestAnimationFrame(animate);
                }

                requestAnimationFrame(animate);
            });

            document.querySelectorAll('.contador').forEach(counter => {
                const target = +counter.dataset.target;
                let count = 0;

                function update() {
                    count += target / 100;
                    if (count < target) {
                        counter.innerText = Math.ceil(count);
                        requestAnimationFrame(update);
                    } else {
                        counter.innerText = target;
                    }
                }

                update();
            });

            const elements = document.querySelectorAll('.animacion-scroll, .aparecer-izquierda, .zoom-entrada');
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.2 });
            elements.forEach(el => observer.observe(el));

            const formularioContacto = document.getElementById('formulario-contacto');
            if (formularioContacto) {
                formularioContacto.addEventListener('submit', function (e) {
                    e.preventDefault();
                    const msg = document.getElementById('mensaje-enviado');
                    if (msg) {
                        msg.classList.remove('d-none');
                        setTimeout(() => {
                            msg.classList.add('d-none');
                            this.reset();
                        }, 3000);
                    }
                });
            }

/******************SCRIPT PARA DESCARGAR AUDIOS********************************/
        const btnDescargarMusica = document.getElementById('descargar-musica');
        if (btnDescargarMusica) {
            btnDescargarMusica.addEventListener('click', async function(e) {
                e.preventDefault();
                try {
                    const response = await fetch('multimedia/audio/musica-instrumental-1.mp3');
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'musica-instrumental-1.mp3';
                    link.click();
                    URL.revokeObjectURL(url);
                } catch (error) {
                    console.error('Error al descargar la música:', error);
                }
            });

            btnDescargarMusica.addEventListener('click', function () {
                // El atributo download ya hace todo
                console.log("Descargando música...");
            });
        }

        const btnDescargarPredica = document.getElementById('descargar-predica');
        if (btnDescargarPredica) {
            btnDescargarPredica.addEventListener('click', function () {
                console.log("Descargando prédica...");
            });
        }
