// frontend/src/modals/modal-socio.js - PARTE 1
export function configurarModalSocio(obtenerSociosFn, recargarDashboardFn) {
  const form = document.getElementById('form-nuevo-socio');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nuevoSocio = {
      nombre: document.getElementById('form-nombre').value.trim(),
      apellido: document.getElementById('form-apellido').value.trim(),
      dni: document.getElementById('form-dni').value.trim(),
      telefono: document.getElementById('form-telefono').value.trim(),
      email: document.getElementById('form-email').value.trim(),
      direccion: document.getElementById('form-direccion').value.trim() || null,
      actividad: document.getElementById('form-actividad').value.trim(),
      categoria: document.getElementById('form-categoria').value.trim(),      
      // 🔌 ADAPTADOR DUAL: Enviamos ambos formatos para que Supabase capture la fecha sí o sí
      fechaNacimiento: document.getElementById('form-nacimiento').value || null,
      fecha_nacimiento: document.getElementById('form-nacimiento').value || null,
      tipo: document.getElementById('form-tipo').value,
      id_titular: document.getElementById('form-id-titular')?.value || null,
      idTitular: document.getElementById('form-id-titular')?.value || null,
      montoCuota: parseFloat(document.getElementById('form-monto').value) || 5000,
      fechaVencimiento: document.getElementById('form-vencimiento').value || null,
      fecha_vencimiento: document.getElementById('form-vencimiento').value || null,
      notas: document.getElementById('form-notas').value.trim() || null
    };

    try {
      const res = await fetch('http://localhost:3000/socios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoSocio)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar.");

      window.cerrarModalSocio();
      document.getElementById('lbl-exito-nombre').innerText = `${data.nombre} ${data.apellido || ''}`.trim();
      document.getElementById('lbl-exito-dni').innerText = data.dni;
      document.getElementById('lbl-exito-plan').innerText = data.tipo;
      document.getElementById('modal-exito-socio').classList.remove('hidden');
      await recargarDashboardFn();
    } catch (error) {
      alert(`⚠️ Error: ${error.message}`);
    }
  });
}
// frontend/src/modals/modal-socio.js - PARTE 2

window.abrirModalSocio = function() {
  const selectTipo = document.getElementById('form-tipo');
  if (selectTipo && window.AppConfig) {
    // 🔌 CONEXIÓN CONFIG REAL: Mapea tu array real de planesDisponibles
    selectTipo.innerHTML = window.AppConfig.planesDisponibles.map(p => 
      `<option value="${p}">${p}</option>`
    ).join('');
    
    // Asignamos tu monto base por defecto ($5000) de forma automática al abrir
    document.getElementById('form-monto').value = window.AppConfig.montoBaseDefault || 5000;
  }
  
  const hoy = new Date();
  hoy.setMonth(hoy.getMonth() + 1);
  document.getElementById('form-vencimiento').value = hoy.toISOString().split('T')[0];
  document.getElementById('modal-socio').classList.remove('hidden');
}

window.cerrarModalSocio = function() {
  document.getElementById('modal-socio').classList.add('hidden');
  document.getElementById('form-nuevo-socio').reset();
  document.getElementById('contenedor-titular-alta').classList.add('hidden');
}

window.cerrarModalExitoSocio = function() {
  document.getElementById('modal-exito-socio').classList.add('hidden');
}

window.verificarSiEsAdherenteAlta = async function() {
  const selectTipo = document.getElementById('form-tipo');
  if (!selectTipo) return;
  
  const tipoSeleccionado = selectTipo.value;
  const rolPrincipalConfig = window.AppConfig?.terminos?.rolPrincipal || 'Titular';

  // Regla de Negocio: Si el plan elegido contiene la palabra Adherente, abrimos el vinculador
  if (tipoSeleccionado.toLowerCase().includes('adherente')) {
    try {
      const res = await fetch('http://localhost:3000/dashboard');
      const datos = await res.json();
      
      // Filtramos los socios que coincidan con tu rolPrincipal ("Titular")
      const titulares = datos.socios.filter(s => s.tipo === rolPrincipalConfig);
      
      const selectTitular = document.getElementById('form-id-titular');
      if (titulares.length === 0) {
        selectTitular.innerHTML = `<option value="">⚠️ No hay ${rolPrincipalConfig}es registrados</option>`;
      } else {
        selectTitular.innerHTML = titulares.map(t => 
          `<option value="${t.id}">${t.nombre} ${t.apellido || ''}</option>`
        ).join('');
      }
      document.getElementById('contenedor-titular-alta').classList.remove('hidden');
    } catch (e) { 
      console.error("Error al cargar titulares por red:", e); 
    }
  } else {
    document.getElementById('contenedor-titular-alta').classList.add('hidden');
  }
}
