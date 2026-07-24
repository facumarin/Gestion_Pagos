export class ObtenerBalanceCuotas {

  constructor(
    supabase,
    socioRepository
  ) {
    this.supabase = supabase;
    this.socioRepository = socioRepository;
  }

async ejecutar({
  mesDesde = null,
  mesHasta = null,
  anio = null
} = {}) {

  const socios =
    await this.socioRepository.obtenerTodos() || [];

let queryCuotas =
  this.supabase
    .from('cuotas')
    .select(`
      id,
      id_socio,
      monto_total,
      pagada,
      saldo_pendiente,
      mes,
      anio
    `);

if (
  mesDesde !== null &&
  mesHasta !== null
) {
  queryCuotas =
    queryCuotas
      .gte('mes', mesDesde)
      .lte('mes', mesHasta);
}

if (anio !== null) {
  queryCuotas =
    queryCuotas.eq('anio', anio);
}

let queryPagos =
  this.supabase
    .from('pagos')
    .select(`
      id,
      id_cuota,
      monto_abonado,
      fecha_pago,
      forma_pago,
      periodo_mes,
      periodo_anio,
      numero_recibo
    `).eq('anulado', false);

if (
  mesDesde !== null &&
  mesHasta !== null
) {
  queryPagos =
    queryPagos
      .gte(
        'periodo_mes',
        mesDesde
      )
      .lte(
        'periodo_mes',
        mesHasta
      );
}

if (anio !== null) {
  queryPagos =
    queryPagos.eq(
      'periodo_anio',
      anio
    );
}
const {
  data: cuotas,
  error: errorCuotas
} = await queryCuotas;

//console.log('CUOTAS FILTRADAS:', mesDesde, mesHasta, anio, cuotas?.length);

  if (errorCuotas) {
    throw errorCuotas;
  }


const {
  data: pagos,
  error: errorPagos
} = await queryPagos.order(
  'fecha_pago',
  {
    ascending: false
  }
);
//console.log('PAGOS FILTRADOS:', mesDesde, mesHasta, anio, pagos?.length);
  if (errorPagos) {
    throw errorPagos;
  }

  const mapaSocios = {};

  socios.forEach(s => {
    mapaSocios[s.id] = s;
  });

  const mapaCuotas = {};

  (cuotas || []).forEach(c => {
    mapaCuotas[c.id] = c;
  });

  const pagosEnriquecidos =
    (pagos || []).map(p => {

      const cuota =
        mapaCuotas[p.id_cuota];

      const socio =
        mapaSocios[cuota?.id_socio];

      return {
        ...p,
        nombreSocio: socio?.nombre || '',
        apellidoSocio: socio?.apellido || '',
        dniSocio: socio?.dni || ''
      };
    });

  const proyectado =
    (cuotas || []).reduce(
      (acc, cuota) =>
        acc + Number(
          cuota.monto_total || 0
        ),
      0
    );

  const cobrado =
    pagosEnriquecidos.reduce(
      (acc, pago) =>
        acc + Number(
          pago.monto_abonado || 0
        ),
      0
    );

  const pendiente =
    (cuotas || []).reduce(
      (acc, cuota) =>
        acc + Number(
          cuota.saldo_pendiente || 0
        ),
      0
    );

  const cumplimiento =
    proyectado > 0
      ? Number(
          (
            (cobrado * 100) /
            proyectado
          ).toFixed(2)
        )
      : 0;

  const cuotasPendientes =
    (cuotas || []).filter(
      c => !c.pagada
    );

  return {
    proyectado,
    cobrado,
    pendiente,
    cumplimiento,
    cantidadCobros:
      pagosEnriquecidos.length,
    cantidadCuotas:
      cuotas.length,
    cuotasPendientes:
      cuotasPendientes.length,
    pagos:
      pagosEnriquecidos
  };
}
}