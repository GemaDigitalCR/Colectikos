// src/lib/soundUtils.ts
// Utilidades robustas de Web Audio API para desbloqueo y reproducción móvil (iOS Safari & Android)

let sharedAudioCtx: AudioContext | null = null;
let isAudioUnlocked = false;

// 1 muestra de audio silencioso en Base64 para desbloquear la sesión de audio en iOS Safari
const SILENT_WAV_BASE64 = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

/**
 * Obtiene o crea la instancia singleton de AudioContext compartida por todos los juegos.
 * Esto evita el límite estricto de iOS Safari (máximo 6 AudioContexts por página).
 */
export function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  try {
    if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        sharedAudioCtx = new AudioCtx();
      }
    }
  } catch (e) {
    console.warn("Error obteniendo AudioContext:", e);
  }

  return sharedAudioCtx;
}

/**
 * Desbloquea activamente el motor de audio en dispositivos móviles (iOS y Android).
 * 1. Llama a ctx.resume() en el AudioContext.
 * 2. Emite un micro-buffer silencioso en la salida.
 * 3. Ejecuta un elemento HTML5 Audio silencioso para elevar la sesión de iOS a "Playback"
 *    (permitiendo escuchar los juegos incluso si el teléfono tiene el switch físico de silencio).
 */
export function unlockAudio(): void {
  if (typeof window === "undefined") return;

  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  if (ctx && !isAudioUnlocked) {
    try {
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
      isAudioUnlocked = true;
    } catch {}
  }

  // Desbloqueo de sesión para iOS Safari
  try {
    const audio = new Audio(SILENT_WAV_BASE64);
    audio.volume = 0.01;
    const p = audio.play();
    if (p !== undefined) {
      p.then(() => {
        audio.pause();
      }).catch(() => {});
    }
  } catch {}
}

/**
 * Registra listeners de desbloqueo en los primeros gestos del usuario (táctil o clic).
 */
export function initMobileAudioUnlock(): () => void {
  if (typeof window === "undefined") return () => {};

  const handleUnlock = () => {
    unlockAudio();
    if (sharedAudioCtx && sharedAudioCtx.state === "running" && isAudioUnlocked) {
      events.forEach((evt) => window.removeEventListener(evt, handleUnlock));
    }
  };

  const events = ["touchstart", "touchend", "pointerdown", "click"];
  events.forEach((evt) => window.addEventListener(evt, handleUnlock, { passive: true }));

  return () => {
    events.forEach((evt) => window.removeEventListener(evt, handleUnlock));
  };
}

/**
 * Ejecuta una síntesis de audio asegurando que el AudioContext esté despierto y activo.
 */
export function playSynthesizedSound(
  soundEnabled: boolean,
  synthesizeFn: (ctx: AudioContext, t0: number) => void
): void {
  if (!soundEnabled || typeof window === "undefined") return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const run = () => {
    try {
      const t0 = Math.max(ctx.currentTime, 0.01);
      synthesizeFn(ctx, t0);
    } catch (e) {
      console.warn("Error en síntesis de sonido:", e);
    }
  };

  if (ctx.state === "suspended") {
    ctx.resume().then(run).catch(run);
  } else {
    run();
  }
}
