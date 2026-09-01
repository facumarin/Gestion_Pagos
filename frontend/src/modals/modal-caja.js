import {
  obtenerCategoriasCaja,
  obtenerMediosPagoCaja,
  registrarMovimientoCaja,
  subirComprobanteCaja,
  actualizarMovimientoCaja
} from '../api-caja.js';

let procesandoMovimientoCaja = false;
window.tipoMovimientoCaja = null;
window.idMovimientoEdicion = null; 
window.comprobanteActualEdicion = null; 

window.abrirModalMovimientoCaja = async function(tipo, movimientoParaEditar = null) {
  window.tipoMovimientoCaja = tipo;

  const titulo = document.getElementById('txt-modal-caja-titulo');
  const btnGuardar = document.getElementById('btn-guardar-movimiento-caja');
  const inputFecha = document.getElementById('caja-fecha');

  // 1. ASIGNAR FECHA DE HOY POR DEFECTO DEL APARATO (Formato YYYY-MM-DD)
  if (inputFecha) {
    const hoy = new Date();
    const tzOffset = hoy.getTimezoneOffset() * 60000;
    inputFecha.value = (new Date(hoy - tzOffset)).toISOString().slice(0, 10);
  }

  if (titulo) {
    if (movimientoParaEditar) {
      window.idMovimientoEdicion = movimientoParaEditar.id;
      window.comprobanteActualEdicion = movimientoParaEditar.comprobanteUrl;
      titulo.innerText = tipo === 'Ingreso' ? '📝 Editar Ingreso' : '📝 Editar Egreso';
    } else {
      window.idMovimientoEdicion = null;
      window.comprobanteActualEdicion = null;
      titulo.innerText = tipo === 'Ingreso' ? '🟢 Registrar Ingreso' : '🔴 Registrar Egreso';
    }
  }

  if (btnGuardar) {
    btnGuardar.innerText = window.idMovimientoEdicion ? 'Actualizar Movimiento' : 'Guardar Movimiento';
  }

  const categorias = await obtenerCategoriasCaja();
  const medios = await obtenerMediosPagoCaja();
  const selectCategorias = document.getElementById('caja-categoria');
  const selectMedios = document.getElementById('caja-medio-pago');

  if (selectCategorias) {
    const categoriasFiltradas = categorias.filter(c => c.tipo === tipo);
    selectCategorias.innerHTML = categoriasFiltradas
      .map(c => `<option value="${c.id}">${c.nombre}</option>`)
      .join('');
  }

  if (selectMedios) {
    selectMedios.innerHTML = medios
      .map(m => `<option value="${m.nombre}">${m.emoji || ''} ${m.nombre}</option>`)
      .join('');
  }

  if (movimientoParaEditar) {
    if (selectCategorias && movimientoParaEditar.idCategoria) selectCategorias.value = movimientoParaEditar.idCategoria;
    if (selectMedios && movimientoParaEditar.medioPago) selectMedios.value = movimientoParaEditar.medioPago;

    document.getElementById('caja-concepto').value = movimientoParaEditar.concepto || '';
    document.getElementById('caja-monto').value = movimientoParaEditar.monto || '';
    
    // Inyectar fecha de la BD recortando a formato estándar
    if (inputFecha && movimientoParaEditar.fechaOriginal) {
      inputFecha.value = movimientoParaEditar.fechaOriginal.substring(0, 10);
    }

    const notasInput = document.getElementById('caja-notas');
    if (notasInput) notasInput.value = movimientoParaEditar.notas || '';

    const preview = document.getElementById('txt-comprobante-preview');
    if (preview && movimientoParaEditar.comprobanteUrl) {
      preview.innerHTML = `📂 <span class="font-semibold text-emerald-600">Tiene comprobante adjunto. Click para cambiarlo</span>`;
    }
  }

  document.getElementById('modal-caja')?.classList.remove('hidden');
};

window.cerrarModalCaja = function() {
  document.getElementById('modal-caja')?.classList.add('hidden');
  document.getElementById('form-caja')?.reset();
  
  window.idMovimientoEdicion = null;
  window.comprobanteActualEdicion = null;

  const preview = document.getElementById('txt-comprobante-preview');
  if (preview) {
    preview.innerHTML = `<span class="font-semibold text-blue-600">Haz clic para subir</span> o arrastra un archivo`;
  }
};

document.getElementById('form-caja')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  if (procesandoMovimientoCaja) return;

  procesandoMovimientoCaja = true;
  const btn = document.getElementById('btn-guardar-movimiento-caja');

  if (btn) {
    btn.disabled = true;
    btn.innerText = window.idMovimientoEdicion ? 'Actualizando...' : 'Guardando...';
  }

  try {
    let comprobanteUrl = window.comprobanteActualEdicion;
    let archivoNombre = null;

    const archivo = document.getElementById('caja-comprobante')?.files?.[0];

    if (archivo) {
      const subida = await subirComprobanteCaja(archivo, window.tipoMovimientoCaja);
      comprobanteUrl = subida.url;
      archivoNombre = subida.nombreArchivo;
    }

    // 2. TOMAR LA HORA DIRECTA DE LA COMPU O CELULAR (Formato local seguro)
    const fechaCalendario = document.getElementById('caja-fecha').value; // "YYYY-MM-DD"
    const horaDispositivo = new Date().toLocaleTimeString('es-AR', { hour12: false }); // "HH:MM:SS"
    
    // Concatenamos el día del input con el reloj real del aparato en un ISO plano local
    const fechaFinalISO = `${fechaCalendario}T${horaDispositivo}`;

    const datosMovimiento = {
      idCategoria: document.getElementById('caja-categoria').value,
      concepto: document.getElementById('caja-concepto').value,
      monto: parseFloat(document.getElementById('caja-monto').value),
      medioPago: document.getElementById('caja-medio-pago').value,
      notas: document.getElementById('caja-notas').value,
      fecha: fechaFinalISO, // ✅ Mapeado a la hora del sistema local
      comprobanteUrl,
      archivoNombre
    };

    if (window.idMovimientoEdicion) {
      await actualizarMovimientoCaja(window.idMovimientoEdicion, datosMovimiento);
      alert('✅ Movimiento actualizado con éxito.');
    } else {
      await registrarMovimientoCaja(datosMovimiento);
      alert('✅ Movimiento registrado.');
    }

    cerrarModalCaja();
    await window.cargarMovimientosCaja();

  } catch (error) {
    alert(error.message);
  } finally {
    procesandoMovimientoCaja = false;
    if (btn) {
      btn.disabled = false;
      btn.innerText = window.idMovimientoEdicion ? 'Actualizar Movimiento' : 'Guardar Movimiento';
    }
  }
});

window.actualizarTextoComprobante = function(input) {
  const preview = document.getElementById('txt-comprobante-preview');
  if (!preview) return;

  const archivo = input.files?.[0];
  if (!archivo) return;

  preview.innerHTML = `✅ <span class="font-semibold text-emerald-600">${archivo.name}</span>`;
};
