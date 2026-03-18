# Reportes App — RCE Ingeniería

Aplicación móvil y web para generar reportes de servicio técnico en formato PDF.
Construida con **Expo (React Native)** + **Supabase**.

---

## Stack

| Tecnología | Uso |
|---|---|
| Expo SDK 55 + expo-router | Framework móvil/web |
| React Native Web | Soporte navegador |
| Supabase | Base de datos, autenticación y storage |
| zustand | Estado global |
| react-hook-form + zod | Formularios y validación |
| expo-print | Generación de PDF en móvil |

---

## Estructura del proyecto

```
reportes-app/
├── app/                        # Rutas (expo-router)
│   ├── (auth)/                 # Login y registro
│   └── (app)/                  # App principal (requiere sesión)
│       ├── index.tsx           # Lista de reportes
│       ├── reports/new.tsx     # Selector de template
│       ├── reports/[id].tsx    # Ver reporte
│       └── reports/[id]/edit.tsx  # Editar reporte
├── src/
│   ├── templates/              # Sistema de templates
│   │   ├── types.ts            # Interfaces base
│   │   ├── index.ts            # Registry de templates
│   │   └── e002-mcd-v1/        # Template Reporte de Servicio
│   ├── components/forms/       # Campos dinámicos (texto, foto, firma)
│   ├── services/               # Supabase, PDF, Storage, Auth
│   ├── stores/                 # Estado global (zustand)
│   └── lib/                    # Tipos de base de datos
├── supabase/
│   ├── migrations/             # Esquema de base de datos
│   └── functions/              # Edge Functions
└── eas.json                    # Configuración de builds
```

---

## Configuración inicial

### 1. Instalar dependencias

```bash
npm install --legacy-peer-deps
```

### 2. Variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 3. Base de datos

Las migraciones ya están aplicadas en Supabase. Si necesitas reaplicarlas:

```bash
~/bin/supabase link --project-ref <project-ref>
SUPABASE_ACCESS_TOKEN=<token> ~/bin/supabase db push
```

---

## Correr la app

### Web (desarrollo)

```bash
npm start
# presiona w para abrir en el navegador
```

### Android — APK para pruebas (sin necesitar PC)

```bash
eas build --profile preview --platform android
```
Al terminar (~10 min) descarga e instala el `.apk` directamente en el teléfono.

### Android — APK de desarrollo (conecta al servidor local)

```bash
eas build --profile development --platform android
# luego:
npm start
```

---

## Agregar un nuevo tipo de reporte

1. Crea la carpeta `src/templates/{codigo}/`
2. Crea `definition.ts` con los campos y secciones
3. Crea `pdf-html.ts` con el template HTML del PDF
4. Registra en `src/templates/index.ts`:

```ts
import { NUEVO_TEMPLATE } from './nuevo-template/definition';

export const TEMPLATES = [
  E002_MCD_V1,
  NUEVO_TEMPLATE,  // ← agregar aquí
];
```

5. Inserta una fila en la tabla `report_templates` de Supabase.

---

## Flujo de un reporte

```
Nuevo → Seleccionar template → Llenar formulario (auto-guarda)
      → Agregar fotos y firmas → Generar PDF → Compartir
```

---

## Storage buckets (Supabase)

| Bucket | Contenido | Acceso |
|---|---|---|
| `reports-photos` | Fotos del reporte | Privado por usuario |
| `reports-signatures` | Firmas digitales | Privado por usuario |
| `reports-pdfs` | PDFs generados | Privado por usuario |

---

## Templates disponibles

| Código | Nombre | Descripción |
|---|---|---|
| `E002-MCD-V1` | Reporte de Servicio | Generadores eléctricos y equipos industriales |
