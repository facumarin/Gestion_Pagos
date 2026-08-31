import {
  obtenerCategoriasCaja,
  obtenerMediosPagoCaja,
  registrarMovimientoCaja,
  subirComprobanteCaja,
  actualizarMovimientoCaja // ✅ Inyección de la nueva dependencia
} from '../api-caja.js';

let procesandoMovimientoCaja = false;
window.tipoMovimientoCaja = null;
window.idMovimientoEdicion = null;        // Estructura de estado: Almacena el ID activo en edición
window.comprobanteActualEdicion = null;   // Estructura de estado: Almacena el documento activo en edición

window.abrirModalMovimientoCaja = async function(tipo, movimientoParaEditar = null) {
  window.tipoMovimientoCaja = tipo;

  const titulo = document.getElementById('txt-modal-caja-titulo');
  const btnGuardar = document.getElementById('btn-guardar-movimiento-caja');

  // 1. Gestión del Estado UI/UX según intencionalidad
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

  // 2. Carga asíncrona en paralelo de diccionarios/catálogos para optimizar el rendimiento (UX Speed)
  const [categorias, medios] = await Promise.all([
    obtenerCategoriasCaja(),
    obtenerMediosPagoCaja()
  ]);

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

  // 3. Hidratación segura del Formulario (Sincronizada post-render de catálogos)
  if (movimientoParaEditar) {
    if (selectCategorias && movimientoParaEditar.idCategoria) selectCategorias.value = movimientoParaEditar.idCategoria;
    if (selectMedios && movimientoParaEditar.medioPago) selectMedios.value = movimientoParaEditar.medioPago;

    document.getElementById('caja-concepto').value = movimientoParaEditar.concepto || '';
    document.getElementById('caja-monto').value = movimientoParaEditar.monto || '';
    
    const notasInput = document.getElementById('caja-notas');
    if (notasInput) notasInput.value = movimientoParaEditar.notas || '';

    // Feedback visual del estado del documento adjunto (UX Claridad)
    const preview = document.getElementById('txt-comprobante-preview');
    if (preview && movimientoParaEditar.comprobanteUrl) {
      preview.innerHTML = `📂 <span class="font-semibold text-emerald-600">Tiene comprobante adjunto. Haz clic para cambiarlo</span>`;
    }
  }

  document.getElementById('modal-caja')?.classList.remove('hidden');
};

window.cerrarModalCaja = function() {
  document.getElementById('modal-caja')?.classList.add('hidden');
  document.getElementById('form-caja')?.reset();
  
  // Limpieza del estado de la memoria volatil
  window.idMovimientoEdicion = null;
  window.comprobanteActualEdicion = null;

  const preview = document.getElementById('txt-comprobante-preview');
  if (preview) {
    preview.innerHTML = `<span class="font-semibold text-blue-600">Haz clic para subir</span> o arrastra un archivo`;
  }
};

document.getElementById('form-caja')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  if (procesandoMovimientoCaja) return; // Patrón de salvaguarda: Evita llamadas duplicadas (Debounce)

  procesandoMovimientoCaja = true;
  const btn = document.getElementById('btn-guardar-movimiento-caja');

  if (btn) {
    btn.disabled = true;
    btn.innerText = window.idMovimientoEdicion ? 'Actualizando...' : 'Guardando...';
  }

  try {
    // Si estamos editando y no se selecciona un archivo nuevo, preservamos el archivo original
    let comprobanteUrl = window.comprobanteActualEdicion;
    let archivoNombre = null;

    const archivo = document.getElementById('caja-comprobante')?.files?.[0];

    // Carga diferida o actualización del archivo binario
    if (archivo) {
      const subida = await subirComprobanteCaja(archivo, window.tipoMovimientoCaja);
      comprobanteUrl = subida.url;
      archivoNombre = subida.nombreArchivo;
    }

    const datosMovimiento = {
      idCategoria: document.getElementById('caja-categoria').value,
      concepto: document.getElementById('caja-concepto').value,
      monto: parseFloat(document.getElementById('caja-monto').value),
      medioPago: document.getElementById('caja-medio-pago').value,
      notas: document.getElementById('caja-notas').value,
      comprobanteUrl,
      archivoNombre
    };

    // Orquestación de la petición según la naturaleza de la acción (Estrategia Polimórfica)
    if (window.idMovimientoEdicion) {
      await actualizarMovimientoCaja(window.idMovimientoEdicion, datosMovimiento);
      alert('✅ Movimiento actualizado con éxito.');
    } else {
      await registrarMovimientoCaja(datosMovimiento);
      alert('✅ Movimiento registrado.');
    }

    cerrarModalCaja();
    await window.cargarMovimientosCaja(); // Actualización reactiva de la grilla principal

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
