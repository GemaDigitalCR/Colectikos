<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `next-app/node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Reglas Críticas del Proyecto Colectikos

## 1. Tiko Playa: Motor Isométrico Canvas 2D (Anti-Aplanamiento Definitivo)
En `next-app/src/app/[lang]/community/playa/page.tsx`:
- **RENDERIZADO EN CANVAS 2D NATIVO**:
  Tiko Playa utiliza un motor de proyección isométrica sobre HTML5 Canvas 2D (`<canvas id="world">`). Esto elimina de raíz el problema histórico de "aplanamiento" de CSS 3D en WebKit/Safari de iPhone/iOS, garantizando 60 FPS estables y renderizado uniforme en cualquier dispositivo móvil.
- **RETROCOMPATIBILIDAD DE COORDENADAS**:
  Al interactuar con la base de datos (Neon / Prisma), se debe mantener siempre la normalización bidireccional entre `(c, r)` del motor Canvas y `(col, row)` del esquema tradicional para proteger las playas existentes de los usuarios.
- **SPRITES OPTIMIZADOS**:
  Los assets en `/public/assets/playa/` utilizan la colección de sprites recortados y optimizados con métricas de delimitación (`SP`) para garantizar mínima huella de memoria y máxima velocidad de carga.

