export class RegistrarMovimientoCaja {

  constructor(supabase) {
    this.supabase = supabase;
  }

  async ejecutar({
    idCategoria,
    concepto,
    monto,
    medioPago,
    notas = null,
    comprobanteUrl = null,
    archivoNombre = null,
    idSocio = null
  }) {

    const montoValidado =
      Number(monto);

    if (
      !monto ||
      isNaN(montoValidado) ||
      montoValidado <= 0
    ) {
      throw new Error(
        'El monto debe ser mayor a cero.'
      );
    }

    if (!idCategoria) {
      throw new Error(
        'Debe seleccionar una categoría.'
      );
    }

    if (!concepto?.trim()) {
      throw new Error(
        'Debe ingresar un concepto.'
      );
    }

    const { data, error } =
      await this.supabase
        .from('caja_movimientos')
        .insert([{
          id_categoria: idCategoria,
          id_socio: idSocio,
          concepto: concepto.trim(),
          monto: montoValidado,
          tipo_pago: medioPago,
          notas,
          comprobante_url:
            comprobanteUrl,
          archivo_nombre:
            archivoNombre
        }])
        .select()
        .single();

    if (error) {
      throw error;
    }

    return data;
  }
}