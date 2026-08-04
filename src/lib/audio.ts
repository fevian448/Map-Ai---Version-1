// Web Audio API helper for sound effects, voice prompts, and emergency sirens

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playBeep(frequency = 880, duration = 0.15, type: OscillatorType = 'sine') {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (_e) {
    // Ignore audio autoplay policies
  }
}

export function playSpeedWarning() {
  playBeep(1200, 0.2, 'sawtooth');
  setTimeout(() => playBeep(1400, 0.25, 'sawtooth'), 200);
}

let sirenOsc1: OscillatorNode | null = null;
let sirenOsc2: OscillatorNode | null = null;
let sirenInterval: NodeJS.Timeout | null = null;

export function startSirenSound() {
  stopSirenSound();
  try {
    const ctx = getAudioContext();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.connect(ctx.destination);

    sirenOsc1 = ctx.createOscillator();
    sirenOsc1.type = 'sawtooth';
    sirenOsc1.frequency.setValueAtTime(600, ctx.currentTime);
    sirenOsc1.connect(gain);
    sirenOsc1.start();

    let high = false;
    sirenInterval = setInterval(() => {
      if (sirenOsc1 && ctx.state === 'running') {
        const targetFreq = high ? 600 : 1200;
        sirenOsc1.frequency.linearRampToValueAtTime(targetFreq, ctx.currentTime + 0.3);
        high = !high;
      }
    }, 400);
  } catch (_e) {
    // Ignore
  }
}

export function stopSirenSound() {
  if (sirenInterval) {
    clearInterval(sirenInterval);
    sirenInterval = null;
  }
  if (sirenOsc1) {
    try {
      sirenOsc1.stop();
      sirenOsc1.disconnect();
    } catch (_e) {}
    sirenOsc1 = null;
  }
}

export function speakPrompt(text: string, lang = 'en-US') {
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (_e) {}
  }
}
