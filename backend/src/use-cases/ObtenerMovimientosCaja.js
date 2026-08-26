export class ObtenerMovimientosCaja {

  constructor(supabase) {
    this.supabase = supabase;
  }

  async ejecutar() {

    const { data, error } =
      await this.supabase
        .from('caja_movimientos')
        .select(`
          id,
          concepto,
          monto,
          tipo_pago,
          fecha,
          comprobante_url,
          archivo_nombre,
          notas,

          categoria:categorias_caja(
            id,
            nombre,
            tipo
          )
        `)
        .order(
          'fecha',
          { ascending: false }
        );

    if (error) {
      throw error;
    }

    return data || [];

  }

}