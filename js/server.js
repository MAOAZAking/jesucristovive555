const express = require('express');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const multer = require('multer');
const { Octokit } = require('@octokit/rest');
// Cargar variables de entorno desde el archivo .env
dotenv.config();

const app = express();

// 0. GENERAR DATOS FACIALES (Ejecutar el script de generación antes de iniciar)
// Esto asegura que el archivo js/datos_faciales.js exista en Render
// require('./generar_datos.js'); // Comentado para no ejecutarlo en cada inicio

// Middleware para entender JSON (Importante)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CONFIGURACIÓN PARA SERVIR ARCHIVOS ESTÁTICOS (HTML, CSS, JS)
// Esto permite que al entrar a la web se vean tus páginas
app.use(express.static(path.join(__dirname, '../'), {
    extensions: ['html'], // Permite que /himnario cargue /himnario.html automáticamente
    index: 'who-logs-in.html' // Página por defecto (o index.html si no hay login)
}));

// Configure multer to store files in memory
const upload = multer({ storage: multer.memoryStorage() });

// 2. Endpoint para Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Buscamos la contraseña dinámicamente según el nombre de usuario (Pattern de Render)
  const contrasenaGuardada = process.env[`CONTRASENA_${username}`];
  
  // Opcional: Puedes definir NOMBRE_usuario y ROLES_usuario en tu .env también
  const nombreCompleto = process.env[`NOMBRE_${username}`] || username;
  const rolesUsuario = process.env[`ROLES_${username}`] ? process.env[`ROLES_${username}`].split(',') : ["admin"];

  // Validar si el usuario existe (la variable está definida) y la contraseña coincide
  if (contrasenaGuardada && contrasenaGuardada === password) {
      console.log(`Acceso concedido para: ${username}`);
      return res.json({ success: true, nombre: nombreCompleto, rol: rolesUsuario });
  }

    // Login fallido
    res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
});

// Endpoint for uploading presentations
app.post('/api/upload-presentations', upload.array('presentations'), async (req, res) => {
    const githubPat = process.env.GITHUB_TOKEN;
    const repoOwner = process.env.GITHUB_OWNER;
    const repoName = process.env.GITHUB_REPO;
    const branch = 'main'; // Assuming 'main' branch

    // Basic authentication check (you might want a more robust one)
    // For example, check if a user session exists or a token is valid
    // if (!req.session.user) {
    //     return res.status(401).json({ message: "No autorizado. Por favor, inicia sesión." });
    // }

    if (!githubPat || !repoOwner || !repoName) {
        console.error("GitHub credentials missing in environment variables.");
        return res.status(500).json({ message: "Error de configuración del servidor (credenciales de GitHub)." });
    }

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No se han subido archivos." });
    }

    // Normalizar 'types' a un array (si es un solo archivo, llega como string)
    let types = req.body.types;
    if (types && !Array.isArray(types)) {
        types = [types];
    }

    if (!types || types.length !== req.files.length) {
        return res.status(400).json({ message: "El número de tipos de presentación no coincide con el número de archivos." });
    }

    const octokit = new Octokit({ auth: githubPat });
    const uploadResults = [];

    for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const fileType = types[i].toLowerCase(); // 'alabanza' or 'adoracion'
        const filename = file.originalname;

        // Validate file type (optional, but good practice)
        const allowedExtensions = ['.pptx', '.ppt', '.odp', '.key', '.pdf'];
        const fileExtension = path.extname(filename).toLowerCase();
        if (!allowedExtensions.includes(fileExtension)) {
            uploadResults.push({ filename, status: 'failed', message: `Extensión de archivo no permitida: ${fileExtension}` });
            continue;
        }

        // Construct the path in the GitHub repository
        const githubPath = `multimedia/presentaciones-power-point/letra-canciones-para-proyectar/${fileType}/${filename}`;
        const content = file.buffer.toString('base64'); // Base64 encode the file content

        try {
            // Check if the file already exists to get its SHA (for updates)
            let sha = null;
            try {
                const { data: existingFile } = await octokit.rest.repos.getContents({                    owner: repoOwner,
                    owner: repoOwner,
                    repo: repoName,
                    path: githubPath,
                    branch: branch,
                });
                sha = existingFile.sha;
            } catch (error) {
                if (error.status !== 404) { // 404 means file doesn't exist, which is fine for creation
                    throw error;
                }
            }

            await octokit.repos.createOrUpdateFileContents({
                owner: repoOwner,
                repo: repoName,
                path: githubPath,
                message: `feat: Subir presentación ${filename} (${fileType})`,
                content: content,
                branch: branch,
                sha: sha // Include SHA if updating an existing file
            });
            uploadResults.push({ filename, status: 'success', message: 'Subido correctamente' });
        } catch (error) {
            console.error(`Error uploading ${filename} to GitHub:`, error);
            uploadResults.push({ filename, status: 'failed', message: `Error al subir a GitHub: ${error.message}` });
        }
    }

    const successfulUploads = uploadResults.filter(r => r.status === 'success').length;
    const failedUploads = uploadResults.filter(r => r.status === 'failed').length;

    if (successfulUploads > 0 && failedUploads === 0) {
        res.status(200).json({ message: `Se subieron ${successfulUploads} presentaciones correctamente.`, results: uploadResults });
    } else if (successfulUploads > 0 && failedUploads > 0) {
        res.status(207).json({ message: `Subida parcial: ${successfulUploads} éxito, ${failedUploads} error.`, results: uploadResults });
    } else {
        const detail = uploadResults.length > 0 ? uploadResults[0].message : "Error desconocido";
        res.status(500).json({ message: `Error: ${detail}`, results: uploadResults });
    }
});

// Ruta principal: Redirigir a who-logs-in.html si entran a la raíz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../who-logs-in.html'));
});

// ... resto de tu configuración del servidor ...
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
