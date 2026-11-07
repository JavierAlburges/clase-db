# 📚 Manual Didáctico: Bases de Datos en Desarrollo Web
**GearSoftCA** &bull; [gearsoftca.com](https://gearsoftca.com/)  
*Eslogan: "Impulsa tu negocio con soluciones innovadoras"*  
**Docente:** Ing. Javier Alburges

---

## 🎯 Objetivo de este Laboratorio
El propósito de este proyecto es enseñar a los estudiantes de desarrollo web las **dos formas principales** de conectar una aplicación web a una base de datos:

1. **Enfoque Tradicional:** Frontend $\to$ Backend propio (**Node.js + Express**) $\to$ Base de datos local (**SQLite**).
2. **Enfoque Moderno (BaaS - Backend as a Service):** Frontend $\to$ SDK en la nube (**Supabase**) $\to$ Base de datos PostgreSQL Cloud.

Ambos métodos pueden probarse en tiempo real e intercambiarse con un solo clic desde la interfaz interactiva.

---

## 🧠 Concepto Clave: ¿Por qué necesitamos un Backend o un BaaS?

Cuando abres un archivo `index.html` en tu navegador, el navegador ejecuta tu código dentro de una **"caja de arena" (Sandbox)** por seguridad. 

> ⚠️ **Regla de oro:** Por razones de seguridad, JavaScript en el navegador **NO puede** leer ni modificar directamente archivos en el disco duro de tu computadora ni conectarse directamente a bases de datos relacionales sin una API intermedia o un servicio autenticado.

Para solucionar esto, existen dos alternativas:
- **Opción A (Tradicional):** Programamos un servidor intermedio propio con **Node.js y Express**. El navegador le envía datos al servidor mediante peticiones HTTP (`fetch`), y el servidor es quien guarda los datos en **SQLite**.
- **Opción B (BaaS con Supabase):** Una empresa en la nube nos da la base de datos (PostgreSQL), la API y la seguridad listas. Solo importamos una librería en el HTML y nos comunicamos directamente con la nube.

---

## 🛠️ PARTE 1: Configuración del Enfoque Tradicional (Node.js + Express + SQLite)

### Paso 1.1: Instalar Node.js en tu computadora
1. Ingresa a la página oficial: [https://nodejs.org/](https://nodejs.org/)
2. Descarga la versión **LTS** (Long Term Support / Soporte a Largo Plazo).
3. Ejecuta el instalador descargado y haz clic en *Siguiente (Next)* hasta finalizar.
4. Para comprobar que se instaló correctamente, abre tu terminal (PowerShell o CMD) y escribe:
   ```bash
   node -v
   npm -v
   ```
   *Deberías ver los números de versión de Node y npm instalados.*

---

### Paso 1.2: Inicializar el proyecto e instalar dependencias
Abre tu terminal en la carpeta del proyecto (`web`) y ejecuta:

```bash
# 1. Crear el archivo package.json con la configuración inicial
npm init -y

# 2. Instalar únicamente las dos dependencias requeridas
npm install express sqlite3
```

> **¿Qué hace cada dependencia?**
> - **`express`**: Un micro-framework ligero para crear nuestro servidor web y recibir peticiones HTTP (`GET`, `POST`).
> - **`sqlite3`**: El motor para conectarse y ejecutar sentencias SQL en un archivo local (`database.sqlite`).

---

### Paso 1.3: Entendiendo el Servidor (`server.js`)
El archivo `server.js` tiene menos de 50 líneas. Está organizado de forma muy sencilla:

```javascript
const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

// 1. Middlewares nativos
app.use(express.json());       // Permite al servidor entender datos JSON
app.use(express.static('.'));  // Sirve los archivos index.html, estilos.css y pro.js

// 2. Conexión a SQLite
const db = new sqlite3.Database('./database.sqlite');

// Crea la tabla automáticamente si no existe al arrancar
db.run(`
  CREATE TABLE IF NOT EXISTS estudiantes_lab (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL,
    comentario TEXT,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 3. Rutas de la API

// GET /api/estudiantes: Lee los registros guardados en SQLite
app.get('/api/estudiantes', (req, res) => {
  db.all('SELECT * FROM estudiantes_lab ORDER BY id DESC', [], (err, filas) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(filas);
  });
});

// POST /api/estudiantes: Inserta un nuevo estudiante en SQLite
app.post('/api/estudiantes', (req, res) => {
  const { nombre, email, comentario } = req.body;
  const sql = 'INSERT INTO estudiantes_lab (nombre, email, comentario) VALUES (?, ?, ?)';
  
  // El signo "?" evita ataques de inyección SQL
  db.run(sql, [nombre, email, comentario || ''], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, nombre, email });
  });
});

// 4. Iniciar el servidor
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
```

> 💡 **¿Por qué no usamos la librería `cors`?**
> Gracias a la línea `app.use(express.static('.'))`, el mismo servidor Express entrega la página web y la API en el mismo puerto (`3000`). Al compartir el mismo origen, el navegador no bloquea ninguna petición por seguridad y no hace falta instalar CORS.

---

### Paso 1.4: Cómo arrancar el servidor local
En tu terminal ejecuta:
```bash
npm start
```
Abre tu navegador en:
👉 **`http://localhost:3000`**

---

## ⚡ PARTE 2: Configuración del Enfoque BaaS (Supabase Cloud)

Supabase te permite tener una base de datos en la nube sin programar ningún backend propio.

### Paso 2.1: Crear cuenta y proyecto en Supabase
1. Ingresa a [https://supabase.com/](https://supabase.com/) y regístrate gratis con tu cuenta de GitHub o Google.
2. Haz clic en **"New Project"** (Nuevo Proyecto).
3. Ingresa un nombre (ej. `Prueba`) y define una contraseña para la base de datos.
4. Selecciona la región más cercana (ej. `East US`) y haz clic en **"Create new project"**.
5. Espera unos 60 segundos mientras Supabase aprovisiona tu base de datos PostgreSQL.

---

### Paso 2.2: Crear la tabla de base de datos
1. En el menú lateral izquierdo de Supabase, entra al **`SQL Editor`** (ícono de terminal `>_`).
2. Haz clic en **`+ New query`**.
3. Copia y pega el siguiente script SQL:

```sql
-- 1. Crear la tabla para el laboratorio
CREATE TABLE IF NOT EXISTS public.estudiantes_lab (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  comentario TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar la seguridad a nivel de filas (RLS)
ALTER TABLE public.estudiantes_lab ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas públicas para permitir lectura e inserción en la clase
CREATE POLICY "Permitir lectura publica" 
ON public.estudiantes_lab FOR SELECT USING (true);

CREATE POLICY "Permitir insercion publica" 
ON public.estudiantes_lab FOR INSERT WITH CHECK (true);
```

4. Haz clic en el botón verde **`Run`** (o presiona `Ctrl + Enter`).
   *Verás el mensaje: "Success. No rows returned". Tu tabla ya está lista en la nube.*

---

### Paso 2.3: ¿Dónde buscar la URL y las Llaves (API Keys) de Supabase?

Para que cualquier estudiante pueda conectar su propia base de datos a la web, debe buscar dos datos en el panel de Supabase:

#### 1. Dónde encontrar la `Project URL`:
1. En el menú lateral izquierdo de tu proyecto en Supabase, haz clic en el ícono de engranaje **`Project Settings`** (Configuración del proyecto, abajo del todo).
2. En la sección **`General`**, verás el campo **`Project ID`** (por ejemplo: `sbrlvyondrlkszmgwrof`).
3. Tu **Project URL** siempre tiene este formato:
   ```text
   https://[TU-PROJECT-ID].supabase.co
   ```
   *(Ejemplo: `https://sbrlvyondrlkszmgwrof.supabase.co`)*.

#### 2. Dónde encontrar la Llave Pública (`Publishable / anon key`):
1. En ese mismo menú lateral izquierdo, bajo la categoría **`CONFIGURATION`**, haz clic en **`API Keys`** (o **`API`**).
2. Verás dos secciones de llaves:
   - ✅ **Publishable key / `anon public`**: Es una clave que empieza por `sb_publishable_...` o `eyJhbGciOi...`. **ESTA ES LA LLAVE QUE DEBES USAR**. Tiene un botón de **Copy** al lado para copiarla en un clic. Es 100% segura para usarse en el navegador porque está protegida por las políticas RLS.
   - 🚫 **Secret keys / `service_role`**: **NUNCA la uses en el frontend ni la compartas**. Esa llave es solo para administradores y permite saltarse toda la seguridad.

#### 3. Dónde pegar estos datos en la web:
Tienes dos formas sencillas de conectarla:
- **Forma A (Desde la propia pantalla de la web):** Abre `http://localhost:3000`, haz clic en **`⚡ 2. Supabase (BaaS Cloud)`**, y en el recuadro amarillo que aparece pega tu URL y tu Publishable Key. ¡La web la guardará automáticamente en tu navegador!
- **Forma B (Directo en el código `pro.js`):** En las primeras líneas de `pro.js`, asigna tus valores por defecto:
  ```javascript
  const SUPABASE_URL = 'https://TU-PROYECTO.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_TU_LLAVE_AQUI';
  ```

---

### Paso 2.4: Cómo se conecta Supabase en la Web

#### 1. En `index.html`:
Importamos la librería oficial de Supabase mediante un CDN (sin necesidad de instalar nada con `npm`):
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

#### 2. En `pro.js`:
Inicializamos el cliente y realizamos las consultas directamente:
```javascript
// 1. Inicializar cliente
const SUPABASE_URL = 'https://tu-proyecto.supabase.co';
const SUPABASE_KEY = 'tu-clave-publica-anon';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. Guardar un registro (INSERT en PostgreSQL Cloud)
const { error } = await supabaseClient
  .from('estudiantes_lab')
  .insert([{ nombre: 'Carlos', email: 'carlos@mail.com', comentario: 'Prueba' }]);

// 3. Consultar todos los registros (SELECT en PostgreSQL Cloud)
const { data, error } = await supabaseClient
  .from('estudiantes_lab')
  .select('*')
  .order('id', { ascending: false });
```

---

## 📊 Tabla Comparativa de Arquitecturas

| Característica | 📁 Express + SQLite (Tradicional) | ⚡ Supabase (BaaS Cloud) |
| :--- | :--- | :--- |
| **¿Dónde corre la BD?** | En tu disco duro (`database.sqlite`). | En servidores en la nube (PostgreSQL). |
| **¿Requiere backend propio?** | Sí (`server.js` con Express). | No (el SDK se conecta directamente). |
| **Instalación** | `npm install express sqlite3`. | Una sola línea `<script>` CDN. |
| **¿Funciona sin Internet?** | **Sí**, 100% offline. | No, requiere conexión a Internet. |
| **Visibilidad de datos** | Mediante consultas SQL o extensiones. | Dashboard web interactivo con Table Editor. |
| **Ideal para...** | Aprender lógica de servidores y APIs REST. | Prototipar y lanzar aplicaciones rápido (MVPs). |

---

## 🧪 Cómo usar el Simulador en Clase

1. Inicia el servidor con `npm start` y abre `http://localhost:3000`.
2. **Probar Modo SQLite:**
   - Haz clic en `📁 1. Express + SQLite (Local)`.
   - Llena el formulario con tus datos y presiona **Guardar**.
   - Observa en la consola didáctica cómo se envía el `fetch POST` y cómo se guarda en el archivo local.
3. **Probar Modo Supabase:**
   - Haz clic en `⚡ 2. Supabase (BaaS Cloud)`.
   - Llena el formulario y presiona **Guardar**.
   - Abre tu panel en [supabase.com](https://supabase.com) > **Table Editor** y verás tu fila ingresada en tiempo real.

---

## ❓ Preguntas y Errores Frecuentes (FAQ)

### 1. "Error: listen EADDRINUSE: address already in use :::3000"
- **Causa:** Ya tienes una terminal o programa corriendo en el puerto 3000.
- **Solución:** Cierra las otras terminales abiertas o cambia el puerto en `server.js` a `const PORT = 3001;`.

### 2. "Could not find the table 'public.estudiantes_lab' in the schema cache"
- **Causa:** Intentaste guardar en Supabase pero aún no habías ejecutado el script SQL en el *SQL Editor*.
- **Solución:** Ve al paso 2.2 de este manual y ejecuta el script de creación de tabla.

### 3. "¿Puedo usar ambas bases de datos al mismo tiempo?"
- ¡Sí! El simulador fue diseñado exactamente para eso. Puedes guardar registros en SQLite para practicar desarrollo local y luego alternar a Supabase para comparar la velocidad de un servicio en la nube.
