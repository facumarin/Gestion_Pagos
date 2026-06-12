// src/reloj.js
export function iniciarRelojLocal() {
  const elFecha = document.getElementById('txt-fecha');
  const elHora = document.getElementById('txt-hora');

  // Si por algún motivo los elementos no existen en el HTML, frenamos para evitar errores
  if (!elFecha || !elHora) return;

  setInterval(() => {
    const ahora = new Date();
    
    // Fecha en español legible: ej. jueves, 4 de junio de 2026
    const opcionesFecha = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const txtFecha = ahora.toLocaleDateString('es-ES', opcionesFecha);
    
    // Hora corriente militar (14:05:02)
    const txtHora = ahora.toLocaleTimeString('es-ES', { hour12: false });
    
    // Inyectamos el texto de forma directa y aislada
    elFecha.innerText = txtFecha;
    elHora.innerText = txtHora;
  }, 1000);
}
