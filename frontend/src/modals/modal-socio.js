// frontend/src/modals/modal-socio.js (Sincronizado Comercial Definitivo)
import { API_URL } from '../config-api.js';
import { poblarSelectorMeses } from '../fechas.js';

export function configurarModalSocio(obtenerSociosFn, recargarDashboardFn) {
  const form = document.getElementById('form-nuevo-socio');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const tipoRegla = document.getElementById('form-alta-tipo-regla').value;
    const condicionAlta = document.getElementById('form-alta-condicion').value;
    const hoy = new Date();
    const anioActual = hoy.getFullYear(); 
    
    let mesSeleccionado = hoy.getMonth() + 1;
    let medioSeleccionado = null;
    let registraPagoInicial = false;
    let fechaFinalTexto = null; 

    if (condicionAlta === 'pago') {
      registraPagoInicial = true;
      mesSeleccionado = parseInt(document.getElementById('form-alta-periodo').value, 10);
      medioSeleccionado = document.getElementById('form-alta-medio').value;
      
      if (tipoRegla === 'calendario') {
        const proximoMes = new Date(anioActual, mesSeleccionado, 10);
        fechaFinalTexto = proximoMes.toISOString().split('T')[0];
      } else {
        hoy.setMonth(hoy.getMonth() + 1);
        fechaFinalTexto = hoy.toISOString().split('T')[0];
      }
    } else if (condicionAlta === 'prueba') {
      const proximoMesPrueba = new Date(anioActual, hoy.getMonth() + 1, 10);
      fechaFinalTexto = proximoMesPrueba.toISOString().split('T')[0];
    } else {
      // 🎯 TU REGLA DE ORO: Si ingresa con Deuda Pendiente, viaja estrictamente vacía (NULL)
      fechaFinalTexto = null;
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

      window.cerrarModalSocio();
      document.getElementById('lbl-exito-nombre').innerText = `${data.nombre} ${data.apellido || ''}`.trim();
      document.getElementById('lbl-exito-dni').innerText = data.dni;
      document.getElementById('lbl-exito-plan').innerText = data.tipo;
      document.getElementById('modal-exito-socio').classList.remove('hidden');
      await recargarDashboardFn();
    } catch (error) {
      alert(`⚠️ Error: ${error.message}`);
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
