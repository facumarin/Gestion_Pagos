import { registrarPagoCuota } from '../api.js';
import { MESES } from '../fechas.js';

let socioSeleccionadoId = '';

export function configurarModalPago(actualizarPantallaCallback) {
  
  // A. Función global que se activa al hacer clic en "💵 Pagar" en la tabla
  window.procesarPago = function(idSocio, nombreSocio) {
    socioSeleccionadoId = idSocio;

    const hoy = new Date();
const mesNombreActual = MESES[hoy.getMonth()];
    const anioActual = hoy.getFullYear();

    // Rellenamos las etiquetas dinámicas del modal
    const lblSocio = document.getElementById('lbl-pago-socio');
    const lblMes = document.getElementById('lbl-pago-mes');
    
    if (lblSocio) lblSocio.innerText = nombreSocio;
    if (lblMes) lblMes.innerText = `${mesNombreActual} ${anioActual}`;

    // Quitamos 'hidden' para desplegar la ventana flotante
    const elModal = document.getElementById('modal-pago');
    if (elModal) elModal.classList.remove('hidden');
  };

  // B. Función global para cerrar la ventana
  window.cerrarModalPago = function() {
    const elModal = document.getElementById('modal-pago');
    if (elModal) elModal.classList.add('hidden');
    socioSeleccionadoId = '';
  };

  // C. Función global que se ejecuta al darle al botón verde "Confirmar"
 window.confirmarPagoProcesado = async function() {
  if (!socioSeleccionadoId) return;

  const hoy = new Date();
  const mesActual = hoy.getMonth() + 1;
  const anioActual = hoy.getFullYear();

  try {
    await registrarPagoCuota(socioSeleccionadoId, mesActual, anioActual);
    window.cerrarModalPago();
    if (actualizarPantallaCallback) await actualizarPantallaCallback();
  } catch (error) {
    alert(`❌ Error al procesar pago: ${error.message}`);
    window.cerrarModalPago();
  }
};
}
