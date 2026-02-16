document.addEventListener('DOMContentLoaded', function() {
    // -----------------------------------------------------------------------
    // CONFIGURACIÓN DE YOUVERSION
    // -----------------------------------------------------------------------
    // IMPORTANTE: Si usas GitHub Actions, asegúrate de que tu workflow reemplace
    // el texto 'TU_API_KEY_AQUI' con el valor de tu secreto.
    const YOUVERSION_API_KEY = '67zapbtZefeJeN9ugqkAjBYg5nHufxWBku9bsj18UKfnz0c9';

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

    // Mapeo de libros de español a códigos USFM para YouVersion API
    const bookMap = {
        "Génesis": "GEN", "Éxodo": "EXO", "Levítico": "LEV", "Números": "NUM", "Deuteronomio": "DEU",
        "Josué": "JOS", "Jueces": "JDG", "Rut": "RUT", "1 Samuel": "1SA", "2 Samuel": "2SA", "1 Reyes": "1KI",
        "2 Reyes": "2KI", "1 Crónicas": "1CH", "2 Crónicas": "2CH", "Esdras": "EZR", "Nehemías": "NEH",
        "Ester": "EST", "Job": "JOB", "Salmos": "PSA", "Proverbios": "PRO", "Eclesiastés": "ECC",
        "Cantares": "SNG", "Isaías": "ISA", "Jeremías": "JER", "Lamentaciones": "LAM",
        "Ezequiel": "EZK", "Daniel": "DAN", "Oseas": "HOS", "Joel": "JOE", "Amós": "AMO", "Abdías": "OBA",
        "Jonás": "JON", "Miqueas": "MIC", "Nahúm": "NAM", "Habacuc": "HAB", "Sofonías": "ZEP", "Hageo": "HAG",
        "Zacarías": "ZEC", "Malaquías": "MAL", "Mateo": "MAT", "Marcos": "MRK", "Lucas": "LUK", "Juan": "JHN",
        "Hechos": "ACT", "Romanos": "ROM", "1 Corintios": "1CO", "2 Corintios": "2CO", "Gálatas": "GAL",
        "Efesios": "EPH", "Filipenses": "PHP", "Colosenses": "COL", "1 Tesalonicenses": "1TH",
        "2 Tesalonicenses": "2TH", "1 Timoteo": "1TI", "2 Timoteo": "2TI", "Tito": "TIT",
        "Filemón": "PHM", "Hebreos": "HEB", "Santiago": "JAS", "1 Pedro": "1PE", "2 Pedro": "2PE",
        "1 Juan": "1JN", "2 Juan": "2JN", "3 Juan": "3JN", "Judas": "JUD", "Apocalipsis": "REV"
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

            // --- URL y Fetch para YouVersion API (RVR1960) ---
            const libroApi = bookMap[libro.trim()];
            if (libroApi) {
                console.log(`Consultando YouVersion API para: ${libroApi}`);
                
                // ID 149 = RVR1960
                // Formato de pasaje: GEN.1.1
                let passageId = `${libroApi}.${capitulo}.${versiculoInicio}`;
                if (versiculoFin) {
                    passageId += `-${versiculoFin}`;
                }
                
                let apiUrl = `https://api.youversion.com/v1/bibles/149/passages/${passageId}?version=rvr1960`;

                const fetchVerseText = async () => {
                    try {
                        const response = await fetch(apiUrl, {
                            method: 'GET',
                            headers: {
                                "X-YVP-App-Key": YOUVERSION_API_KEY,
                                "Accept": "application/json"
                            }
                        });

                        if (!response.ok) throw new Error(`API error: ${response.status}`);
                        const data = await response.json();
                        
                        if (data.content) {
                            // Limpiamos etiquetas HTML si las hay
                            let texto = data.content.replace(/<[^>]*>?/gm, ''); 
                            elementoTexto.textContent = texto.replace(/(\r\n|\n|\r)/gm, " ").trim();
                        } else {
                            throw new Error('Texto no encontrado en la respuesta');
                        }
                    } catch (error) {
                        console.error("Error con YouVersion API:", error);
                        elementoTexto.innerHTML = 'No se pudo cargar el texto.<br><span style="font-size:0.8em">Verifica tu API Key.</span>';
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