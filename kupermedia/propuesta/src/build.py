#!/usr/bin/env python3
"""Genera las 3 versiones de la página de diseño web de Kuper Media desde una sola plantilla.

    python3 src/build.py

Salida (subir tal cual a la raíz del sitio):
    dist/diseno-web-madrid/index.html   -> https://kuper.media/diseno-web-madrid/   (es-ES)
    dist/diseno-web-cdmx/index.html     -> https://kuper.media/diseno-web-cdmx/     (es-MX)
    dist/en/web-design/index.html       -> https://kuper.media/en/web-design/       (en)

Para cambiar diseño: src/styles.css o src/template.html. Para cambiar textos: LOCALES abajo.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DIST = ROOT.parent / "dist"
SITE = "https://kuper.media"

# Orden del selector y datos de cada versión
VERSIONS = [
    {"id": "madrid", "path": "/diseno-web-madrid/", "hreflang": "es-ES", "code": "ES", "city": "Madrid"},
    {"id": "cdmx", "path": "/diseno-web-cdmx/", "hreflang": "es-MX", "code": "MX", "city": "CDMX"},
    {"id": "en", "path": "/en/web-design/", "hreflang": "en", "code": "EN", "city": "English"},
]
X_DEFAULT = "en"

EXTRA_CSS = """
/* ── selector de región / idioma ── */
.hdr-right{position:relative;display:flex;align-items:center;gap:10px}
.lang{position:relative;display:flex;gap:2px;padding:5px;border-radius:999px}
.lang a{display:flex;align-items:center;gap:7px;height:38px;padding:0 14px;border-radius:999px;font-size:12px;font-weight:600;letter-spacing:.04em;color:rgba(255,255,255,.72);transition:background .3s,color .3s}
.lang a b{font-size:10px;font-weight:800;letter-spacing:.1em;opacity:.55}
.lang a:hover{background:rgba(255,255,255,.1);color:#fff}
.lang a[aria-current]{background:#fff;color:#070b14}
.lang a[aria-current] b{opacity:.7}
.lang .short{display:none}
body{transition:opacity .32s var(--ease),filter .32s var(--ease)}
body.leaving{opacity:0;filter:blur(8px)}
@media (max-width:1180px){.lang .full{display:none}.lang .short{display:inline}.lang a b{display:none}}
@media (max-width:900px){.lang a{height:36px;padding:0 13px}}
"""


def tags(items):
    return "".join(f"<span>{t}</span>" for t in items)


def faq(items):
    out = []
    for i, (q, a) in enumerate(items):
        d = f' style="--d:{i * .05:.2f}s"' if i else ""
        out.append(f'      <details class="glass rv"{d}><summary>{q}<span class="pm" aria-hidden="true"></span></summary><p>{a}</p></details>')
    return "\n".join(out)


MAIL = '<a href="mailto:contacto@kuper.media">contacto@kuper.media</a>'
WA = '<a href="https://wa.me/34694221737" target="_blank" rel="noopener">WhatsApp</a>'

LOCALES = {
    # ───────────────────────── ESPAÑA (vosotros) ─────────────────────────
    "madrid": dict(
        lang="es-ES", og_locale="es_ES",
        title="Diseño web en Madrid | Kuper Media",
        description="Estudio de diseño web en Madrid: sitios a medida, rápidos y preparados para SEO e IA. Estrategia, diseño, desarrollo y agentes de IA en un solo equipo.",
        og_description="Sitios web a medida, rápidos y preparados para SEO e IA. Equipo en Madrid y Ciudad de México.",
        service_name="Diseño web en Madrid", service_type="Diseño y desarrollo web",
        service_desc="Sitios web a medida: estrategia, diseño UX/UI, desarrollo de alto rendimiento y SEO técnico desde el primer día.",
        area=["Madrid"], logo_aria="Kuper Media, inicio",
        nav_aria="Navegación principal", nav_services="Servicios", nav_work="Proyectos", nav_process="Proceso", nav_faq="Preguntas", nav_cta="Hablemos",
        lang_aria="Región e idioma", crumbs_aria="Ruta", crumb_home="Inicio", crumb_page="Diseño web en Madrid",
        eyebrow="Estudio en Madrid · CDMX", h1a="Diseño web", h1b="en Madrid",
        lead="Sitios a medida que <b>se ven increíbles, cargan rápido</b> y están preparados para Google y la IA desde el primer día. Estrategia, diseño, desarrollo y agentes de IA en un solo equipo.",
        cta_primary="Cuéntanos tu proyecto", cta_secondary="Ver proyectos", callout="Hecho a medida",
        card_project_sub="Diseño y desarrollo web", mini_label="Diseñado para", mini_text="Core Web Vitals, SEO técnico y búsqueda con IA",
        chip="Equipo en Madrid y CDMX", scroll_hint="Desliza para explorar",
        clients_aria="Marcas con las que hemos trabajado", clients_label="Marcas que confiaron en Kuper",
        clients_sr="Natalia Lafourcade, Miami Ad School, Señor Taco, Aemara y Dr. Raúl López Infante.",
        inc_label="Qué incluye", inc_h2a="Se ven bien.", inc_h2b="Funcionan mejor.",
        inc_p="Nada de plantillas. Cada proyecto se diseña para tu marca y se construye para vender, cargar rápido y aparecer en Google y en las respuestas de la IA.",
        f1_t="Estrategia y UX", f1_p="Entendemos tu negocio y a tus clientes antes de dibujar un solo píxel.", f1_tags=["Arquitectura", "Wireframes", "Copy"],
        f2_t="Diseño a medida", f2_p="Interfaces con carácter, animación y detalle, alineadas con tu identidad.", f2_tags=["UI", "Motion", "Branding"],
        f3_t="Desarrollo de alto rendimiento", f3_p="Código limpio, rápido y accesible. Experiencias 3D cuando suman, no cuando pesan.", f3_tags=["Core Web Vitals", "WebGL", "CMS"],
        f4_t="SEO y GEO desde el día uno", f4_p="Estructura, datos y contenido listos para Google y para ChatGPT, Gemini o Perplexity.", f4_tags=["SEO técnico", "Schema", "IA"],
        proc_label="Cómo trabajamos", proc_h2a="Del brief", proc_h2b="al lanzamiento",
        proc_p="Un proceso claro, con entregas visibles en cada etapa y un solo equipo de principio a fin.", stage="Etapa",
        s1_t="Descubrimiento", s1_p="Llamada, objetivos, competencia y alcance. Sales con una propuesta clara.",
        s2_t="Diseño", s2_p="Dirección visual y prototipo navegable que revisas antes de programar.",
        s3_t="Desarrollo", s3_p="Construcción, contenido, SEO técnico y pruebas en móvil y escritorio.",
        s4_t="Lanzamiento", s4_p="Publicación, medición y acompañamiento para seguir creciendo.",
        proj_label="Trabajo seleccionado", proj_h2a="Nuestro", proj_h2b="trabajo",
        proj_p="Proyectos para artistas, escuelas creativas y marcas que quieren destacar.",
        p1_pill="Diseño web", p1_sub="Sitio oficial · Diseño y desarrollo", p2_pill="Marketing", p2_sub="Marketing digital", p3_pill="Agente de IA", p3_sub="Agente de IA · Web",
        faq_label="Preguntas frecuentes", faq_h2a="Lo que", faq_h2b="nos preguntan",
        faq=[
            ("¿Cuánto cuesta una web a medida en Madrid?", "Depende del alcance: número de páginas, animaciones, integraciones y si incluye agentes de IA o tienda. Tras una llamada de 30 minutos te enviamos una propuesta cerrada, sin sorpresas."),
            ("¿Cuánto tarda el proyecto?", "El plazo se fija en la propuesta según el alcance, con fechas para cada etapa: descubrimiento, diseño, desarrollo y lanzamiento."),
            ("¿Trabajáis en persona o en remoto?", "Las dos cosas. Tenemos equipo en Madrid y en Ciudad de México, y trabajamos en remoto con clientes de otros países."),
            ("¿La web incluye SEO?", "Sí. Cada sitio sale con SEO técnico, datos estructurados y una estructura pensada para Google y para los buscadores con IA. Si quieres ir más allá, tenemos servicio de posicionamiento SEO y GEO."),
            ("¿Podéis añadir un agente de IA a mi web?", "Sí, es uno de nuestros servicios: agentes entrenados con la información de tu negocio para atención al cliente, ventas u operaciones. El asistente de esta página es un ejemplo."),
        ],
        cta_label="¿Empezamos?", cta_h2="Hablemos", cta_p="Cuéntanos qué quieres construir y te respondemos con los siguientes pasos.",
        footer="© 2026 Kuper Media · Madrid · Ciudad de México", footer_aria="Pie de página",
        ai_launch="Pregúntale a Kuper AI", ai_launch_sub="Respuesta al instante", ai_status="En línea · Hecho por Kuper Media",
        ai_close="Cerrar asistente", ai_input_label="Escribe tu pregunta", ai_placeholder="Escribe tu pregunta…", ai_send="Enviar",
        ai_note="Este asistente es un ejemplo de los agentes de IA que construimos.",
        ai=dict(
            greeting="¡Hola! 👋 Soy Kuper AI. Pregúntame lo que quieras sobre diseño web, SEO o agentes de IA.",
            chips=["¿Cuánto cuesta una web?", "¿Cuánto tarda?", "¿Hacéis agentes de IA?", "Quiero agendar una llamada"],
            fallback=f"Buena pregunta. Para darte una respuesta precisa, lo mejor es que lo veamos juntos: escríbenos a {MAIL} y te respondemos con los siguientes pasos.",
            kb=[
                ["(precio|cuesta|cuánto|cuanto|presupuesto|coste|costo)", 'Cada web se presupuesta según su alcance: páginas, animaciones, integraciones y si lleva IA. Tras una llamada de 30 minutos te enviamos una propuesta cerrada. ¿Quieres que <a href="#contacto">agendemos esa llamada</a>?'],
                ["(tarda|tiempo|plazo|cuándo|semanas)", "Fijamos el plazo en la propuesta, con fechas para descubrimiento, diseño, desarrollo y lanzamiento. Así sabes exactamente qué recibes y cuándo."],
                ["(\\bia\\b|agente|chatbot|bot|inteligencia)", "Sí, diseñamos agentes de IA entrenados con la información de tu negocio: atención al cliente, ventas u operaciones. Este asistente es un ejemplo de lo que construimos."],
                ["(seo|google|posicion|geo|chatgpt)", "Todas nuestras webs salen con SEO técnico, datos estructurados y una estructura pensada para Google y para buscadores con IA como ChatGPT o Perplexity."],
                ["(madrid|méxico|mexico|cdmx|dónde|donde|oficina|presencial)", "Tenemos equipo en Madrid y en Ciudad de México. Trabajamos en persona o en remoto, también con clientes de otros países."],
                ["(proyecto|portafolio|clientes|trabajos|ejemplos)", 'Hemos trabajado con Natalia Lafourcade, Miami Ad School, Señor Taco, Aemara y el Dr. Raúl López Infante, entre otros. Puedes verlos en <a href="#proyectos">nuestro trabajo</a>.'],
                ["(llamada|contacto|hablar|agendar|reunión|whatsapp|correo)", f"Perfecto. Escríbenos a {MAIL} o por {WA} y te respondemos con los siguientes pasos."],
            ],
        ),
    ),
    # ───────────────────────── MÉXICO (ustedes) ─────────────────────────
    "cdmx": dict(
        lang="es-MX", og_locale="es_MX",
        title="Diseño de páginas web en CDMX | Kuper Media",
        description="Estudio de diseño de páginas web en CDMX: sitios a medida, rápidos y listos para SEO e IA. Estrategia, diseño, desarrollo web y agentes de IA en un solo equipo.",
        og_description="Páginas web a medida, rápidas y listas para SEO e IA. Equipo en Ciudad de México y Madrid.",
        service_name="Diseño de páginas web en CDMX", service_type="Diseño y desarrollo web",
        service_desc="Páginas web a medida: estrategia, diseño UX/UI, desarrollo de alto rendimiento y SEO técnico desde el primer día.",
        area=["Ciudad de México"], logo_aria="Kuper Media, inicio",
        nav_aria="Navegación principal", nav_services="Servicios", nav_work="Proyectos", nav_process="Proceso", nav_faq="Preguntas", nav_cta="Hablemos",
        lang_aria="Región e idioma", crumbs_aria="Ruta", crumb_home="Inicio", crumb_page="Diseño web en CDMX",
        eyebrow="Estudio en CDMX · Madrid", h1a="Diseño web", h1b="en CDMX",
        lead="Páginas web a medida que <b>se ven increíbles, cargan rápido</b> y están listas para Google y la IA desde el primer día. Estrategia, diseño, desarrollo y agentes de IA en un solo equipo.",
        cta_primary="Cuéntanos tu proyecto", cta_secondary="Ver proyectos", callout="Hecho a la medida",
        card_project_sub="Diseño y desarrollo web", mini_label="Diseñado para", mini_text="Core Web Vitals, SEO técnico y búsqueda con IA",
        chip="Equipo en CDMX y Madrid", scroll_hint="Desliza para explorar",
        clients_aria="Marcas con las que hemos trabajado", clients_label="Marcas que confiaron en Kuper",
        clients_sr="Natalia Lafourcade, Miami Ad School, Señor Taco, Aemara y Dr. Raúl López Infante.",
        inc_label="Qué incluye", inc_h2a="Se ven bien.", inc_h2b="Funcionan mejor.",
        inc_p="Nada de plantillas. Cada proyecto se diseña para tu marca y se construye para vender, cargar rápido y aparecer en Google y en las respuestas de la IA.",
        f1_t="Estrategia y UX", f1_p="Entendemos tu negocio y a tus clientes antes de dibujar un solo pixel.", f1_tags=["Arquitectura", "Wireframes", "Copy"],
        f2_t="Diseño a la medida", f2_p="Interfaces con carácter, animación y detalle, alineadas con tu identidad.", f2_tags=["UI", "Motion", "Branding"],
        f3_t="Desarrollo de alto rendimiento", f3_p="Código limpio, rápido y accesible. Experiencias 3D cuando suman, no cuando pesan.", f3_tags=["Core Web Vitals", "WebGL", "CMS"],
        f4_t="SEO y GEO desde el día uno", f4_p="Estructura, datos y contenido listos para Google y para ChatGPT, Gemini o Perplexity.", f4_tags=["SEO técnico", "Schema", "IA"],
        proc_label="Cómo trabajamos", proc_h2a="Del brief", proc_h2b="al lanzamiento",
        proc_p="Un proceso claro, con entregas visibles en cada etapa y un solo equipo de principio a fin.", stage="Etapa",
        s1_t="Descubrimiento", s1_p="Llamada, objetivos, competencia y alcance. Sales con una propuesta clara.",
        s2_t="Diseño", s2_p="Dirección visual y prototipo navegable que revisas antes de programar.",
        s3_t="Desarrollo", s3_p="Construcción, contenido, SEO técnico y pruebas en celular y computadora.",
        s4_t="Lanzamiento", s4_p="Publicación, medición y acompañamiento para seguir creciendo.",
        proj_label="Trabajo seleccionado", proj_h2a="Nuestro", proj_h2b="trabajo",
        proj_p="Proyectos para artistas, escuelas creativas y marcas que quieren destacar.",
        p1_pill="Diseño web", p1_sub="Sitio oficial · Diseño y desarrollo", p2_pill="Marketing", p2_sub="Marketing digital", p3_pill="Agente de IA", p3_sub="Agente de IA · Web",
        faq_label="Preguntas frecuentes", faq_h2a="Lo que", faq_h2b="nos preguntan",
        faq=[
            ("¿Cuánto cuesta una página web a la medida en CDMX?", "Depende del alcance: número de secciones, animaciones, integraciones y si incluye agentes de IA o tienda en línea. Después de una llamada de 30 minutos te mandamos una propuesta cerrada, sin sorpresas."),
            ("¿Cuánto tarda el proyecto?", "El tiempo se define en la propuesta según el alcance, con fechas para cada etapa: descubrimiento, diseño, desarrollo y lanzamiento."),
            ("¿Trabajan en persona o a distancia?", "Las dos. Tenemos equipo en Ciudad de México y en Madrid, y trabajamos a distancia con clientes de otros países."),
            ("¿La página incluye SEO?", "Sí. Cada sitio sale con SEO técnico, datos estructurados y una estructura pensada para Google y para los buscadores con IA. Si quieres ir más allá, tenemos servicio de posicionamiento SEO y GEO."),
            ("¿Pueden agregar un agente de IA a mi página?", "Sí, es uno de nuestros servicios: agentes entrenados con la información de tu negocio para atención a clientes, ventas u operaciones. El asistente de esta página es un ejemplo."),
        ],
        cta_label="¿Empezamos?", cta_h2="Hablemos", cta_p="Cuéntanos qué quieres construir y te respondemos con los siguientes pasos.",
        footer="© 2026 Kuper Media · Ciudad de México · Madrid", footer_aria="Pie de página",
        ai_launch="Pregúntale a Kuper AI", ai_launch_sub="Respuesta al instante", ai_status="En línea · Hecho por Kuper Media",
        ai_close="Cerrar asistente", ai_input_label="Escribe tu pregunta", ai_placeholder="Escribe tu pregunta…", ai_send="Enviar",
        ai_note="Este asistente es un ejemplo de los agentes de IA que construimos.",
        ai=dict(
            greeting="¡Hola! 👋 Soy Kuper AI. Pregúntame lo que quieras sobre diseño web, SEO o agentes de IA.",
            chips=["¿Cuánto cuesta una página web?", "¿Cuánto tarda?", "¿Hacen agentes de IA?", "Quiero agendar una llamada"],
            fallback=f"Buena pregunta. Para darte una respuesta precisa, lo mejor es platicarlo: escríbenos a {MAIL} y te respondemos con los siguientes pasos.",
            kb=[
                ["(precio|cuesta|cuánto|cuanto|presupuesto|costo|cotiza)", 'Cada página se cotiza según su alcance: secciones, animaciones, integraciones y si lleva IA. Después de una llamada de 30 minutos te mandamos una propuesta cerrada. ¿Quieres que <a href="#contacto">agendemos esa llamada</a>?'],
                ["(tarda|tiempo|plazo|cuándo|semanas)", "Definimos el tiempo en la propuesta, con fechas para descubrimiento, diseño, desarrollo y lanzamiento. Así sabes exactamente qué recibes y cuándo."],
                ["(\\bia\\b|agente|chatbot|bot|inteligencia)", "Sí, diseñamos agentes de IA entrenados con la información de tu negocio: atención a clientes, ventas u operaciones. Este asistente es un ejemplo de lo que construimos."],
                ["(seo|google|posicion|geo|chatgpt)", "Todas nuestras páginas salen con SEO técnico, datos estructurados y una estructura pensada para Google y para buscadores con IA como ChatGPT o Perplexity."],
                ["(madrid|méxico|mexico|cdmx|dónde|donde|oficina|presencial)", "Tenemos equipo en Ciudad de México y en Madrid. Trabajamos en persona o a distancia, también con clientes de otros países."],
                ["(proyecto|portafolio|clientes|trabajos|ejemplos)", 'Hemos trabajado con Natalia Lafourcade, Miami Ad School, Señor Taco, Aemara y el Dr. Raúl López Infante, entre otros. Puedes verlos en <a href="#proyectos">nuestro trabajo</a>.'],
                ["(llamada|contacto|hablar|platicar|agendar|reunión|junta|whatsapp|correo)", f"¡Va! Escríbenos a {MAIL} o por {WA} y te respondemos con los siguientes pasos."],
            ],
        ),
    ),
    # ───────────────────────── ENGLISH ─────────────────────────
    "en": dict(
        lang="en", og_locale="en_US",
        title="Web Design Studio in Madrid & Mexico City | Kuper Media",
        description="Web design studio in Madrid and Mexico City: custom, fast websites built for SEO and AI search. Strategy, design, development and AI agents in one team.",
        og_description="Custom, fast websites built for SEO and AI search. Teams in Madrid and Mexico City.",
        service_name="Web design in Madrid and Mexico City", service_type="Web design and development",
        service_desc="Custom websites: strategy, UX/UI design, high-performance development and technical SEO from day one.",
        area=["Madrid", "Mexico City"], logo_aria="Kuper Media, home",
        nav_aria="Main navigation", nav_services="Services", nav_work="Work", nav_process="Process", nav_faq="FAQ", nav_cta="Let's talk",
        lang_aria="Region and language", crumbs_aria="Breadcrumb", crumb_home="Home", crumb_page="Web design",
        eyebrow="Studio in Madrid · Mexico City", h1a="Web design", h1b="studio",
        lead="Custom websites that <b>look incredible, load fast</b> and are ready for Google and AI search from day one. Strategy, design, development and AI agents in one team.",
        cta_primary="Tell us about your project", cta_secondary="See our work", callout="Custom built",
        card_project_sub="Web design & development", mini_label="Built for", mini_text="Core Web Vitals, technical SEO and AI search",
        chip="Teams in Madrid & Mexico City", scroll_hint="Scroll to explore",
        clients_aria="Brands we've worked with", clients_label="Brands that trusted Kuper",
        clients_sr="Natalia Lafourcade, Miami Ad School, Señor Taco, Aemara and Dr. Raúl López Infante.",
        inc_label="What's included", inc_h2a="Looks good.", inc_h2b="Works better.",
        inc_p="No templates. Every project is designed for your brand and built to sell, load fast and show up on Google and in AI answers.",
        f1_t="Strategy & UX", f1_p="We understand your business and your customers before drawing a single pixel.", f1_tags=["Architecture", "Wireframes", "Copy"],
        f2_t="Custom design", f2_p="Interfaces with character, motion and detail, aligned with your identity.", f2_tags=["UI", "Motion", "Branding"],
        f3_t="High-performance development", f3_p="Clean, fast, accessible code. 3D experiences when they add value, not weight.", f3_tags=["Core Web Vitals", "WebGL", "CMS"],
        f4_t="SEO & GEO from day one", f4_p="Structure, data and content ready for Google and for ChatGPT, Gemini or Perplexity.", f4_tags=["Technical SEO", "Schema", "AI"],
        proc_label="How we work", proc_h2a="From brief", proc_h2b="to launch",
        proc_p="A clear process with visible deliverables at every stage and one team from start to finish.", stage="Stage",
        s1_t="Discovery", s1_p="Call, goals, competitors and scope. You leave with a clear proposal.",
        s2_t="Design", s2_p="Visual direction and a clickable prototype you review before we write code.",
        s3_t="Development", s3_p="Build, content, technical SEO and testing on mobile and desktop.",
        s4_t="Launch", s4_p="Go live, measurement and ongoing support to keep growing.",
        proj_label="Selected work", proj_h2a="Our", proj_h2b="work",
        proj_p="Projects for artists, creative schools and brands that want to stand out.",
        p1_pill="Web design", p1_sub="Official site · Design & development", p2_pill="Marketing", p2_sub="Digital marketing", p3_pill="AI agent", p3_sub="AI agent · Web",
        faq_label="FAQ", faq_h2a="What people", faq_h2b="ask us",
        faq=[
            ("How much does a custom website cost?", "It depends on scope: number of pages, animations, integrations and whether it includes AI agents or e-commerce. After a 30-minute call we send you a fixed-price proposal, no surprises."),
            ("How long does a project take?", "We set the timeline in the proposal based on scope, with dates for each stage: discovery, design, development and launch."),
            ("Do you work in person or remotely?", "Both. We have teams in Madrid and Mexico City, and we work remotely with clients in other countries."),
            ("Does the website include SEO?", "Yes. Every site ships with technical SEO, structured data and a structure built for Google and AI search engines. If you want to go further, we offer SEO and GEO services."),
            ("Can you add an AI agent to my website?", "Yes, it's one of our services: agents trained on your business information for customer support, sales or operations. The assistant on this page is an example."),
        ],
        cta_label="Ready to start?", cta_h2="Let's talk", cta_p="Tell us what you want to build and we'll get back to you with next steps.",
        footer="© 2026 Kuper Media · Madrid · Mexico City", footer_aria="Footer",
        ai_launch="Ask Kuper AI", ai_launch_sub="Instant answers", ai_status="Online · Built by Kuper Media",
        ai_close="Close assistant", ai_input_label="Type your question", ai_placeholder="Type your question…", ai_send="Send",
        ai_note="This assistant is an example of the AI agents we build.",
        ai=dict(
            greeting="Hi! 👋 I'm Kuper AI. Ask me anything about web design, SEO or AI agents.",
            chips=["How much does a website cost?", "How long does it take?", "Do you build AI agents?", "I'd like to book a call"],
            fallback=f"Good question. To give you a precise answer, let's talk it through: email us at {MAIL} and we'll get back to you with next steps.",
            kb=[
                ["(price|cost|how much|budget|quote|pricing)", 'Every website is quoted based on scope: pages, animations, integrations and whether it includes AI. After a 30-minute call we send you a fixed-price proposal. Want to <a href="#contacto">book that call</a>?'],
                ["(how long|time|timeline|when|weeks|deadline)", "We set the timeline in the proposal, with dates for discovery, design, development and launch, so you know exactly what you get and when."],
                ["(\\bai\\b|agent|chatbot|bot|artificial)", "Yes, we build AI agents trained on your business information: customer support, sales or operations. This assistant is an example of what we build."],
                ["(seo|google|rank|geo|chatgpt)", "Every website we build ships with technical SEO, structured data and a structure designed for Google and AI search engines like ChatGPT or Perplexity."],
                ["(madrid|mexico|cdmx|where|office|in person|remote)", "We have teams in Madrid and Mexico City. We work in person or remotely, including with clients in other countries."],
                ["(project|portfolio|clients|work|examples)", 'We have worked with Natalia Lafourcade, Miami Ad School, Señor Taco, Aemara and Dr. Raúl López Infante, among others. See them in <a href="#proyectos">our work</a>.'],
                ["(call|contact|talk|book|meeting|whatsapp|email)", f"Great. Email us at {MAIL} or message us on {WA} and we'll get back to you with next steps."],
            ],
        ),
    ),
}


def jsonld(v, L):
    url = SITE + v["path"]
    area = [{"@type": "City", "name": c} for c in L["area"]]
    data = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Service",
                "@id": url + "#service",
                "name": L["service_name"],
                "serviceType": L["service_type"],
                "provider": {"@id": SITE + "/#organization"},
                "areaServed": area[0] if len(area) == 1 else area,
                "description": L["service_desc"],
                "inLanguage": L["lang"],
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": L["crumb_home"], "item": SITE + "/"},
                    {"@type": "ListItem", "position": 2, "name": L["crumb_page"], "item": url},
                ],
            },
        ],
    }
    return json.dumps(data, ensure_ascii=False, indent=2)


def hreflang():
    lines = [f'<link rel="alternate" hreflang="{v["hreflang"]}" href="{SITE}{v["path"]}">' for v in VERSIONS]
    xd = next(v for v in VERSIONS if v["id"] == X_DEFAULT)
    lines.append(f'<link rel="alternate" hreflang="x-default" href="{SITE}{xd["path"]}">')
    return "\n".join(lines)


def switcher(current):
    out = []
    for v in VERSIONS:
        cur = ' aria-current="page"' if v["id"] == current else ""
        full = v["city"] if v["id"] != "en" else "English"
        code = "" if v["id"] == "en" else f'<b>{v["code"]}</b>'
        out.append(f'      <a href="{v["path"]}" hreflang="{v["hreflang"]}" lang="{v["hreflang"]}"{cur}>{code}<span class="full">{full}</span><span class="short">{v["code"]}</span></a>')
    return "\n".join(out)


def build():
    tpl = (ROOT / "template.html").read_text(encoding="utf-8")
    styles = (ROOT / "styles.css").read_text(encoding="utf-8") + EXTRA_CSS
    for v in VERSIONS:
        L = dict(LOCALES[v["id"]])
        vals = {k: val for k, val in L.items() if isinstance(val, str)}
        vals.update(
            url=SITE + v["path"],
            hreflang=hreflang(),
            jsonld=jsonld(v, L),
            styles=styles,
            switcher=switcher(v["id"]),
            faq_items=faq(L["faq"]),
            ai_json=json.dumps(L["ai"], ensure_ascii=False),
            **{f"f{i}_tags": tags(L[f"f{i}_tags"]) for i in range(1, 5)},
        )
        html = re.sub(r"\{\{(\w+)\}\}", lambda m: vals[m.group(1)], tpl)
        left = re.findall(r"\{\{\w+\}\}", html)
        assert not left, f"{v['id']}: marcadores sin valor {left}"
        out = DIST / v["path"].strip("/") / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(html, encoding="utf-8")
        print(f"✓ {out.relative_to(ROOT.parent)}  ({len(L['title'])} car. título, {len(L['description'])} car. descripción)")


if __name__ == "__main__":
    build()
