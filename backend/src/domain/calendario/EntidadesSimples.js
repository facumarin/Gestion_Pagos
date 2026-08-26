export class Recurso {
  constructor({
    id,
    nombre,
    tipo,
    descripcion = null,
    capacidad = null,
    color = null,
    activo = true
  }) {
    if (!nombre?.trim()) {
      throw new Error('Recurso requiere un nombre');
    }

    if (!tipo?.trim()) {
      throw new Error('Recurso requiere un tipo');
    }

    this.id = id;
    this.nombre = nombre;
    this.tipo = tipo;
    this.descripcion = descripcion;
    this.capacidad = capacidad;
    this.color = color;
    this.activo = activo;
  }

  desactivar() {
    this.activo = false;
  }
}

export class Actividad {
  constructor({
    id,
    nombre,
    descripcion = null,
    color = null,
    duracionDefaultMinutos = null,
    activo = true
  }) {
    if (!nombre?.trim()) {
      throw new Error('Actividad requiere un nombre');
    }

    this.id = id;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.color = color;
    this.duracionDefaultMinutos = duracionDefaultMinutos;
    this.activo = activo;
  }

  desactivar() {
    this.activo = false;
  }
}
