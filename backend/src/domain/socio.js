export class Socio {
  constructor({ id, nombre, dni, telefono, email, tipo, idTitular = null, estado = 'Activo' }) {
    this.id = id;
    this.nombre = nombre;
    this.dni = dni;
    this.telefono = telefono;
    this.email = email;
    this.tipo = tipo; // 'Individual', 'Titular' o 'Adherente'
    this.idTitular = idTitular; // Si es 'Adherente', aquí va el ID de su Titular
    this.estado = estado; // 'Activo' o 'Inactivo'
  }

  // Regla de Negocio: Valida que los datos obligatorios existan antes de guardar
  validar() {
    if (!this.nombre) throw new Error("El nombre del socio es obligatorio.");
    if (!this.dni) throw new Error("El DNI es obligatorio para registrar al socio.");
    if (this.tipo === 'Adherente' && !this.idTitular) {
      throw new Error("Un socio adherente debe estar vinculado a un socio titular.");
    }
  }

  // Verifica si el socio es el responsable de pagar las cuotas
  debePagarCuota() {
    return this.tipo === 'Individual' || this.tipo === 'Titular';
  }
}
