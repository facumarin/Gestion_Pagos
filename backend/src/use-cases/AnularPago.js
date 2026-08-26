export class AnularPago {

  constructor(supabase) {
    this.supabase = supabase;
  }

  async ejecutar(
    idPago,
    motivo = 'Anulado por administración'
  ) {

    // ======================================
    // OBTENER PAGO
    // ======================================

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

    // ======================================
    // OBTENER CUOTA
    // ======================================

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
    // VALIDAR ÚLTIMO COMPROBANTE
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

    const {
      error: errPago
    } = await this.supabase
      .from('pagos')
      .update({
        anulado: true,
        fecha_anulacion:
          new Date().toISOString(),
        motivo_anulacion: motivo
      })
      .eq('id', idPago);

    if (errPago) {
      throw errPago;
    }

    // ======================================
    // RESTAURAR CUOTA
    // ======================================

    const nuevoSaldo =
      Number(cuota.saldo_pendiente || 0) +
      Number(pago.monto_abonado || 0);

    const {
      error: errCuota
    } = await this.supabase
      .from('cuotas')
      .update({
        pagada: false,
        saldo_pendiente: nuevoSaldo
      })
      .eq(
        'id',
        pago.id_cuota
      );

    if (errCuota) {
      throw errCuota;
    }

    // ======================================
    // RESTAURAR VENCIMIENTO DEL SOCIO
    // ======================================

    const fechaOriginal =
      `${cuota.anio}-${String(
        cuota.mes
      ).padStart(2, '0')}-10`;

    const {
      error: errSocio
    } = await this.supabase
      .from('socios')
      .update({
        fecha_vencimiento:
          fechaOriginal
      })
      .eq(
        'id',
        cuota.id_socio
      );

    if (errSocio) {
      throw errSocio;
    }

    return {
      success: true
    };

  }

}