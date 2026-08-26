import {
  obtenerCategoriasCaja,
  obtenerMediosPagoCaja,
  registrarMovimientoCaja,
  subirComprobanteCaja
} from '../api-caja.js';

let procesandoMovimientoCaja = false;
window.tipoMovimientoCaja = null;
//console.log('🔥 MODAL CAJA CARGADO 🔥');
window.abrirModalMovimientoCaja =
async function(tipo)  {

  window.tipoMovimientoCaja =
    tipo;

  const titulo =
    document.getElementById(
      'txt-modal-caja-titulo'
    );

  if (titulo) {

    titulo.innerText =
      tipo === 'Ingreso'
        ? '🟢 Registrar Ingreso'
        : '🔴 Registrar Egreso';

  }

  const categorias =
  await obtenerCategoriasCaja();

const medios =
  await obtenerMediosPagoCaja();

const selectCategorias =
  document.getElementById(
    'caja-categoria'
  );

const selectMedios =
  document.getElementById(
    'caja-medio-pago'
  );

if (selectCategorias) {

  const categoriasFiltradas =
    categorias.filter(
      c => c.tipo === tipo
    );

  selectCategorias.innerHTML =
    categoriasFiltradas
      .map(c => `
        <option value="${c.id}">
          ${c.nombre}
        </option>
      `)
      .join('');

}

if (selectMedios) {

  selectMedios.innerHTML =
    medios
      .map(m => `
        <option value="${m.nombre}">
          ${m.emoji || ''}
          ${m.nombre}
        </option>
      `)
      .join('');

}

  document
    .getElementById('modal-caja')
    ?.classList.remove('hidden');

};

window.cerrarModalCaja =
function() {

  document
    .getElementById('modal-caja')
    ?.classList.add('hidden');
document
  .getElementById('form-caja')
  ?.reset();

const preview =
  document.getElementById(
    'txt-comprobante-preview'
  );

if (preview) {

  preview.innerHTML =
    `<span class="font-semibold text-blue-600">
      Haz clic para subir
    </span>
    o arrastra un archivo`;

}
};

document
  .getElementById('form-caja')
  ?.addEventListener(
    'submit',
   async function(e) {
//console.log('ENTRO AL SUBMIT');
  e.preventDefault();

  if (procesandoMovimientoCaja) return;

  procesandoMovimientoCaja = true;

  const btn =
    document.getElementById(
      'btn-guardar-movimiento-caja'
    );

  if (btn) {

    btn.disabled = true;

    btn.innerText =
      'Guardando...';

  }

      try {

        let comprobanteUrl = null;
let archivoNombre = null;

const archivo =
  document.getElementById(
    'caja-comprobante'
  )?.files?.[0];

//console.log('ARCHIVO SELECCIONADO:',archivo);

if (archivo) {

  const subida =
    await subirComprobanteCaja(
      archivo,
      window.tipoMovimientoCaja
    );

 // console.log('RESPUESTA SUBIDA:',subida);

  comprobanteUrl =
    subida.url;

  archivoNombre =
    subida.nombreArchivo;

}
      
await registrarMovimientoCaja({

  idCategoria:
    document.getElementById(
      'caja-categoria'
    ).value,

  concepto:
    document.getElementById(
      'caja-concepto'
    ).value,

  monto:
    parseFloat(
      document.getElementById(
        'caja-monto'
      ).value
    ),

  medioPago:
    document.getElementById(
      'caja-medio-pago'
    ).value,

  notas:
    document.getElementById(
      'caja-notas'
    ).value,

  comprobanteUrl,

  archivoNombre

});

        cerrarModalCaja();

        await window.cargarMovimientosCaja();

        alert(
          '✅ Movimiento registrado.'
        );

      } catch (error) {

        alert(
          error.message
        );

      }
finally {

  procesandoMovimientoCaja = false;

  const btn =
    document.getElementById(
      'btn-guardar-movimiento-caja'
    );

  if (btn) {

    btn.disabled = false;

    btn.innerText =
      'Guardar Movimiento';

  }

}
    }
  );

  window.actualizarTextoComprobante =
function(input) {

  const preview =
    document.getElementById(
      'txt-comprobante-preview'
    );

  if (!preview) return;

  const archivo =
    input.files?.[0];

  if (!archivo) return;

  preview.innerHTML =
    `✅ <span class="font-semibold text-emerald-600">
      ${archivo.name}
    </span>`;

};