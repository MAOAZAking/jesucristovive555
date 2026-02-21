const fs = require('fs');
const path = require('path');

// Ruta donde se guardará el archivo js/datos_faciales.js
const rutaArchivo = path.join(__dirname, 'datos_faciales.js');

// Mapeo: Nombre de Variable en Render -> Clave en el Código
const mapaVariables = {
    "DATOS_FACIALES_MAOAZAKING": "MAOAZAKING_DATOS_FACIALES_JSON",
    "DATOS_FACIALES_SEBITAS":    "SEBITAS_DATOS_FACIALES_JSON",
    "DATOS_FACIALES_SANTY":      "SANTY_DATOS_FACIALES_JSON",
    "DATOS_FACIALES_DATOS_FACIALES_EQUIPO_DE_ALABANZA":    "EQUIPO_DE_ALABANZA_DATOS_FACIALES_JSON"
};

let datosParaGuardar = {};
let seEncontraronDatos = false;

console.log("🔍 Verificando variables de entorno para datos faciales...");

for (const [variableEnv, claveJson] of Object.entries(mapaVariables)) {
    const valorEnv = process.env[variableEnv];
    if (valorEnv) {
        try {
            datosParaGuardar[claveJson] = JSON.parse(valorEnv);
            seEncontraronDatos = true;
            console.log(`✅ Datos encontrados para: ${variableEnv}`);
        } catch (error) {
            console.error(`❌ Error al procesar JSON de ${variableEnv}`);
        }
    }
}

if (seEncontraronDatos) {
    const contenidoArchivo = `const BASE_DATOS_ROSTROS = ${JSON.stringify(datosParaGuardar, null, 4)};`;
    try {
        fs.writeFileSync(rutaArchivo, contenidoArchivo, 'utf8');
        console.log("💾 Archivo 'js/datos_faciales.js' generado exitosamente.");
    } catch (err) {
        console.error("❌ Error escribiendo el archivo:", err);
    }
} else {
    console.log("⚠️ No se detectaron variables. Se usará el archivo local si existe.");
}

// ==========================================
// PARTE 2: INYECCIÓN DE CREDENCIALES (USUARIOS)
// ==========================================
const rutaUsuariosJson = path.join(__dirname, '../json/usuarios.json');

if (fs.existsSync(rutaUsuariosJson)) {
    console.log("🔍 Verificando variables de entorno para usuarios...");
    try {
        // Leemos el archivo usuarios.json original
        let usuarios = JSON.parse(fs.readFileSync(rutaUsuariosJson, 'utf8'));
        let huboCambiosUsuarios = false;

        usuarios.forEach(usuario => {
            // Convertimos "MAOAZAking" -> "MAOAZAKING" y "equipo-alabanza" -> "EQUIPO_ALABANZA"
            const nombreKey = usuario.nombredeusuario.toUpperCase().replace(/-/g, '_');

            // Mapa de campos a buscar en las variables de entorno
            const camposSeguros = {
                'contrasena': `CONTRASENA_${nombreKey}`,
                'roles': `ROLES_${nombreKey}`,
                'credenciales': `CREDENCIALES_${nombreKey}`
            };

            for (const [campoJson, variableEnv] of Object.entries(camposSeguros)) {
                if (process.env[variableEnv]) {
                    usuario[campoJson] = process.env[variableEnv];
                    huboCambiosUsuarios = true;
                }
            }
        });

        if (huboCambiosUsuarios) {
            fs.writeFileSync(rutaUsuariosJson, JSON.stringify(usuarios, null, 4), 'utf8');
            console.log("✅ Archivo 'json/usuarios.json' actualizado con credenciales seguras de Render.");
        }
    } catch (error) {
        console.error("❌ Error procesando usuarios.json:", error);
    }
}

// ==========================================
// PARTE 3: CONFIGURACIÓN GITHUB CENTRALIZADA
// ==========================================
const rutaConfigGithub = path.join(__dirname, 'config_github.js');
const githubToken = process.env.GITHUB_TOKEN;

if (githubToken) {
    const configContent = `const CONFIG_GITHUB = {
    OWNER: '${process.env.GITHUB_OWNER}',
    REPO: '${process.env.GITHUB_REPO}',
    PATH_CANCIONES: 'json/canciones.json',
    PATH_USUARIOS: 'json/usuarios.json',
    TOKEN: '${githubToken}'
};`;
    try {
        fs.writeFileSync(rutaConfigGithub, configContent, 'utf8');
        console.log("✅ Archivo 'js/config_github.js' generado con token seguro.");
    } catch (err) {
        console.error("❌ Error generando config_github.js:", err);
    }
} else {
    console.log("⚠️ No se detectó GITHUB_TOKEN. Se usará js/config_github.js local.");
}
