// ====================================================================
// Laboratorio Didáctico: Frontend Interactivo (SQLite vs Supabase)
// GearSoftCA - "Impulsa tu negocio con soluciones innovadoras"
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Configuración del proyecto Supabase
  const SUPABASE_URL = 'https://sbrlvyondrlkszmgwrof.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_LVIDg0yFtr_eVHv6JNX27Q_CW2tcZWp';

  // Inicializar cliente Supabase desde el CDN
  const supabaseClient = window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;

  // Estado del modo: 'sqlite' o 'supabase'
  let modoActual = 'sqlite';

  // Referencias a los elementos del DOM
  const btnModoSqlite = document.getElementById('btn-modo-sqlite');
  const btnModoSupabase = document.getElementById('btn-modo-supabase');
  const bannerEstado = document.getElementById('banner-estado');
  const textoEstado = document.getElementById('texto-estado');
  const panelConfigSupabase = document.getElementById('panel-config-supabase');

  const formEstudiante = document.getElementById('form-estudiante');
  const inputNombre = document.getElementById('input-nombre');
  const inputEmail = document.getElementById('input-email');
  const inputComentario = document.getElementById('input-comentario');
  const btnSubmit = document.getElementById('btn-submit');

  const logConsola = document.getElementById('log-consola');
  const listaRegistros = document.getElementById('lista-registros');
  const contadorRegistros = document.getElementById('contador-registros');
  const btnRecargar = document.getElementById('btn-recargar');

  // ------------------------------------------------------------------
  // 1. ALTERNAR ENTRE MODO SQLITE Y MODO SUPABASE
  // ------------------------------------------------------------------
  btnModoSqlite.addEventListener('click', () => activarModo('sqlite'));
  btnModoSupabase.addEventListener('click', () => activarModo('supabase'));

  function activarModo(modo) {
    modoActual = modo;

    if (modo === 'sqlite') {
      btnModoSqlite.classList.add('activo');
      btnModoSupabase.classList.remove('activo');
      panelConfigSupabase.style.display = 'none';

      bannerEstado.className = 'panel-estado estado-tradicional';
      textoEstado.innerHTML = '<strong>Modo Tradicional:</strong> Peticiones enviadas a <code>http://localhost:3000/api/estudiantes</code> (Express + SQLite).';
      btnSubmit.innerHTML = '<span>💾 Guardar Registro con Express + SQLite</span>';
      btnSubmit.style.backgroundColor = '#131D47';

      logConsola.textContent = `// Modo Express + SQLite activo:\n// En este modo, el navegador hace: fetch('/api/estudiantes')\n// y el servidor Node.js ejecuta la consulta SQL local.`;
    } else {
      btnModoSupabase.classList.add('activo');
      btnModoSqlite.classList.remove('activo');
      panelConfigSupabase.style.display = 'block';

      bannerEstado.className = 'panel-estado estado-baas';
      textoEstado.innerHTML = '<strong>Modo BaaS (Cloud):</strong> Conexión directa a Supabase en la nube con su SDK.';
      btnSubmit.innerHTML = '<span>⚡ Guardar Registro en Supabase (Cloud)</span>';
      btnSubmit.style.backgroundColor = '#0E7490';

      logConsola.textContent = `// Modo Supabase activo:\n// En este modo, el navegador se comunica directamente con PostgreSQL Cloud\n// mediante: supabaseClient.from('estudiantes_lab').insert(...)`;
    }

    cargarDatos();
  }

  // ------------------------------------------------------------------
  // 2. LEER DATOS (SELECT)
  // ------------------------------------------------------------------
  async function cargarDatos() {
    listaRegistros.innerHTML = '<li style="justify-content:center; color:#4C4C4C;">Consultando registros...</li>';

    if (modoActual === 'sqlite') {
      // Leer de SQLite vía Express
      try {
        const respuesta = await fetch('/api/estudiantes');
        if (!respuesta.ok) throw new Error('Servidor no responde');
        const datos = await respuesta.json();
        renderizarLista(datos, 'SQLite');
        logConsola.textContent = `// Consulta GET a SQLite exitosa:\n// fetch('/api/estudiantes') devolvió ${datos.length} registros.`;
      } catch (error) {
        listaRegistros.innerHTML = `
          <li style="color:#DC2626; padding:10px; display:block;">
            ❌ <strong>Servidor no detectado:</strong><br>
            Asegúrate de ejecutar en la terminal: <code>npm start</code>
          </li>
        `;
        contadorRegistros.textContent = '0';
      }
    } else {
      // Leer de Supabase Cloud
      try {
        const { data, error } = await supabaseClient
          .from('estudiantes_lab')
          .select('*')
          .order('id', { ascending: false });

        if (error) throw error;
        renderizarLista(data || [], 'Supabase');
        logConsola.textContent = `// Consulta SELECT a Supabase exitosa:\n// supabaseClient.from('estudiantes_lab').select('*') -> ${data ? data.length : 0} registros.`;
      } catch (error) {
        listaRegistros.innerHTML = `<li style="color:#DC2626; justify-content:center;">Error: ${error.message}</li>`;
      }
    }
  }

  function renderizarLista(items, motor) {
    contadorRegistros.textContent = items.length;
    listaRegistros.innerHTML = '';

    if (items.length === 0) {
      listaRegistros.innerHTML = `<li style="justify-content:center; color:#4C4C4C; font-style:italic;">No hay registros en ${motor} aún.</li>`;
      return;
    }

    items.forEach((item) => {
      const li = document.createElement('li');
      const claseBadge = motor === 'SQLite' ? 'item-badge-sqlite' : 'item-badge-supabase';
      li.innerHTML = `
        <div>
          <strong>${item.nombre}</strong> 
          <span style="color:#4C4C4C; font-size:0.82rem;">&lt;${item.email}&gt;</span>
          ${item.comentario ? `<div style="font-size:0.8rem; color:#4C4C4C; margin-top:2px;">"${item.comentario}"</div>` : ''}
        </div>
        <span class="item-badge ${claseBadge}">${motor} #${item.id}</span>
      `;
      listaRegistros.appendChild(li);
    });
  }

  // ------------------------------------------------------------------
  // 3. GUARDAR DATOS (INSERT)
  // ------------------------------------------------------------------
  formEstudiante.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nuevoEstudiante = {
      nombre: inputNombre.value.trim(),
      email: inputEmail.value.trim(),
      comentario: inputComentario.value.trim()
    };

    if (modoActual === 'sqlite') {
      // Guardar en SQLite mediante API REST
      logConsola.textContent = `// Enviando POST a Express:\nfetch('/api/estudiantes', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify(${JSON.stringify(nuevoEstudiante)})\n});`;

      try {
        const respuesta = await fetch('/api/estudiantes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nuevoEstudiante)
        });

        if (!respuesta.ok) throw new Error('Error al guardar en el servidor');
        const resultado = await respuesta.json();

        formEstudiante.reset();
        await cargarDatos();
        alert(`¡Registro #${resultado.id} guardado con éxito en SQLite!`);
      } catch (error) {
        alert('Error: ' + error.message);
      }
    } else {
      // Guardar en Supabase Cloud
      logConsola.textContent = `// Invocando SDK Supabase:\nawait supabaseClient.from('estudiantes_lab').insert([${JSON.stringify(nuevoEstudiante)}]);`;

      try {
        const { error } = await supabaseClient
          .from('estudiantes_lab')
          .insert([nuevoEstudiante]);

        if (error) throw error;

        formEstudiante.reset();
        await cargarDatos();
        alert('¡Registro guardado con éxito en Supabase Cloud!');
      } catch (error) {
        alert('Error en Supabase: ' + error.message);
      }
    }
  });

  // Botón manual de recarga
  btnRecargar.addEventListener('click', cargarDatos);

  // Pestañas de código de ejemplo
  const tabBtns = document.querySelectorAll('.tab-btn');
  const bloques = {
    'tab-express': document.getElementById('tab-express'),
    'tab-fetch': document.getElementById('tab-fetch'),
    'tab-supabase': document.getElementById('tab-supabase'),
  };

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('activo'));
      Object.values(bloques).forEach(b => b.style.display = 'none');

      btn.classList.add('activo');
      const target = btn.getAttribute('data-tab');
      if (bloques[target]) bloques[target].style.display = 'block';
    });
  });

  // Cargar modo inicial
  activarModo('sqlite');
});
