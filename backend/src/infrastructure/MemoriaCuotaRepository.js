export class MemoriaCuotaRepository {
  constructor() {
    this.cuotas = []; // Nuestra tabla temporal de cuotas
  }

  // Contrato: Guarda una nueva cuota (sea generada en lote o individual)
  async guardar(cuota) {
    this.cuotas.push(cuota);
    return cuota;
  }

  // Contrato: Busca todas las cuotas de un socio específico (para su historial)
  async buscarPorSocio(idSocio) {
    return this.cuotas.filter(c => c.idSocio === idSocio);
  }

  // Contrato: Busca una cuota específica de un socio para un mes y año concretos
  // Sirve para evitar generar cuotas duplicadas el día 1
  async buscarCuotaEspecifica(idSocio, mes, anio) {
    const cuota = this.cuotas.find(
      c => c.idSocio === idSocio && c.mes === mes && c.anio === anio
    );
    return cuota || null;
  }

  // Contrato: Actualiza el estado de una cuota (cuando el socio paga)
  async actualizar(cuotaModificada) {
    const indice = this.cuotas.findIndex(c => c.id === cuotaModificada.id);
    if (indice !== -1) {
      this.cuotas[indice] = cuotaModificada;
      return cuotaModificada;
    }
    throw new Error("Cuota no encontrada para actualizar.");
  }
}
