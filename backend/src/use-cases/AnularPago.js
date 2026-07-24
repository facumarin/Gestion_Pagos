export class AnularPago {

  constructor(supabase) {
    this.supabase = supabase;
  }

  async ejecutar(idPago, motivo = 'Anulado por administración') {

    const {
      data: pago,
      error: errorPago
    } = await this.supabase
      .from('pagos')
      .select('*')
      .eq('id', idPago)
      .single();

    if (errorPago) {
      throw errorPago;
    }

    if (!pago) {
      throw new Error(
        'Pago no encontrado.'
      );
    }

    if (pago.anulado) {
      throw new Error(
        'El pago ya fue anulado.'
      );
    }

    const {
      data: cuota,
      error: errorCuota
    } = await this.supabase
      .from('cuotas')
      .select('*')
      .eq('id', pago.id_cuota)
      .single();

    if (errorCuota) {
      throw errorCuota;
    }

    if (!cuota) {
      throw new Error(
        'Cuota asociada no encontrada.'
      );
    }

    // ======================================
    // VALIDACIÓN:
    // sólo permitir anular el último pago
    // activo de la cuota
    // ======================================

    const {
      data: pagosActivos,
      error: errorPagosActivos
    } = await this.supabase
      .from('pagos')
      .select('*')
      .eq('id_cuota', pago.id_cuota)
      .eq('anulado', false)
      .order('fecha_pago', {
        ascending: false
      });

    if (errorPagosActivos) {
      throw errorPagosActivos;
    }

    if (
      pagosActivos &&
      pagosActivos.length > 0 &&
      pagosActivos[0].id !== pago.id
    ) {
      throw new Error(
        'Sólo puede anularse el último comprobante vigente.'
      );
    }

    // ======================================
    // ANULAR PAGO
    // ======================================

    await this.supabase
      .from('pagos')
      .update({
        anulado: true,
        fecha_anulacion:
          new Date().toISOString(),
        motivo_anulacion: motivo
      })
      .eq('id', idPago);

    // ======================================
    // RESTAURAR CUOTA
    // ======================================

    const nuevoSaldo =
      Number(cuota.saldo_pendiente || 0) +
      Number(pago.monto_abonado || 0);

    await this.supabase
      .from('cuotas')
      .update({
        pagada: false,
        saldo_pendiente: nuevoSaldo
      })
      .eq(
        'id',
        pago.id_cuota
      );

    return {
      success: true
    };

  }

}
