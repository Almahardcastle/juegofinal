// ---------- Ajustes ----------
const RADIO = 30;             // grosor del trazo que revela (px)
const PORCENTAJE_FINAL = 0.95; // cuánto hay que revelar para terminar (0 a 1)
const MARGEN_TEXTO = 0.84;    // el texto ocupa como máximo este % de la pantalla
const PUNTA_X = 0;            // posición de la punta del lápiz dentro de lapiz.png (%)
const PUNTA_Y = 100;          // 0,100 = esquina inferior izquierda
const COLUMNAS = 24;          // resolución de la cuadrícula que mide el avance

// ---------- Elementos ----------
const pantallas = {
  inicio: document.getElementById("pantalla-inicio"),
  juego: document.getElementById("pantalla-juego"),
  final: document.getElementById("pantalla-final"),
};
const lienzo = document.getElementById("lienzo");
const ctx = lienzo.getContext("2d");
const lapiz = document.getElementById("lapiz");

const imgTexto = new Image();
imgTexto.src = "texto.png";

let ancho, alto;
let tx, ty, tw, th;            // posición y tamaño del texto en pantalla
let celdas, filas, marcadas, total;
let dibujando = false;
let terminado = false;
let ultimo = null;

// ---------- Pantallas ----------
function mostrar(nombre) {
  Object.values(pantallas).forEach((p) => p.classList.remove("activa"));
  pantallas[nombre].classList.add("activa");
}

// ---------- Preparar juego ----------
function prepararJuego() {
  const dpr = window.devicePixelRatio || 1;
  ancho = window.innerWidth;
  alto = window.innerHeight;

  lienzo.width = ancho * dpr;
  lienzo.height = alto * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, ancho, alto);

  // Texto centrado, con margen, manteniendo proporción
  const escala = Math.min(
    (ancho * MARGEN_TEXTO) / imgTexto.naturalWidth,
    (alto * MARGEN_TEXTO) / imgTexto.naturalHeight
  );
  tw = imgTexto.naturalWidth * escala;
  th = imgTexto.naturalHeight * escala;
  tx = (ancho - tw) / 2;
  ty = (alto - th) / 2;

  // Cuadrícula para medir el avance
  celdas = tw / COLUMNAS;
  filas = Math.ceil(th / celdas);
  total = COLUMNAS * filas;
  marcadas = new Uint8Array(total);

  terminado = false;
  dibujando = false;
  ultimo = null;

  // Lápiz al centro al empezar
  moverLapiz(ancho / 2, alto / 2);
}

// ---------- Lápiz ----------
function moverLapiz(x, y) {
  lapiz.style.transform =
    `translate(${x}px, ${y}px) translate(-${PUNTA_X}%, -${PUNTA_Y}%)`;
}

// ---------- Revelar ----------
function sellar(x, y) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, RADIO, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(imgTexto, tx, ty, tw, th);
  ctx.restore();
  marcar(x, y);
}

function trazo(x0, y0, x1, y1) {
  const dist = Math.hypot(x1 - x0, y1 - y0);
  const paso = RADIO / 3;
  const n = Math.max(1, Math.ceil(dist / paso));
  for (let i = 1; i <= n; i++) {
    sellar(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n);
  }
}

function marcar(x, y) {
  const c0 = Math.max(0, Math.floor((x - RADIO - tx) / celdas));
  const c1 = Math.min(COLUMNAS - 1, Math.floor((x + RADIO - tx) / celdas));
  const f0 = Math.max(0, Math.floor((y - RADIO - ty) / celdas));
  const f1 = Math.min(filas - 1, Math.floor((y + RADIO - ty) / celdas));

  for (let f = f0; f <= f1; f++) {
    for (let c = c0; c <= c1; c++) {
      const cx = tx + c * celdas + celdas / 2;
      const cy = ty + f * celdas + celdas / 2;
      if (Math.hypot(cx - x, cy - y) <= RADIO) {
        marcadas[f * COLUMNAS + c] = 1;
      }
    }
  }
}

function avance() {
  let n = 0;
  for (let i = 0; i < total; i++) n += marcadas[i];
  return n / total;
}

function terminar() {
  terminado = true;
  dibujando = false;
  // Mostrar el mensaje completo
  ctx.drawImage(imgTexto, tx, ty, tw, th);
  setTimeout(() => mostrar("final"), 1400);
}

// ---------- Eventos de puntero ----------
function posicion(e) {
  return { x: e.clientX, y: e.clientY };
}

lienzo.addEventListener("pointerdown", (e) => {
  if (terminado) return;
  e.preventDefault();
  lienzo.setPointerCapture(e.pointerId);
  dibujando = true;
  const { x, y } = posicion(e);
  ultimo = { x, y };
  moverLapiz(x, y);
  sellar(x, y);
});

lienzo.addEventListener("pointermove", (e) => {
  if (terminado || !dibujando) return;
  e.preventDefault();
  const { x, y } = posicion(e);
  moverLapiz(x, y);
  trazo(ultimo.x, ultimo.y, x, y);
  ultimo = { x, y };
  if (avance() >= PORCENTAJE_FINAL) terminar();
});

["pointerup", "pointercancel"].forEach((ev) =>
  lienzo.addEventListener(ev, () => {
    dibujando = false;
    ultimo = null;
  })
);

// Evita gestos del navegador (scroll, zoom) sobre el juego
document.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });

// ---------- Botones ----------
function iniciar() {
  mostrar("juego");
  prepararJuego();
}

document.getElementById("btn-jugar").addEventListener("click", () => {
  if (imgTexto.complete) iniciar();
  else imgTexto.onload = iniciar;
});

document.getElementById("btn-repetir").addEventListener("click", iniciar);

// Intento de bloquear orientación (solo funciona en algunos navegadores)
if (screen.orientation && screen.orientation.lock) {
  screen.orientation.lock("portrait").catch(() => {});
}