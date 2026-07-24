/**
 * Componente Autónomo de Barra Lateral (Sidebar)
 * Procesa y renderiza la configuración inyectada dinámicamente.
 */
const SidebarController = {
    /**
     * Inicializa el componente leyendo la configuración global
     */
    init: function() {
        const config = window.AppConfig;
        if (!config) {
            console.error("[SidebarController] Error: window.AppConfig no definida.");
            return;
        }
        // Corrección de llaves: estas ejecuciones deben ocurrir dentro de init
        this.renderMarcaBlanca(config);
        this.renderNavegacion(config);
    },

    /**
     * Sincroniza la identidad visual en móvil y escritorio
     */
    renderMarcaBlanca: function(config) {
        this._setAtributo('app-nombre-entidad', 'textContent', config.nombre);
        this._setAtributo('app-nombre-entidad-movil', 'textContent', config.nombre);
        this._setAtributo('app-subtitulo-entidad', 'textContent', config.subtitulo);
        this._setAtributo('app-escudo-img', 'src', config.escudoUrl);
        this._setAtributo('app-escudo-img-movil', 'src', config.escudoUrl);
        this._setAtributo('app-version-footer', 'textContent', config.version || "v1.0.0");
    },

    /**
     * Filtra y dibuja los módulos activos basados en config.js
     */
    renderNavegacion: function(config) {
        const contenedor = document.getElementById('modulos-navegacion');
        if (!contenedor || !config.modulos) return;

        // Filtrado dinámico por la propiedad 'activo' de tu configuración
        const modulosVisibles = config.modulos.filter(mod => mod.activo === true);

        contenedor.innerHTML = modulosVisibles.map(mod => {
            // Polimorfismo de términos de negocio (Socios, Afiliados, etc.)
            const textoFinal = (mod.usaTerminoPlural && config.terminos?.plural) 
                ? config.terminos.plural 
                : mod.texto;

            const spanIdAttr = mod.usaTerminoPlural ? 'id="menu-txt-plural"' : '';

            return `
                <a href="#" onclick="SidebarController.ejecutarNavegacion('${mod.id}')" 
                   class="flex items-center gap-3 py-2 px-4 hover:bg-slate-800 rounded-md font-medium text-gray-200 transition group text-sm">
                    <i class="${mod.icono} w-5 text-center ${mod.color} group-hover:scale-110 transition-transform"></i>
                    <span ${spanIdAttr}>${textoFinal}</span>
                </a>
            `;
        }).join('');
    },

    /**
     * Controla el colapso del menú en celulares (Hamburguesa)
     */
    toggle: function() {
        const sidebar = document.getElementById('sidebar-container');
        const icono = document.getElementById('btn-hamburguesa-icono');
        if (!sidebar || !icono) return;
        
        if (sidebar.classList.contains('hidden')) {
            sidebar.classList.remove('hidden');
            sidebar.classList.add('flex');
            icono.className = "fas fa-times"; 
        } else {
            sidebar.classList.remove('flex');
            sidebar.classList.add('hidden');
            icono.className = "fas fa-bars";  
        }
    },

    /**
     * Ejecuta la navegación y gestiona el cierre en pantallas móviles
     */
    ejecutarNavegacion: function(destinoId) {
        if (window.innerWidth < 768) { 
            this.toggle(); 
        }
        if (typeof navegarA === 'function') {
            navegarA(destinoId);
        }
    },

    // Helper utilitario interno para manipulación del DOM
    _setAtributo: function(id, propiedad, valor) {
        const elemento = document.getElementById(id);
        if (elemento) elemento[propiedad] = valor;
    }
}; // <- Aquí se cierra correctamente el objeto

// Inicialización automática cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    SidebarController.init();
});
