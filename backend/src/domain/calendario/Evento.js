export class Evento {
  constructor({
    id,
    recursoId,
    actividadId,
    titulo,
    descripcion = null,
    fechaInicio,
    fechaFin,
    duracionMinutos,
    estado = 'programado',
    reglaRecurrenciaId = null,
    esExcepcion = false
  }) {
    if (!recursoId) throw new Error('Evento requiere un recurso');
    if (!actividadId) throw new Error('Evento requiere una actividad');
    if (!titulo?.trim()) throw new Error('Evento requiere un título');
    if (!fechaInicio) throw new Error('Evento requiere fecha inicio');
    if (!fechaFin) throw new Error('Evento requiere fecha fin');
    if (fechaFin <= fechaInicio) {
      throw new Error('Fecha fin debe ser posterior a fecha inicio');
    }

    this.id = id;
    this.recursoId = recursoId;
    this.actividadId = actividadId;
    this.titulo = titulo;
    this.descripcion = descripcion;
    this.fechaInicio = fechaInicio;
    this.fechaFin = fechaFin;
    this.duracionMinutos = duracionMinutos;
    this.estado = estado;
    this.reglaRecurrenciaId = reglaRecurrenciaId;
    this.esExcepcion = esExcepcion;
  }

  static crearDesdeInicioYDuracion({
    recursoId,
    actividadId,
    titulo,
    descripcion,
    fechaInicio,
    duracionMinutos,
    reglaRecurrenciaId = null
  }) {
    const fechaFin = new Date(
      fechaInicio.getTime() +
      duracionMinutos * 60000
    );

    return new Evento({
      recursoId,
      actividadId,
      titulo,
      descripcion,
      fechaInicio,
      fechaFin,
      duracionMinutos,
      reglaRecurrenciaId
    });
  }

  cancelar() {
    this.estado = 'cancelado';
  }

  perteneceASerie() {
    return this.reglaRecurrenciaId !== null;
  }
}