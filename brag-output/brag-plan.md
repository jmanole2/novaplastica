# /brag — Kuper AI, el nuevo chat de kuper.media

**Entrada:** sitio web https://kuper.media/ con foco en el chat nuevo (`kuper-chat.js`).
**Formato:** 1920×1080, 30 fps, ~20 s. **Tono:** `polished` con ritmo `app-store`: oscuro, cristal, violeta, pocos elementos, cada uno con aire.

## Respuestas previas
- **Qué es:** Kuper AI, un asistente que vive en la esfera de cristal líquido de kuper.media y responde al instante dudas sobre webs, agentes de IA, branding, SEO y marketing.
- **Para quién:** quien visita la web de un estudio (CDMX y Madrid) y quiere saber qué hacen, cuánto cuesta o si pueden ayudarle, sin rellenar un formulario.
- **Qué lo distingue:** la esfera animada *es* el botón. Responde con IA, capta el lead dentro del propio chat y siempre deja la salida a WhatsApp.
- **Frase más fuerte (copia real):** "Resuelve dudas al instante · Gratis".
- **Gancho visual:** la esfera de cristal líquido con su globo "Soy Kuper AI. Chatea conmigo."
- **Flujo real a mostrar:** esfera → abrir chat → saludo y chips → toque en "¿Hacen agentes de IA?" → "Escribiendo…" → respuesta → tarjeta de lead → "Continuar en WhatsApp".
- **Texto para compartir:** ver `share-copy.txt`.

## Identidad (del CSS del sitio)
- Fondo `#03070d`, panel `rgba(8,12,20,.82)` + blur 22 px, bordes `rgba(255,255,255,.18)`, radio 22 px.
- Burbuja del usuario: degradado `#9b6dff → #7c4dff`. WhatsApp `#25d366` sobre `#04210f`.
- Paleta de la esfera (uniforms del shader real): núcleo `#09030e`, verde `#2cce95`, azul `#5c87ff`, violeta `#7b53ff`, brillo `#ffd9f0`.
- Tipografía: el sitio usa la del sistema (-apple-system); en el video uso Inter como equivalente. Logo: `logo_kuper_media.svg`.
- La esfera real es un shader WebGPU que este entorno no puede ejecutar; la recreo en WebGL con su paleta real. El panel del chat reutiliza el CSS y el markup de `kuper-chat.js` tal cual.

## Storyboard (20,0 s)
| # | Tiempo | Escena | Texto en pantalla |
|---|---|---|---|
| 1 | 0,0–3,0 | **Gancho.** Negro. La esfera nace en el centro, grande, girando. Aparece su globo. | "Soy Kuper AI. Chatea conmigo." |
| 2 | 3,0–6,0 | **Revelación.** La esfera viaja a su esquina en kuper.media (captura real del hero). Titular a la izquierda. | "Nuevo en kuper.media" / "Kuper AI" |
| 3 | 6,0–11,2 | **Destacado 1.** Clic en la esfera → se abre el panel real. Saludo, chips; el cursor toca "¿Hacen agentes de IA?". "Escribiendo…" → respuesta real del FAQ. | Izq.: "Resuelve dudas al instante." |
| 4 | 11,2–15,6 | **Destacado 2.** Tarjeta de lead dentro del chat; se escriben nombre y WhatsApp; "Que me contacten" → agradecimiento. | Izq.: "Y convierte la visita en cliente." |
| 5 | 15,6–17,2 | **Destacado 3.** Zoom al botón verde, que late. | "Siempre a un toque de WhatsApp." |
| 6 | 17,2–20,0 | **Cierre.** Logo Kuper Media, esfera pequeña y URL. | "Chatea con Kuper AI" / "kuper.media" |

Transiciones: suaves, sin fundidos cruzados entre dos pantallas llenas (sale una, entra otra o se pasa por el fondo).

## Sonido
Pieza propia a 112 BPM en La menor: pad cálido, bajo suave, bombo y hi-hats discretos que entran en la revelación. Efectos en la misma tonalidad y la misma reverb: "pop" tonal al abrir el globo y el chat, clics suaves, ticks de escritura muy bajos, un acorde brillante en el agradecimiento y una resolución en el logo.
