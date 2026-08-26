import { obtenerMesActual } from './fechas.js';
import { obtenerBalanceCuotas } from './api-cuotas.js';

async function cargarBalanceCuotas(
  mesDesde = obtenerMesActual(),
  mesHasta = obtenerMesActual(),
  anio = new Date().getFullYear()
) {
  try {

    const balance =
      await obtenerBalanceCuotas(
        mesDesde,
        mesHasta,
        anio
      );

    document.getElementById(
      'txt-caja-estimada'
    ).innerText =
      `$${balance.proyectado.toLocaleString('es-AR')}`;

    document.getElementById(
      'txt-caja-real'
    ).innerText =
      `$${balance.cobrado.toLocaleString('es-AR')}`;

    document.getElementById(
      'txt-caja-mora'
    ).innerText =
      `$${balance.pendiente.toLocaleString('es-AR')}`;

    document.getElementById(
      'txt-caja-cumplimiento'
    ).innerText =
      `${balance.cumplimiento}%`;

    renderizarPagosCuotas(
      balance.pagos || []
    );

  } catch (error) {

    console.error(
      'Error al cargar balance:',
      error
    );

  }
}

function renderizarPagosCuotas(
  pagos = []
) {

  const tbody =
    document.getElementById(
      'tabla-auditoria-cuotas-body'
    );

  if (!tbody) return;

  if (!pagos.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="6"
            class="p-8 text-center text-gray-400">
          Sin movimientos registrados.
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML =
    pagos.map(p => `
      <tr class="border-b border-gray-100">

        <td class="p-4">
          ${new Date(
            p.fecha_pago
          ).toLocaleDateString('es-AR')}
        </td>

        <td class="p-4 font-mono">
          #${p.numero_recibo || '-'}
        </td>

        <td class="p-4">
          ${p.nombreSocio || ''}
          ${p.apellidoSocio || ''}
        </td>

        <td class="p-4">
          ${p.periodo_mes || '-'}
          /
          ${p.periodo_anio || '-'}
        </td>

        <td class="p-4">
          ${p.forma_pago || '-'}
        </td>

        <td class="p-4 text-right font-bold">
          $${Number(
            p.monto_abonado || 0
          ).toLocaleString('es-AR')}
        </td>

      </tr>
    `).join('');
}

export function inicializarAuditoriaCuotas() {

  window.evaluarEstructuraFiltroRango = function() {
    const checkActivo = document.getElementById('check-habilitar-rango').checked;
    const lblDesde = document.getElementById('lbl-caja-desde');
    const contenedorHasta = document.getElementById('contenedor-caja-hasta');

    if (checkActivo) {
      lblDesde?.classList.remove('hidden');
      contenedorHasta?.classList.remove('hidden');
    } else {
      lblDesde?.classList.add('hidden');
      contenedorHasta?.classList.add('hidden');
    }

    window.recalcularMetricasCuotasPorMes();
  };

window.recalcularMetricasCuotasPorMes =
  async function() {

    const checkActivo =
      document.getElementById(
        'check-habilitar-rango'
      )?.checked || false;

    const selectDesde =
      document.getElementById(
        'select-cuotas-mes-desde'
      );

    const selectHasta =
      document.getElementById(
        'select-cuotas-mes-hasta'
      );

    let mesDesde =
      parseInt(
        selectDesde?.value ||
        obtenerMesActual(),
        10
      );

    let mesHasta =
      checkActivo
        ? parseInt(
            selectHasta?.value ||
            obtenerMesActual(),
            10
          )
        : mesDesde;

    if (
      checkActivo &&
      mesHasta < mesDesde
    ) {

      selectHasta.value =
        String(mesDesde);

      mesHasta = mesDesde;
    }

    const anioSeleccionado =
      parseInt(
        document.getElementById(
          'select-cuotas-anio'
        )?.value,
        10
      );

    await cargarBalanceCuotas(
      mesDesde,
      mesHasta,
      anioSeleccionado
    );

};

cargarBalanceCuotas();
}