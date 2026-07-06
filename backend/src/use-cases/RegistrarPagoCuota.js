export class RegistrarPagoCuota {

  constructor(socioRepository, supabase) {
    this.socioRepository = socioRepository;
    this.supabase = supabase;
  }

  async ejecutar({
    id,
    monto,
    medioPago,
    notas,
    periodoTexto
  }) {

    const montoValidado = parseFloat(monto);

    if (!monto || isNaN(montoValidado) || montoValidado <= 0) {
      throw new Error("El monto debe ser mayor a $0,00.");
    }

    const resultadoSocio = await this.socioRepository.buscarPorId(id);

    if (!resultadoSocio || resultadoSocio.length === 0) {
      throw new Error("Socio no encontrado.");
    }

    const socioReal = resultadoSocio[0];

    const { data: infoMedio } = await this.supabase
      .from('medios_pago')
      .select('nombre')
      .eq('id', medioPago)
      .maybeSingle();

    const nombreMedioTexto = infoMedio
      ? infoMedio.nombre
      : 'Efectivo';

    let fechaReferencia =
      socioReal.fecha_vencimiento ||
      socioReal.fechaVencimiento;

    let diaAPagar = 10;
    let mesAPagar = new Date().getMonth() + 1;
    let anioAPagar = new Date().getFullYear();

    if (fechaReferencia) {

      const soloFechaTexto =
        String(fechaReferencia).split('T')[0];

      const numerosEncontrados =
        soloFechaTexto.match(/\d+/g);

      if (
        numerosEncontrados &&
        numerosEncontrados.length >= 3
      ) {

        if (numerosEncontrados[0].length === 4) {

          anioAPagar =
            parseInt(numerosEncontrados[0], 10);

          mesAPagar =
            parseInt(numerosEncontrados[1], 10);

          diaAPagar =
            parseInt(numerosEncontrados[2], 10);

        } else {

          diaAPagar =
            parseInt(numerosEncontrados[0], 10);

          mesAPagar =
            parseInt(numerosEncontrados[1], 10);

          anioAPagar =
            parseInt(numerosEncontrados[2], 10);

        }
      }
    }

    let nuevoMes = mesAPagar + 1;
    let nuevoAnio = anioAPagar;

    if (nuevoMes > 12) {
      nuevoMes = 1;
      nuevoAnio += 1;
    }

    let reglaSocio =
      socioReal.regla_vencimiento ||
      socioReal.tipo_regla ||
      'calendario';

    let diaFinalVencimiento = 10;

    if (reglaSocio === 'aniversario') {

      diaFinalVencimiento = diaAPagar;

      const diasEnMesSiguiente =
        new Date(nuevoAnio, nuevoMes, 0).getDate();

      if (diaFinalVencimiento > diasEnMesSiguiente) {
        diaFinalVencimiento = diasEnMesSiguiente;
      }
    }

    const nuevaFechaVencimiento =
      `${nuevoAnio}-${String(nuevoMes).padStart(2, '0')}-${String(diaFinalVencimiento).padStart(2, '0')}`;

    let { data: cuota } = await this.supabase
      .from('cuotas')
      .select('*')
      .eq('id_socio', id)
      .eq('mes', mesAPagar)
      .eq('anio', anioAPagar)
      .maybeSingle();

    if (!cuota) {

      const { data: nuevaCuota } =
        await this.supabase
          .from('cuotas')
          .insert([{
            id_socio: id,
            mes: mesAPagar,
            anio: anioAPagar,
            monto_total: montoValidado,
            pagada: true,
            saldo_pendiente: 0.00
          }])
          .select()
          .single();

      cuota = nuevaCuota;

    } else {

      await this.supabase
        .from('cuotas')
        .update({
          pagada: true,
          saldo_pendiente: 0.00
        })
        .eq('id', cuota.id);

    }

    await this.supabase
      .from('pagos')
      .insert([{
        id_cuota: cuota.id,
        monto_abonado: montoValidado,
        notas_pago: notas || null,
        forma_pago: nombreMedioTexto,
        periodo_mes: mesAPagar,
        periodo_anio: anioAPagar,
        cobrado_por: 'Administrativo'
      }]);

    let nombreMesTexto = periodoTexto;

    if (!nombreMesTexto) {

      const mesesTexto = [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre"
      ];

      nombreMesTexto =
        mesesTexto[mesAPagar - 1];
    }

    await this.supabase
      .from('caja_movimientos')
      .insert([{
        id_socio: id,
        concepto: `Cuota Social - Período: ${nombreMesTexto} ${anioAPagar}`,
        monto: montoValidado,
        tipo_pago: nombreMedioTexto,
        notas: notas || null
      }]);

    await this.socioRepository.actualizar(id, {
      montoCuota: montoValidado,
      fechaVencimiento: nuevaFechaVencimiento
    });

    return {
      success: true,
      fechaVencimiento: nuevaFechaVencimiento,
      mesLiquidado: nombreMesTexto,
      anioLiquidado: anioAPagar
    };

  }
}