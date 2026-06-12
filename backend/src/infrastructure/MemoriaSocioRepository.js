export class MemoriaSocioRepository {
  constructor() {
    this.socios = []; // Nuestra base de datos en memoria (un array simple)
  }

  // Contrato: Guarda un nuevo socio en el sistema
  async guardar(socio) {
    this.socios.push(socio);
    return socio;
  }

  // Contrato: Busca un socio por su ID único
  async buscarPorId(id) {
    const socio = this.socios.find(s => s.id === id);
    return socio || null;
  }

  // Contrato: Busca un socio por su DNI (útil para el buscador y evitar duplicados)
  async buscarPorDni(dni) {
    const socio = this.socios.find(s => s.dni === dni);
    return socio || null;
  }

  // Contrato: Trae todos los socios (para el listado general del Dashboard)
  async listarTodos() {
    return this.socios;
  }

  // Contrato: Trae los adherentes vinculados a un titular (Plan Familiar)
  async listarAdherentes(idTitular) {
    return this.socios.filter(s => s.idTitular === idTitular);
  }
}
