// Lógica de Reconocimiento Facial
document.addEventListener('DOMContentLoaded', async () => {
    const video = document.getElementById('video-input');
    const mensaje = document.getElementById('mensaje-estado');
    let intentos = 0;
    const MAX_INTENTOS = 2;
    let usuarios = [];

    // 1. Cargar Modelos y Usuarios
    try {
        mensaje.innerText = "Cargando modelos y usuarios...";
        
        // Cargar JSON de usuarios
        const response = await fetch('json/usuarios.json');
        usuarios = await response.json();

        // Cargar modelos de face-api (Asumiendo que la carpeta está en la raíz)
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/modelos_rf');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/modelos_rf');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/modelos_rf');

        mensaje.innerText = "Solicitando acceso a la cámara...";
        startVideo();
    } catch (error) {
        console.error(error);
        mensaje.innerText = "Error cargando recursos. Verifica la consola.";
    }

    function startVideo() {
        navigator.mediaDevices.getUserMedia({ video: {} })
            .then(stream => {
                video.srcObject = stream;
            })
            .catch(err => {
                console.error(err);
                mensaje.innerText = "Por favor, permite el acceso a la cámara.";
            });
    }

    video.addEventListener('play', () => {
        mensaje.innerText = "Validando identidad...";
        
        // Crear LabeledFaceDescriptors para el matcher
        const labeledDescriptors = usuarios.map(usuario => {
            const key = usuario.datosfaciales;
            // Buscar en el archivo js/datos_faciales.js
            const descriptorArray = BASE_DATOS_ROSTROS[key];
            
            if (descriptorArray) {
                return new faceapi.LabeledFaceDescriptors(
                    usuario.nombredeusuario,
                    [new Float32Array(descriptorArray)]
                );
            }
        }).filter(d => d !== undefined);

        if (labeledDescriptors.length === 0) {
            mensaje.innerText = "No hay datos faciales configurados.";
            return;
        }

        const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);

        const interval = setInterval(async () => {
            if (intentos >= MAX_INTENTOS) {
                clearInterval(interval);
                mensaje.innerText = "Rostro no reconocido. Volviendo...";
                setTimeout(() => {
                    window.history.back(); // Volver a la página anterior
                }, 2000);
                return;
            }

            const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors();
            
            if (detections.length > 0) {
                // Tomamos el primer rostro detectado
                const bestMatch = faceMatcher.findBestMatch(detections[0].descriptor);
                
                if (bestMatch.label !== 'unknown') {
                    clearInterval(interval);
                    const usuarioEncontrado = usuarios.find(u => u.nombredeusuario === bestMatch.label);
                    
                    mensaje.innerText = `¡Bienvenido ${usuarioEncontrado.nombrecompleto || usuarioEncontrado.nombredeusuario}!`;
                    mensaje.style.color = "#00ff00";

                    // Guardar sesión temporalmente
                    sessionStorage.setItem('usuario_actual', JSON.stringify(usuarioEncontrado));

                    setTimeout(() => {
                        window.location.href = usuarioEncontrado.urlderedireccion;
                    }, 1500);
                } else {
                    intentos++;
                    mensaje.innerText = `Verificando... Intento ${intentos}/${MAX_INTENTOS}`;
                }
            }
        }, 2000); // Validar cada 2 segundos
    });
});