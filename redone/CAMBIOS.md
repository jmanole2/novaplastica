# Cambios SEO para redone.agency

## Archivos de esta carpeta y dónde van

| Archivo | Dónde va | Qué hace |
|---|---|---|
| `index.php` | Raíz del sitio (reemplaza el actual) | Portada corregida (detalle abajo) |
| `robots.txt` | Raíz (reemplaza el actual) | Quita `Crawl-delay: 10` y declara el sitemap |
| `sitemap.xml` | Raíz (nuevo) | Lista portada, `/en`, blog y artículos, con las versiones de idioma |
| `htaccess-AGREGAR.txt` | **Pegar arriba** dentro del `.htaccess` existente; no lo reemplaces | Redirige `www`, `/index.php` y `/blog/`; agrega seguridad, caché y compresión |
| `llms.txt` | Raíz (nuevo) | Resumen del sitio para asistentes de IA |

**Importante:** este `index.php` es más nuevo que el que está publicado. En el publicado los videos de 254 MB y 56 MB siguen en reproducción automática; en este ya estaban comentados y ahora los eliminé del código. Con solo publicar este archivo, la portada deja de descargar unos 310 MB.

## Qué cambió en `index.php`
- `lang="zxx"` (sin idioma) → `lang="es-MX"`.
- **Título:** "Agencia Red One" → "Agencia de marketing digital en CDMX | Red One" (46 caracteres).
- **Meta description** nueva (156 caracteres), con un solo nombre de marca: "Red One" en lugar de "Red 1 México".
- **Canonical y hreflang** (es-MX, en, x-default).
- **Etiquetas:** Open Graph y Twitter Card, `robots` y `theme-color`.
- **Quitados:** `meta keywords` (Google no la usa) y el `author` vacío.
- **Datos estructurados JSON-LD:**
  - `Organization`/`ProfessionalService` con logo, contacto, CDMX y San Antonio, fundador, equipo, servicios y redes.
  - `WebSite` y `WebPage`.
- **Imágenes y recursos:**
  - Texto alternativo en las 5 imágenes del portafolio, más carga diferida.
  - Quitada la imagen de fondo `graph.png`, que daba 404 en dos lugares.
- **Video y formularios:**
  - El video de contacto pasa de `preload="auto"` a `preload="metadata"`: ya no descarga el video completo al abrir la página.
  - Etiquetas accesibles (`aria-label` y `autocomplete`) en los campos del formulario y del newsletter.
- **Popup del newsletter:** antes se abría a los 1.5 segundos, y en celular Google lo considera "intersticial intrusivo". Ahora se abre al llegar a la mitad de la página o a los 30 segundos.
- **Textos:** "About the / Agency" → "Acerca de la / Agencia"; "¿Tienes algún proyecto en mente?" con su signo de apertura; corregido "audiencia..".
- **Código muerto eliminado:** dos bloques de plantilla comentados, con Lorem ipsum y los videos pesados.
- Preconnect a Google Fonts.

## Pendientes (los marqué con `TODO` en el código o no están en este archivo)

### En `index.php`, requieren su decisión
1. **Analítica duplicada.** Hay dos propiedades de GA4 (`G-G6ZS92VGM4` y `G-YTX7WXSJT4`), además de GTM y Clarity. Dejen una sola. No la quité para no cortarles datos sin confirmar cuál usan.
2. **Imagen para redes.** Crear una de 1200×630 px y cambiar la ruta de `og:image`. Por ahora usa `independent.jpg`.
3. **Logos de clientes.** Los 66 logos tienen `alt="Cliente 1"`, `"Cliente 2"`… Cambien cada uno por el nombre real de la marca (ASICS, Bepensa…). Yo no sé a qué marca corresponde cada archivo.
4. **Fotos del equipo.** Siguen pendientes (`lillian-mezher.jpg`, `luis-letayf.jpg`).
5. **Fuentes.** Se cargan Poppins (9 pesos), Sora y Lexend Deca. Revisen en `style.css` cuáles se usan de verdad y quiten el resto.

### En otros archivos que no me pasaste
6. **`/en` (versión en inglés):** agregar en su `<head>`:
   ```html
   <title>Marketing & Communications Agency in Mexico City | Red One</title>
   <link rel="canonical" href="https://redone.agency/en">
   <link rel="alternate" hreflang="es-MX" href="https://redone.agency/">
   <link rel="alternate" hreflang="en" href="https://redone.agency/en">
   <link rel="alternate" hreflang="x-default" href="https://redone.agency/">
   ```
7. **Blog (plantilla de artículo):**
   - Cambiar `lang="en-US"` por `lang="es-MX"`.
   - Agregar canonical y una meta description propia en cada artículo.
   - Dejar un solo `<h1>` por artículo: "¿Por qué es tan importante el SEO?" tiene 8, varios vacíos. Los demás títulos internos deben ser `<h2>`.
   - Usar el mismo nombre de marca: hoy el blog firma "| Red1 Agency"; cambiarlo a "| Red One".
8. **`/terminos`:** también tiene `lang="zxx"` y no tiene `<h1>`.
9. **`modules/footer.php`:** ahí se cargan jQuery, plugins y video.js (671 KB). Lo ideal es cargar video.js solo en las páginas que tienen video.

## Después de subir
1. Search Console → Sitemaps → enviar `https://redone.agency/sitemap.xml`.
2. Inspección de URL de `https://redone.agency/` → solicitar indexación.
3. Validar los datos estructurados en https://search.google.com/test/rich-results
4. Correr PageSpeed Insights en móvil.
