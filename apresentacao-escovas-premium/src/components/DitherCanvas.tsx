import { useEffect, useRef } from 'react';
import { motionAllowed, prefersReducedMotion } from '../lib/motion';

type Props = { ink: string; pixel?: number; className?: string; density?: number };

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

// Ruído de valor em camadas, limiarizado por uma matriz de Bayer 8x8 e
// desenhado como pontos redondos. Cliques geram ondas em anel que se expandem.
const FRAG = `precision highp float;
uniform vec2 uRes;uniform float uTime;uniform float uPx;uniform vec3 uInk;uniform float uDensity;
uniform vec3 uWaves[6];
float h(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}
float vn(vec3 p){vec3 i=floor(p),f=fract(p);vec3 u=f*f*(3.-2.*f);
 float a=h(i),b=h(i+vec3(1,0,0)),c=h(i+vec3(0,1,0)),d=h(i+vec3(1,1,0));
 float e=h(i+vec3(0,0,1)),g=h(i+vec3(1,0,1)),k=h(i+vec3(0,1,1)),l=h(i+vec3(1,1,1));
 return mix(mix(mix(a,b,u.x),mix(c,d,u.x),u.y),mix(mix(e,g,u.x),mix(k,l,u.x),u.y),u.z);}
float fbm(vec2 q,float t){float s=0.,a=.5;vec3 p=vec3(q,t);for(int i=0;i<4;i++){s+=a*vn(p);p*=2.03;a*=.5;}return s;}
float b2(vec2 a){a=floor(a);return fract(a.x*.5+a.y*a.y*.75);}
float b8(vec2 a){return ((b2(.25*a)*.25+b2(.5*a))*.25)+b2(a);}
void main(){
 vec2 fc=gl_FragCoord.xy;vec2 cell=floor(fc/uPx);vec2 cu=fract(fc/uPx);
 vec2 coarse=floor(fc/(uPx*6.))*(uPx*6.);
 float ar=uRes.x/uRes.y;vec2 uv=coarse/uRes;uv.x*=ar;
 float v=fbm(uv*3.2,uTime*.045)*uDensity-0.18;
 for(int i=0;i<6;i++){vec3 w=uWaves[i];if(w.z<0.)continue;float t=uTime-w.z;
  vec2 wp=w.xy/uRes;wp.x*=ar;float r=distance(uv,wp);float ring=exp(-pow((r-.28*t)/.07,2.));
  v=max(v,ring*exp(-1.1*t)*exp(-4.*r)*1.2);}
 float on=step(.5,v+b8(cell)-.5);
 float d=length(cu-.5);float m=on*step(d,.34);
 gl_FragColor=vec4(uInk*m,m);
}`;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/**
 * Fundo pontilhado animado em WebGL puro (sem three.js). Pausa fora da tela,
 * congela em um quadro com movimento reduzido e some se WebGL falhar.
 */
export function DitherCanvas({ ink, pixel = 4, className, density = 1 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { premultipliedAlpha: false, antialias: false, alpha: true });
    if (!gl) {
      canvas.style.display = 'none';
      return;
    }
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      canvas.style.display = 'none';
      return;
    }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = u('uRes');
    const uTime = u('uTime');
    const uWaves = u('uWaves');
    gl.uniform1f(u('uPx'), pixel * Math.min(window.devicePixelRatio || 1, 2));
    gl.uniform3fv(u('uInk'), hexToRgb(ink));
    gl.uniform1f(u('uDensity'), density);
    const waves = new Float32Array(18).fill(-1);
    let waveIdx = 0;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const hgt = Math.max(1, Math.round(canvas.clientHeight * dpr));
      canvas.width = w;
      canvas.height = hgt;
      gl.viewport(0, 0, w, hgt);
      gl.uniform2f(uRes, w, hgt);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const t0 = performance.now();
    let raf = 0;
    let visible = false;
    const draw = () => {
      const t = (performance.now() - t0) / 1000;
      gl.uniform1f(uTime, prefersReducedMotion() ? 12 : t);
      gl.uniform3fv(uWaves, waves);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (visible && motionAllowed()) raf = requestAnimationFrame(draw);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = !!e?.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(draw);
    });
    io.observe(canvas);

    const host = canvas.parentElement;
    const onDown = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const t = (performance.now() - t0) / 1000;
      waves[waveIdx * 3] = (e.clientX - r.left) * dpr;
      waves[waveIdx * 3 + 1] = (r.height - (e.clientY - r.top)) * dpr;
      waves[waveIdx * 3 + 2] = t;
      waveIdx = (waveIdx + 1) % 6;
    };
    host?.addEventListener('pointerdown', onDown);
    return () => {
      io.disconnect();
      ro.disconnect();
      cancelAnimationFrame(raf);
      host?.removeEventListener('pointerdown', onDown);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [ink, pixel, density]);

  return <canvas ref={ref} className={`dither ${className ?? ''}`} aria-hidden="true" />;
}
