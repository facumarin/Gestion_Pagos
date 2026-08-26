export class RecursoRepository {
  async guardar(recurso) {
    throw new Error('No implementado');
  }

  async buscarPorId(id) {
    throw new Error('No implementado');
  }

  async listar({ soloActivos = false } = {}) {
    throw new Error('No implementado');
  }

  async actualizar(recurso) {
    throw new Error('No implementado');
  }
}

export class ActividadRepository {
  async guardar(actividad) {
    throw new Error('No implementado');
  }

  async buscarPorId(id) {
    throw new Error('No implementado');
  }

  async listar({ soloActivos = false } = {}) {
    throw new Error('No implementado');
  }

  async actualizar(actividad) {
    throw new Error('No implementado');
  }
}

export class ReglaRecurrenciaRepository {
  async guardar(regla) {
    throw new Error('No implementado');
  }

  async buscarPorId(id) {
    throw new Error('No implementado');
  }
}

export class EventoRepository {
  async guardar(evento) {
    throw new Error('No implementado');
  }

  async guardarVarios(eventos) {
    throw new Error('No implementado');
  }

  async buscarPorId(id) {
    throw new Error('No implementado');
  }

  async listarPorRango({
    desde,
    hasta,
    recursoId,
    actividadId
  }) {
    throw new Error('No implementado');
  }

  async existeSolapamiento({
    recursoId,
    fechaInicio,
    fechaFin,
    excluirEventoId = null
  }) {
    throw new Error('No implementado');
  }

  async cancelar(id) {
    throw new Error('No implementado');
  }

  async cancelarSerieDesdeFecha({
    reglaRecurrenciaId,
    fechaDesde
  }) {
    throw new Error('No implementado');
  }
}