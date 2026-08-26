export class ReglaRecurrencia {
  constructor({
    id,
    tipo,
    intervalo = 1,
    diasSemana = null,
    diaMes = null,
    fechaInicio,
    fechaFin = null,
    cantidadOcurrencias = null
  }) {
    if (!['diaria', 'semanal', 'mensual'].includes(tipo)) {
      throw new Error('Tipo de recurrencia inválido');
    }

    if (
      tipo === 'semanal' &&
      (!diasSemana || diasSemana.length === 0)
    ) {
      throw new Error(
        'Recurrencia semanal requiere al menos un día de la semana'
      );
    }

    if (fechaFin && cantidadOcurrencias) {
      throw new Error(
        'Definí fecha de fin O cantidad de ocurrencias, no ambas'
      );
    }

    this.id = id;
    this.tipo = tipo;
    this.intervalo = intervalo;
    this.diasSemana = diasSemana;
    this.diaMes = diaMes;
    this.fechaInicio = fechaInicio;
    this.fechaFin = fechaFin;
    this.cantidadOcurrencias = cantidadOcurrencias;
  }

  generarFechas(ventanaHasta) {
    const fechas = [];

    let cursor = new Date(this.fechaInicio);

    const limite = this.fechaFin
      ? new Date(
          Math.min(
            new Date(this.fechaFin).getTime(),
            ventanaHasta.getTime()
          )
        )
      : ventanaHasta;

    while (
      cursor <= limite &&
      (
        !this.cantidadOcurrencias ||
        fechas.length < this.cantidadOcurrencias
      )
    ) {

      if (this.tipo === 'semanal') {

        if (this.diasSemana.includes(cursor.getDay())) {
          fechas.push(new Date(cursor));
        }

        cursor.setDate(cursor.getDate() + 1);

      } else if (this.tipo === 'diaria') {

        fechas.push(new Date(cursor));
        cursor.setDate(
          cursor.getDate() + this.intervalo
        );

      } else if (this.tipo === 'mensual') {

        fechas.push(new Date(cursor));
        cursor.setMonth(
          cursor.getMonth() + this.intervalo
        );

      }
    }

    return fechas;
  }
}