export class ConflictoDeHorarioError extends Error {
  constructor(mensaje = 'El recurso ya está ocupado en ese horario') {
    super(mensaje);
    this.name = 'ConflictoDeHorarioError';
  }
}

export class EntidadNoEncontradaError extends Error {
  constructor(mensaje = 'Entidad no encontrada') {
    super(mensaje);
    this.name = 'EntidadNoEncontradaError';
  }
}