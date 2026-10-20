// VISTA: la "constelación" de la portada (idea de Dala) y los anillos concéntricos (idea de OFF+BRAND).
// Miles de triángulos pequeños, solo con contorno, orbitan alrededor de la esfera de aceite. Los colores son
// los del aceite (dorado, oliva, ámbar, verde y crema) y se leen de las variables CSS, así que respetan el tema.
// Es un <canvas> (miles de elementos en el DOM serían lentísimos). Se pausa cuando no se ve y,
// con "reducir movimiento", se dibuja una sola vez.
import { useEffect, useRef } from 'react';
import styles from './ParticleField.module.css';

const rand = (a, b) => a + Math.random() * (b - a);
const KEYS = ['gold', 'olive', 'amber', 'green', 'cream'];

function readPalette() {
  const cs = getComputedStyle(document.documentElement);
  const v = (name, fallback) => cs.getPropertyValue(name).trim() || fallback;
  return {
    gold: v('--oil', '#e2c44a'),
    olive: v('--olive', '#9bb03a'),
    amber: v('--amber', '#e08a22'),
    green: v('--verdant', '#4f8a3c'),
    cream: v('--ink', '#f6efd2'),
    ring: v('--line-strong', 'rgba(246,239,210,.3)'),
  };
}

function pickKey() {
  const r = Math.random();
  if (r < 0.34) return 'gold';
  if (r < 0.6) return 'olive';
  if (r < 0.74) return 'amber';
  if (r < 0.9) return 'green';
  return 'cream';
}

export default function ParticleField() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return undefined;
    const ctx = canvas.getContext('2d');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let W = 0;
    let H = 0;
    let dpr = 1;
    let cx = 0;
    let cy = 0;
    let R = 100;
    let fade = 1; // en móvil la nube va más tenue para no estorbar al texto
    let orbit = [];
    let ambient = [];
    let palette = readPalette();
    let raf = 0;
    let visible = true;
    const mouse = { x: -9999, y: -9999 };

    function build() {
      const small = W < 700;
      fade = small ? 0.45 : 1;
      // El centro y el radio salen de la esfera real, para que la nube y los anillos estén siempre alineados con ella.
      const sph = host.querySelector('[data-sphere]');
      if (sph) {
        const hr = host.getBoundingClientRect();
        const sr = sph.getBoundingClientRect();
        cx = sr.left - hr.left + sr.width / 2;
        cy = sr.top - hr.top + sr.height / 2;
        R = sr.width / 2;
      } else {
        cx = W * 0.7;
        cy = H * 0.42;
        R = Math.min(W, H) * 0.25;
      }
      const nOrbit = small ? 260 : 760;
      orbit = [];
      for (let i = 0; i < nOrbit; i += 1) {
        // Más densidad cerca de la esfera y cada vez menos hacia fuera.
        const r = R * (1.06 + 0.62 * Math.random() ** 1.7);
        orbit.push({
          r,
          th: rand(0, Math.PI * 2),
          w: (rand(0.5, 1) * 0.00009) / (r / R) ** 1.2 * (Math.random() < 0.5 ? 1 : -1),
          s: rand(2, small ? 4.5 : 6),
          rot: rand(0, 6.28),
          vr: rand(-0.0006, 0.0006),
          key: pickKey(),
          a: rand(0.45, 1),
        });
      }
      ambient = [];
      for (let i = 0; i < (small ? 40 : 130); i += 1) {
        ambient.push({
          hx: rand(0, W),
          hy: rand(0, H),
          s: rand(1.6, 4),
          rot: rand(0, 6.28),
          vr: rand(-0.0004, 0.0004),
          amp: rand(6, 20),
          ph: rand(0, 6.28),
          sp: rand(0.0002, 0.0005),
          key: KEYS[(Math.random() * 5) | 0],
          a: rand(0.15, 0.4),
        });
      }
    }

    function resize() {
      const r = host.getBoundingClientRect();
      W = Math.max(1, r.width);
      H = Math.max(1, r.height);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      build();
      draw(performance.now());
    }

    function draw(now) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.lineJoin = 'round';
      ctx.lineWidth = 1;

      // Anillos concéntricos finos, como en OFF+BRAND (nunca rellenos).
      ctx.strokeStyle = palette.ring;
      ctx.globalAlpha = 0.45 * fade + 0.1;
      for (const k of [1.55, 2.05, 2.7]) {
        ctx.beginPath();
        ctx.arc(cx, cy, R * k, 0, Math.PI * 2);
        ctx.stroke();
      }

      const buckets = new Map();
      const push = (p, x, y, ang) => {
        const mx = x - mouse.x;
        const my = y - mouse.y;
        const d2 = mx * mx + my * my;
        let px = x;
        let py = y;
        if (d2 < 11000) {
          const d = Math.sqrt(d2) || 1;
          const f = (1 - d / 105) * 26; // el cursor empuja los triángulos
          px += (mx / d) * f;
          py += (my / d) * f;
        }
        const lvl = p.a > 0.8 ? 3 : p.a > 0.6 ? 2 : p.a > 0.35 ? 1 : 0;
        const key = `${p.key}|${lvl}`;
        let b = buckets.get(key);
        if (!b) {
          b = [];
          buckets.set(key, b);
        }
        b.push(px, py, ang, p.s);
      };

      for (const p of orbit) {
        const th = p.th + (reduce ? 0 : now * p.w);
        push(p, cx + Math.cos(th) * p.r, cy + Math.sin(th) * p.r, p.rot + (reduce ? 0 : now * p.vr));
      }
      for (const p of ambient) {
        const dx = reduce ? 0 : Math.sin(now * p.sp + p.ph) * p.amp;
        const dy = reduce ? 0 : Math.cos(now * p.sp * 1.3 + p.ph) * p.amp;
        push(p, p.hx + dx, p.hy + dy, p.rot + (reduce ? 0 : now * p.vr));
      }

      const alphas = [0.28, 0.5, 0.72, 0.95];
      for (const [key, arr] of buckets) {
        const [name, lvl] = key.split('|');
        ctx.strokeStyle = palette[name];
        ctx.globalAlpha = alphas[Number(lvl)] * fade;
        ctx.beginPath();
        for (let i = 0; i < arr.length; i += 4) {
          const x = arr[i];
          const y = arr[i + 1];
          const a = arr[i + 2];
          const s = arr[i + 3];
          for (let k = 0; k < 3; k += 1) {
            const ang = a + (k * Math.PI * 2) / 3;
            const px = x + Math.cos(ang) * s;
            const py = y + Math.sin(ang) * s;
            if (k === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    function loop(now) {
      raf = 0;
      if (!visible) return;
      draw(now);
      raf = requestAnimationFrame(loop);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !reduce && !raf) raf = requestAnimationFrame(loop);
    });
    io.observe(host);

    const onMove = (e) => {
      const r = host.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);

    // Si el usuario cambia de tema, se vuelven a leer los colores.
    const mo = new MutationObserver(() => {
      palette = readPalette();
      if (reduce) draw(performance.now());
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    if (!reduce) raf = requestAnimationFrame(loop);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return <canvas ref={ref} className={styles.canvas} aria-hidden="true" />;
}
