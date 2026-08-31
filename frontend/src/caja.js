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
      if (window.filtroCajaMedio !== 'todos') {
      movimientos = movimientos.filter(m => m.tipo_pago === window.filtroCajaMedio);
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
// Tu archivo de la tabla (Fragmento dentro de window.cargarMovimientosCaja)

    if (!movimientos.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="p-8 text-center text-gray-400 text-sm"> <!-- ✅ Actualizado a 7 -->
            No se encontraron movimientos para el filtro seleccionado.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = movimientos.map(m => {
      // ✅ Contenedor de datos tipado y seguro para el Modal de UX
      const movSeguro = {
        id: m.id,
        idCategoria: m.id_categoria || m.categoria?.id, 
        concepto: m.concepto,
        monto: m.monto,
        medioPago: m.tipo_pago,
        notas: m.notas || '',
        comprobanteUrl: m.comprobante_url || null
      };

      return `
        <tr class="hover:bg-slate-50 transition-colors">
          <td class="p-4 text-xs text-gray-600">
            ${new Date(m.fecha).toLocaleDateString('es-AR')}
          </td>
          <td class="p-4">
            <div class="font-semibold text-gray-800">${m.concepto || '-'}</div>
          </td>
          <td class="p-4 text-center text-xs">${m.tipo_pago || '-'}</td>
          <td class="p-4 text-center">
            <span class="px-2 py-1 rounded-full text-xs font-bold ${
              m.categoria?.tipo === 'Ingreso' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }">
              ${m.categoria?.tipo || '-'}
            </span>
          </td>
          <td class="p-4 text-right font-bold">
            $${Number(m.monto || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </td>
          <td class="p-4 text-right">
            ${m.comprobante_url ? `<a href="${m.comprobante_url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 transition-colors" title="Ver comprobante">📄</a>` : '-'}
          </td>
          <!-- ✅ NUEVA CELDA ACCIONES (UX optimizada: botón sutil pero cliqueable) -->
          <td class="p-4 text-center">
            <button onclick='window.abrirModalMovimientoCaja("${m.categoria?.tipo || "Ingreso"}", ${JSON.stringify(movSeguro)})' 
                    class="px-2.5 py-1.5 text-xs font-bold bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-gray-600 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95">
                ✏️ Editar
            </button>
          </td>
        </tr>
      `;
    }).join('');


  } catch (error) {

    console.error(
      'Error cargando caja:',
      error
    );

  }

};

window.filtrarCajaPorTipo = function(tipo) {
  window.filtroCajaMedio = 'todos'; // ✅ Resetea el filtro de medio al cambiar el tipo
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

// Reemplaza esta función en tu caja.js
window.filtrarCajaPorMedio = function(medio) {
  window.filtroCajaMedio = medio;

  const lbl = document.getElementById('lbl-filtro-caja-activo');
  if (lbl) {
    if (medio === 'Efectivo') {
      lbl.innerText = 'Mostrando: 💵 Efectivo';
    } else if (medio === 'Transferencia') {
      lbl.innerText = 'Mostrando: 🏦 Transferencias';
    } if (medio === 'Mercado Pago') {
      lbl.innerText = 'Mostrando: 📱 Mercado Pago'; 
    } else  {
      lbl.innerText = 'Mostrando: 📊 Todos';
    }
  }

  // Reseteamos el filtro de tipo para evitar colisiones cruzadas si el usuario quiere ver todo lo de ese medio
  window.filtroCajaTipo = 'todos'; 

  window.cargarMovimientosCaja();
};



window.filtrarCajaPorMesAnio =
function() {

  window.cargarMovimientosCaja();

};

// Reemplaza esta función al final de tu frontend/src/caja.js
window.exportarCajaExcelActual = async function () {
  try {
    const { obtenerMovimientosCaja } = await import('./api-caja.js');
    const movimientos = await obtenerMovimientosCaja();

    if (!movimientos || movimientos.length === 0) {
      return alert("❌ No hay datos de caja disponibles para exportar.");
    }

    // 1. Usamos PUNTO Y COMA (;) para que Excel lo abra directamente en celdas separadas
    let contenidoCsv = "Fecha;Tipo;Categoria;Concepto;Monto;Observaciones\n";

    const ingresos = movimientos.filter(m => m.categoria?.tipo === 'Ingreso');
    const egresos = movimientos.filter(m => m.categoria?.tipo === 'Egreso');

    // 2. Inyectamos Ingresos (Limpiamos los puntos y comas de los textos para no romper celdas)
    ingresos.forEach(m => {
      const fecha = new Date(m.fecha).toLocaleDateString('es-AR');
      const categoria = (m.categoria?.nombre || '-').replace(/;/g, " ");
      const concepto = (m.concepto || '-').replace(/;/g, " ");
      const monto = String(m.monto || 0);
      const notas = (m.notas || '-').replace(/;/g, " ");
      
      contenidoCsv += `${fecha};Ingreso;${categoria};${concepto};${monto};${notas}\n`;
    });

    // 3. Inyectamos Egresos
    egresos.forEach(m => {
      const fecha = new Date(m.fecha).toLocaleDateString('es-AR');
      const categoria = (m.categoria?.nombre || '-').replace(/;/g, " ");
      const concepto = (m.concepto || '-').replace(/;/g, " ");
      const monto = String(m.monto || 0);
      const notas = (m.notas || '-').replace(/;/g, " ");
      
      contenidoCsv += `${fecha};Egreso;${categoria};${concepto};${monto};${notas}\n`;
    });

    // 4. Generamos la estampa de tiempo única (AñoMesDía_HoraMinutoSegundo)
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    const hora = String(ahora.getHours()).padStart(2, '0');
    const minutos = String(ahora.getMinutes()).padStart(2, '0');
    const segundos = String(ahora.getSeconds()).padStart(2, '0');
    
    const timestampUnico = `${anio}${mes}${dia}_${hora}${minutos}${segundos}`;

    // 5. El truco maestro: Agregamos '\uFEFF' al inicio para forzar a Excel a leerlo en UTF-8 nativo
    const blob = new Blob(["\uFEFF" + contenidoCsv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    
    // Le cambiamos el nombre para que incluya la estampa de tiempo única
    link.setAttribute("download", `Reporte_Caja_${timestampUnico}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch (error) {
    console.error("Error al exportar la caja:", error);
    alert("❌ Ocurrió un error al generar el reporte de caja.");
  }
};
