// ==========================================
// ⚙️ CONFIGURACIÓN DINÁMICA DE LA INSTITUCIÓN (MARCA BLANCA)
// ==========================================

// frontend/config.js
const CONFIG_INSTITUCION = {
  nombre: "Villa Ansaldi",
  subtitulo: "Club Atlético",
  
  escudoUrl: "ClubVA.png", // Ruta absoluta al escudo del club o la institución (puede ser local o URL externa)
  
  emojiDefecto: "⚽",
  terminos: {
    singular: "Socio", 
    plural: "Socios", 
    nuevoEntidad: "Nuevo Socio",
    padronEntidad: "Padrón de Socios",
    gestionEntidad: "Gestión de Socios",
    cuotaConcepto: "Cuota Social",
    // 🔌 SOLUCIÓN: Definimos cuál es el texto exacto que representa al jefe de cuenta
    rolPrincipal: "Titular" // Si mañana cambia a "Afiliado Principal", solo se edita acá
  },

  // 🎛️ Interruptores de Módulos Activos (SaaS Multirubro)
  modulosActivos: {
    caja: true,        // true = Visible / false = Oculto
    calendario: true,
    recargosMora: true,
    whatsapp: true,
    eventos: true,
    perfiles: false,     // Módulo de gestión de perfiles de usuario (Administradores, Cobradores, etc.)
  },

    // 📋 Lista de Planes / Servicios oficiales de la institución
  planesDisponibles: ["Individual", "Titular", "Adherente", "Fútbol Infantil", "Gimnasio"],

  montoBaseDefault: 5000.00,
  // 📋 Períodos habilitados para cobros y altas adelantadas (SaaS Marca Blanca)
  mesesComerciales: [
    { numero: 6, nombre: "Junio" },
    { numero: 7, nombre: "Julio" },
    { numero: 8, nombre: "Agosto" },
    { numero: 9, nombre: "Septiembre" },
    { numero: 10, nombre: "Octubre" },
    { numero: 11, nombre: "Noviembre" },
    { numero: 12, nombre: "Diciembre" }
  ]
};

window.AppConfig = CONFIG_INSTITUCION;
