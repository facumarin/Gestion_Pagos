// backend/src/infrastructure/database.js (Conector Oficial HTTP Supabase)
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargamos las variables de entorno
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error grave: Faltan las variables SUPABASE_URL o SUPABASE_KEY en el archivo .env");
  process.exit(1);
}

// Inicializamos el cliente oficial de internet
export const supabase = createClient(supabaseUrl, supabaseKey);
export default supabase;
// Hacemos una prueba rápida de lectura para verificar que rompió el bloqueo de red
async function probarConexion() {
  try {
    const { data, error } = await supabase.from('socios').select('id').limit(1);
    if (error) throw error;
    console.log("✅ Conexión exitosa a Supabase establecida correctamente por HTTP.");
  } catch (err) {
    console.error("❌ Falló la comunicación con Supabase:", err.message);
  }
}

probarConexion();
