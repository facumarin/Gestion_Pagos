import { Evento } from '../../domain/calendario/Evento.js';
import {
  ConflictoDeHorarioError,
  EntidadNoEncontradaError
} from '../../domain/calendario/erroresDominio.js';

export class CrearEvento {
  constructor(
    eventoRepository,
    recursoRepository,
    actividadRepository
  ) {
    this.eventoRepository = eventoRepository;
    this.recursoRepository = recursoRepository;
    this.actividadRepository = actividadRepository;
  }

  async ejecutar({
    recursoId,
    actividadId,
    titulo,
    descripcion,
    fechaInicio,
    duracionMinutos
  }) {

    const recurso =
      await this.recursoRepository.buscarPorId(
        recursoId
      );

    if (!recurso || !recurso.activo) {
      throw new EntidadNoEncontradaError(
        'Recurso no encontrado o inactivo'
      );
    }

    const actividad =
      await this.actividadRepository.buscarPorId(
        actividadId
      );

    if (!actividad || !actividad.activo) {
      throw new EntidadNoEncontradaError(
        'Actividad no encontrada o inactiva'
      );
    }

    const evento =
      Evento.crearDesdeInicioYDuracion({
        recursoId,
        actividadId,
        titulo: titulo || actividad.nombre,
        descripcion,
        fechaInicio,
        duracionMinutos
      });

    const hayConflicto =
      await this.eventoRepository.existeSolapamiento({
        recursoId,
        fechaInicio: evento.fechaInicio,
        fechaFin: evento.fechaFin
      });

    if (hayConflicto) {
      throw new ConflictoDeHorarioError();
    }

    return await this.eventoRepository.guardar(
      evento
    );
  }
}