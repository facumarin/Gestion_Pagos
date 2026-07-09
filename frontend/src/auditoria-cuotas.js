import { obtenerMesActual } from './fechas.js';

let auditoriaColorActivoGlobal = 'Todos';

let obtenerSociosGlobal = () => [];

export function inicializarAuditoriaCuotas(obtenerSocios) {

  obtenerSociosGlobal = obtenerSocios;

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

  window.recalcularMetricasCuotasPorMes = function() {

    const checkActivo =
      document.getElementById('check-habilitar-rango')?.checked || false;

    const mesDesde =
      parseInt(
        document.getElementById('select-cuotas-mes-desde')?.value || obtenerMesActual(),
        10
      );

    const mesHasta =
      checkActivo
        ? parseInt(
            document.getElementById('select-cuotas-mes-hasta')?.value || obtenerMesActual(),
            10
          )
        : mesDesde;

    const montoBaseDefault =
      window.AppConfig?.montoBaseDefault || 0;

    const sociosActivos =
      obtenerSociosGlobal().filter(
        s => s.estado !== 'Inactivo'
      );

    let estimadosMonto = 0;
    let cobradosMonto = 0;
    let moraMonto = 0;

    sociosActivos.forEach(socio => {

      const cuotaMonto =
        parseFloat(
          socio.montoCuota ||
          socio.monto_cuota ||
          montoBaseDefault
        );

      estimadosMonto += cuotaMonto;

      const fVenc =
        socio.fechaVencimiento ||
        socio.fecha_vencimiento;

      if (fVenc) {

        const mesVencimientoSocio =
          new Date(fVenc).getUTCMonth() + 1;

        if (mesVencimientoSocio > mesHasta) {
          cobradosMonto += cuotaMonto;
        }
        else if (
          mesVencimientoSocio >= mesDesde &&
          mesVencimientoSocio <= mesHasta
        ) {
          moraMonto += cuotaMonto;
        }
        else {
          estimadosMonto -= cuotaMonto;
        }

      } else {

        moraMonto += cuotaMonto;

      }
    });

    document.getElementById('txt-caja-estimada').innerText =
      `$${estimadosMonto.toLocaleString('es-AR')},00`;

    document.getElementById('txt-caja-real').innerText =
      `$${cobradosMonto.toLocaleString('es-AR')},00`;

    document.getElementById('txt-caja-mora').innerText =
      `$${moraMonto.toLocaleString('es-AR')},00`;

    window.renderizarTablaAuditoriaCuotas();

  };

  window.filtrarAuditoriaCuotas = function(color) {

    auditoriaColorActivoGlobal = color;

    const titulos = {
      'Todos': 'Listado General del Período',
      'Verde': 'Comprobantes Saldados (Al Día)',
      'Rojo': 'Padrón de Miembros en Mora'
    };

    const lblTitulo =
      document.getElementById('lbl-auditoria-titulo-filtro');

    if (lblTitulo) {
      lblTitulo.innerText =
        titulos[color] || 'Listado General';
    }

    window.renderizarTablaAuditoriaCuotas();

  };

  window.renderizarTablaAuditoriaCuotas = function() {

    const tbody =
      document.getElementById(
        'tabla-auditoria-cuotas-body'
      );

    const buscadorTxt =
      document.getElementById(
        'input-buscador-auditoria-cuotas'
      )?.value.toLowerCase().trim() || '';

    if (!tbody) return;

    const checkActivo =
      document.getElementById(
        'check-habilitar-rango'
      )?.checked || false;

    const mesDesde =
  parseInt(
    document.getElementById(
      'select-cuotas-mes-desde'
    )?.value || obtenerMesActual(),
    10
  );

   const mesHasta =
  checkActivo
    ? parseInt(
        document.getElementById(
          'select-cuotas-mes-hasta'
        )?.value || obtenerMesActual(),
        10
      )
    : mesDesde;

    let filtrados =
      obtenerSociosGlobal().filter(
        s => s.estado !== 'Inactivo'
      );

    filtrados = filtrados.filter(s => {

      const fVenc =
        s.fechaVencimiento ||
        s.fecha_vencimiento;

      if (!fVenc) return true;

      const mesV =
        new Date(fVenc).getUTCMonth() + 1;

      return mesV >= mesDesde;
    });

    if (auditoriaColorActivoGlobal !== 'Todos') {

      filtrados = filtrados.filter(s => {

        const fVenc =
          s.fechaVencimiento ||
          s.fecha_vencimiento;

        const mesV =
          fVenc
            ? new Date(fVenc).getUTCMonth() + 1
            : 1;

        return auditoriaColorActivoGlobal === 'Verde'
          ? mesV > mesHasta
          : mesV <= mesHasta;
      });

    }

    if (buscadorTxt) {

      filtrados = filtrados.filter(
        s =>
          s.nombre.toLowerCase().includes(buscadorTxt) ||
          s.dni.toString().includes(buscadorTxt)
      );

    }

    if (filtrados.length === 0) {

      tbody.innerHTML =
        `<tr><td colspan="6" class="p-8 text-center text-gray-400 text-sm font-medium">Sin registros para el filtro seleccionado.</td></tr>`;

      return;

    }

    tbody.innerHTML = filtrados.map(s => {

      const fVenc =
        s.fechaVencimiento ||
        s.fecha_vencimiento;

      const esPagado =
        fVenc
          ? (new Date(fVenc).getUTCMonth() + 1) > mesHasta
          : false;

      const waUrl =
        `https://wa.me/${s.telefono}?text=${encodeURIComponent(`Hola ${s.nombre}, te contactamos desde la administración para recordar regularizar tu arancel.`)}`;

      return `
      <tr class="border-b border-gray-100 hover:bg-gray-50/50 transition text-sm">
        <td class="p-4 pl-6 font-bold text-gray-900">${s.nombre} ${s.apellido || ''}</td>
        <td class="p-4 font-mono text-gray-600">${s.dni}</td>
        <td class="p-4 text-gray-500">${s.tipo || 'Arancel Social'}</td>
        <td class="p-4 text-center font-medium">${esPagado ? '✅ Percibido' : '❌ Pendiente'}</td>
        <td class="p-4 text-right font-mono font-black ${esPagado ? 'text-emerald-600' : 'text-rose-600'}">$${parseFloat(s.montoCuota || 0).toLocaleString('es-AR')},00</td>
        <td class="p-4 text-right pr-6">
          ${esPagado
            ? `<span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">Emitido</span>`
            : `<a href="${waUrl}" target="_blank" class="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-1.5 px-3 rounded border border-rose-200 transition cursor-pointer active:scale-[0.97]">📲 Reclamar</a>`
          }
        </td>
      </tr>`;
    }).join('');

  };

}