import { Cuota } from '../domain/Cuota.js';

export class GenerarCuotasMensuales {
  // Recibimos ambos repositorios por inyección de dependencias
  constructor(socioRepository, cuotaRepository) {
    this.socioRepository = socioRepository;
    this.cuotaRepository = cuotaRepository;
  }

  async ejecutar({ mes, anio, montoCuota }) {
    // 1. Traemos todos los socios registrados
    const todosLosSocios = await this.socioRepository.listarTodos();
    const cuotasGeneradas = [];

    // 2. Recorremos los socios aplicando las reglas de negocio
    for (const socio of todosLosSocios) {
      
      // Regla del Plan Familiar: Omitimos adherentes (solo pagan Individuales y Titulares)
      if (!socio.debePagarCuota() || socio.estado !== 'Activo') {
        continue; 
      }

      // Protección de Idempotencia (KISS): Evitamos duplicar cuotas si se corre el proceso dos veces
      const cuotaExistente = await this.cuotaRepository.buscarCuotaEspecifica(socio.id, mes, anio);
      if (cuotaExistente) {
        continue; // Si ya existe la cuota para este mes/año, saltamos al siguiente socio
      }

      // 3. Instanciamos la nueva Cuota de Dominio
      const nuevaCuota = new Cuota({
        id: crypto.randomUUID(),
        idSocio: socio.id,
        mes: mes,
        anio: anio,
        monto: montoCuota,
        pagada: false
      });

      // 4. Guardamos la cuota a través de su repositorio
      await this.cuotaRepository.guardar(nuevaCuota);
      cuotasGeneradas.push(nuevaCuota);
    }

    return {
      mensaje: `Proceso finalizado con éxito.`,
      cuotasCreadas: cuotasGeneradas.length
    };
  }
}
