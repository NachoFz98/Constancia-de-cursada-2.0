# Generador de constancias (web)

App web simple para generar constancias de cursada en PDF.

## Qué hace

- Formulario con datos del estudiante y cursada.
- Texto dinámico según:
  - género (nuestro/nuestra estudiante),
  - tipo de inscripción (curso/carrera/diplomatura/workshop),
  - días de cursada (singular o plural).
- Exporta PDF automáticamente.
- El archivo se descarga con nombre basado en el email.
- Incluye logo placeholder reemplazable.

## Archivos principales

- `index.html`: interfaz del formulario.
- `app.js`: logica de texto y generacion de PDF.
- `styles.css`: estilos.
- `logo-placeholder-banner.png`: banner de ejemplo (PNG).

## Cómo usar localmente

1. Abrí una terminal en esta carpeta.
2. Levantá un servidor estático:
   - `python3 -m http.server 5500`
3. Abrí en navegador:
   - `http://localhost:5500`

## Cambiar placeholders de empresa

En `app.js`, editar el objeto `COMPANY_CONFIG`:

- `companyName`
- `directorName`
- `websiteUrl`
- `addressLine`
- `logoPath`

Si querés usar tu logo real, copia el archivo (por ejemplo `logo-empresa.png`) y actualizá `logoPath`.
Se recomienda usar una imagen horizontal (banner) para que quede centrada arriba del PDF.
Si querés usar firma, agregá una imagen (por ejemplo `firma-director.png`) y cargá su ruta en `signaturePath`.

## Publicar por URL (equipo)

Recomendado: Netlify o Vercel (hosting estático).

- Subís esta carpeta.
- Queda una URL pública para todo el equipo.
- Sin login ni backend.
