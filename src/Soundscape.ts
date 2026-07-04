export class Soundscape {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private ambience: GainNode | null = null
  private isRunning = false

  start() {
    if (this.isRunning) return
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext
    if (!AudioContextCtor) return

    this.context = new AudioContextCtor()
    this.master = this.context.createGain()
    this.master.gain.value = 0.07
    this.master.connect(this.context.destination)

    this.ambience = this.context.createGain()
    this.ambience.gain.value = 0.28
    this.ambience.connect(this.master)

    const noiseBuffer = this.context.createBuffer(1, this.context.sampleRate * 2, this.context.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1

    const noise = this.context.createBufferSource()
    noise.buffer = noiseBuffer
    noise.loop = true
    const noiseFilter = this.context.createBiquadFilter()
    noiseFilter.type = 'lowpass'
    noiseFilter.frequency.value = 520
    noise.connect(noiseFilter).connect(this.ambience)
    noise.start()

    const drone = this.context.createOscillator()
    const droneGain = this.context.createGain()
    drone.type = 'sine'
    drone.frequency.value = 48
    droneGain.gain.value = 0.17
    drone.connect(droneGain).connect(this.ambience)
    drone.start()

    this.isRunning = true
  }

  setScene(scene: number) {
    if (!this.context || !this.master || !this.ambience) return
    const now = this.context.currentTime
    const level = [0.045, 0.065, 0.08, 0.11, 0.045][scene] ?? 0.05
    this.master.gain.cancelScheduledValues(now)
    this.master.gain.linearRampToValueAtTime(level, now + 0.45)

    const ambienceLevel = [0.2, 0.36, 0.45, 0.55, 0.18][scene] ?? 0.25
    this.ambience.gain.cancelScheduledValues(now)
    this.ambience.gain.linearRampToValueAtTime(ambienceLevel, now + 0.45)
  }

  thunder() {
    if (!this.context || !this.master) return
    const now = this.context.currentTime
    const oscillator = this.context.createOscillator()
    const gain = this.context.createGain()
    oscillator.type = 'triangle'
    oscillator.frequency.setValueAtTime(72, now)
    oscillator.frequency.exponentialRampToValueAtTime(28, now + 1.2)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.25)
    oscillator.connect(gain).connect(this.master)
    oscillator.start(now)
    oscillator.stop(now + 1.3)
  }

  stop() {
    if (this.context) this.context.close()
    this.context = null
    this.master = null
    this.ambience = null
    this.isRunning = false
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
  }
}
