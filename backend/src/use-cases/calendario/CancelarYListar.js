import {
  EntidadNoEncontradaError
} from '../../domain/calendario/erroresDominio.js';

export class CancelarEvento {

  constructor(eventoRepository) {
    this.eventoRepository = eventoRepository;
  }

  async ejecutar(eventoId) {

    const evento =
      await this.eventoRepository.buscarPorId(
        eventoId
      );

    if (!evento) {
      throw new EntidadNoEncontradaError(
        'Evento no encontrado'
      );
    }

    evento.cancelar();

    if (evento.perteneceASerie()) {
      evento.esExcepcion = true;
    }

    return await this.eventoRepository.cancelar(
      evento.id
    );
  }
}

export class ListarEventosPorRango {

  constructor(eventoRepository) {
    this.eventoRepository = eventoRepository;
  }

  async ejecutar({
    desde,
    hasta,
    recursoId = null,
    actividadId = null
  }) {

    return await this.eventoRepository
      .listarPorRango({
        desde,
        hasta,
        recursoId,
        actividadId
      });
  }
}