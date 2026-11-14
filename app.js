/* Raíz — una agenda para vivir el presente.
   Todo se guarda en el propio dispositivo (localStorage). */
(() => {
  "use strict";

  // ---------- Datos ----------
  const CLAVE = "raiz.v1";
  const MAX_TAREAS = 3;

  const FRASES = [
    "Lo único que tienes de verdad es este momento. Y es suficiente.",
    "El búho no tiene prisa: mira, escucha y espera.",
    "En la oscuridad, el búho no se asusta. Abre bien los ojos.",
    "No tienes que resolver toda tu vida. Solo este día.",
    "El ayer ya hizo su trabajo. Déjalo descansar.",
    "Respira. Ahora mismo estás bien.",
    "Hacer menos, pero con presencia, también es avanzar.",
    "Las raíces no se ven, pero sostienen todo el árbol.",
    "Hoy no tienes que ser mejor. Solo tienes que estar.",
    "La preocupación no cambia el mañana. Solo le quita fuerza al hoy.",
    "Mira a tu alrededor: hay algo bonito pasando ahora mismo.",
    "Lo que no puedes controlar, puedes soltarlo.",
    "Quien observa en silencio, entiende más.",
    "Ir despacio no es ir mal. Es ir a tu ritmo.",
    "El presente es el único sitio donde puedes actuar.",
    "Hoy basta con hacer bien una cosa pequeña.",
    "No cargues hoy con el peso de días que ya pasaron.",
    "El miedo habla del futuro. Tu cuerpo vive en el ahora.",
    "Agradecer lo pequeño hace grande el día.",
    "La luna no brilla siempre entera, y sigue siendo la luna.",
    "Si te pierdes, vuelve a tu respiración. Siempre está aquí.",
    "Lo que hiciste ayer no te define. Lo que vives hoy, sí te construye.",
    "Hoy también cuenta, aunque sea un día normal.",
    "La noche no dura para siempre. Tampoco lo que hoy te inquieta.",
    "Pon los pies en el suelo. Siente que estás aquí.",
    "El momento perfecto no llega. Se vive el que hay.",
    "Suelta lo que pesa y quédate con lo que te cuida.",
    "Estar presente es el mejor regalo que puedes hacerte.",
    "Descansar también es avanzar.",
    "Hoy es el día que ayer te preocupaba. Y aquí estás."
  ];

  const PREGUNTAS = {
    futuro: [
      "¿Está pasando ahora mismo, o es algo que imaginas?",
      "¿Qué parte de esto puedes hacer hoy? Lo demás, suéltalo.",
      "Cuando llegue ese momento, tendrás recursos que hoy no ves.",
      "¿Qué le dirías a un amigo que te contara esto?"
    ],
    pasado: [
      "Ya pasó. Hiciste lo que pudiste con lo que sabías entonces.",
      "¿Qué aprendiste de aquello? Quédate con eso y suelta el resto.",
      "No puedes cambiar el ayer, pero sí cómo vives hoy.",
      "Perdonarte también es una forma de seguir adelante."
    ]
  };

  // Los id se mantienen para respetar los datos ya guardados
  const ANIMOS = [
    { id: "lluvia", luz: 0, txt: "Oscuro" },
    { id: "seca", luz: 0.22, txt: "Cansado" },
    { id: "brote", luz: 0.5, txt: "Tranquilo" },
    { id: "calma", luz: 0.78, txt: "Sereno" },
    { id: "flor", luz: 1, txt: "Pleno" }
  ];

  const ANCLAJE = [
    { n: "5", t: "Mira a tu alrededor y nombra 5 cosas que puedes ver." },
    { n: "4", t: "Fíjate en 4 cosas que puedes tocar o sentir en tu piel." },
    { n: "3", t: "Escucha con atención: 3 sonidos que oyes ahora." },
    { n: "2", t: "Busca 2 olores, aunque sean muy suaves." },
    { n: "1", t: "Nota 1 sabor en tu boca, o di una cosa buena de ti." },
    { n: "✦", t: "Ya estás aquí, en el presente. Bien hecho." }
  ];

  let estado = cargar();

  function vacio() { return { nombre: "", dias: {}, soltados: 0, ayerVisto: "", tema: "auto" }; }
  function cargar() {
    try {
      const d = JSON.parse(localStorage.getItem(CLAVE));
      if (d && typeof d === "object") return { ...vacio(), ...d };
    } catch (e) { /* sin datos o almacenamiento bloqueado */ }
    return vacio();
  }
  function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify(estado)); }
    catch (e) { avisar("No se ha podido guardar en este dispositivo"); }
  }

  // ---------- Fechas ----------
  const claveFecha = (d) => {
    const z = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
  };
  const hoyClave = () => claveFecha(new Date());
  const desdeClave = (k) => { const [a, m, d] = k.split("-").map(Number); return new Date(a, m - 1, d); };
  const fechaLarga = (d) => { const s = d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }); return s.charAt(0).toUpperCase() + s.slice(1); };
  const fechaCorta = (d) => d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });

  function diaHoy() {
    const k = hoyClave();
    if (!estado.dias[k]) {
      estado.dias[k] = { intencion: "", tareas: [], momento: "", gratitud: ["", "", ""], animo: null, cerrado: false };
    }
    return estado.dias[k];
  }

  // ---------- Utilidades ----------
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);
  let toastT;
  function avisar(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("ver");
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove("ver"), 2600);
  }
  const azar = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // Dibuja una luna con la parte iluminada indicada (0 = nueva, 1 = llena)
  function lunaSVG(luz) {
    const r = 14, c = 16;
    let luzPath = "";
    if (luz > 0) {
      const rx = Math.abs(1 - 2 * luz) * r;
      const barrido = luz < 0.5 ? 0 : 1;
      luzPath = `<path class="luna-luz" d="M${c} ${c - r} A${r} ${r} 0 0 1 ${c} ${c + r} A${rx.toFixed(2)} ${r} 0 0 ${barrido} ${c} ${c - r} Z"/>`;
    }
    const borde = luz === 0 ? `<circle class="luna-borde" cx="${c}" cy="${c}" r="${r}"/>` : "";
    return `<svg viewBox="0 0 32 32" aria-hidden="true"><circle class="luna-sombra" cx="${c}" cy="${c}" r="${r}"/>${luzPath}${borde}</svg>`;
  }

  // ---------- Tema (día / noche) ----------
  function aplicarTema() {
    const pref = estado.tema || "auto";
    const h = new Date().getHours();
    const t = pref === "auto" ? (h >= 8 && h < 20 ? "alba" : "noche") : pref;
    document.documentElement.dataset.tema = t;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = t === "noche" ? "#161a33" : "#e9e6f2";
    $$("#temas .chip").forEach((c) => c.classList.toggle("activo", c.dataset.tema === pref));
  }

  // ---------- Cabecera ----------
  function pintarCabecera() {
    const h = new Date().getHours();
    const base = h < 6 ? "Buenas noches" : h < 13 ? "Buenos días" : h < 21 ? "Buenas tardes" : "Buenas noches";
    $("#saludo").textContent = estado.nombre ? `${base}, ${estado.nombre}` : base;
    $("#fecha").textContent = fechaLarga(new Date());
    const inicio = new Date(new Date().getFullYear(), 0, 0);
    const diaAnio = Math.floor((new Date() - inicio) / 864e5);
    $("#frase").textContent = FRASES[diaAnio % FRASES.length];
  }

  // ---------- Hoy ----------
  const SVG_CHECK = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>';

  function pintarTareas() {
    const d = diaHoy();
    const ul = $("#tareas");
    ul.innerHTML = "";
    d.tareas.forEach((t, i) => {
      const li = document.createElement("li");
      li.className = "tarea" + (t.hecho ? " hecha" : "");
      const chk = document.createElement("button");
      chk.className = "check";
      chk.setAttribute("aria-label", t.hecho ? "Marcar como pendiente" : "Marcar como hecha");
      chk.innerHTML = SVG_CHECK;
      chk.onclick = () => {
        t.hecho = !t.hecho;
        guardar(); pintarTareas();
        if (t.hecho) avisar(azar(["Bien hecho", "Una menos. Respira.", "Paso a paso"]));
      };
      const sp = document.createElement("span");
      sp.className = "texto";
      sp.textContent = t.t;
      const del = document.createElement("button");
      del.className = "borrar";
      del.setAttribute("aria-label", "Quitar");
      del.textContent = "×";
      del.onclick = () => { d.tareas.splice(i, 1); guardar(); pintarTareas(); };
      li.append(chk, sp, del);
      ul.append(li);
    });
    const lleno = d.tareas.length >= MAX_TAREAS;
    $("#form-tarea").classList.toggle("oculto", lleno);
    $("#nota-limite").classList.toggle("oculto", !lleno);
  }

  function añadirTarea(texto) {
    const d = diaHoy();
    texto = texto.trim();
    if (!texto) return false;
    if (d.tareas.length >= MAX_TAREAS) { avisar("Tres es suficiente para hoy"); return false; }
    d.tareas.push({ t: texto, hecho: false });
    guardar(); pintarTareas();
    return true;
  }

  function pintarAnimos() {
    const d = diaHoy();
    const cont = $("#animos");
    cont.innerHTML = "";
    ANIMOS.forEach((a) => {
      const b = document.createElement("button");
      b.className = "animo" + (d.animo === a.id ? " activo" : "");
      b.setAttribute("aria-pressed", d.animo === a.id);
      b.innerHTML = `${lunaSVG(a.luz)}<span>${a.txt}</span>`;
      b.onclick = () => { d.animo = a.id; guardar(); pintarAnimos(); };
      cont.append(b);
    });
  }

  function pintarCierre() {
    const d = diaHoy();
    $("#btn-cerrar").classList.toggle("oculto", d.cerrado);
    $("#cerrado-msg").classList.toggle("oculto", !d.cerrado);
  }

  function pintarHoy() {
    const d = diaHoy();
    $("#intencion").value = d.intencion;
    $("#momento").value = d.momento;
    $$(".gratitud").forEach((el) => { el.value = d.gratitud[+el.dataset.i] || ""; });
    pintarTareas();
    pintarAnimos();
    pintarCierre();
    revisarAyer();
  }

  // Lo que quedó pendiente del último día (sin arrastrarlo automáticamente)
  function revisarAyer() {
    const hoy = hoyClave();
    const aviso = $("#aviso-ayer");
    if (estado.ayerVisto === hoy) { aviso.classList.add("oculto"); return; }
    const anteriores = Object.keys(estado.dias).filter((k) => k < hoy).sort();
    const ultimo = anteriores[anteriores.length - 1];
    const pendientes = ultimo ? estado.dias[ultimo].tareas.filter((t) => !t.hecho) : [];
    if (!pendientes.length) { aviso.classList.add("oculto"); return; }
    aviso.classList.remove("oculto");
    const lista = $("#lista-ayer");
    lista.innerHTML = "";
    lista.classList.add("oculto");
    pendientes.forEach((t) => {
      const b = document.createElement("button");
      b.textContent = "+ " + t.t;
      b.onclick = () => {
        if (añadirTarea(t.t)) { b.remove(); avisar("Añadida a hoy"); }
        if (!lista.children.length) cerrarAvisoAyer();
      };
      lista.append(b);
    });
  }
  function cerrarAvisoAyer() {
    estado.ayerVisto = hoyClave();
    guardar();
    $("#aviso-ayer").classList.add("oculto");
  }

  // ---------- Soltar ----------
  const SVG_PLUMA = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 3C12 3 6 8 5 18l-1.5 3 .9.4L6 19c9-1 14-7 14-16Z" opacity=".9"/><path d="M6 19C9 14 12 10 17 6" fill="none" stroke="var(--cielo)" stroke-width=".9" stroke-linecap="round"/></svg>';
  let tipoPeso = "futuro";
  function prepararSoltar() {
    $$("#vista-soltar .chips .chip").forEach((c) => {
      c.onclick = () => {
        tipoPeso = c.dataset.tipo;
        $$("#vista-soltar .chips .chip").forEach((x) => {
          x.classList.toggle("activo", x === c);
          x.setAttribute("aria-checked", x === c);
        });
        $("#peso").placeholder = tipoPeso === "futuro" ? "Me preocupa que…" : "Todavía me pesa que…";
        $("#pregunta-peso").textContent = "";
      };
    });
    $("#btn-soltar").onclick = () => {
      const ta = $("#peso");
      if (!ta.value.trim()) { avisar("Escribe primero lo que quieres soltar"); ta.focus(); return; }
      const btn = $("#btn-soltar");
      btn.disabled = true;
      $("#pregunta-peso").textContent = azar(PREGUNTAS[tipoPeso]);
      const zona = $(".zona-soltar");
      zona.classList.add("soltando");
      const vuelo = $("#plumas-vuelo");
      for (let i = 0; i < 8; i++) {
        const p = document.createElement("span");
        p.className = "pluma-vuela";
        p.innerHTML = SVG_PLUMA;
        p.style.left = 6 + Math.random() * 84 + "%";
        p.style.top = 30 + Math.random() * 55 + "%";
        p.style.setProperty("--dx", (Math.random() * 140 - 70) + "px");
        p.style.setProperty("--rot", (Math.random() * 280 - 140) + "deg");
        p.style.animationDelay = (Math.random() * 0.6) + "s";
        vuelo.append(p);
      }
      setTimeout(() => {
        ta.value = "";
        zona.classList.remove("soltando");
        vuelo.innerHTML = "";
        btn.disabled = false;
        estado.soltados = (estado.soltados || 0) + 1;
        guardar();
        $("#num-soltados").textContent = estado.soltados;
        avisar("Soltado. Ya no tienes que cargarlo.");
      }, 3000);
    };
    $("#num-soltados").textContent = estado.soltados || 0;
  }

  // ---------- Respirar ----------
  let respT = null, respFin = 0, minutos = 1;
  const CICLO = [
    { txt: "Inspira", s: 4, escala: 1.45, dormido: false },
    { txt: "Mantén", s: 4, escala: 1.45, dormido: false },
    { txt: "Suelta", s: 6, escala: 1, dormido: true }
  ];
  function prepararRespirar() {
    $$("#duraciones .chip").forEach((c) => {
      c.onclick = () => {
        if (respT) return;
        minutos = +c.dataset.min;
        $$("#duraciones .chip").forEach((x) => x.classList.toggle("activo", x === c));
      };
    });
    $("#btn-respirar").onclick = () => (respT ? pararRespirar("Cuando quieras") : empezarRespirar());
  }
  function empezarRespirar() {
    respFin = Date.now() + minutos * 60000;
    $("#btn-respirar").textContent = "Parar";
    let paso = 0;
    const luna = $("#luna"), sil = $("#silueta");
    const siguiente = () => {
      if (Date.now() >= respFin) { pararRespirar("Bien hecho"); return; }
      const f = CICLO[paso % CICLO.length];
      luna.style.transitionDuration = f.s + "s";
      luna.style.transform = `scale(${f.escala})`;
      luna.classList.toggle("grande", f.escala > 1);
      sil.classList.toggle("dormido", f.dormido);
      $("#fase").textContent = f.txt;
      paso++;
      respT = setTimeout(siguiente, f.s * 1000);
    };
    siguiente();
    actualizarTiempo();
  }
  function actualizarTiempo() {
    if (!respT) { $("#tiempo-resp").textContent = ""; return; }
    const rest = Math.max(0, Math.ceil((respFin - Date.now()) / 1000));
    $("#tiempo-resp").textContent = `Quedan ${Math.floor(rest / 60)}:${String(rest % 60).padStart(2, "0")}`;
    setTimeout(actualizarTiempo, 500);
  }
  function pararRespirar(msg) {
    clearTimeout(respT); respT = null;
    const l = $("#luna");
    l.style.transitionDuration = "1.5s";
    l.style.transform = "scale(1)";
    l.classList.remove("grande");
    $("#silueta").classList.remove("dormido");
    $("#fase").textContent = msg;
    $("#btn-respirar").textContent = "Empezar";
    $("#tiempo-resp").textContent = "";
  }

  // 5-4-3-2-1
  let pasoAnclaje = -1;
  function prepararAnclaje() {
    const caja = $("#anclaje");
    const btn = $("#btn-anclaje-sig");
    caja.innerHTML = '<p class="ayuda" style="margin:0">Pulsa empezar y ve paso a paso, sin prisa.</p>';
    btn.onclick = () => {
      pasoAnclaje++;
      if (pasoAnclaje >= ANCLAJE.length) { pasoAnclaje = -1; prepararAnclaje(); return; }
      const p = ANCLAJE[pasoAnclaje];
      caja.innerHTML = `<div><p class="paso-num">${p.n}</p><p class="paso-txt">${p.t}</p></div>`;
      btn.textContent = pasoAnclaje === ANCLAJE.length - 1 ? "Volver a empezar" : "Siguiente";
    };
    btn.textContent = "Empezar";
  }

  // ---------- Mi cielo ----------
  function pintarCielo() {
    const cont = $("#cielo");
    cont.innerHTML = "";
    const hoy = new Date();
    const cerrados = Object.keys(estado.dias).filter((k) => estado.dias[k].cerrado);
    if (!cerrados.length) {
      cont.innerHTML = '<p class="cielo-vacio">Tu cielo está esperando. Cierra tu primer día y verás encenderse la primera luna.</p>';
    } else {
      const inicio = new Date(hoy);
      const dSem = (hoy.getDay() + 6) % 7;
      inicio.setDate(hoy.getDate() - dSem - 28);
      ["L", "M", "X", "J", "V", "S", "D"].forEach((l) => {
        const c = document.createElement("div");
        c.className = "dia-sem";
        c.textContent = l;
        cont.append(c);
      });
      for (let i = 0; i < 35; i++) {
        const f = new Date(inicio);
        f.setDate(inicio.getDate() + i);
        const k = claveFecha(f);
        const d = estado.dias[k];
        const celda = document.createElement("div");
        celda.className = "noche-dia";
        celda.title = fechaCorta(f);
        if (k === hoyClave()) celda.classList.add("hoy");
        if (f > hoy) celda.style.visibility = "hidden";
        if (d && d.cerrado) {
          const a = ANIMOS.find((x) => x.id === d.animo) || ANIMOS[2];
          celda.innerHTML = lunaSVG(a.luz);
          celda.setAttribute("aria-label", `${fechaCorta(f)}: ${a.txt}`);
        } else {
          celda.classList.add("vacia");
          celda.textContent = f.getDate();
        }
        cont.append(celda);
      }
    }
    const ul = $("#lista-gratitudes");
    ul.innerHTML = "";
    const items = [];
    Object.keys(estado.dias).sort().reverse().forEach((k) => {
      (estado.dias[k].gratitud || []).forEach((g) => { if (g && g.trim()) items.push({ k, g }); });
    });
    if (!items.length) {
      ul.innerHTML = '<li style="color:var(--suave)">Aquí aparecerán las cosas buenas que vayas apuntando al cerrar cada día.</li>';
      return;
    }
    items.slice(0, 30).forEach(({ k, g }) => {
      const li = document.createElement("li");
      const s = document.createElement("span");
      s.className = "dia";
      s.textContent = fechaCorta(desdeClave(k));
      li.append(s, document.createTextNode(g));
      ul.append(li);
    });
  }

  // ---------- Navegación ----------
  function irA(vista) {
    $$(".vista").forEach((v) => v.classList.toggle("activa", v.id === "vista-" + vista));
    $$(".nav-btn").forEach((b) => b.classList.toggle("activo", b.dataset.vista === vista));
    if (vista === "cielo") pintarCielo();
    if (vista === "hoy") pintarHoy();
    window.scrollTo({ top: 0 });
  }

  // ---------- Ajustes ----------
  function prepararAjustes() {
    const dlg = $("#dlg-ajustes");
    $("#btn-ajustes").onclick = () => { $("#nombre").value = estado.nombre || ""; aplicarTema(); dlg.showModal(); };
    $("#nombre").addEventListener("input", (e) => { estado.nombre = e.target.value.trim(); guardar(); pintarCabecera(); });
    $$("#temas .chip").forEach((c) => {
      c.onclick = () => { estado.tema = c.dataset.tema; guardar(); aplicarTema(); };
    });
    $("#btn-exportar").onclick = () => {
      const blob = new Blob([JSON.stringify(estado, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `raiz-copia-${hoyClave()}.json`;
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      avisar("Copia guardada en tus descargas");
    };
    $("#input-importar").onchange = (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          const d = JSON.parse(r.result);
          if (!d || typeof d.dias !== "object") throw new Error();
          estado = { ...vacio(), ...d };
          guardar(); aplicarTema(); pintarCabecera(); pintarHoy(); prepararSoltar();
          avisar("Copia recuperada");
          dlg.close();
        } catch (err) { avisar("Ese archivo no es una copia de Raíz"); }
      };
      r.readAsText(f);
      e.target.value = "";
    };
    $("#btn-borrar").onclick = () => {
      if (!confirm("¿Seguro? Se borrará todo lo que has escrito en Raíz y no se puede deshacer.")) return;
      estado = vacio();
      guardar(); aplicarTema(); pintarCabecera(); pintarHoy(); prepararSoltar();
      dlg.close();
      avisar("Todo borrado. Empiezas de cero.");
    };
  }

  // ---------- Eventos de Hoy ----------
  function prepararHoy() {
    $("#intencion").addEventListener("input", (e) => { diaHoy().intencion = e.target.value; guardar(); });
    $("#momento").addEventListener("input", (e) => { diaHoy().momento = e.target.value; guardar(); });
    $$(".gratitud").forEach((el) => el.addEventListener("input", () => {
      diaHoy().gratitud[+el.dataset.i] = el.value; guardar();
    }));
    $("#form-tarea").addEventListener("submit", (e) => {
      e.preventDefault();
      const inp = $("#input-tarea");
      if (añadirTarea(inp.value)) inp.value = "";
    });
    $("#btn-cerrar").onclick = () => {
      const d = diaHoy();
      if (!d.gratitud.some((g) => g && g.trim())) { avisar("Apunta al menos una cosa buena de hoy"); $(".gratitud").focus(); return; }
      d.cerrado = true;
      if (!d.animo) d.animo = "brote";
      guardar(); pintarCierre(); pintarAnimos();
      avisar("Se ha encendido una luna en tu cielo");
    };
    $("#btn-traer").onclick = () => $("#lista-ayer").classList.toggle("oculto");
    $("#btn-dejar").onclick = () => { cerrarAvisoAyer(); avisar("Soltado. Hoy empieza limpio."); };
  }

  // ---------- Inicio ----------
  $$(".nav-btn").forEach((b) => (b.onclick = () => irA(b.dataset.vista)));
  aplicarTema();
  pintarCabecera();
  prepararHoy();
  pintarHoy();
  prepararSoltar();
  prepararRespirar();
  prepararAnclaje();
  prepararAjustes();

  // Si la app sigue abierta y cambia el día o la hora, refrescar
  let diaActual = hoyClave();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    aplicarTema();
    if (hoyClave() !== diaActual) { diaActual = hoyClave(); pintarCabecera(); pintarHoy(); }
  });

  // Funcionamiento sin conexión e instalación
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
})();
