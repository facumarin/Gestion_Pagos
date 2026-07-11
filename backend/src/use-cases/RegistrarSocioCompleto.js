export class RegistrarSocioCompleto {

  constructor(
    socioRepository,
    supabase,
    registrarSocioUC
  ) {
    this.socioRepository = socioRepository;
    this.supabase = supabase;
    this.registrarSocioUC = registrarSocioUC;
  }

  async ejecutar(datosSocio) {

    const {
      registraPagoInicial,
      montoCuota,
      altaMesContable,
      altaMedioPago,
      condicionIngreso
    } = datosSocio;

    const socioCreado =
      await this.registrarSocioUC.ejecutar(datosSocio);
if (
  condicionIngreso === 'deuda' &&
  socioCreado
) {

  const anioAct =
    new Date().getFullYear();

 await this.supabase
  .from('cuotas')
  .insert([{
    id_socio: socioCreado.id,
    mes: altaMesContable || (new Date().getMonth() + 1),
    anio: anioAct,
    monto_total:
      parseFloat(montoCuota || 5000),
    pagada: false,
    saldo_pendiente:
      parseFloat(montoCuota || 5000)
  }]);

}
    if (
      condicionIngreso === 'pago' &&
      registraPagoInicial &&
      socioCreado
    ) {

    const anioAct = new Date().getFullYear();

      const mesesTxt = [
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

      const { data: cat } =
        await this.supabase
          .from('categorias_caja')
          .select('id')
          .eq(
            'nombre',
            'Cuota Social / Arancel'
          )
          .maybeSingle();

      if (cat) {

        const { data: cuota } =
          await this.supabase
            .from('cuotas')
            .insert([{
              id_socio: socioCreado.id,
              mes: altaMesContable,
              anio: anioAct,
              monto_total:
                parseFloat(montoCuota || 5000),
              pagada: true,
              saldo_pendiente: 0.00
            }])
            .select()
            .single();
        if (cuota) {

          const { data: infoMedio } =
  await this.supabase
    .from('medios_pago')
    .select('nombre')
    .eq('id', altaMedioPago)
    .maybeSingle();

const nombreMedioTexto =  infoMedio? infoMedio.nombre: 'Efectivo';

          await this.supabase
            .from('pagos')
            .insert([{
              id_cuota: cuota.id,
              monto_abonado:
                parseFloat(montoCuota || 5000),
              forma_pago:  nombreMedioTexto,
              periodo_mes: altaMesContable,
              periodo_anio: anioAct,
              cobrado_por: 'Administrativo'
            }]);

        await this.supabase
  .from('caja_movimientos')
  .insert([{
    id_categoria: cat.id,
    id_socio: socioCreado.id,
    concepto:
      `Pago Inicial Alta - Período: ${mesesTxt[altaMesContable - 1]} ${anioAct}`,
    monto:
      parseFloat(montoCuota || 5000),
    tipo_pago:
      nombreMedioTexto
  }]);
        }
      }
    }
    return socioCreado;
  }
}