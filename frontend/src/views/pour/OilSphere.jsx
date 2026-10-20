// VISTA: la gran Gota de Aceite de la portada.
// Sustituye la antigua esfera plana por una auténtica gota de aceite de oliva esculpida en SVG:
// silueta de lágrima fluida, gradientes dorados y aceitunados profundos, menisco interior con refracción,
// reflejo especular satinado y una microgota colgante con tensión superficial en la boca (data-mouth),
// desde donde se desprende el goteo "gota a gota" de PourStage.
import styles from './OilSphere.module.css';

export default function OilSphere() {
  return (
    <div className={styles.wrap} data-sphere aria-hidden="true">
      <svg
        className={styles.dropSvg}
        viewBox="0 0 320 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradiente principal del cuerpo de la gota: oro miel -> oliva -> verde virgen extra -> cocoa */}
          <linearGradient id="oilDropGrad" x1="60" y1="20" x2="260" y2="380" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--drop-gold, #ffca50)" />
            <stop offset="28%" stopColor="#e8ba22" />
            <stop offset="58%" stopColor="var(--drop-olive, #83971e)" />
            <stop offset="84%" stopColor="#465b16" />
            <stop offset="100%" stopColor="var(--drop-deep, #3b2722)" />
          </linearGradient>

          {/* Resplandor interno de néctar */}
          <radialGradient id="oilGlow" cx="130" cy="180" r="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fff1a8" stopOpacity="0.85" />
            <stop offset="35%" stopColor="var(--drop-gold, #ffca50)" stopOpacity="0.6" />
            <stop offset="70%" stopColor="#b49b20" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#3b2722" stopOpacity="0" />
          </radialGradient>

          {/* Brillo especular curvado en el hombro superior izquierdo */}
          <linearGradient id="oilSheen" x1="80" y1="60" x2="160" y2="240" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="30%" stopColor="#fff8db" stopOpacity="0.65" />
            <stop offset="75%" stopColor="#ffea9f" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#ffea9f" stopOpacity="0" />
          </linearGradient>

          {/* Reflejo de rebote inferior derecho (caústica) */}
          <linearGradient id="oilCaustic" x1="260" y1="260" x2="180" y2="360" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffca50" stopOpacity="0.75" />
            <stop offset="60%" stopColor="#9bb03a" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ffca50" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Halo exterior difuso de calidez */}
        <path
          d="M 160,18 C 160,18, 244,138, 272,220 C 302,308, 248,382, 160,384 C 72,382, 18,308, 48,220 C 76,138, 160,18, 160,18 Z"
          fill="var(--drop-gold, #ffca50)"
          className={styles.ambientHalo}
        />

        {/* Cuerpo principal de la gota: curvatura orgánica */}
        <path
          d="M 160,20 C 160,20, 240,140, 266,220 C 295,305, 242,376, 160,378 C 78,376, 25,305, 54,220 C 80,140, 160,20, 160,20 Z"
          fill="url(#oilDropGrad)"
          className={styles.dropBody}
        />

        {/* Núcleo de luz interna (volumen líquido) */}
        <path
          d="M 160,36 C 160,36, 226,146, 248,218 C 272,292, 226,356, 160,358 C 94,356, 48,292, 72,218 C 94,146, 160,36, 160,36 Z"
          fill="url(#oilGlow)"
        />

        {/* Menisco interior sutil (refracción) */}
        <path
          d="M 160,54 C 160,54, 214,152, 232,216 C 252,280, 212,336, 160,338 C 108,336, 68,280, 88,216 C 106,152, 160,54, 160,54 Z"
          fill="none"
          stroke="rgba(255, 255, 255, 0.16)"
          strokeWidth="1.5"
        />

        {/* Reflejo especular satinado en el borde superior izquierdo */}
        <path
          d="M 152,38 C 140,78, 104,136, 92,185 C 84,218, 86,242, 90,248 C 94,248, 92,232, 98,206 C 106,164, 138,106, 156,42 Z"
          fill="url(#oilSheen)"
          className={styles.sheen}
        />

        {/* Pequeño punto de brillo especular secundario */}
        <ellipse cx="106" cy="235" rx="6" ry="10" transform="rotate(-18 106 235)" fill="#ffffff" opacity="0.65" />

        {/* Luz reflejada en la parte inferior derecha (rebote de caústica) */}
        <path
          d="M 238,248 C 254,284, 240,336, 196,360 C 204,362, 250,338, 256,276 C 258,256, 248,242, 238,248 Z"
          fill="url(#oilCaustic)"
        />
      </svg>

      {/* Marcador exacto para el origen del flujo de gotas en PourStage */}
      <span className={styles.mouth} data-mouth />
    </div>
  );
}