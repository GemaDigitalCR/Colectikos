<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Reglas Críticas del Proyecto Colectikos

## 1. Tiko Playa: Regla de Oro del Renderizado Isométrico 3D (Anti-Aplanamiento)
En `src/app/[lang]/community/playa/page.tsx`:
- **PROHIBICIÓN ESTRICTA DE FILTROS EN CONTENEDORES 3D**:
  NUNCA aplicar filtros CSS (`drop-shadow-*`, `blur-*`, `filter`, `backdrop-blur`) en ningún contenedor o `div` que tenga transformaciones 3D (`rotateX`, `rotateZ`, `translateZ`, o el componente `IsometricBillboard`).
  - *Razón técnica*: En navegadores móviles WebKit (Safari en iPhone/iOS), aplicar cualquier propiedad `filter` a un contenedor 3D destruye la propiedad `transform-style: preserve-3d` y fuerza `transform-style: flat`, aplanando las estructuras contra la arena como calcomanías bidimensionales.
  - *Ubicación de sombras*: Las sombras DEBEN colocarse EXCLUSIVAMENTE en la etiqueta `<img>` interior, donde no interfieren con la matriz de proyección 3D.
- **ANCLAJE INVARIABLE**:
  Todo elemento colocado (incluyendo assets 1x1 como Sombrilla y Palmera) DEBE mantener `transformOrigin: 'bottom center'` y alineación `flex items-end justify-center` en su celda. Esto garantiza que las estructuras nazcan desde la superficie de la arena y se mantengan erguidas hacia la cámara.
- **ENCAPSULACIÓN**:
  Todas las estructuras colocadas en el tablero deben utilizar el componente `IsometricBillboard`. No deshacer esta abstracción ni mover estilos de transformación 3D de vuelta a etiquetas genéricas con filtros.
- **ESCALAS MÍNIMAS EN ITEM_TYPES**:
  - Sombrilla: `renderScale: 1.8`
  - Palmera: `renderScale: 2.2`
  No reducir estas escalas por debajo de estos valores, ya que en pantallas pequeñas móviles provocarían que los sprites se perciban microscópicos o sumergidos en la arena.
