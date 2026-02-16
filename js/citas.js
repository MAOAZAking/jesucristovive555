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

    // Mapeo de libros de español a inglés para la API bible-api.com
    const bookMap = {
        "Génesis": "genesis", "Éxodo": "exodus", "Levítico": "leviticus", "Números": "numbers", "Deuteronomio": "deuteronomy",
        "Josué": "joshua", "Jueces": "judges", "Rut": "ruth", "1 Samuel": "1 samuel", "2 Samuel": "2 samuel", "1 Reyes": "1 kings",
        "2 Reyes": "2 kings", "1 Crónicas": "1 chronicles", "2 Crónicas": "2 chronicles", "Esdras": "ezra", "Nehemías": "nehemiah",
        "Ester": "esther", "Job": "job", "Salmos": "psalms", "Proverbios": "proverbs", "Eclesiastés": "ecclesiastes",
        "Cantares": "song of solomon", "Isaías": "isaiah", "Jeremías": "jeremiah", "Lamentaciones": "lamentations",
        "Ezequiel": "ezekiel", "Daniel": "daniel", "Oseas": "hosea", "Joel": "joel", "Amós": "amos", "Abdías": "obadiah",
        "Jonás": "jonah", "Miqueas": "micah", "Nahúm": "nahum", "Habacuc": "habakkuk", "Sofonías": "zephaniah", "Hageo": "haggai",
        "Zacarías": "zechariah", "Malaquías": "malachi", "Mateo": "matthew", "Marcos": "mark", "Lucas": "luke", "Juan": "john",
        "Hechos": "acts", "Romanos": "romans", "1 Corintios": "1 corinthians", "2 Corintios": "2 corinthians", "Gálatas": "galatians",
        "Efesios": "ephesians", "Filipenses": "philippians", "Colosenses": "colossians", "1 Tesalonicenses": "1 thessalonians",
        "2 Tesalonicenses": "2 thessalonians", "1 Timoteo": "1 timothy", "2 Timoteo": "2 timothy", "Tito": "titus",
        "Filemón": "philemon", "Hebreos": "hebrews", "Santiago": "james", "1 Pedro": "1 peter", "2 Pedro": "2 peter",
        "1 Juan": "1 john", "2 Juan": "2 john", "3 Juan": "3 john", "Judas": "jude", "Apocalipsis": "revelation"
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

            // --- URL y Fetch para bible-api.com (texto del pasaje) ---
            const libroApi = bookMap[libro.trim()];
            if (libroApi) {
                let apiUrl = `https://bible-api.com/${encodeURIComponent(libroApi)}+${capitulo}:${versiculoInicio}`;
                if (versiculoFin) {
                    apiUrl += `-${versiculoFin}`;
                }
                apiUrl += "?translation=rvr";

                // Función asíncrona para obtener y mostrar el texto
                const fetchVerseText = async () => {
                    try {
                        const response = await fetch(apiUrl);
                        if (!response.ok) {
                            // Si la respuesta no es OK (ej. 404, 500), lanza un error con el status
                            throw new Error(`Error de red o del servidor: ${response.status}`);
                        }
                        const data = await response.json();

                        // La API puede devolver un JSON con un mensaje de error, hay que verificarlo
                        if (data.error) {
                            throw new Error(`Error de la API: ${data.error}`);
                        }

                        // También verificamos que la propiedad 'text' exista antes de usarla
                        if (!data.text) {
                            throw new Error('La respuesta de la API no contenía el texto del versículo.');
                        }

                        // Limpiamos saltos de línea y espacios extra del texto recibido
                        const textoLimpio = data.text.replace(/(\r\n|\n|\r)/gm, " ").trim();
                        elementoTexto.textContent = textoLimpio;
                    } catch (error) {
                        console.error("Error al extraer la cita desde bible-api.com:", error);
                        elementoTexto.innerHTML = 'No se pudo cargar el texto. Por favor, haz clic en el enlace de abajo para leer el pasaje.';
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