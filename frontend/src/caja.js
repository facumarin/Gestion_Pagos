import { obtenerMovimientosCaja } from './api-caja.js';

window.filtroCajaTipo = 'todos';
window.filtroCajaMedio = 'todos';

window.cargarMovimientosCaja = async function () {

  try {

    const movimientosOriginales = await obtenerMovimientosCaja();

    let movimientos =  [...movimientosOriginales];

      const selectMes =  document.getElementById('select-caja-mes-filtro');

const mesSeleccionado = Number(selectMes?.value || 0);

if (mesSeleccionado > 0) {

  movimientos = movimientos.filter(m => {

      const fecha = new Date(m.fecha);

      return (fecha.getMonth() + 1 ===  mesSeleccionado);

    });

}
    // ==========================
    // FILTRO POR TIPO
    // ==========================

    if (
      window.filtroCajaTipo !== 'todos'
    ) {

      movimientos =
        movimientos.filter(
          m =>
            m.categoria?.tipo ===
            window.filtroCajaTipo
        );

    }

    const tbody =
      document.getElementById(
        'tabla-caja-body'
      );

    if (!tbody) return;

    // ==========================
    // TARJETAS SUPERIORES
    // ==========================

    const ingresos =
      movimientosOriginales
        .filter(
          m =>
            m.categoria?.tipo ===
            'Ingreso'
        )
        .reduce(
          (acc, m) =>
            acc + Number(m.monto || 0),
          0
        );

    const egresos =
      movimientosOriginales
        .filter(
          m =>
            m.categoria?.tipo ===
            'Egreso'
        )
        .reduce(
          (acc, m) =>
            acc + Number(m.monto || 0),
          0
        );

    const saldoNeto =
      ingresos - egresos;

    const txtIngresos =
      document.getElementById(
        'txt-saldo-efectivo'
      );

    const txtEgresos =
      document.getElementById(
        'txt-saldo-banco'
      );

    const txtNeto =
      document.getElementById(
        'txt-saldo-neto'
      );

    if (txtIngresos) {

      txtIngresos.innerText =
        `$${ingresos.toLocaleString(
          'es-AR',
          {
            minimumFractionDigits: 2
          }
        )}`;

    }

    if (txtEgresos) {

      txtEgresos.innerText =
        `$${egresos.toLocaleString(
          'es-AR',
          {
            minimumFractionDigits: 2
          }
        )}`;

    }

    if (txtNeto) {

      txtNeto.innerText =
        `$${saldoNeto.toLocaleString(
          'es-AR',
          {
            minimumFractionDigits: 2
          }
        )}`;

    }

    // ==========================
    // TABLA
    // ==========================

    if (!movimientos.length) {

      tbody.innerHTML = `
        <tr>
          <td colspan="6"
              class="p-8 text-center text-gray-400 text-sm">
            No se encontraron movimientos para el filtro seleccionado.
          </td>
        </tr>
      `;

      return;
    }

    tbody.innerHTML =
      movimientos.map(m => `

        <tr class="hover:bg-slate-50">

          <td class="p-4 text-xs text-gray-600">
            ${new Date(
              m.fecha
            ).toLocaleDateString(
              'es-AR'
            )}
          </td>

          <td class="p-4">

            <div class="font-semibold text-gray-800">
              ${m.concepto || '-'}
            </div>

          </td>

          <td class="p-4 text-center text-xs">
            ${m.tipo_pago || '-'}
          </td>

          <td class="p-4 text-center">

            <span
              class="px-2 py-1 rounded-full text-xs font-bold
              ${
                m.categoria?.tipo === 'Ingreso'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }"
            >

              ${m.categoria?.tipo || '-'}

            </span>

          </td>

          <td class="p-4 text-right font-bold">

            $${Number(
              m.monto || 0
            ).toLocaleString(
              'es-AR',
              {
                minimumFractionDigits: 2
              }
            )}

          </td>

          <td class="p-4 text-right">

       ${
m.comprobante_url
? `
<a
href="${m.comprobante_url}"
target="_blank"
rel="noopener noreferrer"
class="text-blue-600 hover:text-blue-800"
title="Ver comprobante">
📄 </a> `
: '-'
}

          </td>

        </tr>

      `).join('');

  } catch (error) {

    console.error(
      'Error cargando caja:',
      error
    );

  }

};

window.filtrarCajaPorTipo = function(tipo) {

  window.filtroCajaTipo = tipo;

  const lbl =
    document.getElementById(
      'lbl-filtro-caja-activo'
    );

  if (lbl) {

    if (tipo === 'Ingreso') {
      lbl.innerText =
        'Mostrando: 🟢 Ingresos';
    }
    else if (tipo === 'Egreso') {
      lbl.innerText =
        'Mostrando: 🔴 Egresos';
    }
    else {
      lbl.innerText =
        'Mostrando: 📊 Todos';
    }

  }

  window.cargarMovimientosCaja();

};

window.filtrarCajaPorMedio = function(medio) {

  window.filtroCajaMedio = medio;

  window.cargarMovimientosCaja();

};

window.filtrarCajaPorMesAnio =
function() {

  window.cargarMovimientosCaja();

};