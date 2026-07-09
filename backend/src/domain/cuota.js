export class Cuota {
  constructor({ id, idSocio, mes, anio, monto, pagada = false, fechaPago = null }) {
    this.id = id;
    this.idSocio = idSocio; // ID del socio obligado al pago (Individual o Titular)
    this.mes = mes;         // Número de mes (1 al 12)
    this.anio = anio;       
    this.monto = monto;
    this.pagada = pagada;
    this.fechaPago = fechaPago;
  }

  // Regla de Negocio fundamental: Calcula el color del semáforo para esta cuota
  calcularEstadoSemaforo() {
    if (this.pagada) {
      return 'Verde'; // Cuota liquidada
    }

    const hoy = new Date();
    const diaActual = hoy.getDate();
    const mesActual = hoy.getMonth() + 1; // JS cuenta los meses del 0 al 11
    const anioActual = hoy.getFullYear();

    // Si la cuota pendiente es de un mes o año anterior, ya está vencida
    if (this.anio < anioActual || (this.anio === anioActual && this.mes < mesActual)) {
      return 'Rojo';
    }

    // Si es el mes actual, evaluamos el día de vencimiento (Día 10)
    if (this.anio === anioActual && this.mes === mesActual) {
      return diaActual <= 10 ? 'Amarillo' : 'Rojo';
    }

    // Por las dudas, si es una cuota adelantada (mes futuro) no pagada
    return 'Amarillo';
  }
}
