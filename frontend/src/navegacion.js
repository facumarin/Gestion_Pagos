// src/navegacion.js

export function configurarNavegacion() {
  // 1. Mapeamos las secciones del HTML con sus títulos y subtítulos correlativos
  const vistas = {
    'dashboard': { id: 'vista-dashboard', titulo: 'Panel de Control', sub: 'Estado de socios y recaudación en tiempo real.' },
    'socios': { id: 'vista-socios', titulo: 'Gestión de Socios', sub: 'Padrón de miembros activos, de altas y bajas.' },
    'cuotas': { id: 'vista-cuotas', titulo: 'Caja y Contabilidad', sub: 'Historial de recaudación y reportes de cuotas.' }
  };

  // 2. Definimos la función ruteadora interna
  function navegarA(pantallaDestino) {
    // Ocultamos todas las vistas agregando la clase 'hidden'
    Object.values(vistas).forEach(vista => {
      const el = document.getElementById(vista.id);
      if (el) el.classList.add('hidden');
    });

    // Mostramos la pantalla seleccionada quitando 'hidden'
    const vistaActiva = vistas[pantallaDestino];
    if (vistaActiva) {
      const elVista = document.getElementById(vistaActiva.id);
      const elTitulo = document.getElementById('titulo-pantalla');
      const elSubtitulo = document.getElementById('subtitulo-pantalla');

      if (elVista) elVista.classList.remove('hidden');
      if (elTitulo) elTitulo.innerText = vistaActiva.titulo;
      if (elSubtitulo) elSubtitulo.innerText = vistaActiva.sub;
    }
  }

  // 3. Exponemos la función al objeto global
  window.navegarA = navegarA;
}
