export class RegistrarPago {
  constructor(cuotaRepository) {
    this.cuotaRepository = cuotaRepository;
  }

  async ejecutar({ idSocio, mes, anio }) {
    // Buscamos la cuota específica del socio para ese mes y año
    const cuota = await this.cuotaRepository.buscarCuotaEspecifica(idSocio, mes, anio);
    if (!cuota) throw new Error("No se encontró una cuota pendiente para este período.");

    // Aplicamos la regla de negocio: Cambiamos el estado
    cuota.pagada = true;
    cuota.fechaPago = new Date();

    // Guardamos los cambios a través del repositorio
    return await this.cuotaRepository.actualizar(cuota);
  }
}
