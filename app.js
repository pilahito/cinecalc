const $ = (s) => document.querySelector(s);
const f = (n, d = 2) => Number(n).toFixed(d).replace(/\.?0+$/, "");
const deg = (r) => (r * 180) / Math.PI;

document.querySelectorAll(".tab").forEach((b) => b.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("activa", x === b));
  document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("oculto", p.id !== "p-" + b.dataset.p));
}));

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
