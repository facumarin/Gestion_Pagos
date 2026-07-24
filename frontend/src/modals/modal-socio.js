// frontend/src/modals/modal-socio.js
import { API_URL } from '../config-api.js';
import { poblarSelectorMeses } from '../fechas.js';
import { guardarComprobante, mostrarModalComprobante} from '../comprobantes.js';

export function configurarModalSocio(obtenerSociosFn, recargarDashboardFn) {
  const form = document.getElementById('form-nuevo-socio');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
const submitBtn =  form.querySelector('button[type="submit"]' );

if (submitBtn) {submitBtn.disabled = true;}

        const tipoRegla = document.getElementById('form-alta-tipo-regla').value;
    const condicionAlta = document.getElementById('form-alta-condicion').value;
    
    const hoy = new Date();
    const anioActual = hoy.getFullYear();
    const mesActualJS = hoy.getMonth(); 
    
    let mesSeleccionado = mesActualJS + 1; // 1 - 12 para el backend
    let medioSeleccionado = null;
    let registraPagoInicial = false;
    let fechaFinalTexto = null; 

    // Función segura para formatear YYYY-MM-DD sin desvíos por zona horaria (UTC)
    const formatearFechaLocal = (fechaObj) => {
      const yyyy = fechaObj.getFullYear();
      const mm = String(fechaObj.getMonth() + 1).padStart(2, '0');
      const dd = String(fechaObj.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    if (condicionAlta === 'pago') {
      registraPagoInicial = true;
      mesSeleccionado = parseInt(document.getElementById('form-alta-periodo').value, 10); // Ej: 7 para Julio
      medioSeleccionado = document.getElementById('form-alta-medio').value;
      
      if (tipoRegla === 'calendario') {
            fechaFinalTexto = formatearFechaLocal(new Date(anioActual, mesSeleccionado, 10));
      } else {
        // Aniversario con pago: suma exactamente 1 mes a la fecha de hoy de forma segura
        const fechaVencimiento = new Date(hoy.getFullYear(), mesActualJS + 1, hoy.getDate());
        fechaFinalTexto = formatearFechaLocal(fechaVencimiento);
      }

    } else if (condicionAlta === 'prueba') {
      // Regla de prueba estándar: vence el día 10 del mes siguiente
      fechaFinalTexto = formatearFechaLocal(new Date(anioActual, mesActualJS + 1, 10));

    } else { // 🟡 Ingresa con deuda
      if (tipoRegla === 'calendario') {
        // Vence el día 10 del mes actual en curso
        fechaFinalTexto = formatearFechaLocal(new Date(anioActual, mesActualJS, 10));
      } else {
        // Aniversario con deuda: tiene exactamente 7 días corridos de gracia
      const fechaGracia = new Date(hoy);fechaGracia.setDate(fechaGracia.getDate() + 7);
        fechaFinalTexto = formatearFechaLocal(fechaGracia);
      }
    }


    const nuevoSocio = {
      nombre: document.getElementById('form-nombre').value.trim(),
      apellido: document.getElementById('form-apellido').value.trim(),
      dni: document.getElementById('form-dni').value.trim(),
      telefono: document.getElementById('form-telefono').value.trim(),
      email: document.getElementById('form-email').value.trim(),
      direccion: document.getElementById('form-direccion').value.trim() || null,
      actividad: document.getElementById('form-actividad').value.trim(),
      categoria: document.getElementById('form-categoria').value.trim(), 
      fechaNacimiento: document.getElementById('form-nacimiento').value || null,
      fecha_nacimiento: document.getElementById('form-nacimiento').value || null,
      tipo: document.getElementById('form-tipo').value,
      id_titular: document.getElementById('form-id-titular')?.value || null,
      idTitular: document.getElementById('form-id-titular')?.value || null,
      montoCuota: parseFloat(
  document.getElementById('form-monto').value
) || 0,
      
      fechaVencimiento: fechaFinalTexto,
      fecha_vencimiento: fechaFinalTexto,
      registraPagoInicial: registraPagoInicial,
      altaMesContable: mesSeleccionado,
      altaMedioPago: medioSeleccionado,
      condicionIngreso: condicionAlta,
      notas: document.getElementById('form-notas').value.trim() || null
    };

    try {

  const res = await fetch(`${API_URL}/socios`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(nuevoSocio)
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Error al guardar.');
  }
if (data.pagoInicial) {

  guardarComprobante({
    numeroRecibo: data.numeroRecibo,
    periodo: `${data.mesLiquidado} ${data.anioLiquidado}`,
    nombreCompleto: `${data.nombre} ${data.apellido || ''}`,
    dni: data.dni,
    tipo: data.tipo,
    medio: data.formaPago,
    monto: data.montoAbonado
  });

}
      window.cerrarModalSocio();
      document.getElementById('lbl-exito-nombre').innerText = `${data.nombre} ${data.apellido || ''}`.trim();
      document.getElementById('lbl-exito-dni').innerText = data.dni;
      document.getElementById('lbl-exito-plan').innerText = data.tipo;
    
if (data.pagoInicial) {
document.getElementById(
  'lbl-pagoexito-nombre'
).innerText =
  `${data.nombre} ${data.apellido || ''}`;

document.getElementById(
  'lbl-pagoexito-monto'
).innerText =
  `$${Number(
    data.montoAbonado || 0
  ).toLocaleString('es-AR', {
    minimumFractionDigits: 2
  })}`;

document.getElementById(
  'lbl-pagoexito-tipo'
).innerHTML =
  `Pago Inicial<br>
   <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">
     Período: ${data.mesLiquidado} ${data.anioLiquidado}
   </span>`;
  mostrarModalComprobante();

} else {

  document
    .getElementById('modal-exito-socio')
    .classList.remove('hidden');

}

      await recargarDashboardFn();
     } catch (error) {
  alert(`⚠️ Error: ${error.message}`);
} finally {

  if (submitBtn) {
    submitBtn.disabled = false;
  }

}
  });
}

window.abrirModalSocio = function() {
  const selectTipo = document.getElementById('form-tipo');
  if (selectTipo && window.AppConfig) {
    selectTipo.innerHTML = window.AppConfig.planesDisponibles.map(p => 
      `<option value="${p}">${p}</option>`
    ).join('');
    document.getElementById('form-monto').value =  window.AppConfig.montoBaseDefault;
  }

  const selectRegla = document.getElementById('form-alta-tipo-regla');
  if (selectRegla) selectRegla.value = 'calendario';

  const selectCondicion = document.getElementById('form-alta-condicion');
  if (selectCondicion) selectCondicion.value = 'deuda';

  const contenedorComercial = document.getElementById('contenedor-comercial-alta');
  if (contenedorComercial) contenedorComercial.classList.add('hidden');

  document.getElementById('modal-socio').classList.remove('hidden');
}

window.cerrarModalSocio = function() {
  document.getElementById('modal-socio').classList.add('hidden');
  document.getElementById('form-nuevo-socio').reset();
  document.getElementById('contenedor-titular-alta').classList.add('hidden');
}

window.cerrarModalExitoSocio = function() {
  document.getElementById('modal-exito-socio').classList.add('hidden');
}

window.evaluarExcepcionesFormularioAlta = function(tipoRegla) {
  const opcionCortesia = document.getElementById('opt-alta-cortesia');
  const selectorCondicion = document.getElementById('form-alta-condicion');
  
  if (!opcionCortesia || !selectorCondicion) return;

  if (tipoRegla === 'aniversario') {
    opcionCortesia.style.display = 'none';
    if (selectorCondicion.value === 'prueba') {
      selectorCondicion.value = 'deuda';
      window.evaluarCamposComercialesAlta('deuda');
    }
  } else {
    opcionCortesia.style.display = 'block';
  }
}

window.evaluarCamposComercialesAlta = function(condicionSeleccionada) {
  const contenedorComercial = document.getElementById('contenedor-comercial-alta');
  if (!contenedorComercial) return;

 if (condicionSeleccionada === 'pago') {
  contenedorComercial.classList.remove('hidden');
  poblarSelectorMeses('form-alta-periodo');
} else {
  contenedorComercial.classList.add('hidden');
}
}

window.verificarSiEsAdherenteAlta = async function() {
  const selectTipo = document.getElementById('form-tipo');
  if (!selectTipo) return;
  const tipoSeleccionado = selectTipo.value;
  const rolPrincipalConfig = window.AppConfig?.terminos?.rolPrincipal || 'Titular';

  if (tipoSeleccionado.toLowerCase().includes('adherente')) {
    try {
      const res = await fetch(`${API_URL}/dashboard`);
      const datos = await res.json();
      const titulares = datos.socios.filter(s => s.tipo === rolPrincipalConfig);
      const selectTitular = document.getElementById('form-id-titular');
      if (titulares.length === 0) {
        selectTitular.innerHTML = `<option value="">⚠️ No hay ${rolPrincipalConfig}es registrados</option>`;
      } else {
        selectTitular.innerHTML = titulares.map(t => 
          `<option value="${t.id}">${t.nombre} ${t.apellido || ''}</option>`
        ).join('');
      }
      document.getElementById('contenedor-titular-alta').classList.remove('hidden');
    } catch (e) { 
      console.error("Error al cargar titulares por red:", e); 
    }
  } else {
    document.getElementById('contenedor-titular-alta').classList.add('hidden');
  }
}
