// Programmatic sound effects using Web Audio API — no audio files needed.

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  // Resume if suspended (browser autoplay policy)
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.15,
  fadeOut = true,
) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = volume;

  if (fadeOut) {
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  }

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration: number, volume = 0.08) {
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
  }

  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  source.buffer = buffer;
  gain.gain.value = volume;

  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

export function playMoveSound() {
  playTone(220, 0.06, "square", 0.04);
}

export function playDashSound() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(300, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.25);

  playNoise(0.15, 0.06);
}

export function playCollectSound() {
  // Rising arpeggio chime
  playTone(523, 0.15, "sine", 0.12); // C5
  setTimeout(() => playTone(659, 0.15, "sine", 0.12), 80); // E5
  setTimeout(() => playTone(784, 0.15, "sine", 0.12), 160); // G5
  setTimeout(() => playTone(1047, 0.25, "sine", 0.15), 240); // C6
}

export function playPowerActivateSound() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.3);
  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.4);

  setTimeout(() => playTone(800, 0.2, "triangle", 0.08), 150);
}

export function playDamageSound() {
  // Low harsh buzz + noise
  playTone(120, 0.3, "sawtooth", 0.15);
  playTone(90, 0.25, "square", 0.1);
  playNoise(0.2, 0.12);
}

export function playObstacleClearSound() {
  // Shatter sound — quick descending noise + bright tone
  playNoise(0.25, 0.1);
  playTone(880, 0.12, "square", 0.08);
  setTimeout(() => playTone(660, 0.15, "triangle", 0.1), 100);
}

export function playWinSound() {
  // Fanfare — ascending major chord
  const notes = [523, 659, 784, 1047, 1319];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.4, "sine", 0.12), i * 120);
    setTimeout(() => playTone(freq * 0.5, 0.4, "triangle", 0.06), i * 120);
  });
}

export function playLoseSound() {
  // Descending minor — sad tones
  const notes = [440, 370, 311, 262];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.5, "sine", 0.1), i * 200);
  });
}

export function playRechargeStartSound() {
  playTone(330, 0.2, "triangle", 0.08);
  setTimeout(() => playTone(440, 0.2, "triangle", 0.08), 100);
}

export function playButtonClick() {
  playTone(660, 0.05, "square", 0.06);
}
