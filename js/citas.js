document.addEventListener('DOMContentLoaded', function() {
    // Lista de 31 citas bíblicas para cada día del mes
    const citas = [
        "Éxodo 28:36-38",
        "Efesios 4:22-24",
        "Efesios 5:3-7",
        "Efesios 5:25-27",
        "1 Corintios 3:16-17",
        "2 Corintios 6:14-18",
        "2 Corintios 7:1",
        "1 Pedro 1:13-16",
        "1 Pedro 1:17-21",
        "1 Pedro 1:22-25",
        "1 Pedro 2:9-10",
        "Levítico 19:1-2",
        "Levítico 20:26",
        "Hebreos 12:9-11",
        "Hebreos 12:12-15",
        "Isaías 35:8",
        "Lucas 1:74-75",
        "Juan 17:15-20",
        "1 Juan 3:2-3",
        "Génesis 17:1-2",
        "Romanos 6:19-23",
        "Romanos 12:1-2",
        "2 Timoteo 1:6-9",
        "1 Tesalonicenses 3:12-13",
        "1 Tesalonicenses 4:3-7",
        "Salmos 119:9-11",
        "Salmos 139:1-6",
        "Salmos 139:23-24"
    ];

    // Mapeo de libros de español a INGLÉS para bible-api.com (la API pública más estable)
    const bookMap = {
        "Génesis": "Genesis", "Éxodo": "Exodus", "Levítico": "Leviticus", "Números": "Numbers", "Deuteronomio": "Deuteronomy",
        "Josué": "Joshua", "Jueces": "Judges", "Rut": "Ruth", "1 Samuel": "1 Samuel", "2 Samuel": "2 Samuel", "1 Reyes": "1 Kings",
        "2 Reyes": "2 Kings", "1 Crónicas": "1 Chronicles", "2 Crónicas": "2 Chronicles", "Esdras": "Ezra", "Nehemías": "Nehemiah",
        "Ester": "Esther", "Job": "Job", "Salmos": "Psalms", "Proverbios": "Proverbs", "Eclesiastés": "Ecclesiastes",
        "Cantares": "Song of Solomon", "Isaías": "Isaiah", "Jeremías": "Jeremiah", "Lamentaciones": "Lamentations",
        "Ezequiel": "Ezekiel", "Daniel": "Daniel", "Oseas": "Hosea", "Joel": "Joel", "Amós": "Amos", "Abdías": "Obadiah",
        "Jonás": "Jonah", "Miqueas": "Micah", "Nahúm": "Nahum", "Habacuc": "Habakkuk", "Sofonías": "Zephaniah", "Hageo": "Haggai",
        "Zacarías": "Zechariah", "Malaquías": "Malachi", "Mateo": "Matthew", "Marcos": "Mark", "Lucas": "Luke", "Juan": "John",
        "Hechos": "Acts", "Romanos": "Romans", "1 Corintios": "1 Corinthians", "2 Corintios": "2 Corinthians", "Gálatas": "Galatians",
        "Efesios": "Ephesians", "Filipenses": "Philippians", "Colosenses": "Colossians", "1 Tesalonicenses": "1 Thessalonians",
        "2 Tesalonicenses": "2 Thessalonians", "1 Timoteo": "1 Timothy", "2 Timoteo": "2 Timothy", "Tito": "Titus",
        "Filemón": "Philemon", "Hebreos": "Hebrews", "Santiago": "James", "1 Pedro": "1 Peter", "2 Pedro": "2 Peter",
        "1 Juan": "1 John", "2 Juan": "2 John", "3 Juan": "3 John", "Judas": "Jude", "Apocalipsis": "Revelation"
    };

    // Obtener el día actual del mes (1-31)
    const fecha = new Date();
    const dia = fecha.getDate();
    
    // Calcular el índice (restamos 1 porque los arrays empiezan en 0)
    // Usamos el operador % por si cambiamos la cantidad de citas en el futuro, no se rompa
    const indice = (dia - 1) % citas.length;
    const citaDelDia = citas[indice];

    // Elementos del DOM a actualizar
    const elementoTitulo = document.getElementById('titulo-cita');
    const elementoTexto = document.getElementById('texto-cita');
    const elementoLink = document.getElementById('link-cita');

    if (elementoTitulo && elementoTexto && elementoLink) {
        // 1. Rellenar el h5 con la escritura del día
        elementoTitulo.textContent = citaDelDia;

        // 2. Lógica para construir los links y hacer la consulta a la API
        const regex = /^(.*)\s+(\d+):(\d+)(?:-(\d+))?$/;
        const match = citaDelDia.match(regex);

        if (match) {
            const libro = match[1];
            const capitulo = match[2];
            const versiculoInicio = match[3];
            const versiculoFin = match[4];

            // --- URL para Bible Gateway (botón de contexto) ---
            const libroEncoded = encodeURIComponent(libro);
            let gatewayUrl = `https://www.biblegateway.com/passage/?search=${libroEncoded}%20${capitulo}%3A${versiculoInicio}`;
            if (versiculoFin) {
                gatewayUrl += `-${versiculoFin}`;
            }
            gatewayUrl += "&version=RVR1960";
            elementoLink.href = gatewayUrl;

            // --- SOLUCIÓN ESTABLE: bible-api.com (RVR 1909) vía Proxy ---
            const libroApi = bookMap[libro.trim()];
            if (libroApi) {
                console.log(`Consultando bible-api.com para: ${libroApi}`);
                
                // Usamos + en lugar de %20 para evitar problemas con algunos proxies
                let apiUrl = `https://bible-api.com/${encodeURIComponent(libroApi)}+${capitulo}:${versiculoInicio}`;
                if (versiculoFin) {
                    apiUrl += `-${versiculoFin}`;
                }
                apiUrl += "?translation=rvr";
                
                const fetchVerseText = async () => {
                    try {
                        // INTENTO 1: AllOrigins (JSON Wrapper)
                        // Usamos /get para obtener un JSON que contiene el texto en .contents
                        // Esto suele ser lo más robusto contra CORS y tipos MIME
                        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`;
                        
                        const response = await fetch(proxyUrl);
                        if (!response.ok) throw new Error(`AllOrigins status: ${response.status}`);
                        
                        const dataWrapper = await response.json();
                        // allorigins devuelve el contenido como string en 'contents'
                        if (dataWrapper.contents) {
                            const data = JSON.parse(dataWrapper.contents);
                            if (data.text) {
                                elementoTexto.textContent = data.text.replace(/(\r\n|\n|\r)/gm, " ").trim();
                                return; 
                            }
                        }
                    } catch (error) {
                        console.warn("AllOrigins falló, intentando CorsProxy...", error);
                        
                        try {
                            // INTENTO 2: CorsProxy.io
                            const proxyUrl2 = `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`;
                            const response2 = await fetch(proxyUrl2);
                            if (!response2.ok) throw new Error(`CorsProxy status: ${response2.status}`);
                            
                            const data2 = await response2.json();
                            if (data2.text) {
                                elementoTexto.textContent = data2.text.replace(/(\r\n|\n|\r)/gm, " ").trim();
                                return; // Éxito
                            }
                        } catch (error2) {
                            console.warn("CorsProxy falló, intentando conexión directa...", error2);
                        }
                    }

                    // INTENTO 3: Conexión Directa (Fallback final)
                    try {
                        const responseDirect = await fetch(apiUrl);
                        if (!responseDirect.ok) throw new Error(`Direct error: ${responseDirect.status}`);
                        const dataDirect = await responseDirect.json();
                        
                        if (dataDirect.text) {
                            elementoTexto.textContent = dataDirect.text.replace(/(\r\n|\n|\r)/gm, " ").trim();
                        } else {
                            throw new Error('Texto no encontrado en la respuesta');
                        }
                    } catch (errorDirect) {
                        console.error("Error definitivo al extraer la cita:", errorDirect);
                        elementoTexto.textContent = 'No se pudo cargar el texto. Por favor, haz clic en el enlace de abajo para leer el pasaje.';
                    }
                };

                fetchVerseText();

            } else {
                console.error(`El libro "${libro}" no se encontró en el mapa de traducción.`);
                elementoTexto.textContent = 'Error de configuración: libro no encontrado.';
            }

        } else {
            console.error("El formato de la cita no es válido:", citaDelDia);
            elementoTitulo.textContent = "Error en cita";
            elementoTexto.textContent = "El formato de la cita de hoy no es correcto.";
        }
    }
});