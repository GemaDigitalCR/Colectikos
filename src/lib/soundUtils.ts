// src/lib/soundUtils.ts
// Utilidades especializadas para reproducción de audio confiable en móviles (iOS Safari, iOS Chrome y Android)
// Soluciona restricciones de autoplay, estado suspended, y el switch físico de silencio en iPhones.

let sharedAudioCtx: AudioContext | null = null;
let persistentSilentAudio: HTMLAudioElement | null = null;
let isAudioUnlocked = false;

/**
 * Configura la sesión de audio del navegador en modo 'playback' (iOS 16.4+).
 * Esto le indica a WebKit que la página reproduce multimedia intencional
 * y no debe ser silenciada por el botón de silencio / Action Button del iPhone.
 */
export function setAudioSessionPlayback(): void {
  if (typeof navigator !== "undefined" && "audioSession" in navigator) {
    try {
      (navigator as any).audioSession.type = "playback";
    } catch {}
  }
}

/**
 * Genera un archivo WAV mono silencioso de 7 muestras exactas con el sampleRate del dispositivo.
 * Basado en la técnica estándar de unmute-ios-audio para engañar al motor de WebKit.
 */
function createSilentWav(sampleRate: number = 44100): string {
  if (typeof window === "undefined") return "";
  try {
    const arrayBuffer = new ArrayBuffer(10);
    const dataView = new DataView(arrayBuffer);
    dataView.setUint32(0, sampleRate, true);
    dataView.setUint32(4, sampleRate, true);
    dataView.setUint16(8, 1, true);

    const chars = window.btoa(
      String.fromCharCode(...new Uint8Array(arrayBuffer))
    ).slice(0, 13);

    return `data:audio/wav;base64,UklGRisAAABXQVZFZm10IBAAAAABAAEA${chars}AgAZGF0YQcAAACAgICAgICAAAA=`;
  } catch {
    return "data:audio/wav;base64,UklGRisAAABXQVZFZm10IBAAAAABAAEARKwAAESsAAABAAgAZGF0YQcAAACAgICAgICAAAA=";
  }
}

/**
 * Genera un tono corto WAV en memoria para reproducción directa vía HTML5 Audio.
 * En iOS, los elementos HTML5 Audio SIEMPRE se escuchan independientemente del switch de silencio.
 */
export function generateToneWavUrl(freq = 620, duration = 0.09, sampleRate = 22050): string {
  if (typeof window === "undefined") return "";
  try {
    const numSamples = Math.floor(sampleRate * duration);
    const dataSize = numSamples * 2;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    view.setUint32(0, 0x52494646, false); // 'RIFF'
    view.setUint32(4, 36 + dataSize, true);
    view.setUint32(8, 0x57415645, false); // 'WAVE'
    view.setUint32(12, 0x666d7420, false); // 'fmt '
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    view.setUint32(36, 0x64617461, false); // 'data'
    view.setUint32(40, dataSize, true);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const env = Math.exp(-t * 22);
      const sample = Math.sin(2 * Math.PI * freq * t) * env;
      const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767 * 0.75)));
      view.setInt16(44 + i * 2, intSample, true);
    }

    return "data:audio/wav;base64," + window.btoa(String.fromCharCode(...new Uint8Array(buffer)));
  } catch {
    return "";
  }
}

let cachedClickWav: string | null = null;

/**
 * Reproduce un tono de clic garantizado vía HTML5 Audio.
 * Útil como confirmación instantánea e inequívoca de audio en iOS.
 */
export function playHtmlAudioClick(): void {
  if (typeof window === "undefined") return;
  try {
    if (!cachedClickWav) {
      cachedClickWav = generateToneWavUrl(640, 0.08);
    }
    if (cachedClickWav) {
      const audio = new Audio(cachedClickWav);
      audio.volume = 0.8;
      audio.play().catch(() => {});
    }
  } catch {}
}

/**
 * Obtiene o crea la instancia singleton de AudioContext compartida por todos los juegos.
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
 * 1. Configura navigator.audioSession en 'playback'.
 * 2. Mantiene un elemento HTML5 Audio silencioso en bucle continuo (loop = true).
 *    Esto evita que iOS regrese la sesión a 'ambient' y silencie los juegos cuando
 *    el teléfono está en modo vibración/silencio.
 * 3. Despierta el AudioContext con ctx.resume().
 */
export function unlockAudio(): void {
  if (typeof window === "undefined") return;

  setAudioSessionPlayback();

  // 1. Iniciar HTML5 Audio silencioso en loop para forzar el canal Playback en iOS
  try {
    if (!persistentSilentAudio) {
      const ctx = getAudioContext();
      const sampleRate = ctx ? ctx.sampleRate : 44100;
      persistentSilentAudio = document.createElement("audio");
      persistentSilentAudio.setAttribute("x-webkit-airplay", "deny");
      persistentSilentAudio.preload = "auto";
      persistentSilentAudio.loop = true;
      persistentSilentAudio.src = createSilentWav(sampleRate);
      persistentSilentAudio.volume = 0.001;
    }
    const p = persistentSilentAudio.play();
    if (p !== undefined) {
      p.catch(() => {});
    }
  } catch {}

  // 2. Despertar el Web AudioContext
  const ctx = getAudioContext();
  if (ctx) {
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    if (!isAudioUnlocked) {
      try {
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
        isAudioUnlocked = true;
      } catch {}
    }
  }
}

/**
 * Registra listeners de desbloqueo en los primeros gestos del usuario.
 */
export function initMobileAudioUnlock(): () => void {
  if (typeof window === "undefined") return () => {};

  setAudioSessionPlayback();

  const handleUnlock = () => {
    unlockAudio();
    const ctx = getAudioContext();
    if (ctx && ctx.state === "running" && isAudioUnlocked) {
      events.forEach((evt) => {
        window.removeEventListener(evt, handleUnlock, { capture: true } as any);
        document.removeEventListener(evt, handleUnlock, { capture: true } as any);
      });
    }
  };

  const events = ["click", "touchend", "touchstart", "pointerdown", "pointerup"];
  events.forEach((evt) => {
    window.addEventListener(evt, handleUnlock, { capture: true, passive: true });
    document.addEventListener(evt, handleUnlock, { capture: true, passive: true });
  });

  return () => {
    events.forEach((evt) => {
      window.removeEventListener(evt, handleUnlock, { capture: true } as any);
      document.removeEventListener(evt, handleUnlock, { capture: true } as any);
    });
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

  unlockAudio();

  const ctx = getAudioContext();
  if (!ctx) return;

  const run = () => {
    try {
      const t0 = Math.max(ctx.currentTime, 0.001);
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
