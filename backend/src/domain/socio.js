export class Socio {
  constructor({
    id,
    nombre,
    apellido = null,
    dni,
    telefono,
    email = null,
    direccion = null,
    tipo,
    idTitular = null,
    id_titular = null,
    estado = 'Activo',
    actividad = null,
    categoria = null,
    fechaNacimiento = null,
    fecha_nacimiento = null,
    fechaVencimiento = null,
    fecha_vencimiento = null,
    montoCuota = 5000,
    monto_cuota = 5000,
    notas = null
  }) {

    this.id = id;

    this.nombre = nombre;
    this.apellido = apellido;

    this.dni = dni;
    this.telefono = telefono;
    this.email = email;
    this.direccion = direccion;

    this.tipo = tipo;

    this.idTitular =
      idTitular ||
      id_titular ||
      null;

    this.estado = estado;

    this.actividad = actividad;
    this.categoria = categoria;

    this.fechaNacimiento =
      fechaNacimiento ||
      fecha_nacimiento ||
      null;

    this.fechaVencimiento =
      fechaVencimiento ||
      fecha_vencimiento ||
      null;

    this.montoCuota =
      montoCuota ||
      monto_cuota ||
      5000;

    this.notas = notas;
  }

  validar() {
    if (!this.nombre) {
      throw new Error(
        "El nombre del socio es obligatorio."
      );
    }

    if (!this.dni) {
      throw new Error(
        "El DNI es obligatorio para registrar al socio."
      );
    }

    if (
      this.tipo === 'Adherente' &&
      !this.idTitular
    ) {
      throw new Error(
        "Un socio adherente debe estar vinculado a un socio titular."
      );
    }
  }

  debePagarCuota() {
    return (
      this.tipo === 'Individual' ||
      this.tipo === 'Titular'
    );
  }
}