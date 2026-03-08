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
app.use(express.static(path.join(__dirname, '../')));

// 2. Endpoint para Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Usar variables de entorno para las credenciales
  const usuarios = [
    {
      "nombredeusuario": process.env.USER1_USERNAME,
      "contrasena": process.env.USER1_PASSWORD,
      "nombrecompleto": "Usuario 1",
      "roles": ["admin"]
    }
  ];

        // Buscar usuario (mapeando 'username' del login a 'nombredeusuario' del json)
        const user = usuarios.find(u => u.nombredeusuario === username);

        // Validar contraseña (usando 'contrasena' sin ñ como ajustaste)
        if (user && user.contrasena === password) {
            return res.json({ success: true, nombre: user.nombrecompleto, rol: user.roles });
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
