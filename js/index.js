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

            document.getElementById('formulario-contacto').addEventListener('submit', function (e) {
                e.preventDefault();
                const msg = document.getElementById('mensaje-enviado');
                msg.classList.remove('d-none');
                setTimeout(() => {
                    msg.classList.add('d-none');
                    this.reset();
                }, 3000);
            });

/******************SCRIPT PARA ACTUALIZAR DÍA A DÍA EL DEVOCIONAL********************************/
            async function cargarVideoPorFecha() {
            const API_KEY = ""; /*AIzaSyBMRAEdRr6haBFQGo-MKTqtSVykPDHdMx0*/
            const CHANNEL_ID = "UCZRzRrdOC4vxIQYm03US9Wg";

            // 📅 Obtener fecha actual en formato ddmmaa
            const hoy = new Date();
            const dia = String(hoy.getDate()).padStart(2, '0');
            const mes = String(hoy.getMonth() + 1).padStart(2, '0');
            const anio = String(hoy.getFullYear()).slice(-2);

            const tituloBusqueda = `Dev ${dia}${mes}${anio}`;

            const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&type=video&maxResults=1&q=${encodeURIComponent(tituloBusqueda)}`;

            try {
                const response = await fetch(url);
                const data = await response.json();

                if (data.items.length > 0) {
                    const videoId = data.items[0].id.videoId;
                    document.getElementById("youtubeFrame").src =
                        `https://www.youtube.com/embed/${videoId}?rel=0`;
                } else {
                    console.log("No se encontró el video con ese nombre:", tituloBusqueda);
                }

            } catch (error) {
                console.error("Error al buscar el video:", error);
            }
        }

        cargarVideoPorFecha();

/******************SCRIPT PARA DESCARGAR AUDIOS********************************/
        document.getElementById('descargar-musica').addEventListener('click', async function(e) {
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

        document.getElementById('descargar-musica')
            .addEventListener('click', function () {
                // El atributo download ya hace todo
                console.log("Descargando música...");
            });

        document.getElementById('descargar-predica')
            .addEventListener('click', function () {
                console.log("Descargando prédica...");
            });

