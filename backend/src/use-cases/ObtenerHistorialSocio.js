export class ObtenerHistorialSocio {

  constructor(supabase) {
    this.supabase = supabase;
  }

  async ejecutar(id) {

    const { data: cuotas, error: errorCuotas } =
      await this.supabase
        .from('cuotas')
        .select('id')
        .eq('id_socio', id);

    if (errorCuotas) {
      throw errorCuotas;
    }

    if (!cuotas || cuotas.length === 0) {
      return [];
    }

    const listaIdsCuotas =
      cuotas.map(c => c.id);

    const { data: pagos, error: errorPagos } =
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
          numero_recibo,
          anulado
        `)
        .in('id_cuota', listaIdsCuotas)
        .order('fecha_pago', {
          ascending: false
        });

    if (errorPagos) {
      throw errorPagos;
    }
    return pagos || [];
  }
}