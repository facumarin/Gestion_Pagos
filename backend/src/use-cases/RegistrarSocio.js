import { Socio } from '../domain/socio.js';

export class RegistrarSocio {
  // DIP: Recibimos el repositorio por el constructor. 
  // No hacemos un "new" de la memoria acá adentro.
  constructor(socioRepository) {
    this.socioRepository = socioRepository;
  }

  async ejecutar(datosSocio) {
    // 1. Aplicamos KISS/SOLID: Validamos si el DNI ya existe para evitar duplicados
    const socioExistente = await this.socioRepository.buscarPorDni(datosSocio.dni);
    if (socioExistente) {
      throw new Error(`El DNI ${datosSocio.dni} ya se encuentra registrado en el sistema.`);
    }

    // 2. Creamos la entidad de dominio con un ID único del sistema
    const nuevoSocio = new Socio({
      id: crypto.randomUUID(), // Genera un ID único e imbatible de forma nativa en Node.js
      ...datosSocio
    });

    // 3. El socio se valida a sí mismo (Reglas de negocio del dominio)
    nuevoSocio.validar();

    // 4. Lo mandamos a guardar a través del contrato del repositorio
    return await this.socioRepository.guardar(nuevoSocio);
  }
}
