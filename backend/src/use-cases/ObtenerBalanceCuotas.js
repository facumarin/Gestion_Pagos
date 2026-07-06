export class ObtenerBalanceCuotas {

  constructor(
    supabase,
    socioRepository
  ) {
    this.supabase = supabase;
    this.socioRepository = socioRepository;
  }

  async ejecutar() {
    const socios =
      await this.socioRepository.obtenerTodos() || [];

    const sociosActivos =
      socios.filter(
        s => s.estado === 'Activo'
      );

    const proyectado =
      sociosActivos.reduce(
        (acc, socio) =>
          acc + Number(
            socio.montoCuota ||
            socio.monto_cuota ||
            0
          ),
        0
      );

    const { data: pagos, error } =
      await this.supabase
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
        `)
        .order('fecha_pago', {
          ascending: false
        });

    if (error) {
      throw error;
    }

    const { data: cuotas } =
      await this.supabase
        .from('cuotas')
        .select(`
          id,
          id_socio
        `);

    const mapaCuotas = {};
    (cuotas || []).forEach(c => {
      mapaCuotas[c.id] = c.id_socio;
    });
    const mapaSocios = {};
    socios.forEach(s => {
      mapaSocios[s.id] = s;
    });

    const pagosEnriquecidos =
      (pagos || []).map(p => {
        const idSocio =
          mapaCuotas[p.id_cuota];
        const socio = mapaSocios[idSocio];
        return {
          ...p,
          nombreSocio: socio?.nombre || '',
          apellidoSocio: socio?.apellido || '',
          dniSocio: socio?.dni || ''
        };
      });
    const cobrado = pagosEnriquecidos.reduce(
        (acc, pago) =>
          acc + Number(
            pago.monto_abonado || 0
          ),
        0
      );

    const pendiente = Math.max(
        0,
        proyectado - cobrado
      );
    return {
      proyectado,
      cobrado,
      pendiente,
      cantidadSociosActivos:
        sociosActivos.length,
      cantidadCobros:
        pagosEnriquecidos.length,
      pagos:
        pagosEnriquecidos
    };
  }
}