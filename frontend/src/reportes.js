// src/reportes.js

// A. Función para exportar a Excel mediante el formato universal CSV
export function exportarExcelContable(listaSocios) {
  if (listaSocios.length === 0) return alert("❌ No hay datos disponibles para exportar.");

  // 1. Definimos los encabezados del Excel
  let contenidoCsv = "Nombre Completo,DNI,Telefono,Plan,Estado Pago,Monto\n";

  // 2. Recorremos los socios e inyectamos sus filas
  listaSocios.forEach(s => {
    const montoStr =
  String(
    s.montoCuota ||
    s.monto_cuota ||
    0
  );
    const estadoTexto = s.estadoSemaforo === 'Verde' ? "Al Dia" : (s.estadoSemaforo === 'Amarillo' ? "Pendiente" : "Vencido");
    
    // Limpiamos comas por seguridad en los nombres
    const nombreLimpio = s.nombre.replace(/,/g, " ");
    
    contenidoCsv += `${nombreLimpio},${s.dni},${s.telefono || ''},${s.tipo},${estadoTexto},${montoStr}\n`;
  });

  // 3. Truco nativo KISS: Creamos un enlace invisible de descarga en el navegador
  const blob = new Blob([contenidoCsv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", `Reporte_Caja_${new Date().getFullYear()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// B. Función para imprimir en PDF usando el motor nativo del sistema operativo
export function exportarPDFContable() {
  // Truco de arquitectura: usamos la orden nativa de impresión. 
  // El administrativo podrá guardarlo como PDF o mandarlo directo a la impresora física.
  window.print();
}
