// All player-facing Spanish text. Keys are the English ids from game/defs.ts;
// es.test.ts guards that every id has an entry and that spec §8's minimum
// counts are met.

import { FRENZY_MULTIPLIER } from "../game/defs";
import type { Content } from "./types";

function duration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  if (totalSeconds < 60) return `${totalSeconds} s`;
  const totalMinutes = Math.floor(totalSeconds / 60);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

export const es: Content = {
  stages: {
    kitchen: {
      name: "La Cocina",
      tickerHeadlines: [
        "Westie local se autoproclama Presidenta y Directora General",
        "Cocina familiar declarada «sede corporativa» sin previo aviso",
        "Vecinos reportan olor a zanahoria horneada a toda hora",
        "Cachorro becario pide sueldo; recibe una palmadita y un «buen chico»",
        "Primer cliente satisfecho: el perro de enfrente pide repetir",
        "Abuela del barrio firma contrato; exige pausas para la telenovela",
        "Licuadora industrial despierta a todo el edificio a las 6 a. m.",
        "Pandora convoca junta de accionistas; asisten dos peluches y un calcetín",
        "Food truck en el parque genera una fila de perros y mucha confusión",
        "Refrigerador de la casa reclasificado como «centro logístico»",
        "Análisis: ¿puede una croqueta vegana cambiar el mundo? La jefa dice que sí",
      ],
      quotes: [
        "Hoy una cocina. Mañana, el mundo. Pasado mañana, una siesta.",
        "Becario, tráeme el informe. Y una pelota.",
        "No soy pequeña. Soy una empresa en fase semilla.",
        "Mi visión es clara: croquetas veganas en cada plato del planeta.",
        "Esta reunión pudo haber sido un ladrido.",
        "Anota esto: la jefa nunca se equivoca. Salvo con la aspiradora.",
      ],
      memo: {
        title: "Fundación de Las Cajas de Pandora",
        paragraphs: [
          "A todo el personal (es decir, a ti):",
          "A partir de hoy, esta cocina es la sede mundial de Las Cajas de Pandora, la empresa de croquetas veganas más ambiciosa del vecindario.",
          "Tu misión: hacer clic en mí para producir croquetas. Muchas. Con ellas contrataremos becarios, abuelas y maquinaria de primera.",
          "Recuerda: yo pongo la visión y tú pones los clics. Así funcionan las grandes empresas.",
        ],
        dismiss: "A sus órdenes, jefa",
      },
    },
    factory: {
      name: "La Fábrica",
      tickerHeadlines: [
        "Las Cajas de Pandora compra su primera fábrica; la jefa corta la cinta a mordiscos",
        "Gatos contadores entregan el balance trimestral y derriban tres tazas",
        "Sindicato de becarios exige más siestas; la gerencia acepta encantada",
        "Laboratorio de tofu anuncia avance histórico: una croqueta que sabe a croqueta",
        "Presidenta Pandora inaugura sala de juntas con cama incorporada",
        "Camiones repartidores ya cubren todo el país; ninguno persigue carteros",
        "Encuesta: 9 de cada 10 perros prefieren Las Cajas de Pandora; el décimo se durmió",
        "Consultores recomiendan «pensar fuera de la caja»; Pandora prefiere dormir dentro",
        "Nuevo código de vestimenta: moño obligatorio los viernes",
        "Récord de producción celebrado con un paseo de 15 minutos para toda la plantilla",
        "Línea de ensamblaje funciona sin parar; la jefa la vigila con la cabeza ladeada",
      ],
      quotes: [
        "Una fábrica entera. Y aun así, la mejor silla es mi cojín.",
        "Quiero sinergias. No sé qué son, pero las quiero para ayer.",
        "Los gatos llevan las cuentas. Yo los vigilo. Muy de cerca.",
        "La productividad subió 300 %. Mi cola también lo celebra.",
        "Innovación disruptiva: croquetas que no ruedan debajo del sofá.",
        "¿Quién movió mi hueso de goma de la sala de juntas?",
      ],
      memo: {
        title: "Adquisición de La Fábrica",
        paragraphs: [
          "Me complace anunciar que Las Cajas de Pandora ha comprado su primera fábrica. La cocina queda como museo corporativo.",
          "Ahora tenemos líneas de ensamblaje, un departamento de contabilidad felina y un laboratorio con batas diminutas.",
          "La meta es duplicar la producción. Luego, duplicar la duplicación. Yo supervisaré todo desde mi cojín.",
        ],
        dismiss: "¡A producir!",
      },
    },
    multinational: {
      name: "La Multinacional",
      tickerHeadlines: [
        "Las Cajas de Pandora sale a bolsa; la acción GUAU abre al alza",
        "Pandora aparece en portada de revista de negocios; exige retocar las orejas",
        "Influencer canino supera en seguidores a varios canales de cocina",
        "Satélite publicitario proyecta la cara de la jefa sobre la luna llena",
        "Analistas: «la croqueta vegana es el nuevo oro»; el oro no quiso opinar",
        "Colonia en Marte reporta sus primeras ventas; clientes aún por identificar",
        "Pandora da conferencia magistral de liderazgo; se duerme en la diapositiva 3",
        "Congreso debate el Día Nacional de la Croqueta; una ardilla interrumpe la sesión",
        "Junta directiva aprueba presupuesto ilimitado para juguetes que chillan",
        "Competencia en pánico tras ver a Pandora con corbata",
        "Rumor: la jefa quiere comprar la luna «para tener más espacio para correr»",
      ],
      quotes: [
        "Cotizo en bolsa. Y aun así, me emociona el cartero.",
        "Un satélite con mi cara. Lo mínimo que merece el cosmos.",
        "Pensar globalmente. Actuar localmente. Dormir al sol de la ventana.",
        "Marte es solo el comienzo. Después, el sofá de la sala.",
        "Mis accionistas me adoran. Con toda razón.",
        "El éxito no es un destino. Es un paseo largo con muchas paradas.",
      ],
      memo: {
        title: "Salida a Bolsa",
        paragraphs: [
          "Hoy tocamos la campana de la bolsa. Bueno, la toqué yo. Varias veces. Con la pata.",
          "Las Cajas de Pandora es oficialmente una multinacional. Nuestro símbolo: GUAU. Nuestro techo: no existe.",
          "Próximos pasos: influencers, satélites y Marte. Nadie dijo que conquistar la galaxia sería fácil.",
        ],
        dismiss: "Hacia las estrellas",
      },
    },
  },

  producers: {
    intern_puppy: {
      name: "Cachorro Becario",
      flavor: "Trabaja por experiencia y una galleta. Sobre todo por la galleta.",
    },
    neighbor_grandma: {
      name: "Abuela Vecina",
      flavor: "Receta secreta, delantal floreado y cero interés en tu plan de negocios.",
    },
    industrial_blender: {
      name: "Licuadora Industrial",
      flavor: "Tritura zanahorias, avena y el silencio de toda la cuadra.",
    },
    food_truck: {
      name: "Food Truck",
      flavor: "Croquetas sobre ruedas. La jefa lo llama «expansión logística».",
    },
    assembly_line: {
      name: "Línea de Ensamblaje",
      flavor: "Cada croqueta idéntica a la anterior. Así se ve la excelencia.",
    },
    accountant_cats: {
      name: "Gatos Contadores",
      flavor: "Cuadran los libros y luego los tiran de la mesa. Con precisión.",
    },
    delivery_truck: {
      name: "Camión Repartidor",
      flavor: "Lleva croquetas a todo el país. La jefa va de copiloto, con la cabeza afuera.",
    },
    tofu_lab: {
      name: "Laboratorio de Tofu",
      flavor: "Científicos en bata buscan la croqueta perfecta. Van por la versión 47.",
    },
    dog_influencer: {
      name: "Influencer Canino",
      flavor: "Tres millones de seguidores y un contrato de exclusividad con un cojín.",
    },
    congress_lobby: {
      name: "Lobby en el Congreso",
      flavor: "Objetivo: declarar la croqueta vegana patrimonio nacional. Y el cojín, también.",
    },
    ad_satellite: {
      name: "Satélite Publicitario",
      flavor: "Proyecta el logo de la empresa en el cielo nocturno. Los lobos están confundidos.",
    },
    mars_colony: {
      name: "Colonia en Marte",
      flavor: "En Marte aún no hay perros, pero ya hay croquetas. Por si acaso.",
    },
  },

  upgrades: {
    intern_puppy_1: {
      name: "Gafete con Foto",
      flavor: "Ahora los becarios se sienten parte del equipo. Siguen sin sueldo.",
    },
    intern_puppy_2: {
      name: "Programa de Mentoría",
      flavor: "Los becarios veteranos enseñan a los nuevos a no morder los cables.",
    },
    neighbor_grandma_1: {
      name: "Delantal Corporativo",
      flavor: "Con el logo bordado. Ella lo usa al revés, por principio.",
    },
    neighbor_grandma_2: {
      name: "Club de Tejido Ejecutivo",
      flavor: "Las abuelas del barrio se unen. Tejen, hornean y opinan de todo.",
    },
    industrial_blender_1: {
      name: "Cuchillas de Titanio",
      flavor: "Trituran el doble de rápido. El ruido asusta a la jefa, pero ella lo niega.",
    },
    industrial_blender_2: {
      name: "Modo Turbo",
      flavor: "Un botón rojo que nadie debe tocar. Todos lo tocan.",
    },
    food_truck_1: {
      name: "Menú de Temporada",
      flavor: "Croqueta de calabaza en otoño. Y el resto del año también.",
    },
    food_truck_2: {
      name: "Franquicia Rodante",
      flavor: "Un food truck es un negocio. Diez son una flota. Veinte, un imperio.",
    },
    assembly_line_1: {
      name: "Cinta Transportadora Premium",
      flavor: "Avanza más rápido y hace un zumbido muy satisfactorio.",
    },
    assembly_line_2: {
      name: "Metodología Ágil",
      flavor: "Reunión de pie cada mañana. La jefa asiste acostada, porque puede.",
    },
    accountant_cats_1: {
      name: "Calculadoras de Colores",
      flavor: "Los gatos rinden más cuando los botones son bonitos.",
    },
    accountant_cats_2: {
      name: "Caja de Cartón Ejecutiva",
      flavor: "Cada contador tiene su propia caja. La productividad se disparó.",
    },
    delivery_truck_1: {
      name: "Ruta Optimizada",
      flavor: "Un algoritmo evita los parques. Demasiadas ardillas, demasiadas distracciones.",
    },
    delivery_truck_2: {
      name: "Flota Eléctrica",
      flavor: "Cero emisiones. Solo un leve aroma a croqueta recién horneada.",
    },
    tofu_lab_1: {
      name: "Microscopio de Cuarzo",
      flavor: "Ahora ven la croqueta a nivel molecular. Sigue siendo deliciosa.",
    },
    tofu_lab_2: {
      name: "Fórmula Secreta 48",
      flavor: "La 47 era buena. La 48 es revolucionaria. La 49 ya viene en camino.",
    },
    dog_influencer_1: {
      name: "Filtro de Orejas Brillantes",
      flavor: "La interacción subió 400 %. Nadie sabe por qué, y nadie pregunta.",
    },
    dog_influencer_2: {
      name: "Documental Biográfico",
      flavor: "Tres temporadas sobre su rutina diaria: comer, dormir, posar.",
    },
    congress_lobby_1: {
      name: "Almuerzo de Trabajo",
      flavor: "Croquetas de cortesía para todos. Nadie le dice que no a una croqueta.",
    },
    congress_lobby_2: {
      name: "Día Nacional de la Croqueta",
      flavor: "Aprobado por unanimidad. Nadie quiso discutir con una westie tan decidida.",
    },
    ad_satellite_1: {
      name: "Proyector de Alta Definición",
      flavor: "El logo se ve desde todo el hemisferio. Con cada pelo en su lugar.",
    },
    ad_satellite_2: {
      name: "Constelación Pandora",
      flavor: "Veinte satélites dibujan su perfil en el cielo. Muy humilde, dice ella.",
    },
    mars_colony_1: {
      name: "Invernadero Marciano",
      flavor: "Zanahorias marcianas: rojas por fuera, rojas por dentro, rentables siempre.",
    },
    mars_colony_2: {
      name: "Paseo Interplanetario",
      flavor: "La jefa exige su paseo diario, también en Marte. El casco tiene huecos para orejas.",
    },
    click_1: {
      name: "Pata Firme",
      flavor: "Un clic con convicción vale por dos.",
    },
    click_2: {
      name: "Guantes de Ejecutiva",
      flavor: "Suaves, blancos y carísimos. Como el pelaje de la jefa.",
    },
    click_3: {
      name: "Sello Presidencial",
      flavor: "Cada clic es ahora un decreto oficial.",
    },
    click_4: {
      name: "Clic Sinérgico",
      flavor: "Cada clic aprovecha la fuerza de toda la empresa. Nadie sabe cómo, pero funciona.",
    },
  },

  expansions: {
    buy_factory: {
      name: "Comprar la Fábrica",
      flavor: "La cocina se quedó pequeña. Como el plato de comida: siempre.",
    },
    go_public: {
      name: "Salir a Bolsa",
      flavor: "Acciones de la empresa para todo el mundo. Símbolo en bolsa: GUAU.",
    },
  },

  inversionista: {
    frenzy: {
      // `amount` is the formatted production multiplier.
      toast: (amount) => `¡Ronda de Financiación! Producción ×${amount}`,
      headlines: [
        "Inversionista misterioso apuesta todo por la croqueta vegana; la producción se dispara",
        "Ronda de financiación cerrada: Pandora lo celebra persiguiendo su propia cola",
        "Llega capital de riesgo a Las Cajas de Pandora; los becarios reciben galletas extra",
      ],
    },
    lump: {
      toast: (amount) => `¡Cheque Gordo! +${amount} croquetas`,
      headlines: [
        "Inversionista entrega un cheque gordo; la jefa lo olfatea y lo aprueba",
        "Cheque gigante llega a la oficina; Pandora intenta enterrarlo en el jardín",
        "Aporte sorpresa engorda la bóveda de croquetas de Las Cajas de Pandora",
      ],
    },
  },

  offlineLines: [
    "Mientras no estabas, yo lideraba. Bueno, también dormía, pero con liderazgo.",
    "La empresa no se detiene. Solo para comer. Y para ladrarle al cartero.",
    "Notamos tu ausencia. Los becarios siguieron produciendo, por supuesto.",
    "Volviste. Excelente. Las croquetas no se cuentan solas.",
  ],

  ui: {
    title: "Las Cajas de Pandora",
    croquetasUnit: "croquetas",
    perSecond: (cps) => `por segundo: ${cps}`,
    store: "Tienda",
    upgradesHeading: "Mejoras",
    expansionHeading: "Expansión",
    owned: (n) => `x${n}`,
    cost: (amount) => `Costo: ${amount}`,
    producerCps: (cps) => `Produce ${cps} por segundo`,
    upgradeEffectProducer: (producerName) => `Duplica la producción de ${producerName}`,
    upgradeEffectClick: "Duplica las croquetas por clic",
    upgradeEffectClickCps: "+1 % de tu producción por segundo en cada clic",
    buy: "Comprar",
    close: "Cerrar",
    frenzyIndicator: (seconds) => `¡Ronda de Financiación! ×${FRENZY_MULTIPLIER} — ${seconds} s`,
    inversionistaAria: "Inversionista: haz clic para recibir su inversión",
    pandoraAria: "Pandora, la jefa: haz clic para producir croquetas",
    musicOn: "Música: activada",
    musicOff: "Música: silenciada",
    sfxOn: "Sonidos: activados",
    sfxOff: "Sonidos: silenciados",
    reset: "Borrar partida",
    resetConfirmTitle: "¿Borrar la partida?",
    resetConfirmBody:
      "Perderás todas tus croquetas, tus compras y la dignidad corporativa acumulada. Esta acción no se puede deshacer.",
    resetConfirmYes: "Sí, borrar todo",
    resetConfirmNo: "Cancelar",
    offlineTitle: "Mientras no estabas…",
    offlineBody: (elapsed, gain) =>
      `Estuviste fuera ${elapsed}. La empresa produjo ${gain} croquetas.`,
    offlineDismiss: "Recoger croquetas",
    duration,
    memoHeader: "MEMORANDO",
    memoFrom: "De: Pandora, Presidenta y Directora General",
    memoTo: "Para: Todo el personal",
  },
};
