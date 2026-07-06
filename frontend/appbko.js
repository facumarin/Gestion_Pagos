// frontend/app.js (Orquestador Central - Marca Blanca Real) - PARTE 1
import { iniciarRelojLocal } from './src/reloj.js';
import { configurarNavegacion } from './src/navegacion.js';
import { obtenerDatosDashboard } from './src/api.js';
import { configurarModalPago } from './src/modals/modal-pago.js';
import { configurarModalSocio } from './src/modals/modal-socio.js';
import { exportarExcelContable, exportarPDFContable } from './src/reportes.js';

let todosLosSocios = [];

function aplicarConfiguracionVisual() {
  const cfg = window.AppConfig;
  if (!cfg) return;
  // 🔌 MARCA BLANCA LOGIN: Inyectamos el nombre dinámico y un placeholder universal
  const subtituloLogin = document.getElementById('login-subtitulo-dinamico');
  if (subtituloLogin) {
    subtituloLogin.innerText = `${cfg.nombre} - Panel Administrativo`;
  }
  
  const emailInput = document.getElementById('login-email');
  if (emailInput) {
    // Texto 100% genérico para cualquier club, academia o cliente del SaaS
    emailInput.placeholder = 'ejemplo@institucion.com'; 
  }

  const imgEscudo = document.getElementById('app-escudo-img');
  if (imgEscudo) {
    imgEscudo.src = cfg.escudoUrl;
    imgEscudo.onerror = function() {
      this.style.display = 'none';
      // 💼 CORRECCIÓN: Usamos un emoji neutro universal para cualquier rubro comercial
      this.parentElement.innerHTML = cfg.emojiDefecto || '📁'; 
    };
  }

  document.getElementById('app-nombre-entidad').innerText = cfg.nombre;
  document.getElementById('app-subtitulo-entidad').innerText = cfg.subtitulo;
  document.getElementById('menu-txt-plural').innerText = cfg.terminos.plural;
  document.getElementById('btn-txt-nuevo').innerText = `+ ${cfg.terminos.nuevoEntidad}`;
  document.getElementById('th-dashboard-entidad').innerText = `${cfg.terminos.singular} / Nombre`;
  document.getElementById('th-padron-entidad').innerText = `${cfg.terminos.singular} / Ficha`;
  document.getElementById('txt-modal-titulo-alta').innerText = cfg.terminos.nuevoEntidad;
}
// =======================================================
// 📊 FUNCIÓN CENTRAL: SINCRONIZA LA RED CON LA PANTALLA (PARTE 2)
// =======================================================
async function cargarDashboard() {
  try {
    const datos = await obtenerDatosDashboard();
    todosLosSocios = datos.socios;

    document.getElementById('txt-total').innerText = datos.metricas.totalSocios;
    document.getElementById('txt-verdes').innerText = datos.metricas.verdes;
    document.getElementById('txt-amarillos').innerText = datos.metricas.amarillos;
    document.getElementById('txt-rojos').innerText = datos.metricas.rojos;

    const totalObligados = datos.metricas.verdes + datos.metricas.amarillos + datos.metricas.rojos;
    const montoBase = window.AppConfig?.montoBaseDefault || 5000;

    document.getElementById('txt-caja-estimada').innerText = `$${(totalObligados * montoBase).toLocaleString('es-AR')},00`;
    document.getElementById('txt-caja-real').innerText = `$${(datos.metricas.verdes * montoBase).toLocaleString('es-AR')},00`;
    document.getElementById('txt-caja-mora').innerText = `$${((datos.metricas.amarillos + datos.metricas.rojos) * montoBase).toLocaleString('es-AR')},00`;

    renderizarTabla(todosLosSocios);
    renderizarPadronSocios(todosLosSocios); 
  } catch (error) {
    document.getElementById('tabla-socios-body').innerHTML = `
      <tr><td colspan="5" class="p-8 text-center text-red-500 font-semibold">❌ No se pudo conectar con el backend (Puerto 3000).</td></tr>
    `;
  }
}

function renderizarTabla(listaDeSocios) {
  const tbody = document.getElementById('tabla-socios-body');
  if (!tbody) return;

  const estilosSemaforo = {
    'Verde': 'bg-green-100 text-green-800 border-green-500',
    'Amarillo': 'bg-amber-100 text-amber-800 border-amber-500',
    'Rojo': 'bg-rose-100 text-rose-800 border-rose-500'
  };

  tbody.innerHTML = listaDeSocios.map(socio => {
    const claseColor = estilosSemaforo[socio.estadoSemaforo] || 'bg-gray-100 text-gray-800';
    return `
      <tr class="border-b border-gray-100 hover:bg-gray-50 transition text-sm">
        <td class="p-4 font-semibold text-gray-900">${socio.nombre} ${socio.apellido || ''}</td>
        <td class="p-4 text-gray-600">${socio.dni}</td>
        <td class="p-4 text-gray-500"><span class="px-2 py-0.5 bg-gray-100 rounded text-xs">${socio.tipo}</span></td>
        <td class="p-4 text-center">
          <span class="px-3 py-1 rounded-full text-xs font-bold border-l-4 ${claseColor}">${socio.estadoSemaforo}</span>
        </td>
        <td class="p-4 text-right space-x-1">
          <button onclick="abrirModalConfirmarPago('${socio.id}')" class="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold py-1.5 px-3 rounded border border-emerald-200 transition cursor-pointer">💵 Cobrar</button>
          <button onclick="abrirModalWhatsApp('${socio.id}')" class="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-1.5 px-3 rounded border border-blue-200 transition cursor-pointer">💬 Alerta</button>
        </td>
      </tr>
    `;
  }).join('');
}
// frontend/app.js (Orquestador Central - Marca Blanca Real) - PARTE 3

function renderizarPadronSocios(listaDeSocios) {
  const tbody = document.getElementById('tabla-padron-body');
  if (!tbody) return;

  tbody.innerHTML = listaDeSocios.map(socio => {
    const esActivo = socio.estado !== 'Inactivo'; 
    const claseEstado = esActivo ? 'bg-emerald-100 text-emerald-800 border-emerald-500' : 'bg-gray-100 text-gray-600 border-gray-300';
    const textoBotonBaja = esActivo ? '🔻 Baja' : '🟢 Activar';
    const completoNombre = `${socio.nombre} ${socio.apellido || ''}`.trim();
    const nombreEscapado = completoNombre.replace(/'/g, "\\'");

    return `
      <tr class="border-b border-gray-100 hover:bg-gray-50 transition text-sm">
        <td class="p-4 font-bold text-gray-900">${completoNombre}</td>
        <td class="p-4 text-gray-600 font-mono">${socio.dni}</td>
        <td class="p-4">
          <div class="text-gray-700 font-medium">${socio.telefono || 'Sin número'}</div>
          <div class="text-gray-400 text-xs">${socio.email || 'Sin correo'}</div>
        </td>
        <td class="p-4"><span class="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-semibold">${socio.tipo}</span></td>
        <td class="p-4 text-center text-gray-600 font-medium">
          ${socio.fechaAlta ? new Date(socio.fechaAlta).toLocaleDateString('es-ES') : '-'}
        </td> 
        <td class="p-4 text-center">
          <span class="px-2.5 py-0.5 rounded-full text-xs font-bold border-l-4 ${claseEstado}">${esActivo ? 'Activo' : 'Inactivo'}</span>
        </td>
        <td class="p-4 text-right space-x-1 flex justify-end gap-1">
          <button onclick="toggleBajaSocio('${socio.id}')" class="text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-1 px-2 rounded border border-gray-200 transition cursor-pointer">${textoBotonBaja}</button>
          <button onclick="abrirModalEditarSocio('${socio.id}')" class="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-1 px-2 rounded border border-blue-200 transition cursor-pointer">✏️</button>
          <button onclick="eliminarSocioPadrón('${socio.id}', '${nombreEscapado}')" class="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-1 px-2 rounded border border-rose-200 transition cursor-pointer">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

window.abrirModalEditarSocio = function(idSocio) {
  const socio = todosLosSocios.find(s => s.id === idSocio);
  if (!socio) return;

  document.getElementById('edit-form-id').value = socio.id;
  document.getElementById('edit-form-nombre').value = socio.nombre;
  document.getElementById('edit-form-apellido').value = socio.apellido || '';
  document.getElementById('edit-form-dni').value = socio.dni;
  document.getElementById('edit-form-telefono').value = socio.telefono || '';
  document.getElementById('edit-form-email').value = socio.email || '';
  document.getElementById('edit-form-direccion').value = socio.direccion || '';
  document.getElementById('edit-form-tipo').value = socio.tipo || '';
  document.getElementById('edit-form-monto').value = socio.montoCuota || 5000;
  document.getElementById('edit-form-notas').value = socio.notas || '';
  document.getElementById('edit-form-actividad').value = socio.actividad || '';
  document.getElementById('edit-form-categoria').value = socio.categoria || '';

  if (socio.fechaNacimiento) {
    document.getElementById('edit-form-nacimiento').value = socio.fechaNacimiento.split('T')[0];
  }
  if (socio.fechaVencimiento) {
    document.getElementById('edit-form-vencimiento').value = socio.fechaVencimiento.split('T')[0];
  }
  document.getElementById('modal-editar-socio').classList.remove('hidden');
}

window.cerrarModalEditarSocio = function() {
  document.getElementById('modal-editar-socio').classList.add('hidden');
}

window.toggleBajaSocio = function(idSocio) {
  const socio = todosLosSocios.find(s => s.id === idSocio);
  if (!socio) return;
  const esActivo = socio.estado !== 'Inactivo';
  const proximoEstado = esActivo ? 'Inactivo' : 'Activo';

  document.getElementById('lbl-baja-titulo').innerText = esActivo ? '🔻 Confirmar Baja' : '🟢 Activar Miembro';
  document.getElementById('lbl-baja-nombre').innerText = `${socio.nombre} ${socio.apellido || ''}`;

  const btnEjecutar = document.getElementById('btn-baja-ejecutar');
  btnEjecutar.onclick = async function() {
    try {
      await fetch(`http://localhost:3000/socios/${idSocio}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...socio, estado: proximoEstado })
      });
      document.getElementById('modal-baja-confirmar').classList.add('hidden');
      await cargarDashboard();
    } catch (error) {
      alert("❌ Error de conexión al procesar el cambio de estado.");
    }
  };
  document.getElementById('modal-baja-confirmar').classList.remove('hidden');
}

window.eliminarSocioPadrón = function(idSocio, nombreSocio) {
  document.getElementById('lbl-eliminar-nombre').innerText = nombreSocio;
  const btnEjecutar = document.getElementById('btn-eliminar-ejecutar');
  btnEjecutar.onclick = async function() {
    try {
      const res = await fetch(`http://localhost:3000/socios/${idSocio}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      document.getElementById('modal-eliminar-confirmar').classList.add('hidden');
      await cargarDashboard();
    } catch (error) {
      alert("❌ Error de comunicación con la base de datos cloud.");
    }
  };
  document.getElementById('modal-eliminar-confirmar').classList.remove('hidden');
}
// frontend/app.js (Orquestador Central - Marca Blanca Real) - PARTE 4

// --- WHATSAPP ---
let socioWhatsAppActivo = null;
let tipoNotificacionActual = 'vencido';

window.abrirModalWhatsApp = function (idSocio) {
  const socio = todosLosSocios.find(s => s.id === idSocio);
  if (!socio) return;
  socioWhatsAppActivo = socio;
  tipoNotificacionActual = socio.estadoSemaforo === 'Rojo' ? 'vencido' : 'proximo';
  
  document.getElementById('wa-socio-nombre').innerText = `${socio.nombre} ${socio.apellido || ''}`;
  document.getElementById('wa-socio-telefono').innerText = socio.telefono || 'Sin número';
  document.getElementById('wa-socio-iniciales').innerText = socio.nombre.substring(0, 2).toUpperCase();
  
  actualizarDiseñoBotonesTipoRecordatorio();
  armarPlantillaMensajeTexto();
  document.getElementById('modal-whatsapp').classList.remove('hidden');
}

window.cerrarModalWhatsApp = function () {
  document.getElementById('modal-whatsapp').classList.add('hidden');
}

window.cambiarTipoMensajeWhatsApp = function (nuevoTipo) {
  tipoNotificacionActual = nuevoTipo;
  actualizarDiseñoBotonesTipoRecordatorio();
  armarPlantillaMensajeTexto();
}

function actualizarDiseñoBotonesTipoRecordatorio() {
  const btnVencido = document.getElementById('btn-wa-vencido');
  const btnProximo = document.getElementById('btn-wa-proximo');
  if (tipoNotificacionActual === 'vencido') {
    btnVencido.className = "p-3 border-2 border-rose-500 rounded-xl text-left transition bg-rose-50/50 cursor-pointer";
    btnProximo.className = "p-3 border-2 border-gray-200 rounded-xl text-left transition hover:border-amber-400 cursor-pointer";
  } else {
    btnVencido.className = "p-3 border-2 border-gray-200 rounded-xl text-left transition hover:border-rose-400 cursor-pointer";
    btnProximo.className = "p-3 border-2 border-amber-500 rounded-xl text-left transition bg-amber-50/50 cursor-pointer";
  }
}

function armarPlantillaMensajeTexto() {
  if (!socioWhatsAppActivo) return;
  const txt = tipoNotificacionActual === 'vencido' ? 'VENCIDO' : 'próxima a vencer';
  document.getElementById('txt-wa-cuerpo').value = `Hola ${socioWhatsAppActivo.nombre},\n\nTe recordamos que tu cuota de $${socioWhatsAppActivo.montoCuota || 5000} se encuentra en estado ${txt}.`;
}

window.dispararPestañaWhatsApp = function () {
  const urlFinal = `https://wa.me/${socioWhatsAppActivo.telefono}?text=${encodeURIComponent(document.getElementById('txt-wa-cuerpo').value)}`;
  window.open(urlFinal, '_blank');
  document.getElementById('modal-whatsapp').classList.add('hidden');
}

// --- COBROS ---
let socioCobroActivo = null;
let modalidadCobroActual = 'total';

window.abrirModalConfirmarPago = function (idSocio) {
  const socio = todosLosSocios.find(s => s.id === idSocio);
  if (!socio) return;
  socioCobroActivo = socio;
  modalidadCobroActual = 'total';

  // Deshardcodeado dinámico leyendo el AppConfig o el monto de base real del socio
  let montoPlan = parseFloat(socio.montoCuota || socio.monto_cuota);
  if (isNaN(montoPlan) || montoPlan === 0) {
    montoPlan = window.AppConfig?.montoBaseDefault || 5000;
  }

  // Si tu módulo recargosMora está en true en config.js y el socio está en Rojo, sumamos el 5% de la reunión
  if (window.AppConfig?.modulosActivos?.recargosMora && socio.estadoSemaforo === 'Rojo') {
    const recargo = (montoPlan * 5) / 100;
    montoPlan = montoPlan + recargo;
  }

  document.getElementById('pago-socio-nombre').innerText = `${socio.nombre} ${socio.apellido || ''}`;
  document.getElementById('pago-servicio-txt').innerText = socio.tipo || 'Cuota';
  document.getElementById('pago-monto-txt').innerText = `$${montoPlan.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  document.getElementById('pago-vencimiento-txt').innerText = socio.fechaVencimiento || socio.fecha_vencimiento ? new Date(socio.fechaVencimiento || socio.fecha_vencimiento).toLocaleDateString('es-AR') : '-';
  
  document.getElementById('txt-pago-notas').value = '';
  document.getElementById('input-monto-parcial').value = montoPlan;
  document.getElementById('contenedor-monto-parcial').classList.add('hidden');
  actualizarDiseñoBotonesCobro();
  document.getElementById('modal-confirmar-pago').classList.remove('hidden');
}

window.cerrarModalConfirmarPago = function () {
  document.getElementById('modal-confirmar-pago').classList.add('hidden');
}

window.seleccionarTipoCobro = function (modalidad) {
  modalidadCobroActual = modalidad;
  actualizarDiseñoBotonesCobro();
  if (modalidad === 'parcial') {
    document.getElementById('contenedor-monto-parcial').classList.remove('hidden');
  } else {
    document.getElementById('contenedor-monto-parcial').classList.add('hidden');
  }
}

function actualizarDiseñoBotonesCobro() {
  const btnTotal = document.getElementById('btn-pago-total');
  const btnParcial = document.getElementById('btn-pago-parcial');
  if (modalidadCobroActual === 'total') {
    btnTotal.className = "p-3 border-2 border-emerald-500 rounded-xl bg-emerald-50/50 cursor-pointer text-center";
    btnParcial.className = "p-3 border-2 border-gray-200 rounded-xl cursor-pointer text-center";
  } else {
    btnTotal.className = "p-3 border-2 border-gray-200 rounded-xl cursor-pointer text-center";
    btnParcial.className = "p-3 border-2 border-amber-500 rounded-xl bg-amber-50/50 cursor-pointer text-center";
  }
}

window.procesarCobroDefinitivo = async function () {
  if (!socioCobroActivo) return;
  const notas = document.getElementById('txt-pago-notas').value.trim();
  const medio = document.getElementById('select-pago-medio').value;
  
  let montoACobrar = parseFloat(socioCobroActivo.montoCuota || 5000);
  if (modalidadCobroActual === 'parcial') {
    montoACobrar = parseFloat(document.getElementById('input-monto-parcial').value) || 0;
  }

  try {
    const res = await fetch(`http://localhost:3000/socios/${socioCobroActivo.id}/cobrar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monto: montoACobrar, medioPago: medio, notas })
    });
    if (!res.ok) throw new Error();

    document.getElementById('modal-confirmar-pago').classList.add('hidden');
    document.getElementById('lbl-pagoexito-nombre').innerText = `${socioCobroActivo.nombre} ${socioCobroActivo.apellido || ''}`;
    document.getElementById('lbl-pagoexito-monto').innerText = `$${montoACobrar.toLocaleString('es-AR', {minimumFractionDigits: 2})}`;
    document.getElementById('lbl-pagoexito-tipo').innerText = modalidadCobroActual === 'total' ? 'Pago Total' : 'Pago Parcial';
    document.getElementById('modal-pago-exito').classList.remove('hidden');
    await cargarDashboard();
  } catch (error) {
    alert("❌ Error al registrar el cobro en Supabase.");
  }
}

// =======================================================
// 🚀 INICIALIZADOR CENTRAL DEL DOM
// =======================================================
document.addEventListener('DOMContentLoaded', () => {
  aplicarConfiguracionVisual();
  iniciarRelojLocal();
  configurarNavegacion();
  configurarModalPago(cargarDashboard);
  configurarModalSocio(() => todosLosSocios, cargarDashboard);
  cargarDashboard();

  document.getElementById('input-buscador').addEventListener('input', (e) => {
    const txt = e.target.value.toLowerCase().trim();
    const filtrados = todosLosSocios.filter(s => 
      s.nombre.toLowerCase().includes(txt) || 
      (s.apellido && s.apellido.toLowerCase().includes(txt)) || 
      s.dni.toString().includes(txt)
    );
    renderizarTabla(filtrados);
  });

  document.getElementById('input-buscador-padron').addEventListener('input', (e) => {
    const txt = e.target.value.toLowerCase().trim();
    const filtrados = todosLosSocios.filter(s => 
      s.nombre.toLowerCase().includes(txt) || 
      (s.apellido && s.apellido.toLowerCase().includes(txt)) || 
      s.dni.toString().includes(txt)
    );
    renderizarPadronSocios(filtrados);
  });

  document.getElementById('form-editar-socio').addEventListener('submit', async (e) => {
    e.preventDefault();
    const idSocio = document.getElementById('edit-form-id').value;
    const datos = {
      nombre: document.getElementById('edit-form-nombre').value.trim(),
      apellido: document.getElementById('edit-form-apellido').value.trim(),
      telefono: document.getElementById('edit-form-telefono').value.trim(),
      email: document.getElementById('edit-form-email').value.trim(),
      direccion: document.getElementById('edit-form-direccion').value.trim(),
      tipo: document.getElementById('edit-form-tipo').value.trim(),
      montoCuota: parseFloat(document.getElementById('edit-form-monto').value) || 5000,
      fechaVencimiento: document.getElementById('edit-form-vencimiento').value,
      actividad: document.getElementById('edit-form-actividad').value.trim(),
      categoria: document.getElementById('edit-form-categoria').value.trim(),
      notas: document.getElementById('edit-form-notas').value.trim()
    };
    try {
      const res = await fetch(`http://localhost:3000/socios/${idSocio}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });
      if (!res.ok) throw new Error();
      document.getElementById('modal-editar-socio').classList.add('hidden');
      document.getElementById('lbl-editexito-nombre').innerText = `${datos.nombre} ${datos.apellido}`;
      document.getElementById('modal-editar-exito').classList.remove('hidden');
      await cargarDashboard();
    } catch (error) {
      alert("❌ Error al actualizar la ficha del socio.");
    }
  });

    // =======================================================
  // 🔒 MOTOR DE LOGIN SEGURO CONECTADO A SUPABASE AUTH (FINAL)
  // =======================================================
  const formLogin = document.getElementById('form-login-administrativo');
  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const emailIngresado = document.getElementById('login-email').value.trim();
      const passwordIngresada = document.getElementById('login-password').value;
      const errorMsg = document.getElementById('login-error-msg');

      try {
        // 📡 Disparamos la petición HTTP POST segura hacia tu endpoint de Node
        const res = await fetch('http://localhost:3000/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailIngresado, password: passwordIngresada })
        });

        const datosRespuesta = await res.json();

        if (!res.ok) {
          throw new Error(datosRespuesta.error || "Rebote de autenticación.");
        }

        // Si las credenciales coinciden en Supabase, ocultamos la alerta y levantamos la barrera
        if (errorMsg) errorMsg.classList.add('hidden');
        document.getElementById('contenedor-login').classList.add('hidden');

      } catch (error) {
        // Si la clave es incorrecta o no hay internet, prendemos el cartel rojo estético
        if (errorMsg) {
          errorMsg.innerText = `❌ ${error.message}`;
          errorMsg.classList.remove('hidden');
        }
      }
    });
  }


});

window.filtrarPorSemaforo = function (color) {
  if (color === 'Todos') return renderizarTabla(todosLosSocios);
  renderizarTabla(todosLosSocios.filter(s => s.estadoSemaforo === color));
}
