import { supabase } from '../database.js';

import {
  Recurso,
  Actividad
} from '../../domain/calendario/EntidadesSimples.js';

import { Evento } from '../../domain/calendario/Evento.js';

import {
  ConflictoDeHorarioError
} from '../../domain/calendario/erroresDominio.js';

function filaARecurso(fila) {
  return new Recurso({
    id: fila.id,
    nombre: fila.nombre,
    tipo: fila.tipo,
    descripcion: fila.descripcion,
    capacidad: fila.capacidad,
    color: fila.color,
    activo: fila.activo
  });
}

function filaAActividad(fila) {
  return new Actividad({
    id: fila.id,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    color: fila.color,
    duracionDefaultMinutos:
      fila.duracion_default_minutos,
    activo: fila.activo
  });
}

function filaAEvento(fila) {
  return new Evento({
    id: fila.id,
    recursoId: fila.recurso_id,
    actividadId: fila.actividad_id,
    titulo: fila.titulo,
    descripcion: fila.descripcion,
    fechaInicio: new Date(fila.fecha_inicio),
    fechaFin: new Date(fila.fecha_fin),
    duracionMinutos: fila.duracion_minutos,
    estado: fila.estado,
    reglaRecurrenciaId:
      fila.regla_recurrencia_id,
    esExcepcion: fila.es_excepcion
  });
}

export class RecursoRepositorySupabase {

  async guardar(recurso) {

    const { data, error } =
      await supabase
        .from('recursos')
        .insert({
          nombre: recurso.nombre,
          tipo: recurso.tipo,
          descripcion: recurso.descripcion,
          capacidad: recurso.capacidad,
          color: recurso.color
        })
        .select()
        .single();

    if (error) throw error;

    return filaARecurso(data);
  }

  async buscarPorId(id) {

    const { data, error } =
      await supabase
        .from('recursos')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (error) throw error;

    return data
      ? filaARecurso(data)
      : null;
  }

  async listar({ soloActivos = false } = {}) {

    let query =
      supabase
        .from('recursos')
        .select('*')
        .order('nombre');

    if (soloActivos) {
      query = query.eq('activo', true);
    }

    const { data, error } =
      await query;

    if (error) throw error;

    return data.map(filaARecurso);
  }

  async actualizar(recurso) {

    const { data, error } =
      await supabase
        .from('recursos')
        .update({
          nombre: recurso.nombre,
          tipo: recurso.tipo,
          descripcion: recurso.descripcion,
          capacidad: recurso.capacidad,
          color: recurso.color,
          activo: recurso.activo,
          actualizado_en: new Date().toISOString()
        })
        .eq('id', recurso.id)
        .select()
        .single();

    if (error) throw error;

    return filaARecurso(data);
  }
}

export class ActividadRepositorySupabase {

  async guardar(actividad) {

    const { data, error } =
      await supabase
        .from('actividades')
        .insert({
          nombre: actividad.nombre,
          descripcion: actividad.descripcion,
          color: actividad.color,
          duracion_default_minutos:
            actividad.duracionDefaultMinutos
        })
        .select()
        .single();

    if (error) throw error;

    return filaAActividad(data);
  }

  async buscarPorId(id) {

    const { data, error } =
      await supabase
        .from('actividades')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (error) throw error;

    return data
      ? filaAActividad(data)
      : null;
  }

  async listar({ soloActivos = false } = {}) {

    let query =
      supabase
        .from('actividades')
        .select('*')
        .order('nombre');

    if (soloActivos) {
      query = query.eq('activo', true);
    }

    const { data, error } =
      await query;

    if (error) throw error;

    return data.map(filaAActividad);
  }

  async actualizar(actividad) {

    const { data, error } =
      await supabase
        .from('actividades')
        .update({
          nombre: actividad.nombre,
          descripcion: actividad.descripcion,
          color: actividad.color,
          activo: actividad.activo,
          duracion_default_minutos:
            actividad.duracionDefaultMinutos,
          actualizado_en:
            new Date().toISOString()
        })
        .eq('id', actividad.id)
        .select()
        .single();

    if (error) throw error;

    return filaAActividad(data);
  }
}

export class EventoRepositorySupabase {

  async guardar(evento) {

    const { data, error } =
      await supabase
        .from('eventos')
        .insert(this._aFila(evento))
        .select()
        .single();

    if (error) {
      throw this._traducirError(error);
    }

    return filaAEvento(data);
  }

  async guardarVarios(eventos) {

    if (eventos.length === 0) {
      return [];
    }

    const { data, error } =
      await supabase
        .from('eventos')
        .insert(
          eventos.map(e => this._aFila(e))
        )
        .select();

    if (error) {
      throw this._traducirError(error);
    }

    return data.map(filaAEvento);
  }

  async buscarPorId(id) {

    const { data, error } =
      await supabase
        .from('eventos')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (error) throw error;

    return data
      ? filaAEvento(data)
      : null;
  }

  async listarPorRango({
    desde,
    hasta,
    recursoId,
    actividadId
  }) {

    let query =
      supabase
        .from('eventos')
        .select('*')
        .lt('fecha_inicio', hasta.toISOString())
        .gt('fecha_fin', desde.toISOString())
        .neq('estado', 'cancelado')
        .order('fecha_inicio');

    if (recursoId) {
      query = query.eq('recurso_id', recursoId);
    }

    if (actividadId) {
      query = query.eq('actividad_id', actividadId);
    }

    const { data, error } =
      await query;

    if (error) throw error;

    return data.map(filaAEvento);
  }

  async existeSolapamiento({
    recursoId,
    fechaInicio,
    fechaFin,
    excluirEventoId = null
  }) {

    let query =
      supabase
        .from('eventos')
        .select('id', {
          count: 'exact',
          head: true
        })
        .eq('recurso_id', recursoId)
        .eq('estado', 'programado')
        .lt('fecha_inicio', fechaFin.toISOString())
        .gt('fecha_fin', fechaInicio.toISOString());

    if (excluirEventoId) {
      query = query.neq('id', excluirEventoId);
    }

    const { count, error } =
      await query;

    if (error) throw error;

    return count > 0;
  }

  async cancelar(id) {

    const { data, error } =
      await supabase
        .from('eventos')
        .update({
          estado: 'cancelado',
          actualizado_en:
            new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;

    return filaAEvento(data);
  }

  _aFila(evento) {

    return {
      recurso_id: evento.recursoId,
      actividad_id: evento.actividadId,
      regla_recurrencia_id:
        evento.reglaRecurrenciaId,

      titulo: evento.titulo,
      descripcion: evento.descripcion,

      fecha_inicio:
        evento.fechaInicio.toISOString(),

      fecha_fin:
        evento.fechaFin.toISOString(),

      duracion_minutos:
        evento.duracionMinutos,

      estado: evento.estado,
      es_excepcion:
        evento.esExcepcion
    };
  }

  _traducirError(error) {

    if (error.code === '23P01') {
      return new ConflictoDeHorarioError();
    }

    return error;
  }
}
