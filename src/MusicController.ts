export class MusicController {
  private audio: HTMLAudioElement | null = null
  private active = false
  private creditsPhase: 'chapter' | 'credits' | 'fade' = 'chapter'
  private fadeFrame: number | null = null

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
        this.fadeTo(0.46, 1000)
      })
      .catch(() => this.stop())

    return true
  }

  setScene(scene: number, immediate = false) {
    if (!this.audio || !this.active || this.creditsPhase !== 'chapter') return
    const levels = [0.42, 0.44, 0.46, 0.44, 0.38]
    this.fadeTo(levels[scene] ?? 0.4, immediate ? 0 : 500)
  }

  setCredits(phase: 'chapter' | 'credits' | 'fade', fallbackScene = 4) {
    if (!this.audio || !this.active) return
    if (phase === this.creditsPhase) return
    this.creditsPhase = phase

    if (phase === 'credits') {
      this.resumeIfNeeded()
      this.fadeTo(0.22, 900)
      return
    }
    if (phase === 'fade') {
      // Credits finish in silence. Pausing after the fade guarantees the loop
      // cannot restart or continue underneath the final still frame.
      this.fadeTo(0, 1400, () => {
        if (this.creditsPhase === 'fade' && this.audio) this.audio.pause()
      })
      return
    }

    this.resumeIfNeeded()
    const levels = [0.42, 0.44, 0.46, 0.44, 0.38]
    this.fadeTo(levels[fallbackScene] ?? 0.38, 500)
  }

  private resumeIfNeeded() {
    if (!this.audio || !this.audio.paused) return
    void this.audio.play().catch(() => undefined)
  }

  private fadeTo(target: number, duration: number, onComplete?: () => void) {
    if (!this.audio) return
    if (this.fadeFrame !== null) cancelAnimationFrame(this.fadeFrame)

    const audio = this.audio
    const from = audio.volume
    const startedAt = performance.now()
    const tick = (now: number) => {
      if (audio !== this.audio) return
      const progress = Math.min(1, (now - startedAt) / Math.max(duration, 1))
      const eased = 1 - Math.pow(1 - progress, 3)
      audio.volume = from + (target - from) * eased
      if (progress < 1) {
        this.fadeFrame = requestAnimationFrame(tick)
      } else {
        this.fadeFrame = null
        onComplete?.()
      }
    }
    this.fadeFrame = requestAnimationFrame(tick)
  }

  stop() {
    if (this.fadeFrame !== null) cancelAnimationFrame(this.fadeFrame)
    this.fadeFrame = null
    if (!this.audio) return
    this.audio.pause()
    this.audio.currentTime = 0
    this.audio.removeAttribute('src')
    this.audio.load()
    this.audio = null
    this.active = false
    this.creditsPhase = 'chapter'
  }

  get isActive() {
    return this.active
  }
}
