# Oleómetro — Frontend (React + Vite)

Interfaz web para la visualización y análisis de cotizaciones del aceite de oliva en origen (España, Italia, Grecia y Portugal), con arquitectura **MVC**, diseño artesanal y **calculadora interactiva de liquidación y rendimiento**.

---

## Características de la Interfaz

- **La Gran Gota de Aceite (Hero)**: Lágrima de aceite de oliva en SVG con gradientes líquidos multicapa, volumen y menisco interior reflectante.
- **Calculadora en Origen y Rendimientos**:
  - Conversión entre toneladas (€/t), kilos (€/kg), litros (€/L, con densidad 0,916 kg/L) y garrafas de 5 litros.
  - Modo cosechero: cálculo de aceite neto obtenido a partir de kilos de aceituna cosechada y porcentaje de rendimiento graso.
  - Simulador de precios y comparador de valor entre España, Italia, Grecia y Portugal.
- **Cotizaciones y Analítica**:
  - Precios semanales actualizados por categoría (**Virgen Extra**, **Virgen**, **Lampante**).
  - Indicadores clave de volatilidad y posición relativa respecto al rango histórico.
- **Gráficos e Histórico**:
  - Gráficos interactivos construidos con **Recharts**, con selector de periodo temporal (3m, 6m, 1a, 3a, 5a, histórico).
  - Tabla de cotizaciones con micrográficos (*sparklines*) accesible para lectores de pantalla.
- **Previsión y Estacionalidad**:
  - Estimaciones estadísticas a 1 semana, 1 mes y 1 año con bandas de confianza del 80 %.
  - Mapa de calor de precios medios año × mes y producción anual apilada por país.
- **Charco de Aceite (OilPool)**:
  - Cierre inferior con olas fluidas animadas en oro miel y ámbar, calibradas para transicionar suavemente tanto en el tema oscuro (*Dark Cocoa*) como en el tema claro (*Cream Parchment*).
- **Tema Claro y Oscuro**:
  - Detección automática de preferencia del sistema y conmutador manual persistente en `localStorage`.

---

## Estructura del Frontend (MVC)

```
frontend/src
├── main.jsx                  ← Punto de entrada React
├── controllers/              ← Controladores (hooks de estado y lógica de página)
│   ├── DashboardController.jsx
│   ├── useDashboard.js       ← Carga y sincronización de datos
│   ├── useSelection.js       ← Gestión de filtros y sincronización con URL
│   └── useTheme.js           ← Gestión del tema claro/oscuro
├── models/                   ← Lógica pura y cálculo matemático (testeable)
│   ├── constants.js          ← Catálogos de países, calidades y colores
│   ├── dashboardModel.js     ← Agregaciones, transformaciones de series y previsiones
│   ├── dashboardModel.test.js← Tests unitarios con Vitest (25 tests)
│   └── format.js             ← Formateadores numéricos y de moneda (€, %, fechas)
├── services/                 ← Acceso a datos
│   └── dashboardService.js   ← Fetch de datos estáticos (dashboard.json) o API
├── styles/                   ← Tokens globales y CSS base
│   ├── base.css              ← Estilos de base tipográfica y reset
│   └── tokens.css            ← Variables de color, radios y espaciado
└── views/                    ← Vistas y componentes de presentación
    ├── DashboardView.jsx     ← Orquestador visual de la página
    ├── pour/                 ← Hero, gota de aceite y charco inferior
    │   ├── OilSphere.jsx     ← Escultura de la Gran Gota de Aceite
    │   ├── OilPool.jsx       ← Charco de aceite líquido animado
    │   ├── ParticleField.jsx ← Campo de partículas de apoyo
    │   └── PourHero.jsx      ← Portada editorial
    ├── sections/             ← Paneles temáticos (Mercado, Evolución, Previsión, etc.)
    │   ├── OilCalculator.jsx ← Calculadora interactiva de aceite y cosecha
    │   ├── MethodPanel.jsx   ← Panel de metodología y cálculo
    │   ├── Header.jsx        ← Barra de navegación superior
    │   └── ...
    └── ui/                   ← Componentes UI reutilizables (píldoras, botones, deltas)
```

---

## Comandos Disponibles

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo en local (puerto 5173)
npm run dev

# Ejecutar tests unitarios con Vitest
npm test

# Compilar para producción (carpeta dist/)
npm run build

# Previsualizar la compilación de producción localmente
npm run preview
```
