import { useEffect, useRef } from 'react'

type CinematicFXProps = {
  scene: number
  progress: number
  soundPulse: number
}

const vertexShader = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`

const fragmentShader = `
precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_scene;
uniform float u_progress;
uniform float u_pulse;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p *= 2.03;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 p = uv;
  p.x *= u_resolution.x / u_resolution.y;

  float fog = fbm(p * 3.0 + vec2(u_time * 0.026, -u_time * 0.018));
  fog += 0.45 * fbm(p * 6.0 + vec2(-u_time * 0.018, u_time * 0.011));
  fog = smoothstep(0.62, 1.22, fog);

  float vignette = smoothstep(1.08, 0.18, length(uv - 0.5));
  float grain = hash(gl_FragCoord.xy + u_time * 40.0) - 0.5;

  vec3 tint = vec3(0.13, 0.14, 0.18);
  if (u_scene > 1.5 && u_scene < 3.5) tint = vec3(0.42, 0.025, 0.045);
  if (u_scene > 2.5 && u_scene < 4.5) tint = vec3(0.10, 0.12, 0.22);
  if (u_scene > 3.5) tint = vec3(0.31, 0.21, 0.20);

  float redPulse = exp(-length(uv - vec2(0.67, 0.31)) * 4.0) * u_pulse;
  vec3 color = tint * fog * (0.24 + 0.35 * vignette);
  color += vec3(0.30, 0.02, 0.03) * redPulse;
  color += grain * 0.045;

  float opacity = 0.24 + 0.14 * smoothstep(0.0, 1.0, u_progress);
  gl_FragColor = vec4(color, opacity);
}`

function createProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string) {
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)
    if (!shader) throw new Error('Shader creation failed')
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) ?? 'Shader compile failed')
    }
    return shader
  }

  const program = gl.createProgram()
  if (!program) throw new Error('Program creation failed')
  gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource))
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource))
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? 'Program link failed')
  }
  return program
}

export function CinematicFX({ scene, progress, soundPulse }: CinematicFXProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const latest = useRef({ scene, progress, soundPulse })

  useEffect(() => {
    latest.current = { scene, progress, soundPulse }
  }, [scene, progress, soundPulse])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', { alpha: true, antialias: false })
    if (!gl) return

    let frame = 0
    let disposed = false

    try {
      const program = createProgram(gl, vertexShader, fragmentShader)
      const position = gl.getAttribLocation(program, 'a_position')
      const uniforms = {
        resolution: gl.getUniformLocation(program, 'u_resolution'),
        time: gl.getUniformLocation(program, 'u_time'),
        scene: gl.getUniformLocation(program, 'u_scene'),
        progress: gl.getUniformLocation(program, 'u_progress'),
        pulse: gl.getUniformLocation(program, 'u_pulse'),
      }
      const buffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW)

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.75)
        const width = Math.max(1, Math.floor(canvas.clientWidth * dpr))
        const height = Math.max(1, Math.floor(canvas.clientHeight * dpr))
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width
          canvas.height = height
        }
        gl.viewport(0, 0, width, height)
      }

      const render = (time: number) => {
        if (disposed) return
        resize()
        const current = latest.current
        gl.useProgram(program)
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.enableVertexAttribArray(position)
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
        gl.uniform2f(uniforms.resolution, canvas.width, canvas.height)
        gl.uniform1f(uniforms.time, time / 1000)
        gl.uniform1f(uniforms.scene, current.scene)
        gl.uniform1f(uniforms.progress, current.progress)
        gl.uniform1f(uniforms.pulse, current.soundPulse)
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.drawArrays(gl.TRIANGLES, 0, 6)
        frame = requestAnimationFrame(render)
      }

      frame = requestAnimationFrame(render)
    } catch {
      // The narrative still works without the enhancement layer on older GPUs.
    }

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
    }
  }, [])

  return <canvas className="webgl-fog" ref={canvasRef} aria-hidden="true" />
}
