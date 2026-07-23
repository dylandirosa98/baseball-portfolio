import { execFileSync } from "node:child_process";
import { mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const sampleRate = 44_100;
const duration = 36;
const channels = 2;
const totalSamples = sampleRate * duration;
const left = new Float32Array(totalSamples);
const right = new Float32Array(totalSamples);
const beat = 0.5;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const midiToHz = (note) => 440 * 2 ** ((note - 69) / 12);

let seed = 0x5eed1234;
const noise = () => {
  seed = (1664525 * seed + 1013904223) >>> 0;
  return seed / 0xffffffff * 2 - 1;
};

function addTone({ start, length, frequency, gain, pan = 0, attack = 0.005, release = 0.18, wave = "sine", glide = 1 }) {
  const startSample = Math.floor(start * sampleRate);
  const sampleLength = Math.floor(length * sampleRate);
  const leftGain = Math.cos((pan + 1) * Math.PI / 4);
  const rightGain = Math.sin((pan + 1) * Math.PI / 4);
  let phase = 0;

  for (let i = 0; i < sampleLength && startSample + i < totalSamples; i += 1) {
    const time = i / sampleRate;
    const progress = i / sampleLength;
    const envelope = clamp(time / attack, 0, 1) * clamp((length - time) / release, 0, 1);
    phase += 2 * Math.PI * frequency * (1 + (glide - 1) * progress) / sampleRate;
    const signal = wave === "triangle" ? 2 / Math.PI * Math.asin(Math.sin(phase)) : Math.sin(phase);
    const value = signal * gain * envelope;
    left[startSample + i] += value * leftGain;
    right[startSample + i] += value * rightGain;
  }
}

function addNoise({ start, length, gain, pan = 0, decay = 8, highPass = false }) {
  const startSample = Math.floor(start * sampleRate);
  const sampleLength = Math.floor(length * sampleRate);
  const leftGain = Math.cos((pan + 1) * Math.PI / 4);
  const rightGain = Math.sin((pan + 1) * Math.PI / 4);
  let previous = 0;

  for (let i = 0; i < sampleLength && startSample + i < totalSamples; i += 1) {
    const progress = i / sampleLength;
    const raw = noise();
    const filtered = highPass ? raw - previous * 0.86 : raw;
    previous = raw;
    const value = filtered * gain * Math.exp(-decay * progress);
    left[startSample + i] += value * leftGain;
    right[startSample + i] += value * rightGain;
  }
}

function addKick(start, gain = 0.8) {
  const startSample = Math.floor(start * sampleRate);
  const sampleLength = Math.floor(0.42 * sampleRate);
  let phase = 0;

  for (let i = 0; i < sampleLength && startSample + i < totalSamples; i += 1) {
    const time = i / sampleRate;
    const frequency = 145 * Math.exp(-time * 22) + 43;
    phase += 2 * Math.PI * frequency / sampleRate;
    const click = i < 260 ? (1 - i / 260) * 0.22 : 0;
    const value = (Math.sin(phase) * Math.exp(-time * 11) + click) * gain;
    left[startSample + i] += value * 0.72;
    right[startSample + i] += value * 0.72;
  }
}

function addSnare(start, gain = 0.34) {
  addNoise({ start, length: 0.26, gain, decay: 7.5, highPass: true });
  addTone({ start, length: 0.2, frequency: 180, gain: gain * 0.35, release: 0.15 });
}

function addHat(start, gain = 0.09, pan = 0) {
  addNoise({ start, length: 0.065, gain, pan, decay: 15, highPass: true });
}

function addImpact(start, gain = 0.46) {
  addKick(start, gain * 1.2);
  addNoise({ start, length: 1.35, gain: gain * 0.58, decay: 4.4, highPass: true });
  addTone({ start, length: 1.8, frequency: 92, gain: gain * 0.34, release: 1.65, glide: 0.56 });
}

function addRiser(start, length, gain = 0.12) {
  const startSample = Math.floor(start * sampleRate);
  const sampleLength = Math.floor(length * sampleRate);
  let lowPass = 0;

  for (let i = 0; i < sampleLength && startSample + i < totalSamples; i += 1) {
    const progress = i / sampleLength;
    lowPass += (noise() - lowPass) * (0.015 + progress * 0.16);
    const envelope = progress ** 1.7 * (1 - Math.max(0, (progress - 0.94) / 0.06));
    const pan = Math.sin(progress * Math.PI * 4) * 0.3;
    const value = lowPass * gain * envelope;
    left[startSample + i] += value * Math.cos((pan + 1) * Math.PI / 4);
    right[startSample + i] += value * Math.sin((pan + 1) * Math.PI / 4);
  }
}

const chords = [
  [38, 45, 50, 53],
  [34, 41, 46, 50],
  [41, 48, 53, 57],
  [36, 43, 48, 52],
];

for (let bar = 0; bar < 18; bar += 1) {
  const barStart = bar * beat * 4;
  const chord = chords[bar % chords.length];
  const intensity = bar < 2 ? 0.72 : bar < 15 ? 1 : 0.88;

  for (let step = 0; step < 8; step += 1) {
    addTone({
      start: barStart + step * beat / 2,
      length: beat * 0.43,
      frequency: midiToHz(chord[(step + Math.floor(step / 2)) % chord.length] + 24),
      gain: 0.075 * intensity,
      pan: step % 2 === 0 ? -0.24 : 0.24,
      release: beat * 0.3,
      wave: "triangle",
    });
  }

  chord.slice(1).forEach((note, index) => {
    addTone({
      start: barStart,
      length: beat * 3.8,
      frequency: midiToHz(note + 12),
      gain: 0.024 * intensity,
      pan: (index - 1) * 0.36,
      attack: 0.7,
      release: 0.8,
      wave: "triangle",
    });
  });

  for (let beatIndex = 0; beatIndex < 4; beatIndex += 1) {
    const time = barStart + beatIndex * beat;
    addKick(time, 0.62 * intensity);
    if (beatIndex === 1 || beatIndex === 3) addSnare(time, 0.3 * intensity);
    addTone({ start: time, length: beat * 0.42, frequency: midiToHz(chord[0]), gain: 0.2 * intensity, release: beat * 0.32, wave: "triangle" });
    addHat(time, 0.07 * intensity, -0.18);
    addHat(time + beat / 2, 0.055 * intensity, 0.2);
  }
}

[4.5, 11.5, 18.5, 26.5, 31.5].forEach((time, index) => {
  addRiser(Math.max(0, time - 1.5), 1.46, index === 4 ? 0.17 : 0.12);
  addImpact(time, index === 4 ? 0.55 : 0.42);
});
addImpact(0, 0.5);

let peak = 0;
for (let i = 0; i < totalSamples; i += 1) {
  const fadeIn = clamp(i / (sampleRate * 0.35), 0, 1);
  const fadeOut = clamp((totalSamples - i) / (sampleRate * 1.7), 0, 1);
  left[i] = Math.tanh(left[i] * 1.38) * fadeIn * fadeOut;
  right[i] = Math.tanh(right[i] * 1.38) * fadeIn * fadeOut;
  peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
}

const normalization = 0.91 / peak;
const dataSize = totalSamples * channels * 2;
const buffer = Buffer.alloc(44 + dataSize);
buffer.write("RIFF", 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write("WAVE", 8);
buffer.write("fmt ", 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(channels, 22);
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate * channels * 2, 28);
buffer.writeUInt16LE(channels * 2, 32);
buffer.writeUInt16LE(16, 34);
buffer.write("data", 36);
buffer.writeUInt32LE(dataSize, 40);

for (let i = 0; i < totalSamples; i += 1) {
  const offset = 44 + i * 4;
  buffer.writeInt16LE(Math.round(clamp(left[i] * normalization, -1, 1) * 32767), offset);
  buffer.writeInt16LE(Math.round(clamp(right[i] * normalization, -1, 1) * 32767), offset + 2);
}

const wavOutput = resolve("public/audio/diamond-profile-promo.wav");
const mp3Output = resolve("public/audio/diamond-profile-promo.mp3");
mkdirSync(dirname(wavOutput), { recursive: true });
writeFileSync(wavOutput, buffer);
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", wavOutput, "-codec:a", "libmp3lame", "-b:a", "256k", mp3Output]);
unlinkSync(wavOutput);
console.log(`Created ${mp3Output} (${duration}s, ${sampleRate}Hz stereo, 256kbps)`);
