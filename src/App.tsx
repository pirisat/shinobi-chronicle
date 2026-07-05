import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CinematicFX } from './CinematicFX'
import { MusicController } from './MusicController'

import './styles.css'

gsap.registerPlugin(ScrollTrigger)

type Scene = {
  id: string
  index: string
  image: string
  eyebrow: string
  title: string
  body: string
  quote?: string
  align: 'left' | 'right'
  focus: string
  focusMobile: string
  startScale: number
  endScale: number
  moveX: number
  moveY: number
}

const scenes: Scene[] = [
  {
    id: 'prodigy',
    index: '01',
    image: '/images/rooftop-dusk.png',
    eyebrow: 'CHAPTER I · THE PRODIGY',
    title: 'A child asked to carry the future.',
    body: 'Mist, rooftops, and moonlight drift around the boy who would carry more than anyone should have to bear.',
    quote: 'Even as a child, he learned that peace always asks something in return.',
    align: 'left',
    focus: '52% 34%',
    focusMobile: '58% 30%',
    startScale: 1.22,
    endScale: 1.08,
    moveX: -2,
    moveY: -2,
  },
  {
    id: 'war',
    index: '02',
    image: '/images/war-memory.png',
    eyebrow: 'CHAPTER II · THE WEIGHT OF WAR',
    title: 'Some battles never leave the mind.',
    body: 'Smoke and memory close in around him, and the silence begins to feel heavier than the battlefield itself.',
    quote: 'The wounds of war do not end when the fighting is over; they follow the heart forever.',
    align: 'right',
    focus: '50% 38%',
    focusMobile: '52% 32%',
    startScale: 1.18,
    endScale: 1.06,
    moveX: 3,
    moveY: -3,
  },
  {
    id: 'choice',
    index: '03',
    image: '/images/crimson-moon.png',
    eyebrow: 'CHAPTER III · THE DARKEST CHOICE',
    title: 'To protect the village, he chose to be hated.',
    body: 'The eye closes on one life and opens beneath a crimson moon, where duty demands the impossible.',
    quote: 'To shield the village, he stepped into the darkness and let the world misunderstand him.',
    align: 'left',
    focus: '51% 37%',
    focusMobile: '52% 28%',
    startScale: 1.2,
    endScale: 1.09,
    moveX: -1,
    moveY: -4,
  },
  {
    id: 'akatsuki',
    index: '04',
    image: '/images/storm.png',
    eyebrow: 'CHAPTER IV · THE MASK',
    title: 'In the storm, he became a myth.',
    body: 'Rain runs down the cloak, crows cut through the dark, and the face behind the legend finally stays in view.',
    quote: 'Behind the mask of a criminal, he carried the loneliness of a guardian no one could see.',
    align: 'right',
    focus: '50% 20%',
    focusMobile: '54% 14%',
    startScale: 1.1,
    endScale: 1.01,
    moveX: 1.4,
    moveY: -1.2,
  },
  {
    id: 'farewell',
    index: '05',
    image: '/images/farewell.png',
    eyebrow: 'CHAPTER V · THE TRUTH',
    title: 'The final gesture was love.',
    body: 'The storm gives way to light, and the last moment is not power or vengeance, but tenderness.',
    quote: 'In the end, the truth was not anger or power, but the quiet love he left behind.',
    align: 'left',
    focus: '50% 30%',
    focusMobile: '54% 24%',
    startScale: 1.14,
    endScale: 1.02,
    moveX: -1,
    moveY: -2,
  },
]

type MemoryFragment = {
  scene: number
  icon: string
  title: string
  text: string
  className: string
}

const memories: MemoryFragment[] = [
  { scene: 0, icon: '✦', title: 'The prodigy', text: 'Before the weight of the clan fell on him, Itachi was simply a child who believed peace could be protected.', className: 'fragment-rooftop' },
  { scene: 1, icon: '◒', title: 'A witness to war', text: 'The battlefield taught him that victory without understanding only leaves another wound behind.', className: 'fragment-war' },
  { scene: 2, icon: '◉', title: 'The choice', text: 'He chose to become the shadow around the village so the people inside it could keep living in the light.', className: 'fragment-moon' },
  { scene: 3, icon: '✧', title: 'The mask', text: 'The Akatsuki cloak hid a protector whose name the world was never meant to celebrate.', className: 'fragment-storm' },
  { scene: 4, icon: '❖', title: 'The farewell', text: 'His final touch carried every apology he could never say aloud.', className: 'fragment-farewell' },
]

function range(count: number) {
  return Array.from({ length: count }, (_, index) => index)
}

function App() {
  const app = useRef<HTMLDivElement>(null)
  const music = useRef<MusicController | null>(null)
  const cursorGlow = useRef<HTMLDivElement>(null)
  const activeSceneRef = useRef(0)
  const creditsPhaseRef = useRef<'chapter' | 'credits' | 'fade'>('chapter')

  const [activeScene, setActiveScene] = useState(0)
  const [progress, setProgress] = useState(0)
  const [musicOn, setMusicOn] = useState(false)
  const [pulse, setPulse] = useState(0.2)
  const [loaded, setLoaded] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const [entered, setEntered] = useState(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('replay'))
  const [memoryOpen, setMemoryOpen] = useState<MemoryFragment | null>(null)
  const [screenWidth, setScreenWidth] = useState(() => (typeof window === 'undefined' ? 1440 : window.innerWidth))
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    let cancelled = false
    let finished = 0
    const sources = scenes.map((scene) => scene.image)
    const markLoaded = () => {
      finished += 1
      if (cancelled) return
      setLoadProgress(Math.round((finished / sources.length) * 100))
      if (finished >= sources.length) window.setTimeout(() => !cancelled && setLoaded(true), 260)
    }

    sources.forEach((source) => {
      const image = new Image()
      image.onload = markLoaded
      image.onerror = markLoaded
      image.src = source
    })

    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (!params.has('replay')) return

    // The replay link reloads at the top of the document and removes its marker
    // so refreshes do not keep forcing a replay state.
    window.scrollTo({ top: 0, behavior: 'auto' })
    params.delete('replay')
    const query = params.toString()
    window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`)
    window.requestAnimationFrame(() => ScrollTrigger.refresh())
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const applyMotionPref = () => setReducedMotion(media.matches)
    const onResize = () => setScreenWidth(window.innerWidth)

    applyMotionPref()
    onResize()

    media.addEventListener('change', applyMotionPref)
    window.addEventListener('resize', onResize)

    return () => {
      media.removeEventListener('change', applyMotionPref)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  const compact = screenWidth < 900
  const mobile = screenWidth < 640
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData ?? false
  const performanceMode = reducedMotion || saveData || screenWidth < 820

  const fxDensity = useMemo(() => {
    if (performanceMode) return { feathers: 10, crows: 5, particles: 14, rain: 18, branches: 3 }
    if (compact) return { feathers: 14, crows: 6, particles: 18, rain: 28, branches: 3 }
    return { feathers: 20, crows: 9, particles: 26, rain: 46, branches: 4 }
  }, [compact, performanceMode])

  const feathers = useMemo(() => range(fxDensity.feathers), [fxDensity.feathers])
  const crows = useMemo(() => range(fxDensity.crows), [fxDensity.crows])
  const particles = useMemo(() => range(fxDensity.particles), [fxDensity.particles])
  const rain = useMemo(() => range(fxDensity.rain), [fxDensity.rain])
  const branches = useMemo(() => range(fxDensity.branches), [fxDensity.branches])

  const startDefaultAudio = useCallback(() => {
    if (music.current) return

    const score = new MusicController()
    const started = score.start()
    if (started) {
      score.setScene(activeScene, true)
      music.current = score
      setMusicOn(true)
    }
  }, [activeScene])


  useEffect(() => {
    const node = cursorGlow.current
    if (!node || compact) return

    const move = (event: MouseEvent) => {
      gsap.to(node, {
        x: event.clientX,
        y: event.clientY,
        duration: 0.45,
        ease: 'power3.out',
      })
    }

    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [compact])

  useEffect(() => {
    const ctx = gsap.context(() => {
      const story = document.querySelector<HTMLElement>('.story')
      const storyStage = document.querySelector<HTMLElement>('.story-stage')
      const stageCamera = document.querySelector<HTMLElement>('.stage-camera')
      const frames = gsap.utils.toArray<HTMLElement>('.world-frame')
      const images = gsap.utils.toArray<HTMLElement>('.world-image')
      const cards = gsap.utils.toArray<HTMLElement>('.story-card')
      const endingScene = document.querySelector<HTMLElement>('.ending-scene')
      const progressBar = document.querySelector<HTMLElement>('.progress-fill')
      const wipe = document.querySelector<HTMLElement>('.scene-wipe')
      const wipeBand = document.querySelector<HTMLElement>('.scene-wipe-band')
      const flash = document.querySelector<HTMLElement>('.transition-flash')
      const ash = document.querySelector<HTMLElement>('.ash-transition')
      const crowWipe = document.querySelector<HTMLElement>('.crow-transition')
      const rainDissolve = document.querySelector<HTMLElement>('.rain-dissolve')
      const heroCopy = document.querySelector<HTMLElement>('.hero-copy')
      const titleSpans = gsap.utils.toArray<HTMLElement>('.story-title > span')
      const heroChildren = gsap.utils.toArray<HTMLElement>('.hero-copy > *')
      const branchesNodes = gsap.utils.toArray<HTMLElement>('.branch')
      const cardLines = cards.map((card) => Array.from(card.querySelectorAll<HTMLElement>(':scope > *')))
      const endingLines = endingScene ? Array.from(endingScene.querySelectorAll<HTMLElement>(':scope > *')) : []

      if (!story || !storyStage || !stageCamera) return

      gsap.set(frames, { autoAlpha: 0 })
      gsap.set(images, { scale: 1.12, xPercent: 0, yPercent: 0 })
      gsap.set(frames[0], { autoAlpha: 1 })
      gsap.set(images[0], { scale: scenes[0].startScale })
      gsap.set(cards, { autoAlpha: 0 })
      if (endingScene) gsap.set(endingScene, { autoAlpha: 0, y: 26, pointerEvents: 'none' })
      if (endingLines.length) gsap.set(endingLines, { autoAlpha: 0, y: 22, filter: 'blur(10px)' })
      gsap.set(heroChildren, { autoAlpha: 0, y: 24 })
      gsap.set(titleSpans, { autoAlpha: 0, yPercent: 110 })
      gsap.set(wipe, { autoAlpha: 0 })
      gsap.set(wipeBand, { xPercent: -135 })
      gsap.set(flash, { autoAlpha: 0 })
      gsap.set([ash, crowWipe, rainDissolve], { autoAlpha: 0 })
      cardLines.forEach((lines) => gsap.set(lines, { autoAlpha: 0, y: 28, filter: 'blur(10px)' }))
      gsap.set(cards[0], { autoAlpha: 1 })
      gsap.set(cardLines[0], { autoAlpha: 1, y: 0, filter: 'blur(0px)' })

      const master = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: story,
          start: 'top top',
          end: 'bottom bottom',
          scrub: compact ? 0.9 : 1.1,
          onUpdate: (self) => {
            setProgress(self.progress)
            const storyStep = Math.floor(self.progress * (scenes.length + 1) + 0.0001)
            const chapter = Math.min(scenes.length - 1, storyStep)
            const creditsPhase = self.progress >= 0.975 ? 'fade' : self.progress >= 0.89 ? 'credits' : 'chapter'
            if (chapter !== activeSceneRef.current) {
              activeSceneRef.current = chapter
              setActiveScene(chapter)
            }
            // Track every credits phase, not only whether credits are visible.
            // This ensures the final fade phase actually reaches the audio controller.
            if (creditsPhase !== creditsPhaseRef.current) {
              creditsPhaseRef.current = creditsPhase
              music.current?.setCredits(creditsPhase, chapter)
            }
            const velocity = Math.abs(self.getVelocity())
            const blur = performanceMode ? Math.min(4, velocity / 1500) : Math.min(10, velocity / 900)
            storyStage.style.setProperty('--velocity-blur', `${blur.toFixed(2)}px`)
          },
        },
      })

      master
        .to(heroChildren, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.45, ease: 'power3.out' }, 0)
        .to(titleSpans, { autoAlpha: 1, yPercent: 0, stagger: 0.05, duration: 0.42, ease: 'power3.out' }, 0)
        .fromTo(stageCamera, { scale: 1.03, xPercent: 0, yPercent: 0 }, { scale: compact ? 1 : 0.995, xPercent: -1, yPercent: -1, duration: 0.95 }, 0)
        .fromTo(images[0], { scale: scenes[0].startScale, xPercent: 0, yPercent: 0 }, { scale: scenes[0].endScale, xPercent: scenes[0].moveX, yPercent: scenes[0].moveY, duration: 1 }, 0)
        .fromTo(branchesNodes, { xPercent: -8, yPercent: 0 }, { xPercent: 8, yPercent: -3, stagger: 0.03, duration: 1 }, 0)
        .to(heroCopy, { autoAlpha: 0, y: -18, duration: 0.28 }, 0.8)

      // Every scene change belongs to this same timeline, so scrolling forward and back
      // always restores the exact previous chapter state.
      scenes.slice(1).forEach((scene, offset) => {
        const nextIndex = offset + 1
        const prevIndex = nextIndex - 1
        const position = nextIndex
        const previousCard = cards[prevIndex]
        const nextCard = cards[nextIndex]

        if (previousCard) {
          master
            .to(cardLines[prevIndex], { autoAlpha: 0, y: -24, filter: 'blur(10px)', stagger: 0.03, duration: 0.22 }, position - 0.24)
            .to(previousCard, { autoAlpha: 0, duration: 0.18 }, position - 0.06)
        }

        master
          .to(wipe, { autoAlpha: 1, duration: 0.04 }, position - 0.06)
          .fromTo(wipeBand, { xPercent: -135 }, { xPercent: 135, duration: compact ? 0.28 : 0.34, ease: 'power2.inOut' }, position - 0.06)
          .to(wipe, { autoAlpha: 0, duration: 0.06 }, position + 0.29)
          .to(frames[prevIndex], { autoAlpha: 0.08, duration: 0.46 }, position)
          .fromTo(frames[nextIndex], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, position)
          .fromTo(
            images[nextIndex],
            { scale: scene.startScale, xPercent: -scene.moveX * 0.35, yPercent: scene.moveY * -0.25 },
            { scale: scene.endScale, xPercent: scene.moveX, yPercent: scene.moveY, duration: 1 },
            position,
          )
          .to(stageCamera, {
            scale: compact ? 1 : 1 + (nextIndex === 2 ? 0.016 : nextIndex === 3 ? 0.009 : 0.004),
            xPercent: nextIndex % 2 === 0 ? -1 : 1.5,
            yPercent: -1 - nextIndex,
            duration: 0.9,
          }, position)

        // Every chapter, including Chapter V, has its own complete story card.
        if (nextCard) {
          master
            .set(nextCard, { autoAlpha: 1 }, position + 0.02)
            .fromTo(cardLines[nextIndex], { autoAlpha: 0, y: 28, filter: 'blur(10px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', stagger: 0.05, duration: 0.3, ease: 'power3.out' }, position + 0.08)
        }

        if (nextIndex === 1) {
          master
            .fromTo(ash, { autoAlpha: 0, xPercent: -8 }, { autoAlpha: 0.85, xPercent: 8, duration: 0.46 }, position - 0.08)
            .to(ash, { autoAlpha: 0, duration: 0.24 }, position + 0.34)
        }

        if (nextIndex === 2) {
          master
            .to('.ambient-red', { autoAlpha: 0.58, duration: 0.9 }, position)
            .to('.moon-pulse', { autoAlpha: 1, duration: 0.9 }, position)
            .fromTo('.iris-transition', { autoAlpha: 0, scale: 0.18 }, { autoAlpha: 1, scale: 2.2, duration: 0.24, ease: 'power2.in' }, position + 0.27)
            .to('.iris-transition', { autoAlpha: 0, scale: 4.8, duration: 0.22, ease: 'power2.out' }, position + 0.52)
        }

        if (nextIndex === 3) {
          master
            .fromTo(crowWipe, { autoAlpha: 0, xPercent: -18 }, { autoAlpha: 1, xPercent: 12, duration: 0.26 }, position - 0.02)
            .to(crowWipe, { autoAlpha: 0, duration: 0.32 }, position + 0.28)
            .to('.ambient-rain', { autoAlpha: 1, duration: 0.8 }, position)
            .to('.ambient-lightning', { autoAlpha: 0.62, duration: 0.26 }, position + 0.15)
            .to(flash, { autoAlpha: 0.46, duration: 0.05 }, position + 0.31)
            .to(flash, { autoAlpha: 0, duration: 0.16 }, position + 0.38)
            .to('.storm-shake', { x: 3, y: -1, duration: 0.07, repeat: 3, yoyo: true, ease: 'none' }, position + 0.31)
        }

        if (nextIndex === 4) {
          master
            .fromTo(rainDissolve, { autoAlpha: 0, scale: 0.86 }, { autoAlpha: 0.72, scale: 1.08, duration: 0.42 }, position - 0.02)
            .to(rainDissolve, { autoAlpha: 0, duration: 0.38 }, position + 0.38)
            .to('.ambient-rain', { autoAlpha: 0, duration: 0.7 }, position)
            .to('.ambient-lightning', { autoAlpha: 0, duration: 0.38 }, position)
            .to('.ambient-light', { autoAlpha: 1, duration: 0.8 }, position)
            .to('.ambient-red', { autoAlpha: 0.08, duration: 0.8 }, position)
        }
      })

      // Credits follow Chapter V. The final chapter clears first, then the credits become interactive.
      if (endingScene) {
        master
          .to(cardLines[4], { autoAlpha: 0, y: -24, filter: 'blur(10px)', stagger: 0.03, duration: 0.24 }, 4.64)
          .to(cards[4], { autoAlpha: 0, duration: 0.18 }, 4.82)
          .set(endingScene, { pointerEvents: 'auto' }, 4.98)
          .to(endingScene, { autoAlpha: 1, y: 0, duration: 0.34, ease: 'power2.out' }, 4.98)
          .to(endingLines, { autoAlpha: 1, y: 0, filter: 'blur(0px)', stagger: 0.07, duration: 0.28, ease: 'power3.out' }, 5.08)
      }

      gsap.to(progressBar, {
        scaleY: 1,
        transformOrigin: 'top',
        ease: 'none',
        scrollTrigger: { trigger: story, start: 'top top', end: 'bottom bottom', scrub: 0.8 },
      })

      if (!reducedMotion) {
        gsap.to(branchesNodes, { xPercent: 10, duration: 9, repeat: -1, yoyo: true, ease: 'sine.inOut', stagger: 0.2 })
        gsap.to('.foreground-haze', { xPercent: 6, duration: 8, repeat: -1, yoyo: true, ease: 'sine.inOut' })
        if (!compact) gsap.to('.cursor-ring', { scale: 1.18, duration: 1.8, repeat: -1, yoyo: true, ease: 'sine.inOut' })
      }

      ScrollTrigger.refresh()
    }, app)

    return () => ctx.revert()
  }, [compact, performanceMode, reducedMotion])

  useEffect(() => {
    if (!musicOn) return
    music.current?.setScene(activeScene)
    setPulse(0.92)
    window.setTimeout(() => setPulse(activeScene === 4 ? 0.45 : 0.28), 320)
  }, [activeScene, musicOn])


  useEffect(() => () => {
    music.current?.stop()
  }, [])

  const enterStory = () => {
    if (!loaded) return
    setEntered(true)
    startDefaultAudio()
    window.scrollTo({ top: 0, behavior: 'auto' })
    window.setTimeout(() => ScrollTrigger.refresh(), 350)
  }

  // Replay intentionally uses native navigation instead of manipulating a sticky
  // GSAP scene. The link works even if an animation frame is currently in progress.

  const toggleMusic = () => {
    if (musicOn) {
      music.current?.stop()
      music.current = null
      setMusicOn(false)
      return
    }

    const score = new MusicController()
    const started = score.start()
    if (!started) return
    score.setScene(activeScene, true)
    music.current = score
    setMusicOn(true)
  }


  return (
    <main ref={app}>
      <section className={`burden-intro ${entered ? 'is-entered' : ''}`} aria-hidden={entered}>
        <div className="intro-noise" />
        <div className="intro-moon" aria-hidden="true"><span /><span /><span /></div>
        <div className="intro-content">
          <p className="intro-kicker">THE STORY OF ITACHI UCHIHA</p>
          <h1><span>The Burden</span><span>of a Shinobi</span></h1>
          <p className="intro-subtitle">A story of sacrifice, truth, and love.</p>
          <div className="intro-loader" aria-live="polite">
            <span><i style={{ width: `${loadProgress}%` }} /></span>
            <small>{loaded ? 'MEMORIES READY' : `LOADING MEMORIES · ${loadProgress}%`}</small>
          </div>
          <button type="button" className="enter-button" onClick={enterStory} disabled={!loaded}>
            {loaded ? 'BEGIN THE STORY' : 'PREPARING THE STORY'}
          </button>
        </div>
      </section>

      {memoryOpen && (
        <div className="memory-dialog" role="dialog" aria-modal="true" aria-label={memoryOpen.title}>
          <button type="button" className="memory-backdrop" aria-label="Close memory" onClick={() => setMemoryOpen(null)} />
          <article className="memory-card">
            <button type="button" className="memory-close" onClick={() => setMemoryOpen(null)} aria-label="Close">×</button>
            <span>{memoryOpen.icon}</span>
            <p className="kicker">MEMORY FRAGMENT</p>
            <h2>{memoryOpen.title}</h2>
            <p>{memoryOpen.text}</p>
          </article>
        </div>
      )}

      <div className="cursor-glow" ref={cursorGlow} aria-hidden="true">
        <span className="cursor-ring" />
      </div>

      <aside className="chapter-rail" aria-label="Story progress">
        <span className="rail-label">CHAPTERS</span>
        <div className="rail-progress"><span className="progress-fill" /></div>
        <div className="rail-dots">
          {scenes.map((scene, index) => (
            <button
              key={scene.id}
              type="button"
              aria-label={`Go to ${scene.eyebrow}`}
              className={activeScene === index ? 'is-active' : ''}
              onClick={() => document.getElementById(scene.id)?.scrollIntoView({ behavior: 'smooth' })}
            />
          ))}
        </div>
      </aside>

      <div className="audio-controls">
        <button className={`track-toggle ${musicOn ? 'is-playing' : ''}`} type="button" onClick={toggleMusic} aria-pressed={musicOn}>
          <span aria-hidden="true">{musicOn ? '◼' : '♫'}</span> {musicOn ? 'MUSIC OFF' : 'PLAY MUSIC'}
        </button>
      </div>

      <section className="story" aria-label="Continuous cinematic Itachi story">
        <div className={`story-stage storm-shake scene-${activeScene + 1}`}>
          <div className="stage-camera">
            <div className="world-stack" aria-hidden="true">
              {scenes.map((scene) => (
                <div key={scene.id} className="world-frame">
                  <img className="world-image" src={scene.image} alt="" loading={scene.index === '01' ? 'eager' : 'lazy'} decoding="async" style={{ objectPosition: mobile ? scene.focusMobile : scene.focus }} />
                  <div className="world-vignette" />
                </div>
              ))}
            </div>

            {performanceMode ? <div className="lite-film-grain" aria-hidden="true" /> : <CinematicFX scene={activeScene} progress={progress} soundPulse={pulse} />}

            <div className="scene-wipe" aria-hidden="true"><span className="scene-wipe-band" /></div>
            <div className="ash-transition" aria-hidden="true" />
            <div className="crow-transition" aria-hidden="true">{range(18).map((index) => <i key={index} style={{ '--i': index } as CSSProperties} />)}</div>
            <div className="rain-dissolve" aria-hidden="true" />
            <div className="transition-flash" aria-hidden="true" />
            <div className="ambient ambient-fog" />
            <div className="ambient ambient-red" />
            <div className="ambient ambient-light" />
            <div className="ambient ambient-embers" aria-hidden="true">
              {particles.map((index) => <i key={index} className="particle" style={{ '--i': index } as CSSProperties} />)}
            </div>
            <div className="ambient ambient-rain" aria-hidden="true">
              {rain.map((index) => <i key={index} className="drop" style={{ '--i': index } as CSSProperties} />)}
            </div>
            <div className="ambient ambient-lightning" aria-hidden="true"><span className="lightning-bolt bolt-a" /><span className="lightning-bolt bolt-b" /></div>
            <div className="chapter-atmosphere rooftop-mist" aria-hidden="true"><i /><i /><i /></div>
            <div className="chapter-atmosphere war-fragments" aria-hidden="true">{range(12).map((index) => <i key={index} style={{ '--i': index } as CSSProperties} />)}</div>
            <div className="chapter-atmosphere crimson-eclipse" aria-hidden="true"><i /><i /><i /></div>
            <div className="chapter-atmosphere farewell-light" aria-hidden="true"><i /><i /></div>
            <div className="moon-pulse" aria-hidden="true"><span className="ring ring-a" /><span className="ring ring-b" /></div>
            <div className="iris-transition" aria-hidden="true"><span /><span /><span /></div>
            <div className="crows" aria-hidden="true">
              {crows.map((index) => (
                <span className="crow" key={index} style={{ '--i': index } as CSSProperties}>
                  <svg viewBox="0 0 64 36" role="presentation"><path d="M1 18c7-11 18-17 31-17 6 0 13 2 19 6-4 0-8 2-11 5 9 2 17 8 23 18-9-5-18-7-27-6-5 1-10 3-15 7 1-4 1-8-2-13-5 5-11 7-18 7z" /></svg>
                </span>
              ))}
            </div>
            <div className="feather-layer" aria-hidden="true">
              {feathers.map((index) => <i key={index} className="feather" style={{ '--i': index } as CSSProperties} />)}
            </div>
            <div className="foreground-depth" aria-hidden="true">
              {branches.map((index) => <span key={index} className={`branch branch-${index + 1}`} />)}
              <span className="foreground-haze" />
            </div>
          </div>

          <div className="story-overlay shell">
            <div className="memory-fragments" aria-label="Memories">
              {memories.map((memory) => (
                <button
                  key={memory.title}
                  type="button"
                  className={`memory-fragment ${memory.className} ${activeScene === memory.scene ? 'is-active' : ''}`}
                  aria-label={`Open memory: ${memory.title}`}
                  onClick={() => setMemoryOpen(memory)}
                >{memory.icon}</button>
              ))}
            </div>
            <div className="hero-copy">
              <p className="kicker">ITACHI UCHIHA</p>
              <h1 className="story-title" aria-label="The burden of a shinobi">
                <span>The burden</span>
                <span>of a shinobi.</span>
              </h1>
              <p className="hero-description">A journey through sacrifice, burden, truth, and the love he chose to protect in silence.</p>
            </div>

            <div className="story-cards" aria-live="polite">
              {scenes.map((scene, index) => (
                <article key={scene.id} className={`story-card card-${index + 1} ${scene.align}`}>
                  <span className="scene-index">{scene.index}</span>
                  <p className="kicker">{scene.eyebrow}</p>
                  <h2>{scene.title}</h2>
                  <p>{scene.body}</p>
                  {scene.quote && <blockquote>{scene.quote}</blockquote>}
                </article>
              ))}
            </div>
            <section className="ending-scene" aria-label="End credits">
              <span className="ending-mark" aria-hidden="true">✦</span>
              <p className="ending-kicker">EPILOGUE</p>
              <h2>His silence was never empty.<br />It was love.</h2>
              <div className="ending-credits">
                <span>THE BURDEN OF A SHINOBI</span>
                <span>A SHINOBI STUDIO STORY</span>
                <span>THANK YOU FOR WATCHING</span>
              </div>
            </section>
          </div>
        </div>

        <div className="scroll-track" aria-hidden="true">
          {scenes.map((scene, index) => (
            <section key={scene.id} id={scene.id} className={`step ${index === scenes.length - 1 ? 'is-last' : ''}`}>
              <div className="step-label"><span>{scene.eyebrow}</span></div>
            </section>
          ))}
          <section className="step end-credit-step"><div className="step-label"><span>END CREDITS</span></div></section>
        </div>
      </section>
    </main>
  )
}

export default App
