const $ = (s) => document.querySelector(s);
const f = (n, d = 2) => Number(n).toFixed(d).replace(/\.?0+$/, "");
const deg = (r) => (r * 180) / Math.PI;

// Navegación estilo iOS: barra inferior + filas de "Más".
function irA(pestana) {
  document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("oculto", p.id !== "p-" + pestana));
  const enBarra = [...document.querySelectorAll("nav.tabbar .tab")].find((b) => b.dataset.p === pestana);
  document.querySelectorAll("nav.tabbar .tab").forEach((b) => b.classList.toggle("activa", b === (enBarra || document.querySelector('nav.tabbar .tab[data-p="mas"]'))));
  window.scrollTo({ top: 0, behavior: "instant" });
  if (pestana === "frame") setTimeout(dibujarEncuadre, 30);
}

document.querySelectorAll(".tab[data-p]").forEach((b) => b.addEventListener("click", () => irA(b.dataset.p)));

document.querySelectorAll("[data-cal]").forEach((b) => b.addEventListener("click", () => {
  const tipo = b.dataset.cal;
  const salida = $("#r-" + tipo);
  if (tipo === "fov") {
    const focal = +$("#fov-f").value, sensor = +$("#fov-s").value, dist = +$("#fov-d").value;
    const alto = sensor * 0.6667;
    const hfov = deg(2 * Math.atan(sensor / (2 * focal)));
    const vfov = deg(2 * Math.atan(alto / (2 * focal)));
    const ancho = 2 * dist * Math.tan((hfov * Math.PI) / 360);
    salida.textContent =
      `Ángulo horizontal: ${f(hfov, 1)}°\nÁngulo vertical: ${f(vfov, 1)}°\n` +
      `Encuadre a ${dist} m: ${f(ancho, 2)} m de ancho\n` +
      `Diagonal del sensor: ${f(Math.hypot(sensor, alto), 1)} mm`;
  } else if (tipo === "dof") {
    const focal = +$("#dof-f").value, N = +$("#dof-n").value, d = +$("#dof-d").value * 1000, c = +$("#dof-c").value;
    const H = (focal * focal) / (N * c) + focal;
    const cerca = (d * (H - focal)) / (H + d - 2 * focal);
    const lejos = (d * (H - focal)) / (H - d);
    salida.textContent =
      `Hiperfocal: ${f(H / 1000, 2)} m\nNítido desde: ${f(cerca / 1000, 2)} m\n` +
      `Nítido hasta: ${f(lejos / 1000, 2)} m\nProfundidad total: ${f((lejos - cerca) / 1000, 2)} m`;
  } else if (tipo === "exp") {
    const fps = +$("#exp-fps").value, ang = +$("#exp-ang").value, iso = +$("#exp-iso").value, nd = +$("#exp-nd").value;
    const t = ang / 360 / fps;
    const tNd = t * Math.pow(2, nd);
    const ev = Math.log2(Math.pow(2, nd) * 1);
    salida.textContent =
      `Velocidad de obturación: 1/${f(1 / t, 1)} s (${f(t * 1000, 1)} ms)\n` +
      `Con ND ${nd} stops equivale a 1/${f(1 / tNd, 1)} s\n` +
      `Pérdida de luz: ${f(nd, 1)} stops (${f(ev, 1)} EV)\nISO base introducido: ${iso}`;
  } else if (tipo === "tc") {
    const fps = +$("#tc-fps").value, ini = $("#tc-ini").value.trim(), dur = +$("#tc-dur").value, br = +$("#tc-br").value;
    const [h, m, s, ff] = ini.split(":").map(Number);
    let frames = Math.round(((h * 3600 + m * 60 + s) * fps) + (ff || 0) + dur * fps);
    const fpsInt = Math.round(fps);
    const H = Math.floor(frames / (fpsInt * 3600)); frames -= H * fpsInt * 3600;
    const M = Math.floor(frames / (fpsInt * 60)); frames -= M * fpsInt * 60;
    const S = Math.floor(frames / fpsInt); frames -= S * fpsInt;
    const tcf = (n) => String(n).padStart(2, "0");
    const tam = (dur * br) / 8;
    salida.textContent =
      `Timecode final: ${tcf(H)}:${tcf(M)}:${tcf(S)}:${tcf(frames)}\n` +
      `Duración: ${f(dur / 60, 2)} min\n` +
      `Tamaño a ${br} Mbps: ${f(tam, 2)} MB (${f(tam / 1024, 2)} GB)`;
  } else {
    const focal = +$("#eq-f").value, a = +$("#eq-a").value, b = +$("#eq-b").value;
    const equiv = focal * (a / b);
    const crop = a / b;
    salida.textContent =
      `Factor de recorte: ${f(crop, 2)}×\n` +
      `Equivalencia en el formato B: ${f(equiv, 1)} mm\n` +
      `Ángulo horizontal aprox.: ${f(deg(2 * Math.atan(a / (2 * focal))), 1)}° (A)`;
  }
}));
document.querySelector("[data-cal=fov]").click();
irA("fov");


// ── previsualizador de encuadre ─────────────────────────────────────────────
function dibujarEncuadre() {
  const canvas = $("#lienzo");
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const ancho = canvas.clientWidth || 720;
  const alto = Math.round(ancho / (16 / 9));
  canvas.width = ancho * dpr;
  canvas.height = alto * dpr;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, ancho, alto);

  const focal = +$("#fr-f").value;
  const [sw, sh] = $("#fr-s").value.split(",").map(Number);
  const dist = +$("#fr-d").value;
  const ar = +$("#fr-ar").value;
  const refH = +$("#fr-h").value;

  const hfov = 2 * Math.atan(sw / (2 * focal));
  const anchoReal = 2 * dist * Math.tan(hfov / 2);
  const altoReal = anchoReal / ar;

  // marco del encuadre: usa el alto disponible
  const margen = 26;
  const escala = Math.min((ancho - margen * 2) / anchoReal, (alto - margen * 2) / altoReal);
  const w = anchoReal * escala, h = altoReal * escala;
  const x = (ancho - w) / 2, y = (alto - h) / 2;

  // fondo fuera de cuadro
  ctx.fillStyle = "#05070c";
  ctx.fillRect(0, 0, ancho, alto);
  // área encuadrada
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, "#16233c");
  grad.addColorStop(1, "#0b1220");
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  // rejilla de tercios
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 3; i++) {
    ctx.beginPath(); ctx.moveTo(x + (w * i) / 3, y); ctx.lineTo(x + (w * i) / 3, y + h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y + (h * i) / 3); ctx.lineTo(x + w, y + (h * i) / 3); ctx.stroke();
  }
  // borde
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  // figura de referencia (persona) centrada y apoyada abajo
  const ph = refH * escala;
  const py = y + h - ph;
  ctx.fillStyle = "rgba(148,197,255,0.85)";
  ctx.beginPath();
  ctx.arc(x + w / 2, py + ph * 0.1, ph * 0.09, 0, Math.PI * 2); // cabeza
  ctx.fill();
  ctx.fillRect(x + w / 2 - ph * 0.1, py + ph * 0.2, ph * 0.2, ph * 0.45); // torso
  ctx.fillRect(x + w / 2 - ph * 0.07, py + ph * 0.65, ph * 0.06, ph * 0.35); // pierna izq
  ctx.fillRect(x + w / 2 + ph * 0.01, py + ph * 0.65, ph * 0.06, ph * 0.35); // pierna der

  ctx.fillStyle = "#cbd5e1";
  ctx.font = "12px ui-monospace, monospace";
  ctx.fillText(`${focal} mm · ${dist} m`, x + 10, y + 18);
  ctx.fillText(`${f(anchoReal, 2)} × ${f(altoReal, 2)} m`, x + 10, y + h - 10);

  $("#r-frame").textContent =
    `Ángulo horizontal: ${f(deg(hfov), 1)}°\nCampo a ${dist} m: ${f(anchoReal, 2)} m de ancho × ${f(altoReal, 2)} m de alto\n` +
    `Persona de ${refH} m ocupa el ${f((refH / altoReal) * 100, 1)}% del alto del cuadro`;
}
["#fr-f", "#fr-s", "#fr-d", "#fr-ar", "#fr-h"].forEach((sel) => {
  const el = $(sel);
  if (el) el.addEventListener("input", dibujarEncuadre);
});
window.addEventListener("resize", dibujarEncuadre);

// ── comparador de objetivos ─────────────────────────────────────────────────
function comparar() {
  const [sw] = $("#cmp-s").value.split(",").map(Number);
  const dist = +$("#cmp-d").value, N = +$("#cmp-n").value;
  const focales = [ +$("#cmp-a").value, +$("#cmp-b").value, +$("#cmp-c").value ];
  const c = 0.029;
  const filas = focales.map((focal) => {
    const hfov = deg(2 * Math.atan(sw / (2 * focal)));
    const ancho = 2 * dist * Math.tan((hfov * Math.PI) / 360);
    const H = (focal * focal) / (N * c) + focal;
    const d = dist * 1000;
    const cerca = (d * (H - focal)) / (H + d - 2 * focal);
    const lejos = (d * (H - focal)) / (H - d);
    return `${String(focal).padStart(3)} mm → ${f(hfov, 1).padStart(5)}° · ${f(ancho, 2).padStart(5)} m ancho · DoF ${f((lejos - cerca) / 1000, 2)} m`;
  });
  $("#r-cmp").textContent = filas.join("\n");
}
document.querySelector("[data-cal=cmp]")?.addEventListener("click", comparar);
