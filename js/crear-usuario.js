document.addEventListener('DOMContentLoaded', async () => {
    const usuarioSesion = JSON.parse(sessionStorage.getItem('usuario_actual'));
    
    if (!usuarioSesion) {
        alert("No hay sesión activa. Redirigiendo...");
        window.location.href = 'who-logs-in.html';
        return;
    }

    // Cargar datos en el formulario
    document.getElementById('saludo-usuario').innerText = usuarioSesion.nombrecompleto || usuarioSesion.nombredeusuario;
    document.getElementById('usuario-actual-display').innerText = usuarioSesion.nombredeusuario;
    document.getElementById('nuevo-usuario').value = usuarioSesion.nombredeusuario;

    const inputUsuario = document.getElementById('nuevo-usuario');
    const inputPass = document.getElementById('nueva-password');
    const btnValidar = document.getElementById('btn-validar');
    const video = document.getElementById('video-validacion');
    const estadoCamara = document.getElementById('estado-camara');

    // Habilitar botón solo si hay datos
    function verificarCampos() {
        if (inputUsuario.value.trim() !== '' && inputPass.value.trim() !== '') {
            btnValidar.disabled = false;
            btnValidar.classList.remove('btn-secondary');
            btnValidar.classList.add('btn-primary');
        } else {
            btnValidar.disabled = true;
            btnValidar.classList.add('btn-secondary');
            btnValidar.classList.remove('btn-primary');
        }
    }

    inputUsuario.addEventListener('input', verificarCampos);
    inputPass.addEventListener('input', verificarCampos);

    // Cargar modelos FaceAPI
    await faceapi.nets.ssdMobilenetv1.loadFromUri('/modelos_rf');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/modelos_rf');
    await faceapi.nets.faceRecognitionNet.loadFromUri('/modelos_rf');

    btnValidar.addEventListener('click', async () => {
        // 1. Pedir Permiso de Cámara
        video.style.display = 'block';
        estadoCamara.innerText = `Por favor ${inputUsuario.value}, mira a la cámara y no te muevas mientras validamos tu identidad.`;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
            video.srcObject = stream;
        } catch (err) {
            estadoCamara.innerText = "Permiso denegado. Por favor da permiso a la cámara para validar que seas tú.";
            return;
        }

        // 2. Validar Rostro (Max 2 intentos)
        let intentos = 0;
        const MAX_INTENTOS = 2;
        
        // Preparar matcher solo para este usuario
        const descriptorArray = BASE_DATOS_ROSTROS[usuarioSesion.datosfaciales];
        if (!descriptorArray) {
            alert("Error: No se encontraron datos faciales base para comparar.");
            return;
        }
        const labeledDescriptor = new faceapi.LabeledFaceDescriptors(usuarioSesion.nombredeusuario, [new Float32Array(descriptorArray)]);
        const faceMatcher = new faceapi.FaceMatcher([labeledDescriptor], 0.6);

        const interval = setInterval(async () => {
            if (intentos >= MAX_INTENTOS) {
                clearInterval(interval);
                alert("Validación fallida. Redirigiendo atrás...");
                window.history.go(-2); // Volver 2 páginas atrás
                return;
            }

            const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors();
            
            if (detections.length > 0) {
                const bestMatch = faceMatcher.findBestMatch(detections[0].descriptor);
                
                if (bestMatch.label !== 'unknown') {
                    // ¡ÉXITO!
                    clearInterval(interval);
                    streamCamara = video.srcObject;
                    streamCamara.getTracks().forEach(track => track.stop()); // Detener cámara
                    video.style.display = 'none';
                    
                    // Actualizar UI
                    btnValidar.innerHTML = 'Validación Exitosa <i class="bi bi-check-circle-fill"></i>';
                    btnValidar.classList.remove('btn-primary');
                    btnValidar.classList.add('btn-success');
                    btnValidar.disabled = true;
                    
                    document.getElementById('mensaje-exito').style.display = 'block';

                    // 3. Actualizar GitHub
                    await actualizarGitHub(inputUsuario.value, inputPass.value);

                } else {
                    intentos++;
                }
            }
        }, 2000);
    });
});

async function actualizarGitHub(nuevoUsuario, nuevaPass) {
    const url = `https://api.github.com/repos/${CONFIG_GITHUB.OWNER}/${CONFIG_GITHUB.REPO}/contents/${CONFIG_GITHUB.PATH_USUARIOS}`;
    
    try {
        // A. Obtener el archivo actual (necesitamos el SHA)
        const getResponse = await fetch(url, {
            headers: { 'Authorization': `Bearer ${CONFIG_GITHUB.TOKEN}` }
        });
        const getData = await getResponse.json();
        const sha = getData.sha;
        
        // Decodificar contenido actual (Base64 -> String -> JSON)
        // Nota: atob falla con caracteres especiales, usamos un fix UTF8
        const contenidoActualStr = decodeURIComponent(escape(window.atob(getData.content)));
        let usuariosJson = JSON.parse(contenidoActualStr);

        // B. Modificar el usuario
        const usuarioSesion = JSON.parse(sessionStorage.getItem('usuario_actual'));
        const index = usuariosJson.findIndex(u => u.nombredeusuario === usuarioSesion.nombredeusuario);

        if (index !== -1) {
            usuariosJson[index].nombredeusuario = nuevoUsuario;
            usuariosJson[index].contrasena = nuevaPass; // Guardar contrasena (idealmente debería ser hash)
            usuariosJson[index].urlderedireccion = "contribucion-ministerio-alabanza.html";
        }

        // C. Codificar nuevo contenido (JSON -> String -> Base64)
        const nuevoContenidoStr = JSON.stringify(usuariosJson, null, 4);
        const nuevoContenidoB64 = window.btoa(unescape(encodeURIComponent(nuevoContenidoStr)));

        // D. Subir cambios (PUT)
        const putResponse = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${CONFIG_GITHUB.TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Actualización de usuario: ${nuevoUsuario}`,
                content: nuevoContenidoB64,
                sha: sha
            })
        });

        if (putResponse.ok) {
            console.log("GitHub actualizado correctamente.");
            // Esperar los 10 segundos solicitados antes de redirigir
            setTimeout(() => {
                window.location.href = 'contribucion-ministerio-alabanza.html';
            }, 10000);
        } else {
            throw new Error("Error al subir a GitHub");
        }
    } catch (error) {
        console.error(error);
        alert("Hubo un error guardando los datos. Verifica la consola o tu conexión.");
    }
}