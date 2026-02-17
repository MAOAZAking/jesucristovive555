document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const elementoTexto = document.getElementById('texto-cita');
    const elementoTitulo = document.getElementById('titulo-cita');
    const elementoLink = document.getElementById('link-cita');
    
    // Verificación de la galería para depuración
    const galeria = document.querySelector('.galeria-imagenes');
    if (galeria && galeria.children.length === 0) {
        console.warn("⚠️ AVISO: El contenedor de la galería (.galeria-imagenes) está vacío. El script de actualización (node) no ha inyectado las imágenes todavía.");
    }

    // 1. VERIFICACIÓN DE CARGA ESTÁTICA
    // Si el servidor (GitHub Actions) ya actualizó el HTML, el texto no dirá "Cargando...".
    // En ese caso, no hacemos nada para ahorrar recursos y evitar parpadeos.
    if (elementoTexto && !elementoTexto.textContent.includes("Cargando")) {
        console.log("Devocional cargado estáticamente.");
        return;
    }

    console.log("Cargando devocional dinámicamente (Modo Cliente)...");

    // --- BASE DE DATOS LOCAL DE CITAS (Sin API) ---
    const citasBiblicas = [
        { ref: "Éxodo 28:36-38", texto: "36 Harás además una lámina de oro fino, y grabarás en ella como grabadura de sello, SANTIDAD A JEHOVÁ. 37 Y la pondrás con un cordón de azul, y estará sobre la mitra; por la parte delantera de la mitra estará. 38 Y estará sobre la frente de Aarón, y llevará Aarón las faltas cometidas en todas las cosas santas, que los hijos de Israel hubieren consagrado en todas sus santas ofrendas; y sobre su frente estará continuamente, para que tengan gracia delante de Jehová." },
        { ref: "Efesios 4:22-24", texto: "22 En cuanto a la pasada manera de vivir, despojaos del viejo hombre, que está viciado conforme a los deseos engañosos, 23 y renovaos en el espíritu de vuestra mente, 24 y vestíos del nuevo hombre, creado según Dios en la justicia y santidad de la verdad." },
        { ref: "Efesios 5:3-7", texto: "3 Pero fornicación y toda inmundicia, o avaricia, ni aun se nombre entre vosotros, como conviene a santos; 4 ni palabras deshonestas, ni necedades, ni truhanerías, que no convienen, sino antes bien acciones de gracias. 5 Porque sabéis esto, que ningún fornicario, o inmundo, o avaro, que es idólatra, tiene herencia en el reino de Cristo y de Dios. 6 Nadie os engañe con palabras vanas, porque por estas cosas viene la ira de Dios sobre los hijos de desobediencia. 7 No seáis, pues, partícipes con ellos." },
        { ref: "Efesios 5:25-27", texto: "25 Maridos, amad a vuestras mujeres, así como Cristo amó a la iglesia, y se entregó a sí mismo por ella, para santificarla, habiéndola purificado en el lavamiento del agua por la palabra, 26 a fin de presentársela a sí mismo, una iglesia gloriosa, que no tuviese mancha ni arruga ni cosa semejante, sino que fuese santa y sin mancha." },
        { ref: "1 Corintios 3:16-17", texto: "16 ¿No sabéis que sois templo de Dios, y que el Espíritu de Dios mora en vosotros? 17 Si alguno destruyere el templo de Dios, Dios le destruirá a él; porque el templo de Dios, el cual sois vosotros, santo es." },
        { ref: "2 Corintios 6:14-18", texto: "14 No os unáis en yugo desigual con los incrédulos; porque ¿qué compañerismo tiene la justicia con la injusticia? ¿Y qué comunión la luz con las tinieblas? 15 ¿Y qué concordia Cristo con Belial? ¿O qué parte el creyente con el incrédulo? 16 ¿Y qué acuerdo hay entre el templo de Dios y los ídolos? Porque vosotros sois el templo del Dios viviente, como Dios dijo: Habitaré y andaré entre ellos, Y seré su Dios, Y ellos serán mi pueblo. 17 Por lo cual, Salid de en medio de ellos, y apartaos, dice el Señor, Y no toquéis lo inmundo; Y yo os recibiré, 18 Y seré para vosotros por Padre, Y vosotros me seréis hijos e hijas, dice el Señor Todopoderoso." },
        { ref: "2 Corintios 7:1", texto: "Así que, amados, puesto que tenemos tales promesas, limpiémonos de toda contaminación de carne y de espíritu, perfeccionando la santidad en el temor de Dios." },
        { ref: "1 Pedro 1:13-16", texto: "13 Por tanto, ceñid los lomos de vuestro entendimiento, sed sobrios, y esperad por completo en la gracia que se os traerá cuando Jesucristo sea manifestado; 14 como hijos obedientes, no os conforméis a los deseos que antes teníais estando en vuestra ignorancia; 15 sino, como aquel que os llamó es santo, sed también vosotros santos en toda vuestra manera de vivir; 16 porque escrito está: Sed santos, porque yo soy santo." },
        { ref: "1 Pedro 1:17-21", texto: "17 Y si invocáis por Padre a aquel que sin acepción de personas juzga según la obra de cada uno, conducíos en temor todo el tiempo de vuestra peregrinación; 18 sabiendo que fuisteis rescatados de vuestra vana manera de vivir, la cual recibisteis de vuestros padres, no con cosas corruptibles, como oro o plata, 19 sino con la sangre preciosa de Cristo, como de un cordero sin mancha y sin contaminación, 20 ya destinado desde antes de la fundación del mundo, pero manifestado en los postreros tiempos por amor de vosotros, 21 y mediante el cual creéis en Dios, quien le resucitó de los muertos y le ha dado gloria, para que vuestra fe y esperanza sean en Dios." },
        { ref: "1 Pedro 1:22-25", texto: "22 Habiendo purificado vuestras almas por la obediencia a la verdad, mediante el Espíritu, para el amor fraternal no fingido, amaos unos a otros entrañablemente, de corazón puro; 23 siendo renacidos, no de simiente corruptible, sino de incorruptible, por la palabra de Dios que vive y permanece para siempre. 24 Porque: Toda carne es como hierba, Y toda la gloria del hombre como flor de la hierba. La hierba se seca, y la flor se cae; 25 Mas la palabra del Señor permanece para siempre. Y esta es la palabra que por el evangelio os ha sido anunciada." },
        { ref: "1 Pedro 2:9-10", texto: "9 Mas vosotros sois linaje escogido, real sacerdocio, nación santa, pueblo adquirido por Dios, para que anunciéis las virtudes de aquel que os llamó de las tinieblas a su luz admirable; 10 vosotros que en otro tiempo no erais pueblo, pero que ahora sois pueblo de Dios; que en otro tiempo no habíais alcanzado misericordia, pero ahora habéis alcanzado misericordia." },
        { ref: "Levítico 19:1-2", texto: "1 Habló Jehová a Moisés, diciendo: 2 Habla a toda la congregación de los hijos de Israel, y diles: Santos seréis, porque santo soy yo Jehová vuestro Dios." },
        { ref: "Levítico 20:26", texto: "Habéis, pues, de serme santos, porque yo Jehová soy santo, y os he apartado de los pueblos para que seáis míos." },
        { ref: "Hebreos 12:9-11", texto: "9 Por otra parte, tuvimos a nuestros padres terrenales que nos disciplinaban, y los venerábamos. ¿Por qué no obedeceremos mucho mejor al Padre de los espíritus, y viviremos? 10 Y aquéllos, ciertamente por pocos días nos disciplinaban como a ellos les parecía, pero éste para lo que nos es provechoso, para que participemos de su santidad. 11 Es verdad que ninguna disciplina al presente parece ser causa de gozo, sino de tristeza; pero después da fruto apacible de justicia a los que en ella han sido ejercitados." },
        { ref: "Hebreos 12:12-15", texto: "12 Por lo cual, levantad las manos caídas y las rodillas paralizadas; 13 y haced sendas derechas para vuestros pies, para que lo cojo no se salga del camino, sino que sea sanado. 14 Seguid la paz con todos, y la santidad, sin la cual nadie verá al Señor. 15 Mirad bien, no sea que alguno deje de alcanzar la gracia de Dios; que brotando alguna raíz de amargura, os estorbe, y por ella muchos sean contaminados;" },
        { ref: "Isaías 35:8", texto: "Y habrá allí calzada y camino, y será llamado Camino de Santidad; no pasará inmundo por él, sino que él mismo estará con ellos; el que anduviere en este camino, por torpe que sea, no se extraviará." },
        { ref: "Lucas 1:74-75", texto: "74 Que, librados de nuestros enemigos, Sin temor le serviríamos, 75 En santidad y en justicia delante de él, todos los días de nuestra vida." },
        { ref: "Juan 17:15-20", texto: "15 No ruego que los quites del mundo, sino que los guardes del mal. 16 No son del mundo, como tampoco yo soy del mundo. 17 Santifícalos en tu verdad; tu palabra es verdad. 18 Como tú me enviaste al mundo, así yo los he enviado al mundo. 19 Y por ellos yo me santifico a mí mismo, para que también ellos sean santificados en la verdad. 20 Mas no ruego solamente por éstos, sino también por los que han de creer en mí por la palabra de ellos," },
        { ref: "1 Juan 3:2-3", texto: "2 Amados, ahora somos hijos de Dios, y aún no se ha manifestado lo que hemos de ser; pero sabemos que cuando él se manifieste, seremos semejantes a él, porque le veremos tal como él es. 3 Y todo aquel que tiene esta esperanza en él, se purifica a sí mismo, así como él es puro." },
        { ref: "Génesis 17:1-2", texto: "1 Era Abram de edad de noventa y nueve años, cuando se le apareció Jehová y le dijo: Yo soy el Dios Todopoderoso; anda delante de mí y sé perfecto. 2 Y pondré mi pacto entre mí y ti, y te multiplicaré en gran manera." },
        { ref: "Romanos 6:19-23", texto: "19 Hablo como humano, por vuestra humana debilidad; que así como para iniquidad presentasteis vuestros miembros para servir a la inmundicia y a la iniquidad, así ahora para santificación presentad vuestros miembros para servir a la justicia. 20 Porque cuando erais esclavos del pecado, erais libres acerca de la justicia. 21 ¿Pero qué fruto teníais de aquellas cosas de las cuales ahora os avergonzáis? Porque el fin de ellas es muerte. 22 Mas ahora que habéis sido libertados del pecado y hechos siervos de Dios, tenéis por vuestro fruto la santificación, y como fin, la vida eterna. 23 Porque la paga del pecado es muerte, mas la dádiva de Dios es vida eterna en Cristo Jesús Señor nuestro." },
        { ref: "Romanos 12:1-2", texto: "1 Así que, hermanos, os ruego por las misericordias de Dios, que presentéis vuestros cuerpos en sacrificio vivo, santo, agradable a Dios, que es vuestro culto racional. 2 No os conforméis a este siglo, sino transformaos por medio de la renovación de vuestro entendimiento, para que comprobéis cuál sea la buena voluntad de Dios, agradable y perfecta." },
        { ref: "2 Timoteo 1:6-9", texto: "6 Por lo cual te aconsejo que avives el fuego del don de Dios que está en ti por la imposición de mis manos. 7 Porque no nos ha dado Dios espíritu de cobardía, sino de poder, de amor y de dominio propio. 8 Por tanto, no te avergüences de dar testimonio de nuestro Señor, ni de mí, preso suyo, sino participa de las aflicciones por el evangelio según el poder de Dios, 9 quien nos salvó y llamó con llamamiento santo, no conforme a nuestras obras, sino según el propósito suyo y la gracia que nos fue dada en Cristo Jesús antes de los tiempos de los siglos," },
        { ref: "1 Tesalonicenses 3:12-13", texto: "12 Y el Señor os haga crecer y abundar en amor unos para con otros y para con todos, como también lo hacemos nosotros para con vosotros, 13 para que sean afirmados vuestros corazones, irreprensibles en santidad delante de Dios nuestro Padre, en la venida de nuestro Señor Jesucristo con todos sus santos." },
        { ref: "1 Tesalonicenses 4:3-7", texto: "3 pues la voluntad de Dios es vuestra santificación; que os apartéis de fornicación; 4 que cada uno de vosotros sepa tener su propia esposa en santidad y honor; 5 no en pasión de concupiscencia, como los gentiles que no conocen a Dios; 6 que ninguno agravie ni engañe en nada a su hermano; porque el Señor es vengador de todo esto, como ya os hemos dicho y testificado. 7 Pues no nos ha llamado Dios a inmundicia, sino a santificación." },
        { ref: "Salmos 119:9-11", texto: "9 ¿Con qué limpiará el joven su camino? Con guardar tu palabra. 10 Con todo mi corazón te he buscado; No me dejes desviarme de tus mandamientos. 11 En mi corazón he guardado tus dichos, Para no pecar contra ti." },
        { ref: "Salmos 139:1-6", texto: "1 Oh Jehová, tú me has examinado y conocido. 2 Tú has conocido mi sentarme y mi levantarme; Has entendido desde lejos mis pensamientos. 3 Has escudriñado mi andar y mi reposo, Y todos mis caminos te son conocidos. 4 Pues aún no está la palabra en mi lengua, Y he aquí, oh Jehová, tú la sabes toda. 5 Detrás y delante me rodeaste, Y sobre mí pusiste tu mano. 6 Tal conocimiento es demasiado maravilloso para mí; Alto es, no lo puedo comprender." },
        { ref: "Salmos 139:23-24", texto: "23 Examíname, oh Dios, y conoce mi corazón; Pruébame y conoce mis pensamientos; 24 Y ve si hay en mí camino de perversidad, Y guíame por el camino eterno." }
    ];

    // Obtener el día actual del mes (1-31)
    const fecha = new Date();
    const dia = fecha.getDate();
    const indice = (dia - 1) % citasBiblicas.length;
    const citaDelDia = citasBiblicas[indice];

    if (elementoTitulo) {
        elementoTitulo.textContent = citaDelDia.ref;
    }
    
    if (elementoTexto) {
        // Reemplazamos los números de los versículos para poder darles estilo y usamos innerHTML.
        const textoConEstilo = citaDelDia.texto.replace(/(\d+)/g, '<span class="numero-versiculo-rojo">$1</span>');
        elementoTexto.innerHTML = textoConEstilo;
    }

    // Generar link a BibleGateway solo como referencia
    const regex = /^(.*)\s+(\d+):(\d+)(?:-(\d+))?$/;
    const match = citaDelDia.ref.match(regex);

    if (match) {
        const libro = match[1];
        const capitulo = match[2];
        const versiculoInicio = match[3];
        const versiculoFin = match[4];

        // Link Bible Gateway
        const libroEncoded = encodeURIComponent(libro);
        let gatewayUrl = `https://www.biblegateway.com/passage/?search=${libroEncoded}%20${capitulo}%3A${versiculoInicio}`;
        if (versiculoFin) gatewayUrl += `-${versiculoFin}`;
        gatewayUrl += "&version=RVR1960";
        if (elementoLink) elementoLink.href = gatewayUrl;
    }
});