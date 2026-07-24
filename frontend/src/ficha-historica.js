export async function abrirFichaHistorica(
  idSocio,
  todosLosSocios,
  API_URL,
  MESES
) {

  const socio =
    todosLosSocios.find(
      s => s.id === idSocio
    );

  if (!socio) return;

  document.getElementById(
    'ficha-avatar-txt'
  ).innerText =
    String(socio.nombre)
      .substring(0, 2)
      .toUpperCase();

  document.getElementById(
    'ficha-nombre-completo'
  ).innerText =
    `${socio.nombre} ${socio.apellido || ''}`.trim();

  document.getElementById(
    'ficha-dni'
  ).innerText =
    socio.dni;

  document.getElementById(
    'ficha-telefono'
  ).innerText =
    socio.telefono || 'Sin teléfono';

  document.getElementById(
    'ficha-email'
  ).innerText =
    socio.email || 'Sin correo electrónico';

  document.getElementById(
    'ficha-actividad'
  ).innerText =
    `${socio.actividad || 'General'} / ${socio.categoria || 'Socio'}`;

  document.getElementById(
    'ficha-monto'
  ).innerText =
    `$${parseFloat(
      socio.montoCuota || 0
    ).toLocaleString('es-AR', {
      minimumFractionDigits: 2
    })}`;

  const vencimientoTxt =
    socio.fechaVencimiento ||
    socio.fecha_vencimiento;

  document.getElementById(
    'ficha-vencimiento'
  ).innerText =
    vencimientoTxt
      ? vencimientoTxt.split('T')[0]
      : 'Sin fecha';

  const badgeEstado =
    document.getElementById(
      'ficha-estado-badge'
    );

  if (badgeEstado) {

    badgeEstado.innerText =
      socio.leyendaSemaforo ||
      socio.estadoSemaforo;

    const clasesSemaforo = {
      Verde:
        'bg-emerald-50 text-emerald-700 border-emerald-200',

      Amarillo:
        'bg-amber-50 text-amber-700 border-amber-200',

      Rojo:
        'bg-rose-50 text-rose-700 border-rose-200',

      Gris:
        'bg-slate-50 text-slate-600 border-slate-200'
    };

    badgeEstado.className =
      `inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mt-1 border ${
        clasesSemaforo[
          socio.estadoSemaforo
        ] || 'bg-gray-50'
      }`;
  }

  const tablaPagosBody =
    document.getElementById(
      'ficha-tabla-pagos-body'
    );

  if (tablaPagosBody) {

    tablaPagosBody.innerHTML =
      `
      <tr>
        <td colspan="6"
            class="p-4 text-center text-gray-400">
          Buscando recibos...
        </td>
      </tr>
    `;
  }

  try {

    const res =
      await fetch(
        `${API_URL}/socios/${idSocio}/pagos`
      );

    const pagosHistoricos =
      await res.json();

    if (
      !pagosHistoricos ||
      pagosHistoricos.length === 0
    ) {

      tablaPagosBody.innerHTML =
        `
        <tr>
          <td colspan="6"
              class="p-6 text-center text-gray-400">
            Sin comprobantes emitidos.
          </td>
        </tr>
      `;

    } else {

      tablaPagosBody.innerHTML =
        pagosHistoricos.map(p => {

          const fechaPagoObj =
            new Date(
              p.fecha_pago ||
              p.created_at
            );

          return `
            <tr class="hover:bg-slate-50/80 transition text-gray-600">

              <td class="p-3 pl-4 font-medium text-gray-400">
                ${fechaPagoObj.toLocaleDateString('es-AR')}
              </td>

              <td class="p-3 text-center font-mono font-bold text-blue-600">
                #${String(
                  p.numero_recibo || '-'
                ).padStart(4, '0')}
              </td>

              <td class="p-3 text-center font-semibold uppercase text-slate-700">
                <span class="px-1.5 py-0.5 bg-slate-100 rounded text-[10px]">
                  ${
                    p.periodo_mes
                      ? MESES[
                          parseInt(
                            p.periodo_mes,
                            10
                          ) - 1
                        ].substring(0, 3)
                      : '-'
                  }
                  ${p.periodo_anio || ''}
                </span>
              </td>

              <td class="p-3 text-center font-medium text-gray-500">
                ${p.forma_pago || 'Efectivo'}
              </td>

              <td class="p-3 text-right pr-4 font-mono font-black text-emerald-600">
                $${parseFloat(
                  p.monto_abonado || 0
                ).toLocaleString('es-AR', {
                  minimumFractionDigits: 2
                })}
              </td>

        <td class="p-3 text-center">

  ${
    p.anulado
      ? `
        <span
          class="text-xs px-2 py-1 rounded bg-gray-100 text-gray-500 font-bold">
          ANULADO
        </span>
      `
      : `
        <div class="flex justify-center gap-1">

          <button
            onclick="
              window.reimprimirComprobanteHistorico(
                '${p.numero_recibo}',
                '${
                  p.periodo_mes
                    ? MESES[
                        parseInt(
                          p.periodo_mes,
                          10
                        ) - 1
                      ]
                    : '-'
                } ${p.periodo_anio || ''}',
                '${socio.nombre} ${socio.apellido || ''}',
                '${socio.dni}',
                '${socio.tipo || ''}',
                '${p.forma_pago || 'Efectivo'}',
                '${p.monto_abonado || 0}'
              )
            "
            class="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-1 px-2 rounded border border-blue-200">
            🖨️
          </button>

          <button
            onclick="window.anularComprobante('${p.id}')"
            class="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-1 px-2 rounded border border-rose-200">
            🚫
          </button>

        </div>
      `
  }

</td>

            </tr>
          `;

        }).join('');
    }

  } catch (error) {

    if (tablaPagosBody) {

      tablaPagosBody.innerHTML =
        `
        <tr>
          <td colspan="6"
              class="p-4 text-center text-rose-500 font-semibold">
            ⚠️ Error de red.
          </td>
        </tr>
      `;
    }
  }

  document
    .getElementById(
      'modal-ficha-historica'
    )
    .classList.remove('hidden');
}

export function cerrarFichaHistorica() {

  document
    .getElementById(
      'modal-ficha-historica'
    )
    .classList.add('hidden');
}