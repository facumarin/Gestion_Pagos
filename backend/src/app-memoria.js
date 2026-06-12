// 1. Importamos la Infraestructura de Datos (Memoria por ahora)
import { MemoriaSocioRepository } from './infrastructure/MemoriaSocioRepository.js';
import { MemoriaCuotaRepository } from './infrastructure/MemoriaCuotaRepository.js';

// 2. Importamos los Casos de Uso (La lógica del negocio)
import { RegistrarSocio } from './use-cases/RegistrarSocio.js';
import { GenerarCuotasMensuales } from './use-cases/GenerarCuotasMensuales.js';
import { ObtenerDashboard } from './use-cases/ObtenerDashboard.js';

// 3. Importamos el Servidor Express
import { ExpressServer } from './infrastructure/ExpressServer.js';

// --- INYECCIÓN DE DEPENDENCIAS MANUALLY (SÚPER SOLID Y KISS) ---

// Paso A: Instanciamos los repositorios (Los datos)
const socioRepository = new MemoriaSocioRepository();
const cuotaRepository = new MemoriaCuotaRepository();

// Paso B: Instanciamos los casos de uso pasándole sus herramientas/datos
const registrarSocioUC = new RegistrarSocio(socioRepository);
const generarCuotasUC = new GenerarCuotasMensuales(socioRepository, cuotaRepository);
const obtenerDashboardUC = new ObtenerDashboard(socioRepository, cuotaRepository);

// Paso C: Inicializamos el servidor metiéndole los casos de uso adentro
const servidor = new ExpressServer(registrarSocioUC, generarCuotasUC, obtenerDashboardUC);


// --- DATOS DE PRUEBA EN EL ARRANQUE (KISS) ---
async function precargarDatosDePrueba() {
  try {
    // Registramos 4 socios con diferentes categorías
    const socio1 = await registrarSocioUC.ejecutar({ nombre: "Juan Pérez", dni: "12345678", telefono: "5493446112233", email: "juan@email.com", tipo: "Individual" });
    const socio2 = await registrarSocioUC.ejecutar({ nombre: "Carlos Gómez (Titular)", dni: "87654321", telefono: "5493446445566", email: "carlos@email.com", tipo: "Titular" });
    const socio3 = await registrarSocioUC.ejecutar({ nombre: "Nico Gómez (Hijo)", dni: "55556666", telefono: "5493446445566", email: "nico@email.com", tipo: "Adherente", idTitular: socio2.id });
    const socio4 = await registrarSocioUC.ejecutar({ nombre: "Marta Rodríguez", dni: "99991111", telefono: "5493446778899", email: "marta@email.com", tipo: "Individual" });

    const hoy = new Date();
    const mesActual = hoy.getMonth() + 1;
    const anioActual = hoy.getFullYear();

    // Generamos las cuotas automáticas del mes actual para todos
    await generarCuotasUC.ejecutar({ mes: mesActual, anio: anioActual, montoCuota: 5000 });

    // A Juan (Socio 1) le marcamos la cuota del mes actual como PAGADA (Semáforo Verde)
    const cuotasJuan = await cuotaRepository.buscarPorSocio(socio1.id);
    if (cuotasJuan.length > 0) {
      const cuotaAModificar = cuotasJuan[0];
      cuotaAModificar.pagada = true;
      cuotaAModificar.fechaPago = new Date();
      await cuotaRepository.actualizar(cuotaAModificar);
    }

    // A Marta (Socio 4) le creamos una de las deudas del mes anterior no pagada (Semáforo Rojo)
    const mesPasado = mesActual === 1 ? 12 : mesActual - 1;
    const anioPasado = mesActual === 1 ? anioActual - 1 : anioActual;
    
    await cuotaRepository.guardar(new (await import('./domain/Cuota.js')).Cuota({
      id: crypto.randomUUID(),
      idSocio: socio4.id,
      mes: mesPasado,
      anio: anioPasado,
      monto: 4500,
      pagada: false
    }));

    console.log("✅ Datos de prueba inyectados con éxito.");
  } catch (error) {
    console.error("Error cargando datos de prueba:", error.message);
  }
}

// Ejecutamos la precarga antes de abrir el puerto
await precargarDatosDePrueba();

// Paso D: Encendemos el backend local en el puerto 3000
servidor.iniciar(3000);