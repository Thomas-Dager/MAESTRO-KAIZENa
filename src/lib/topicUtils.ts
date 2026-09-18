/**
 * Utilidades para limpieza, extracción y normalización de temas de aprendizaje,
 * y currículos pedagógicos expertos por dominio para Maestro Kaizen.
 */

import type { Milestone, DifficultyLevel } from "@/types";
import type { GeneratedMilestoneDto } from "@/app/api/ai/generate-plan/route";

/**
 * Limpia y destila frases coloquiales en un título conciso, formal y profesional.
 * Ej: "Quiero aprender a hacer cortes culinarios a nivel profesional" -> "Cortes Culinarios Profesionales"
 */
export function cleanSkillTopic(input: string): string {
  if (!input) return "Habilidad Kaizen";
  let cleaned = input.trim();

  // Eliminar prefijos conversacionales comunes iterativamente
  const prefixPatterns = [
    /^(quiero|deseo|necesito|busco|quisiera)\s+(aprender|dominar|mejorar|saber|hacer|estudiar|practicar|usar|utilizar|memorizar)(\s+(a\s+hacer|a\s+usar|a\s+utilizar|a|en|sobre|el|la|los|las|como|cómo|de))?\s+/i,
    /^(me\s+gustar[ií]a|me\s+encantar[ií]a)\s+(aprender|dominar|mejorar|saber|hacer|usar|utilizar)(\s+(a\s+hacer|a\s+usar|a\s+utilizar|a|en|sobre|el|la|los|las|como|cómo|de))?\s+/i,
    /^(aprender|dominar|mejorar|c[oó]mo\s+(aprender|hacer|tocar|dibujar|programar|cocinar|usar|utilizar))(\s+(a\s+hacer|a\s+usar|a\s+utilizar|a|en|sobre|el|la|los|las|de))?\s+/i,
    /^(curso\s+de|tutorial\s+de|gu[ií]a\s+de|iniciaci[oó]n\s+a(l)?)\s+/i,
    /^(a\s+hacer|hacer|a\s+usar|usar|a\s+utilizar|utilizar|a\s+tocar|tocar|a\s+cocinar|cocinar|a\s+dibujar|dibujar|a\s+memorizar|memorizar)\s+/i,
  ];

  let changed = true;
  while (changed) {
    changed = false;
    for (const pattern of prefixPatterns) {
      if (pattern.test(cleaned)) {
        cleaned = cleaned.replace(pattern, "").trim();
        changed = true;
      }
    }
  }

  // Normalizar sufijos coloquiales
  cleaned = cleaned.replace(/\s+a\s+nivel\s+profesional$/i, " Profesionales");
  cleaned = cleaned.replace(/\s+nivel\s+profesional$/i, " Profesionales");
  cleaned = cleaned.replace(/\s+a\s+nivel\s+experto$/i, " Avanzado");
  cleaned = cleaned.replace(/\s+desde\s+cero$/i, "");
  cleaned = cleaned.replace(/\s+paso\s+a\s+paso$/i, "");
  cleaned = cleaned.replace(/\s+f[aá]cil\s+y\s+r[aá]pido$/i, "");
  cleaned = cleaned.replace(/[.?!,;:]+$/, "");

  // Normalizaciones específicas de dominios comunes
  cleaned = cleaned.replace(/\bcortes?\s+culinarios?\b/i, "Cortes Culinarios");
  cleaned = cleaned.replace(/\bcortes?\s+culinario\b/i, "Cortes Culinarios");
  cleaned = cleaned.replace(/\bcortes?\s+de\s+cocina\b/i, "Cortes Culinarios");
  cleaned = cleaned.replace(/\bt[eé]cnicas?\s+de\s+cuchillo\b/i, "Técnicas de Cuchillo");
  cleaned = cleaned.replace(/\bpistol\s+squats?\b/i, "Pistol Squat");
  cleaned = cleaned.replace(/\bsentadilla\s+a\s+una\s+pierna\b/i, "Pistol Squat (Sentadilla a una pierna)");
  cleaned = cleaned.replace(/\b(el\s+)?palacio\s+mental\b/i, "Palacio Mental (Método de Loci)");
  cleaned = cleaned.replace(/\b(el\s+)?palacio\s+de\s+(la\s+)?memoria\b/i, "Palacio Mental (Método de Loci)");
  cleaned = cleaned.replace(/\bt[eé]cnica\s+de\s+loci\b/i, "Palacio Mental (Método de Loci)");
  cleaned = cleaned.replace(/\bmnemotecnia\b/i, "Mnemotecnia y Memorización");

  cleaned = cleaned.trim();
  if (!cleaned) return "Habilidad Kaizen";

  // Capitalizar primera letra respetando el resto
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Genera un currículo pedagógico experto y específico por dominio cuando Gemini
 * no está configurado o si la cuota de la API se agota temporalmente.
 * PROHIBIDO generar texto de relleno genérico.
 */
export function generateExpertCurriculum(
  rawInterest: string,
  totalDays: number,
  dailyMinutes: number,
  assessedLevel: string,
  gapAnalysis: string
): {
  planTitle: string;
  overview: string;
  rawMilestones: GeneratedMilestoneDto[];
} {
  const cleanTitle = cleanSkillTopic(rawInterest);
  const lower = rawInterest.toLowerCase();

  // 1. DOMINIO: CORTES CULINARIOS Y TÉCNICAS DE CUCHILLO
  if (
    lower.includes("corte") ||
    lower.includes("culinari") ||
    lower.includes("cocina") ||
    lower.includes("cuchillo") ||
    lower.includes("chef")
  ) {
    const culinaryTitles = [
      {
        title: "Seguridad, Agarre en Pinza (Pinch Grip) y la Garra de Oso (Bear Claw)",
        theory:
          "El control del cuchillo de chef profesional no radica en la fuerza del brazo, sino en la palanca neuromuscular. El agarre en pinza (pulgar e índice sobre la base de la hoja) neutraliza el balanceo, mientras la mano guía en garra de oso protege los dedos y actúa como tope milimétrico móvil.",
        steps: [
          "Fijar la tabla de corte con un paño húmedo debajo (tolerancia cero a deslizamientos).",
          "Pinzar la base de la hoja entre el pulgar y el lateral del índice, envolviendo el mango con los dedos restantes.",
          "Adoptar la garra de oso con la mano guía: yemas replegadas hacia adentro y pulgar oculto detrás.",
          "Realizar 25 movimientos de vaivén en vacío sintiendo el lateral del cuchillo deslizar por la segunda falange.",
        ],
        sensoryKey: "Sentir el plano frío de la hoja reposando contra los nudillos guía sin presionar.",
        searchQuery: "cuchillo de chef agarre en pinza garra de oso tecnica tutorial",
      },
      {
        title: "Corte Pivotante (Rocking) y Deslizamiento Frontal (Push Cut)",
        theory:
          "Los dos movimientos mecánicos rectores de la gastronomía. El corte pivotante mantiene la punta del cuchillo siempre en contacto con la tabla como eje oscilante. El push-cut proyecta la hoja hacia adelante y abajo en un trazo limpio, evitando aplastar las fibras de los vegetales.",
        steps: [
          "Ejecutar el movimiento oscilatorio elíptico en una rama de apio sin despegar la punta de la tabla.",
          "Practicar el empuje frontal (push-cut) en zanahoria o calabacín sin emplear presión vertical aplastante.",
          "Comprobar que el filo corta por cizallamiento y no por machacado (inspección de bordes limpios).",
          "Mantener hombros relajados y peso distribuido equitativamente sobre ambos pies.",
        ],
        sensoryKey: "Sonido rítmico y seco al contactar la madera, sin resistencia áspera al deslizar.",
        searchQuery: "tecnicas de corte culinario rocking push cut chef profesional",
      },
      {
        title: "Cortes en Bastón I: Cuadratura de Vegetales y Batonnet (6mm x 6mm x 6cm)",
        theory:
          "En cocina clásica, todo corte geométrico perfecto proviene de transformar una raíz orgánica en un prisma rectangular. El batonnet es la base estructural a partir de la cual se derivan los cubos medianos y la macedonia.",
        steps: [
          "Pelar una zanahoria y seccionar en troncos idénticos de exactamente 6 cm de longitud.",
          "Cortar una lámina delgada en una de las caras para crear una base de apoyo plana e inamovible.",
          "Cuadrar las cuatro caras restantes descartando curvaturas hasta obtener un prisma recto.",
          "Rebanar en láminas de 6 mm de grosor y luego seccionar longitudinalmente en bastones de 6x6 mm.",
        ],
        sensoryKey: "Alineación visual perfecta: ningún bastón debe superar una desviación mayor a 1 milímetro.",
        searchQuery: "corte batonnet zanahoria tecnica cocina profesional tutorial",
      },
      {
        title: "Cortes en Bastón II: La Juliana Fina de Precisión (2mm x 2mm x 5cm)",
        theory:
          "La juliana fina mide el control micrométrico del cocinero. Cada retroceso de los nudillos guía debe ser un espaciado exacto de 2 milímetros, logrando filamentos tan uniformes que se cocinen al mismo segundo.",
        steps: [
          "Cuadrar un vegetal firme (nabo, papa o zanahoria) en bloques de 5 cm de largo.",
          "Obtener láminas casi translúcidas de 2 mm empleando el corte en deslizamiento frontal.",
          "Apilar un máximo de 3 láminas y cortar a ritmo pausado con separación de 2 mm.",
          "Sumergir los filamentos en agua helada para comprobar la tensión y crocancia uniforme.",
        ],
        sensoryKey: "Ritmo cadencioso constante: la mano guía retrocede como los engranajes de un reloj.",
        searchQuery: "corte juliana fina verduras tecnica profesional chef",
      },
      {
        title: "Cubos de Alta Cocina: Brunoise Fina (2mm) y Mirepoix (1cm)",
        theory:
          "La brunoise fina no se pica al azar; se construye cortando transversalmente los bastones de juliana con espaciado idéntico. El mirepoix combina cubos de 1 cm de cebolla, apio y zanahoria para bases aromáticas francesas.",
        steps: [
          "Alinear un haz compacto de bastones de juliana fina sujetándolos con firmeza.",
          "Cortar transversalmente a intervalos de 2 mm generando diminutos cubos milimétricos idénticos.",
          "Practicar el mirepoix tradicional en cebolla sin desprender el nudo de la raíz para retener las capas.",
          "Evaluar la ausencia de piezas piramidales o desgranadas en la tabla.",
        ],
        sensoryKey: "Sensación de lluvia homogénea de cubos al pasar la hoja hacia el recipiente de mise en place.",
        searchQuery: "corte brunoise cebolla verduras tecnica chef profesional",
      },
      {
        title: "Corte de Hojas Delicadas: Chiffonade y Despepitado Concassé",
        theory:
          "Las hierbas aromáticas y hojas verdes (albahaca, salvia, espinaca) se marchitan y ennegrecen si se machacan. El chiffonade utiliza hojas enrolladas a modo de habano y un filo afiladísimo para rebanar en cintas etéreas.",
        steps: [
          "Lavar y secar completamente hojas de albahaca para evitar que la humedad apelmace el corte.",
          "Apilar las hojas de mayor a menor y enrollarlas con suavidad en un cilindro compacto.",
          "Cortar en cintas delgadísimas con el filo deslizando sin ejercer presión vertical.",
          "Preparar un tomate concassé: escaldar 30 segundos, pelar, retirar semillas y cortar en dados de 5 mm.",
        ],
        sensoryKey: "Bordes de las cintas de albahaca de color verde brillante sin oxidación ni humedad residual.",
        searchQuery: "corte chiffonade albahaca concasse tomate tecnica profesional",
      },
      {
        title: "★ Desafío Final Capstone: Mise en Place Autónoma de 4 Cortes Clásicos",
        theory:
          "La prueba de graduación del cocinero profesional: ejecución serena, limpia y autónoma de los cuatro pilares del cuchillo (Juliana, Brunoise, Batonnet y Chiffonade) bajo estándar de restaurante gastronómico.",
        steps: [
          "Organizar tu estación de trabajo profesional: tabla fija, paño de limpieza, cuencos de mise en place.",
          "Procesar consecutivamente: 1 porción de Juliana fina, 1 de Brunoise, 1 de Batonnet y 1 de Chiffonade.",
          "Comprobar el filo con el test del papel o del tomate maduro antes y después de la sesión.",
          "Evaluar la uniformidad total del lote y documentar tus tiempos y sensaciones en la bitácora.",
        ],
        sensoryKey: "Confianza corporal total: la vista anticipa el corte y las manos ejecutan sin vacilación.",
        searchQuery: "mise en place cortes clasicos examen gastronomia profesional",
      },
    ];

    return {
      planTitle: "Cortes Culinarios y Técnicas de Cuchillo Profesional",
      overview: `Roadmap acelerado de ${totalDays} días basado en pedagogía Kaizen para dominar los cortes clásicos de la cocina profesional (Juliana, Brunoise, Batonnet, Chiffonade) con seguridad biomecánica y precisión milimétrica.`,
      rawMilestones: buildMilestonesFromCurriculum(
        culinaryTitles,
        "★ Desafío Final Autónomo: Mise en Place de 4 Cortes Clásicos de Alta Cocina",
        totalDays,
        dailyMinutes
      ),
    };
  }

  // 2. DOMINIO: PISTOL SQUAT / CALISTENIA / MOVILIDAD
  if (
    lower.includes("pistol") ||
    lower.includes("sentadilla") ||
    lower.includes("calistenia") ||
    lower.includes("pierna")
  ) {
    const fitnessTitles = [
      {
        title: "Movilidad de Dorsiflexión y Descompresión de Sóleo",
        theory: "La sentadilla a una pierna requiere al menos 35° de dorsiflexión en el tobillo para evitar la caída hacia atrás.",
        steps: [
          "Test de rodilla a pared para medir el rango articular inicial.",
          "Movilizaciones dinámicas de tobillo con banda elástica o apoyo corporal (3 series de 10 reps).",
          "Estiramiento mantenido de sóleo y fascia plantar durante 45 segundos por lado.",
        ],
        sensoryKey: "Sentir el talón pegado al suelo sin levantar el arco interno.",
        searchQuery: "dorsiflexion tobillo pistol squat movilidad tutorial",
      },
      {
        title: "Fuerza Excéntrica en Cajón / Banco Asistido",
        theory: "El control motor excéntrico construye la fuerza y la estabilidad neuromuscular antes de intentar el empuje concéntrico.",
        steps: [
          "Colocarse de pie sobre un escalón o cajón a la altura de la rodilla.",
          "Descender en 4 segundos completos con una sola pierna hasta rozar el suelo.",
          "Subir con ambas piernas para no fatigar la fase de empuje concéntrico.",
        ],
        sensoryKey: "Descenso suave sin dejarse caer en los últimos 5 centímetros.",
        searchQuery: "pistol squat bajadas excentricas cajon progresion",
      },
      {
        title: "Sentadilla Cosaca (Cossack Squat) y Apertura de Cadera",
        theory: "Desarrolla la flexibilidad activa de aductores y la estabilidad lateral de la pelvis.",
        steps: [
          "Separar los pies al doble del ancho de hombros con puntas ligeramente hacia afuera.",
          "Descender hacia un lateral manteniendo el talón de la pierna activa anclado al piso.",
          "Rotar la pierna extendida hacia el techo apoyando solo el talón.",
        ],
        sensoryKey: "Tensión elástica y confortable en los aductores sin dolor en la rótula.",
        searchQuery: "cossack squat tecnica paso a paso calistenia",
      },
      {
        title: "Control del Psoas y Pierna Libre en Extensión (L-Hold)",
        theory: "El 50% del éxito en la pistol squat radica en mantener la pierna libre extendida en el aire sin que toque el suelo.",
        steps: [
          "Sentado en el suelo con piernas estiradas en L, colocar las manos junto a las rodillas.",
          "Elevar la pierna activa 5 cm del suelo durante 5 segundos mediante contracción del cuádriceps y psoas.",
          "Realizar 4 series de 6 elevaciones controladas por pierna.",
        ],
        sensoryKey: "Contracción nítida en el flexor de la cadera sin redondear en exceso la espalda baja.",
        searchQuery: "compresion psoas elevacion pierna l-sit calistenia",
      },
      {
        title: "Pistol Squat Asistida con Contrapeso Ligero",
        theory: "Sujetar una mancuerna o botella de 2 a 3 kg al frente adelanta el centro de gravedad, compensando la falta de flexión de tobillo.",
        steps: [
          "Sostener un peso de 2 a 3 kg con los brazos estirados al frente a la altura del pecho.",
          "Iniciar el descenso con una pierna manteniendo la mirada al horizonte.",
          "Descender hasta la máxima profundidad y empujar con el talón para subir de manera continua.",
        ],
        sensoryKey: "El contrapeso equilibra la pelvis permitiendo bajar profundo sin caerse.",
        searchQuery: "pistol squat contrapeso mancuerna progresion",
      },
      {
        title: "Pistol Squat Asistida con Soporte de Dedos / Poste",
        theory: "Reducción progresiva del soporte manual hasta emplear únicamente 1 o 2 dedos para equilibrio.",
        steps: [
          "Situarse junto a una puerta, poste o anilla de gimnasia.",
          "Descender con una sola pierna utilizando solo dos dedos de la mano para estabilidad mínima.",
          "Pausar 1 segundo en el fondo antes de impulsar hacia arriba.",
        ],
        sensoryKey: "Empuje potente originado en el glúteo mayor y cuádriceps.",
        searchQuery: "pistol squat progresion anillas barra asistencia",
      },
      {
        title: "Pistol Squat Autónoma en Suelo Firme",
        theory: "Integración completa de movilidad, balance, fuerza concéntrica y control neuromuscular sin ayuda externa.",
        steps: [
          "Calentamiento articular completo de tobillo y cadera (5 min).",
          "Ejecutar 3 repeticiones limpias y fluidas con la pierna derecha.",
          "Descanso de 90 segundos y ejecutar 3 repeticiones limpias con la pierna izquierda.",
          "Verificar extensión total de la pierna libre y ausencia de despegue del talón de apoyo.",
        ],
        sensoryKey: "Fluidez, equilibrio inquebrantable y control absoluto en el fondo.",
        searchQuery: "pistol squat demostracion tecnica perfecta calistenia",
      },
    ];

    return {
      planTitle: "Pistol Squat: Dominio y Fuerza Unilateral",
      overview: `Roadmap progresivo de ${totalDays} días para dominar la sentadilla a una pierna (Pistol Squat), superando la restricción de dorsiflexión y construyendo fuerza excéntrica y equilibrio neuromuscular.`,
      rawMilestones: buildMilestonesFromCurriculum(
        fitnessTitles,
        "★ Desafío Final Autónomo: Dominio y Ejecución Impecable de Pistol Squat",
        totalDays,
        dailyMinutes
      ),
    };
  }

  // 3. DOMINIO: PALACIO MENTAL / MÉTODO DE LOCI / MNEMOTECNIA
  if (
    lower.includes("palacio") ||
    lower.includes("loci") ||
    lower.includes("memoria") ||
    lower.includes("mnemo")
  ) {
    const memoryTitles = [
      {
        title: "Cartografía de tu Primer Palacio: Selección del Hogar y Regla de No-Cruce",
        theory:
          "El método de loci aprovecha la corteza parahipocampal humana, evolutivamente programada para la navegación espacial. Un palacio mental efectivo requiere un espacio 100% familiar (tu casa o habitación) recorrido en una sola dirección fija (sentido horario) sin cruzar nunca tu propio camino.",
        steps: [
          "Elegir un espacio íntimamente conocido: tu habitación o casa actual.",
          "Definir una ruta física lineal secuencial con un punto de partida exacto (la puerta de entrada).",
          "Establecer la regla inviolable de avance en sentido horario para no saltar ni cruzar habitaciones.",
          "Caminar mentalmente por la ruta 3 veces con ojos cerrados sintiendo cada rincón con nitidez.",
        ],
        sensoryKey: "Sentir la textura del pomo de la puerta y la temperatura del suelo en el punto de partida.",
        searchQuery: "palacio mental metodo de loci elegir loci ruta sin cruces tutorial",
      },
      {
        title: "Anclaje de 10 Micro-Loci Fijos y Regla de Escala Espacial",
        theory:
          "Los loci son estaciones de aterrizaje donde se colocarán las imágenes mnemotécnicas. Deben ser muebles u objetos fijos (mesa, lámpara, fregadero, sofá), espaciados al menos a 1 metro de distancia para evitar solapamientos o contaminación visual.",
        steps: [
          "Seleccionar exactamente 10 objetos o esquinas inmóviles a lo largo de tu recorrido.",
          "Numerar mentalmente los 10 loci del 1 al 10 en estricto orden cronológico.",
          "Verificar que ningún locus sea idéntico a otro dentro de la misma habitación.",
          "Recorrer los 10 loci hacia adelante (1 al 10) y hacia atrás (10 al 1) en menos de 30 segundos.",
        ],
        sensoryKey: "Localización espacial instantánea: señalar con el dedo físico cada locus en el aire.",
        searchQuery: "como seleccionar loci fijos estaciones palacio de la memoria guia",
      },
      {
        title: "Principio VIVID y Codificación de Palabras Concretas",
        theory:
          "El cerebro no recuerda datos neutros; recuerda lo VIVID (Visual, Insólito, Vívido, Inusual, Dinámico). Para fijar un elemento en un locus, la imagen mental debe involucrar movimiento violento o cómico, dimensiones desproporcionadas y sensaciones táctiles u olfativas.",
        steps: [
          "Tomar una lista de 5 objetos cotidianos (ej: martillo, sandía, violín, bota, telescopio).",
          "Amplificar cada objeto: no imagines una sandía quieta, imagina una sandía gigante explotando con jugo pegajoso.",
          "Anclar la escena interactuando activamente con el primer locus (ej: la sandía reventando sobre la lámpara del techo).",
          "Recitar la secuencia completa tras 15 minutos sin consultar la lista escrita.",
        ],
        sensoryKey: "Sentir el impacto kinestésico o el olor penetrante del objeto interactuando con el mueble.",
        searchQuery: "mnemotecnia imagenes absurdas principio VIVID memoria visual",
      },
      {
        title: "Codificación de Conceptos Abstractos mediante Metáforas Visuales",
        theory:
          "Las ideas intangibles (libertad, inflación, sinapsis, democracia) deben traducirse a sustitutos fonéticos o símbolos visuales contundentes antes de ingresar al palacio mental.",
        steps: [
          "Seleccionar 5 conceptos abstractos o técnicos de un área de estudio.",
          "Aplicar la técnica de sustitución fonética o simbólica (ej: 'inflación' -> un globo aerostático gigantesco a punto de estallar).",
          "Anclar el símbolo interactuando con tu locus 6 al 10.",
          "Decodificar la imagen: pasar del símbolo visual de regreso al concepto técnico exacto.",
        ],
        sensoryKey: "El clic mental inmediato donde la metáfora evoca automáticamente el término abstracto.",
        searchQuery: "memorizar conceptos abstractos palacio mental sustitucion simbolica",
      },
      {
        title: "Técnica de Vinculación en Cadena (Link Method) dentro de un Locus",
        theory:
          "Para multiplicar la capacidad del palacio sin saturarlo de estaciones, cada locus puede albergar una 'micro-escena' donde 2 o 3 elementos interactúan en una acción de causa y efecto en cadena.",
        steps: [
          "Vincular el elemento A golpeando, quemando o transformando al elemento B en un solo locus.",
          "Garantizar que la dirección de la acción indique cuál elemento va primero y cuál después.",
          "Practicar con ternas de información (ej: autor -> obra -> año).",
          "Comprobar que recordar el elemento A detona instantáneamente la imagen del elemento B.",
        ],
        sensoryKey: "Efecto dominó: la primera imagen empuja visualmente a la siguiente como una chispa.",
        searchQuery: "metodo de la cadena mnemotecnia asociacion link method memoria",
      },
      {
        title: "Introducción al Sistema Mayor: Fonética Consonántica para Números",
        theory:
          "Los números son abstractos y resbaladizos para el hipocampo. El Sistema Mayor asigna consonantes fijas a los dígitos 0-9 según su parecido gráfico o articulatorio (1=T/D, 2=N, 3=M, 4=C/K, etc.), permitiendo transformar cifras en palabras palpables.",
        steps: [
          "Aprender la tabla fonética de los dígitos del 0 al 4 con sus sonidos consonánticos correspondientes.",
          "Aprender la tabla fonética de los dígitos del 5 al 9 con sus sonidos consonánticos correspondientes.",
          "Convertir números de 2 dígitos en palabras concretas insertando vocales libres (ej: 14 -> T-R -> 'Toro').",
          "Codificar tus primeras 3 palabras numéricas y ubicarlas en loci consecutivos.",
        ],
        sensoryKey: "Articulación fonética sublingual rápida al leer cualquier cifra del 0 al 9.",
        searchQuery: "sistema mayor fonetico mnemotecnia tabla consonantes numeros",
      },
      {
        title: "Hito Integrador: Memorización Rápida de 20 Términos Complejos",
        theory:
          "Consolidación de la primera fase: recuperar a demanda y sin titubeos 20 elementos técnicos o vocabulario foráneo utilizando únicamente tus 10 loci con 2 elementos enlazados por locus.",
        steps: [
          "Cargar 20 conceptos o vocabulario en tu palacio mental en una sola pasada de 8 minutos.",
          "Realizar una tarea distractora no verbal durante 3 minutos (caminar o beber agua).",
          "Recorrer mentalmente el palacio y transcribir los 20 elementos en papel en orden exacto.",
          "Realizar el recorrido en orden inverso del 20 al 1 para comprobar la solidez del anclaje.",
        ],
        sensoryKey: "Sensación de certeza absoluta: cada habitación 'presenta' sus objetos sin esfuerzo voluntario.",
        searchQuery: "evaluacion palacio de la memoria test 20 palabras orden directo inverso",
      },
      {
        title: "Creación del Segundo Palacio: Rutas Cotidianas y Exteriores",
        theory:
          "Para evitar el efecto 'fantasma' (interferencia proactiva entre datos antiguos y nuevos), un mnemotécnico necesita múltiples palacios independientes clasificados por temática o propósito.",
        steps: [
          "Diseñar una ruta al aire libre: el camino habitual desde tu casa al trabajo o parque.",
          "Fijar 10 macro-estaciones al aire libre (panadería, semáforo, árbol centenario, banco de plaza).",
          "Verificar la estabilidad visual diurna y nocturna de los puntos seleccionados.",
          "Calibrar la velocidad de desplazamiento mental por la nueva ruta.",
        ],
        sensoryKey: "Amplitud espacial: sensación de aire libre y tridimensionalidad al recorrer la ruta.",
        searchQuery: "como crear multiples palacios de memoria rutas urbanas loci",
      },
      {
        title: "Sistema PAO (Persona-Acción-Objeto) para Datos Densos",
        theory:
          "El estándar de los campeonatos de memoria: cada número de 2 cifras se asocia a una Persona fija ejecutando una Acción fija sobre un Objeto fijo, permitiendo comprimir 6 dígitos en un solo locus de forma nítida.",
        steps: [
          "Construir tus primeras 10 tripletas PAO para los números 00 a 09.",
          "Practicar la combinación: Persona del primer número + Acción del segundo + Objeto del tercero.",
          "Anclar una cifra de 6 dígitos en un único locus mediante una sola escena unificada.",
          "Decodificar la escena identificando quién hace qué con qué cosa.",
        ],
        sensoryKey: "Claridad cinematográfica: la Persona realiza la Acción con dinamismo sobre el Objeto.",
        searchQuery: "sistema PAO persona accion objeto mnemotecnia avanzada",
      },
      {
        title: "Memorización de Fechas Históricas, Fórmulas y Códigos Numéricos",
        theory:
          "Aplicación práctica de la compresión numérica: anclar eventos históricos con su fecha exacta o fórmulas científicas combinando el Sistema Mayor con anclas semánticas.",
        steps: [
          "Seleccionar 5 fechas clave o fórmulas matemáticas/físicas de tu interés.",
          "Codificar la fecha mediante imagen fonética y fusionarla con el protagonista del evento.",
          "Instalar la escena en tu segundo palacio mental.",
          "Realizar el test de recuperación inmediata respondiendo preguntas desordenadas.",
        ],
        sensoryKey: "Disparo automático: escuchar el nombre del evento y ver inmediatamente la escena numérica.",
        searchQuery: "como memorizar fechas y formulas con palacio de memoria y sistema mayor",
      },
      {
        title: "Estructuración de Discursos y Presentaciones sin Notas (Dispositio)",
        theory:
          "La técnica original de los oradores romanos (Cicerón, Quintiliano): cada locus representa una sección, argumento clave o anécdota de tu oratoria, liberándote de las diapositivas y el papel.",
        steps: [
          "Dividir un discurso o charla de 10 minutos en 5 secciones argumentales lógicas.",
          "Extraer una imagen-clave gatillo para cada argumento y asignarla a 5 loci de tu palacio.",
          "Practicar la exposición oral de pie mientras caminas mentalmente de un locus al siguiente.",
          "Verificar que la mirada no busca notas y que las transiciones entre ideas son fluidas.",
        ],
        sensoryKey: "Oratoria serena: ver la imagen mental en el locus 2 segundos antes de pronunciar la idea.",
        searchQuery: "oratoria ciceron hablar en publico con palacio mental sin leer notas",
      },
      {
        title: "Velocidad de Recuperación y Limpieza de Palacios (Desvanecimiento Controlado)",
        theory:
          "Para reutilizar un palacio mental sin que queden residuos del pasado, se practica la 'limpieza ritual' o se destinan palacios permanentes (para saber definitivo) y palacios temporales (para exámenes o listas efímeras).",
        steps: [
          "Cronometrar el tiempo de escaneo mental de tus 10 loci buscando bajar de 1 segundo por estación.",
          "Practicar el barrido visual de un palacio temporal: imaginar una ráfaga de agua o viento barriendo las imágenes.",
          "Dejar reposar el palacio 24 horas y verificar la ausencia de imágenes residuales.",
          "Distinguir qué palacios de tu repertorio serán de archivo permanente y cuáles reciclables.",
        ],
        sensoryKey: "Sensación de espacio limpio, silencioso y listo para albergar nueva información.",
        searchQuery: "como limpiar y reutilizar palacios de memoria evitar interferencias",
      },
      {
        title: "Simulación bajo Presión y Distracciones Auditivas",
        theory:
          "La memoria en condiciones reales debe operar con ruido ambiental y estrés cognitivo. Este hito entrena la estabilidad atencional en tu navegación interna.",
        steps: [
          "Cargar 15 datos complejos en tu palacio mientras escuchas un podcast o ruido ambiente de cafetería.",
          "Mantener la vista desenfocada o fija en un punto neutro mientras la mente recorre los loci.",
          "Anotar los datos recuperados y medir el porcentaje de retención bajo interferencia.",
          "Reforzar con mayor contraste lumínico o absurdo las imágenes que hayan flaqueado.",
        ],
        sensoryKey: "Blindaje atencional: el mundo exterior se vuelve secundario mientras el palacio brilla nítido.",
        searchQuery: "entrenamiento de memoria bajo distracciones concentracion profunda loci",
      },
      {
        title: "Memorización Masiva de 50 Datos o Discurso Completo en Palacio Mental",
        theory:
          "La prueba cumbre del mnemotécnico Kaizen: demostración autónoma de codificación espacial, decodificación perfecta y retención sin notas de un volumen masivo de información en tiempo récord.",
        steps: [
          "Seleccionar tu reto final: una lista desordenada de 50 elementos, o un discurso completo de 15 minutos con cifras exactas.",
          "Codificar y alojar la totalidad del material a lo largo de tus dos palacios mentales.",
          "Ejecutar la recuperación completa en voz alta o por escrito de inicio a fin con 100% de precisión.",
          "Documentar tu tiempo total, porcentaje de acierto y registrar tus conclusiones en la Ficha de Maestría.",
        ],
        sensoryKey: "Dominio absoluto, claridad espacial cristalina y sensación de memoria sobrehumana consolidada.",
        searchQuery: "demostracion final palacio de memoria maestria mnemotecnia examen",
      },
    ];

    return {
      planTitle: "Palacio Mental y Mnemotecnia Aplicada",
      overview: `Roadmap acelerado de ${totalDays} días basado en pedagogía Kaizen para dominar el método de loci, la codificación visual VIVID y el Sistema Mayor, culminando en la memorización fluida y autónoma de 50 datos o discursos extensos.`,
      rawMilestones: buildMilestonesFromCurriculum(
        memoryTitles,
        "★ Desafío Final Autónomo: Memorización Masiva de 50 Datos en Palacio Mental",
        totalDays,
        dailyMinutes
      ),
    };
  }

  // 4. CURRÍCULO GENÉRICO ADAPTATIVO INTELIGENTE (Cualquier otra habilidad)
  // Genera fases pedagógicas reales basadas en Bloom y Kaizen sin NUNCA repetir texto tonto.
  const genericPhases = [
    {
      title: "Postura, Ergonomía y Mecanismo Base",
      theory: `En el método Kaizen, el primer paso para dominar "${cleanTitle}" consiste en eliminar toda tensión postural parasitaria y fijar el punto de contacto inicial.`,
      steps: [
        `Verificar la posición de pies, manos y espalda antes de iniciar la sesión de ${dailyMinutes} min.`,
        `Ejecutar el movimiento o interacción nuclear a un 30% de la velocidad habitual.`,
        `Identificar los 3 puntos biomecánicos o conceptuales de mayor apoyo.`,
      ],
      sensoryKey: "Sensación de ligereza en hombros y cuello durante la preparación.",
      searchQuery: `${cleanTitle} postura ergonomia tecnica basica tutorial`,
    },
    {
      title: "Aislamiento del Sub-Movimiento Nuclear",
      theory: `Descomponer la habilidad "${cleanTitle}" en su variable más pequeña para que el cerebro cree mielina sin sobrecarga cognitiva.`,
      steps: [
        `Aislar únicamente el primer gesto o concepto fundamental durante 10 minutos.`,
        `Realizar 3 series de 8 repeticiones deliberadas pausando 2 segundos en el punto de inflexión.`,
        `Evaluar la repetibilidad del gesto sin desviar la trayectoria.`,
      ],
      sensoryKey: "Consistencia motora: cada repetición se siente exactamente igual a la anterior.",
      searchQuery: `${cleanTitle} tecnica fundamental aislamiento paso a paso`,
    },
    {
      title: "Control de Cadencia y Sincronización",
      theory: `La velocidad precoz arruina la técnica. La precisión rítmica consolida el hábito de forma permanente en "${cleanTitle}".`,
      steps: [
        `Introducir una cuenta mental o compás pausado para sincronizar cada fase de la acción.`,
        `Practicar 15 repeticiones ininterrumpidas manteniendo el mismo tiempo en cada ciclo.`,
        `Detectar si existe aceleración involuntaria cuando aparece la fatiga.`,
      ],
      sensoryKey: "Respiración acompasada y ausencia de jadeo o tensión mandibular.",
      searchQuery: `${cleanTitle} ritmo cadencia precision guia`,
    },
    {
      title: "Manejo de Fricción y Variación Controlada",
      theory: `Ajustar pequeños cambios de ángulo, resistencia o complejidad en "${cleanTitle}" para fortalecer la adaptabilidad del aprendiz.`,
      steps: [
        `Introducir una ligera variante de dificultad respecto a los días anteriores.`,
        `Detectar inmediatamente el punto donde la técnica intenta romperse y retroceder un 10%.`,
        `Completar 2 bloques de práctica enfocados exclusivamente en la transición crítica.`,
      ],
      sensoryKey: "Sentir el control del error antes de que el fallo se manifieste.",
      searchQuery: `${cleanTitle} resolucion de problemas errores comunes`,
    },
    {
      title: "Micro-Precisión y Reducción de Tolerancia de Error",
      theory: `El estándar Kaizen: reducir los márgenes de error a milímetros o fracciones de segundo en "${cleanTitle}".`,
      steps: [
        `Definir un criterio estricto de éxito para cada intento del día.`,
        `Registrar únicamente los intentos que cumplan con el 100% de la forma técnica deseada.`,
        `Analizar sensorialmente qué diferenció a las repeticiones óptimas de las mediocres.`,
      ],
      sensoryKey: "Claridad mental inmediata sobre si el intento fue limpio o deficiente.",
      searchQuery: `${cleanTitle} precision perfeccionamiento tecnica`,
    },
    {
      title: "Integración Fluida de Secuencias",
      theory: `Unir los micro-pasos aislados en una sola cadena continua e intuitiva de "${cleanTitle}".`,
      steps: [
        `Encadenar el inicio, desarrollo y final de la técnica en un solo flujo continuo.`,
        `Incrementar gradualmente la velocidad sin perder un solo ápice de forma.`,
        `Realizar una simulación completa bajo condiciones reales de aplicación.`,
      ],
      sensoryKey: "Sensación de automatismo fluido: el cuerpo o la mente actúa sin necesidad de diálogo interno.",
      searchQuery: `${cleanTitle} fluidez combinacion avanzada`,
    },
    {
      title: `Demostración Autónoma de ${cleanTitle}`,
      theory: `Cierre del ciclo Kaizen: el aprendiz demuestra el dominio autónomo de "${cleanTitle}" sin soporte ni vacilación.`,
      steps: [
        `Preparar el entorno y realizar el calentamiento o activación mental (5 min).`,
        `Ejecutar la demostración integral de la habilidad de inicio a fin.`,
        `Autoevaluar con la rúbrica de maestría y registrar las notas finales en la bitácora.`,
      ],
      sensoryKey: "Sensación de triunfo, calma y dominio consolidado.",
      searchQuery: `${cleanTitle} demostracion maestra examen`,
    },
  ];

  return {
    planTitle: `${cleanTitle}: Maestría Kaizen`,
    overview: `Plan acelerado estructurado en ${totalDays} días para desarrollar maestría en ${cleanTitle}. Enfocado en superar la brecha diagnóstica: ${gapAnalysis}`,
    rawMilestones: buildMilestonesFromCurriculum(
      genericPhases,
      `★ Desafío Final Autónomo: Dominio Consolidado de ${cleanTitle}`,
      totalDays,
      dailyMinutes
    ),
  };
}

/**
 * Función auxiliar para distribuir de forma estrictamente monótona y progresiva
 * los días de aprendizaje, asegurando que el Capstone aparezca EXACTAMENTE UNA VEZ
 * y únicamente en el último día (Día totalDays).
 */
function buildMilestonesFromCurriculum(
  items: Array<{ title: string; theory: string; steps: string[]; sensoryKey: string; searchQuery: string }>,
  capstoneTitle: string,
  totalDays: number,
  dailyMinutes: number
): GeneratedMilestoneDto[] {
  const learningItems = items.slice(0, items.length - 1);
  const capstoneItem = items[items.length - 1];

  return Array.from({ length: totalDays }).map((_, idx) => {
    const day = idx + 1;
    const isLast = day === totalDays;

    if (isLast) {
      return {
        dayNumber: day,
        title: capstoneTitle,
        theory: capstoneItem.theory,
        stepByStep: capstoneItem.steps,
        sensoryKey: capstoneItem.sensoryKey,
        searchQuery: capstoneItem.searchQuery,
        isCapstone: true,
        targetDifficulty: "advanced",
        estimatedMinutes: dailyMinutes,
      };
    }

    // Escalar monótonamente sobre los días de aprendizaje sin tocar el Capstone
    const templateIndex = Math.min(
      Math.floor((idx / Math.max(1, totalDays - 1)) * learningItems.length),
      learningItems.length - 1
    );
    const template = learningItems[templateIndex];
    const cleanDayTitle = template.title.replace(/^★\s*Desafío\s+Final[^:]*:\s*/i, "");

    return {
      dayNumber: day,
      title: `Día ${day}: ${cleanDayTitle}`,
      theory: template.theory,
      stepByStep: template.steps,
      sensoryKey: template.sensoryKey,
      searchQuery: template.searchQuery,
      isCapstone: false,
      targetDifficulty: day > Math.floor(totalDays * 0.6) ? "intermediate" : "beginner",
      estimatedMinutes: dailyMinutes,
    };
  });
}
