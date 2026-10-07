# Cambios SEO para redone.agency

## Ronda 2 (7 oct 2026): ajustes del cliente, leads y PageSpeed

### Ajustes del docx del cliente (en `index.php`)
- **Casos de éxito:**
  - Las imágenes ya no se recortan en computadora. El recuadro ahora tiene la proporción de las fotos (16:9) en lugar de 210 px fijos.
  - En COOP, las fotos verticales se ven completas, con un fondo desenfocado de la misma foto.
- **Clientes:** ahora va primero el título "Clientes" y debajo "Marcas que han confiado en nosotros".
- **Menos espacio entre apartados:** cada sección tenía 120 px arriba y abajo, que se sumaban a 240 px entre una y otra. Ahora tienen 70 px.
- **Signo de apertura:** "¿Tienes algún proyecto en mente?" ya lo tenía desde la ronda 1.
- **Botón circular "Contactar":** fondo blanco con letra negra y un pulso rojo suave. Al pasar el cursor se llena de rojo, igual que antes.
- **H2:** "Hacemos que las marcas se vean, se sientan y, sobre todo, se recuerden." ahora es un `<h2>` en tamaño grande.
- **Equipo:** "Las personas detrás de Red One" → "Personas detrás de Red One".

### Leads
- **El formulario se veía roto.** El CSS de la plantilla estiraba los círculos de opción al 100 % de ancho, así que aparecían sueltos al centro y lejos de su texto, en celular y en computadora. Ahora cada opción es un botón que se marca en rojo al elegirla.
- **Botón de envío:** "Enviar" con solo un contorno pasa a ser un botón rojo sólido que dice "Solicitar llamada estratégica".
- **Debajo del botón:** "¿Prefieres hablar ya? Escríbenos por WhatsApp o llama al 55 4727 3070".
- **Medición de conversiones en GA4 y GTM.** Antes ningún envío se registraba como conversión. Ahora se mandan estos eventos:
  - `generate_lead`: formulario enviado con éxito.
  - `sign_up`: suscripción al newsletter.
  - `whatsapp_click`, `phone_click`, `email_click` y `schedule_click`.

  En GA4, marquen `generate_lead` y `whatsapp_click` como **eventos clave**. En Google Ads, impórtenlos como conversiones.
- **Lo que no puedo ver yo: `lead.php`.** Probé `https://redone.agency/lead.php` y valida bien los campos, pero no sé si el correo realmente llega. Si usa `mail()` de PHP, es muy común que caiga en spam o que nunca salga. Hagan un envío de prueba real o pásenme `lead.php` y lo reviso.

### PageSpeed (rendimiento 53)
- **CSS en cadena:** `plugins.css` cargaba 11 archivos CSS con `@import`, uno detrás de otro, antes de pintar la página. Esto es casi todo el "bloqueo de renderizado" de 750 ms.
  - Ahora se piden en paralelo.
  - Bootstrap, Slick y Swiper siguen bloqueando, porque definen el layout.
  - Los íconos, las animaciones y los popups ya no bloquean.
- **Fuente Lexend Deca:** se quitó porque no la usa ningún CSS del sitio.
- **Lo que falta y no está en estos archivos:**
  - Los logos de clientes y las fotos en JPG/PNG pesan unos 830 KB que se pueden ahorrar convirtiéndolos a WebP.
  - JavaScript que no se usa: jQuery, plugins y GSAP en `footer.php`.

### `.htaccess` (reemplaza completo al que me pasaste)
Con el archivo que subieron, **ninguna redirección funcionaba**. Lo comprobé en vivo: `www.redone.agency`, `/index.php` e `/index_en.php` siguen respondiendo 200, y `/blog/` da 404. Tampoco salen los encabezados de seguridad.
- **Orden de las reglas:** las redirecciones estaban al final, después de las reescrituras del blog. Ahora van primero.
- **Redirecciones nuevas:**
  - `/en/` → `/en`, que antes duplicaba la página.
  - `/blog/artículo/` → `/blog/artículo`, que antes daba 404.
  - `/terminos/` → `/terminos`.
  - Las rutas internas (`/templates/...php`, `/index_en.php`) → su URL limpia.
- **Caché de CSS y JS:** tenían un año con `immutable`. Eso significa que quien ya visitó el sitio **no ve los cambios de `style.css` hasta dentro de un año**. Ahora es una semana. Imágenes, video y fuentes siguen con un año.
- **Bloques duplicados:** había bloques de caché y compresión repetidos y contradictorios. Ahora hay uno de cada uno, y la compresión incluye el HTML.
- **Seguridad:** se bloquea la descarga de `.env`, `.htaccess`, `.sql`, `.log` y respaldos.
- **Lo probé en un Apache local con las mismas rutas:** las 23 URLs respondieron como debían, sin bucles.
- **Después de subirlo:**
  - `curl -I https://www.redone.agency/` debe dar 301.
  - `curl -I https://redone.agency/blog/` debe dar 301.

---

## Ronda 1

## Archivos de esta carpeta y dónde van

| Archivo | Dónde va | Qué hace |
|---|---|---|
| `index.php` | Raíz del sitio (reemplaza el actual) | Portada corregida (detalle abajo) |
| `modules/header.php` | `/modules/` (reemplaza) | Menú corregido |
| `modules/footer.php` | `/modules/` (reemplaza) | Pie corregido y video.js bajo demanda |
| `robots.txt` | Raíz (reemplaza el actual) | Quita `Crawl-delay: 10` y declara el sitemap |
| `sitemap.xml` | Raíz (nuevo) | Lista portada, `/en`, blog y artículos, con las versiones de idioma |
| `.htaccess` | Raíz. **Reemplaza completo** al actual | Redirecciones, reescrituras del sitio, seguridad, caché y compresión (detalle abajo) |
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

## Qué cambió en `modules/header.php`
- "Inicio" apuntaba a `#top`, un ancla que no existe en ninguna página, así que no llevaba a ningún lado. Ahora apunta a `/`.
- Quité `role="menubar"`/`menuitem`: obligan a navegar con flechas, cosa que este menú no hace. Un `<nav>` con lista ya es accesible.
- Un solo nombre de marca en el logo ("Red One") y `hreflang="en"` en el botón EN.

## Qué cambió en `modules/footer.php`
- **video.js (unos 670 KB) ya no se carga en todas las páginas.** Solo se descarga si la página tiene el video, y cuando el video se acerca a la pantalla. Probado: al abrir la portada no se descarga; al bajar al video, sí, y el botón "Agendar" sigue funcionando.
- El enlace de Calendly tenía fijo `?month=2026-05`, así que abría un mes ya pasado. Ahora abre el mes actual.
- **Logo del pie:**
  - Antes iba a `#0` y no llevaba a ningún lado; ahora lleva al inicio.
  - Tenía `alt` vacío; ahora dice "Red One".
  - Usaba una ruta relativa que daba 404 dentro de `/blog/…`; ahora es absoluta.
- Direcciones marcadas como `<address>`, Instagram sin parámetros de rastreo en la URL y "Todos los derechos reservados" en español.
- Las direcciones reales del footer se agregaron también a los datos estructurados de `index.php`.

## Pendientes (los marqué con `TODO` en el código o no están en este archivo)

### En `index.php`, requieren su decisión
1. **Analítica duplicada.** Hay dos propiedades de GA4 (`G-G6ZS92VGM4` y `G-YTX7WXSJT4`), además de GTM y Clarity. Dejen una sola. No la quité para no cortarles datos sin confirmar cuál usan.
2. **Imagen para redes.** Crear una de 1200×630 px y cambiar la ruta de `og:image`. Por ahora usa `independent.jpg`.
3. **Logos de clientes.** Los 66 logos tienen `alt="Cliente 1"`, `"Cliente 2"`… Cambien cada uno por el nombre real de la marca (ASICS, Bepensa…). Yo no sé a qué marca corresponde cada archivo.
4. **Fotos del equipo.** Siguen pendientes (`lillian-mezher.jpg`, `luis-letayf.jpg`).
5. **Fuentes.** Se cargan Poppins (9 pesos), Sora y Lexend Deca. Revisen en `style.css` cuáles se usan de verdad y quiten el resto.

### En otros archivos que todavía no me pasaste
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
9. **Código postal y municipio** de cada oficina en el schema (`TODO` en `index.php`). Lomas de Tecamachalco está en el límite CDMX / Naucalpan: confirmen cuál es.
10. **TikTok:** lo quitaron del footer, pero la sección de contacto de `index.php` todavía lo enlaza. Decidan si se queda o se va en los dos lugares.
11. **`hscroll.js`:** se carga en el footer, pero `index.php` lo desactiva justo después con un script. Si ninguna otra página lo usa, quítenlo del footer.

## Después de subir
1. Search Console → Sitemaps → enviar `https://redone.agency/sitemap.xml`.
2. Inspección de URL de `https://redone.agency/` → solicitar indexación.
3. Validar los datos estructurados en https://search.google.com/test/rich-results
4. Correr PageSpeed Insights en móvil.
