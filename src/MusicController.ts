export class MusicController {
  private audio: HTMLAudioElement | null = null
  private active = false

  start() {
    if (this.active) return true

    const audio = new Audio('/audio/burden-theme.ogg')
    audio.loop = true
    audio.preload = 'auto'
    audio.volume = 0.0001
    this.audio = audio

    audio.play()
      .then(() => {
        this.active = true
        this.fadeTo(0.64, 900)
      })
      .catch(() => {
        this.stop()
      })

    return true
  }

  setScene(scene: number, immediate = false) {
    if (!this.audio || !this.active) return
    const levels = [0.56, 0.60, 0.64, 0.68, 0.54]
    this.fadeTo(levels[scene] ?? 0.5, immediate ? 0 : 650)
  }

  duck(amount = 0.28) {
    if (!this.audio || !this.active) return
    this.fadeTo(amount, 220)
    window.setTimeout(() => this.fadeTo(0.60, 900), 340)
  }

  private fadeTo(target: number, duration: number) {
    if (!this.audio) return
    const audio = this.audio
    const from = audio.volume
    const startedAt = performance.now()

    const tick = (now: number) => {
      if (audio !== this.audio) return
      const progress = Math.min(1, (now - startedAt) / Math.max(duration, 1))
      const eased = 1 - Math.pow(1 - progress, 3)
      audio.volume = from + (target - from) * eased
      if (progress < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }

  stop() {
    if (!this.audio) return
    this.audio.pause()
    this.audio.currentTime = 0
    this.audio.removeAttribute('src')
    this.audio.load()
    this.audio = null
    this.active = false
  }

  get isActive() {
    return this.active
  }
}
