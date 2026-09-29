# Edifica Casa: lista para publicar el nuevo inicio (SEO)

## 1. Publicación

1. Respaldar el `index.html` actual del servidor.
2. Renombrar `edifica-casa-v2.html` a `index.html` y subirlo a la raíz de `edificacasa.mx`. No subas `edifica-casa-v2.html` como archivo aparte; el `.htaccess` lo redirige a `/` por si ya se compartió esa URL.
3. Confirmar que en la raíz están las imágenes con estos nombres exactos: `edificasa_inicio.jpeg`, `prestamos_edifica_1.jpeg`, `prestamos_edifica_2.png`, `prestamos_edifica_4.jpeg`, `prestamos_edifica_5.jpeg`, `edifica-casa-logo.png` (y `favicon.ico`).
4. Subir a la raíz `sitemap.xml`, `robots.txt` y `.htaccess`. Si ya existe un `.htaccess`, combinarlo en lugar de reemplazarlo.
5. Comprobar después de subir:
   - `http://www.edificacasa.mx/` redirige con **una sola** 301 a `https://edificacasa.mx/`.
   - `https://edificacasa.mx/index.html` redirige con 301 a `https://edificacasa.mx/`, sin bucle.
   - Una URL inexistente (p. ej. `/no-existe`) responde **404** (no 200) y muestra `error404.html`.
   - La página de confirmación y `error404.html` envían la cabecera `X-Robots-Tag: noindex`.
   - Comando útil: `curl -sI https://edificacasa.mx/index.html`.
   - Si aparece un error 500, comentar el bloque del `.htaccess` que lo provoca y consultar al hosting (puede faltar `mod_rewrite`, `mod_headers` o `mod_expires`).

## 2. Pendientes del dueño (comentarios `TODO(owner)` en el HTML)

Para listarlos: `grep -n "TODO(owner)" index.html`

- [ ] Confirmar o subir `/favicon.ico` (y un PNG de 180x180 para `apple-touch-icon`).
- [ ] Imagen para redes (Open Graph) de 1200x630 px; hoy se usa `edificasa_inicio.jpeg`.
- [ ] Datos que no están en el JSON-LD porque no se han confirmado: horario, coordenadas, rango de precios, año de fundación, razón social y RFC. Confirmar también el área de servicio (hoy solo Ciudad de México).
- [ ] Revisar que el texto `alt` de cada imagen describa la foto real.
- [ ] Tamaño real del logo (ancho x alto) para ajustar `width`/`height`.
- [ ] Aclarar la frase "100% del avalúo devuelto", que es ambigua.
- [ ] Foto propia para la tarjeta "Terreno y garantía" (hoy repite la del departamento).
- [ ] Confirmar la figura legal de la garantía (hipoteca u otra), que el cliente sigue usando su inmueble y que la garantía se libera al liquidar.
- [ ] Verificar que los 4 pasos de "Cómo funciona" coincidan con el proceso real.
- [ ] Razón social completa y RFC en el pie de página.
- [ ] Registro CONDUSEF / SIPRES y RECA (si aplican).
- [ ] **CAT promedio** "para fines informativos y de comparación", sin IVA y con fecha de cálculo (obligatorio en la publicidad de créditos).
- [ ] Revisar con asesoría legal si faltan otras leyendas obligatorias.

## 3. Correcciones pendientes en las OTRAS páginas

- [ ] Reescribir los títulos tipo "Edifica Casa Préstamos-por-casa-…": que sean únicos, de 60 caracteres o menos, que empiecen con la palabra clave y terminen con la marca. Ejemplos:
  - Requisitos: "Requisitos para préstamo con garantía hipotecaria | Edifica Casa"
  - Preguntas frecuentes: "Preguntas frecuentes sobre préstamos con garantía | Edifica Casa"
  - Contacto: "Contacto y oficinas en Azcapotzalco, CDMX | Edifica Casa"
  - Autos: "Préstamo con garantía de auto, moto o camioneta | Edifica Casa"
- [ ] Un solo `<h1>` descriptivo en cada página (hoy faltan).
- [ ] Una meta description única en cada página (hoy están duplicadas), de 140 a 160 caracteres.
- [ ] `<link rel="canonical">` con la URL propia y etiquetas Open Graph en cada página.
- [ ] `lang="es-MX"`, texto `alt` en las imágenes y teléfonos como enlaces `tel:` en todas las páginas.
- [ ] Enlaces internos a `/index.html` → cambiarlos a `https://edificacasa.mx/`.
- [ ] Página de confirmación: agregar `<meta name="robots" content="noindex">` (además de la cabecera del `.htaccess`).
- [ ] `error404.html`: debe responder 404 (lo resuelve `ErrorDocument`), llevar `noindex` y **no** estar en el sitemap (ya se quitó).

## 4. Google Search Console

1. Verificar la propiedad de dominio `edificacasa.mx` (registro DNS TXT).
2. **Sitemaps** → enviar `https://edificacasa.mx/sitemap.xml`.
3. **Inspección de URLs** → `https://edificacasa.mx/` → "Probar URL publicada" → "Solicitar indexación".
4. Repetir la inspección con las páginas de requisitos, preguntas frecuentes y contacto después de corregirlas.
5. Pasadas 2 a 4 semanas, revisar **Páginas** (indexación) y **Rendimiento** para las consultas "crédito de liquidez con garantía hipotecaria", "préstamo con garantía hipotecaria" y "liquidez hipotecaria".

## 5. Validación

- **Prueba de resultados enriquecidos**: https://search.google.com/test/rich-results (con la URL de inicio). Debe detectar la organización/negocio local sin errores.
- **Validador de Schema.org**: https://validator.schema.org/ (FinancialService, WebSite, WebPage).
- **PageSpeed Insights**: https://pagespeed.web.dev/ (móvil y escritorio). Revisar LCP (imagen principal) y CLS. Comprimir las imágenes (WebP o JPEG de ~150 KB como máximo) si LCP está por encima de 2.5 s.
- **Vista previa en redes**: Facebook Sharing Debugger (https://developers.facebook.com/tools/debug/) para revisar título, descripción e imagen.
