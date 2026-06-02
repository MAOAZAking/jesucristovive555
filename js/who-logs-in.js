// Lógica de Reconocimiento Facial
document.addEventListener('DOMContentLoaded', async () => {
    const video = document.getElementById('video-input');
    const mensaje = document.getElementById('mensaje-estado');
    let intentos = 0;
    const MAX_INTENTOS = 2;
    let usuarios = [];
    let usuarioDetectadoPendiente = null; // Para almacenar el usuario detectado por rostro

    // 0. Cargar Fondo Simulado y Gestionar Permisos
    cargarFondoSimulado();
    gestionarPermisosCamara();

    // 1. Carga Paralela (Modelos + Usuarios + Cámara) para máxima velocidad
    try {
        // No mostramos mensaje en el DOM oculto, usamos las alertas
        // Promesas de carga de recursos
        const pUsuarios = fetch('json/usuarios.json').then(res => res.json());
        
        const pModelos = Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri('modelos_rf'),
            faceapi.nets.faceLandmark68Net.loadFromUri('modelos_rf'),
            faceapi.nets.faceRecognitionNet.loadFromUri('modelos_rf')
        ]);

        // Promesa de cámara
        const pCamara = navigator.mediaDevices.getUserMedia({ video: {} })
            .then(stream => {
                video.srcObject = stream;
                return new Promise((resolve) => {
                    video.onloadedmetadata = () => {
                        video.play();
                        resolve();
                    };
                });
            });

        // Esperar a que TODO esté listo
        const [usuariosCargados] = await Promise.all([pUsuarios, pModelos, pCamara]);
        usuarios = usuariosCargados;

        // Iniciar detección inmediatamente
        iniciarDeteccion();

    } catch (error) {
        console.error(error);
        mensaje.innerText = "Por favor, recarga la página.";
    }

    function iniciarDeteccion() {
        mensaje.innerText = "Accediendo...";
        
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
            mensaje.innerText = "Configurando...";
            return;
        }

        const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);

        const interval = setInterval(async () => {
            if (intentos >= MAX_INTENTOS) {
                clearInterval(interval);
                mensaje.innerText = "Redirigiendo...";
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
                    
                    // LÓGICA DE SEGURIDAD ADICIONAL
                    // Si la redirección NO es crear-usuario.html, pedimos credenciales
                    if (usuarioEncontrado.urlderedireccion !== 'crear-usuario.html') {
                        mostrarFormularioLogin(usuarioEncontrado);
                    } else {
                        // Si es para crear/configurar usuario, permitimos el paso directo (o según lógica anterior)
                        completarLogin(usuarioEncontrado);
                    }
                } else {
                    intentos++;
                    mensaje.innerText = "Accediendo...";
                }
            }
        }, 2000); // Validar cada 2 segundos
    }

    // --- FUNCIONES PARA EL LOGIN SEGURO ---

    function mostrarFormularioLogin(usuario) {
        usuarioDetectadoPendiente = usuario;
        
        // Ocultar mensaje de estado de carga
        mensaje.style.display = 'none';
        
        // Mostrar formulario
        const formContainer = document.getElementById('formulario-login-facial');
        formContainer.style.display = 'block';
        
        // Enfocar el input de usuario
        document.getElementById('login-usuario').focus();
    }

    // Manejar el envío del formulario de login
    document.getElementById('form-login-seguro').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const inputUser = document.getElementById('login-usuario').value;
        const inputPass = document.getElementById('login-pass').value;

        if (!usuarioDetectadoPendiente) return;

        // 1. VALIDACIÓN DE IDENTIDAD (El usuario escrito DEBE ser el mismo del rostro)
        if (inputUser !== usuarioDetectadoPendiente.nombredeusuario) {
            alert("⛔ ACCESO DENEGADO: El usuario ingresado no coincide con el rostro detectado.");
            // "Sacar de una" - Regresar al historial o recargar
            window.history.back(); 
            return;
        }

        // 2. VALIDACIÓN DE CONTRASEÑA MEDIANTE EL SERVIDOR (API)
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: inputUser,
                    password: inputPass
                })
            });

            const result = await response.json();

            if (result.success) {
                // Si el servidor confirma que la clave es correcta (según el .env)
                document.getElementById('formulario-login-facial').style.display = 'none';
                completarLogin(usuarioDetectadoPendiente);
            } else {
                alert("❌ " + (result.message || "Contraseña incorrecta."));
            }
        } catch (error) {
            console.error("Error al conectar con el servidor de login:", error);
            alert("⚠️ Error de conexión con el servidor de validación.");
        }
    });
});

// --- FUNCIONES DE INTERFAZ Y PERMISOS ---

async function cargarFondoSimulado() {
    const contenedor = document.getElementById('fondo-simulado');
    let urlOrigen = 'index.html';

    // Intentar obtener la página anterior si es del mismo dominio
    if (document.referrer && document.referrer.includes(window.location.origin)) {
        urlOrigen = document.referrer;
    }

    try {
        const response = await fetch(urlOrigen);
        const textoHtml = await response.text();
        
        // Parsear solo el body para no duplicar head/scripts que puedan romper cosas
        const parser = new DOMParser();
        const doc = parser.parseFromString(textoHtml, 'text/html');
        
        // Limpiar scripts del contenido inyectado para evitar doble ejecución
        const scripts = doc.body.querySelectorAll('script');
        scripts.forEach(s => s.remove());

        // Inyectar contenido
        contenedor.innerHTML = doc.body.innerHTML;
        
    } catch (error) {
        console.error("Error cargando fondo simulado:", error);
        contenedor.innerHTML = "<h1 class='text-center mt-5'>Cargando...</h1>";
    }
}

async function gestionarPermisosCamara() {
    try {
        const permissionStatus = await navigator.permissions.query({ name: 'camera' });
        
        actualizarAlertasPermisos(permissionStatus.state);

        permissionStatus.onchange = () => {
            actualizarAlertasPermisos(permissionStatus.state);
        };
    } catch (error) {
        // Fallback para navegadores que no soportan query de cámara (ej. Firefox a veces)
        // Asumimos prompt y dejamos que getUserMedia maneje el error
        actualizarAlertasPermisos('prompt');
    }
}

function actualizarAlertasPermisos(estado) {
    const contenedorAlertas = document.getElementById('contenedor-alertas');
    
    // Limpiar alertas previas de permisos
    const alertaExistente = document.getElementById('alerta-permiso');
    if (alertaExistente) alertaExistente.remove();

    if (estado === 'denied') {
        const alerta = document.createElement('div');
        alerta.id = 'alerta-permiso';
        alerta.className = 'alerta-flotante alerta-error';
        alerta.innerHTML = `Por favor ve a los ajustes de tu navegador y concede el permiso de la cámara para poder continuar.<br><br>Porque la necesitarás para tomar la foto de tu contribución.`;
        // Insertar al principio (arriba)
        contenedorAlertas.prepend(alerta);
    } 
    else if (estado === 'prompt') {
        const alerta = document.createElement('div');
        alerta.id = 'alerta-permiso';
        alerta.className = 'alerta-flotante alerta-error'; // Usamos estilo error (rojo) para llamar atención
        alerta.style.borderColor = '#ffcc00'; // Borde amarillo para diferenciar
        alerta.innerHTML = `Por favor concede el permiso de la cámara para continuar.<br><br>Porque la necesitarás para tomar la foto de tu contribución.`;
        contenedorAlertas.prepend(alerta);
    }
    else if (estado === 'granted') {
        mostrarAlertaCarga();
    }
}

function mostrarAlertaCarga() {
    // Verificar si ya existe para no duplicar
    if (document.getElementById('alerta-carga')) return;

    const contenedorAlertas = document.getElementById('contenedor-alertas');
    const alerta = document.createElement('div');
    alerta.id = 'alerta-carga';
    alerta.className = 'alerta-flotante alerta-carga';
    alerta.innerHTML = `Se está cargando la página, por favor espera que en un momento serás redirigido...`;
    
    // Añadir al contenedor (si hay alerta de error, esta quedará abajo por el prepend del error)
    contenedorAlertas.appendChild(alerta);

    // Aplicar la "tela negra" al fondo
    document.getElementById('fondo-simulado').classList.add('fondo-con-overlay');

    // Desaparecer a los 10 segundos
    setTimeout(() => {
        if (alerta) alerta.remove();
        // Quitar la "tela negra"
        document.getElementById('fondo-simulado').classList.remove('fondo-con-overlay');
    }, 10000);
}

function completarLogin(usuario) {
    mostrarAlertaExito(usuario);
    sessionStorage.setItem('usuario_actual', JSON.stringify(usuario));
}

function mostrarAlertaExito(usuario) {
    // Ocultar alertas flotantes anteriores
    const contenedorAlertas = document.getElementById('contenedor-alertas');
    if(contenedorAlertas) contenedorAlertas.style.display = 'none';
    
    // Formatear nombre de página (quitar .html y guiones)
    let paginaDestino = usuario.urlderedireccion || 'index.html';
    let nombrePagina = paginaDestino.replace('.html', '').replace(/-/g, ' ');
    
    // Crear alerta full screen
    const alerta = document.createElement('div');
    alerta.id = 'alerta-exito-fullscreen';
    alerta.innerHTML = `
        <h1>¡Bienvenido ${usuario.nombrecompleto || usuario.nombredeusuario}!</h1>
        <p>Ya te estamos redirigiendo ☺️ a la página de ${nombrePagina}</p>
    `;
    
    document.body.appendChild(alerta);
    
    setTimeout(() => {
        window.location.href = paginaDestino;
    }, 3000);
}