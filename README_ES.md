# Turnos de Inscripción (6 cupos por bloque) — Supabase + GitHub Pages

App pública para que estudiantes escriban su nombre en **Mañana** o **Tarde** (máx. 6 por bloque) y todos puedan ver los inscritos en tiempo real.

## 1) Crea el proyecto en Supabase
1. Entra a https://supabase.com/ → New project (gratis).
2. En **Project Settings → API**, copia:
   - **Project URL**
   - **anon public key**

## 2) Crea la base de datos
1. En **SQL Editor** pega el contenido de `schema.sql` y ejecútalo.
2. Esto crea la tabla `public.reservas` con **RLS**:
   - Lectura para todos.
   - Insert permitido sin login **solo** si hay cupos (<6) por día/bloque.
   - `slot_no` está limitado a 1..6 y la PK evita duplicados.

## 3) Configura la app
1. **Copia `config.example.js` como `config.js`** y edita:
   ```js
   window.SUPABASE_URL = "https://TU-REF.supabase.co";
   window.SUPABASE_ANON_KEY = "TU-ANON-KEY";
   window.MESES_HABILITADOS = []; // opcional
   ```

## 4) Publica en GitHub Pages (o Netlify/Vercel)
- Sube estos archivos al **root** del repositorio:
  - `index.html`, `style.css`, `app.js`, `config.js`, `schema.sql`, `README_ES.md`
- Activa **GitHub Pages**: Settings → Pages → Deploy from a branch → `main` → /(root).
- Tu URL pública: `https://USUARIO.github.io/NOMBRE-REPO/`.

## 5) Cómo usar
- Elegir **Mes** y **Día**, escribir el **Nombre**, escoger **Mañana/Tarde** y **Inscribirme**.
- Cuando un bloque completa 6 cupos, la app ya no agrega más nombres.
- Los nombres **no se editan ni borran** desde la UI (para evitar errores).

## Opcional
- Para varios cursos/turnos distintos, duplica el repo/carpeta o agrega más controles en el UI.
- Para permitir “desinscribir”, crea una segunda página protegida (con login) y una política RLS para `delete`.

---
Hecho para funcionar en laptops y teléfonos (responsive).
