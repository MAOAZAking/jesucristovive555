const express = require('express');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

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
    index: 'who-logs-in.html' // Página por defecto
}));

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

// Ruta principal: Redirigir a who-logs-in.html si entran a la raíz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../who-logs-in.html'));
});

// ... resto de tu configuración del servidor ...
app.listen(3000, () => console.log('Servidor corriendo en puerto 3000'));
