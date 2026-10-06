import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import Lenis from "lenis";
import { live, measureAnchors } from "./pose.js";
import Scene from "./Scene.jsx";
import { BgTiles, PixelGlyph } from "./Pixels.jsx";

gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin);

const WA =
  "https://wa.me/5511964159518?text=" + encodeURIComponent("Olá! Quero confirmar o pedido KG da Dental Life DF com as condições da página.");

function Dots() {
  return (
    <>
      <i className="dot tl" aria-hidden="true" />
      <i className="dot tr" aria-hidden="true" />
      <i className="dot bl" aria-hidden="true" />
      <i className="dot br" aria-hidden="true" />
    </>
  );
}

export default function App() {
  const root = useRef(null);
  const video = useRef(null);
  const [soundOn, setSoundOn] = useState(false);

  useLayoutEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    live.reduced = reduced;

    let lenis;
    const tick = (t) => lenis && lenis.raf(t * 1000);
    if (!reduced) {
      lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
      lenis.on("scroll", (e) => {
        live.velocity = e.velocity;
        ScrollTrigger.update();
      });
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }

    const mm = gsap.matchMedia();
    const ctx = gsap.context(() => {
      if (reduced) return;

      // hero entrance
      gsap
        .timeline({ defaults: { ease: "expo.out" } })
        .from(".hero h1 .ln", { yPercent: 40, opacity: 0.2, duration: 1.4, stagger: 0.1 })
        .from(".hero-copy > :not(h1)", { y: 24, duration: 1.1, stagger: 0.08 }, 0.25)
        .from(".hero .sq", { scale: 0, duration: 0.9, stagger: { each: 0.05, from: "random" } }, 0.2);

      // hero squares drift at different speeds
      gsap.utils.toArray(".hero .sq").forEach((el, i) => {
        gsap.to(el, { y: -80 - (i % 3) * 70, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
      });

      // giant wordmark slides across, image blocks at their own speeds
      gsap.fromTo(".wordmark", { xPercent: 4 }, { xPercent: -4, ease: "none", scrollTrigger: { trigger: ".marca", start: "top bottom", end: "bottom top", scrub: true } });
      gsap.utils.toArray("[data-speed]").forEach((el) => {
        const s = parseFloat(el.dataset.speed);
        gsap.fromTo(
          el,
          { y: () => s * 90 },
          { y: () => -s * 90, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true } }
        );
      });

      // reveals (transform only, content is never hidden at rest)
      gsap.utils.toArray("[data-reveal]").forEach((el) => {
        gsap.from(el, { y: 60, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 92%" } });
      });
      gsap.utils.toArray(".sec-title").forEach((el) => {
        gsap.from(el, { yPercent: 25, opacity: 0.25, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%" } });
      });

      // bracket labels decode
      gsap.utils.toArray("[data-scramble]").forEach((el) => {
        gsap.to(el, {
          scrambleText: { text: el.textContent, chars: "▪▫░▒01", speed: 0.5 },
          duration: 1.1,
          scrollTrigger: { trigger: el, start: "top 92%", once: true },
        });
      });

      // prices count up to their real value
      gsap.utils.toArray("[data-count]").forEach((el) => {
        const end = parseFloat(el.dataset.count);
        const o = { v: 0 };
        gsap.to(o, {
          v: end,
          duration: 1.6,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
          onUpdate: () => (el.textContent = o.v.toFixed(2).replace(".", ",")),
        });
      });
      gsap.from(".meter-fill", { scaleX: 0, transformOrigin: "left center", duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: ".meter", start: "top 90%" } });

      // horizontal film strip, pinned on wide screens
      mm.add("(min-width: 900px)", () => {
        const track = document.querySelector(".strip-track");
        const dist = () => track.scrollWidth - window.innerWidth;
        gsap.to(track, {
          x: () => -dist(),
          ease: "none",
          scrollTrigger: { trigger: ".strip", start: "top top", end: () => "+=" + dist(), pin: true, scrub: 1, invalidateOnRefresh: true },
        });
        gsap.utils.toArray(".strip .img-card img").forEach((img) => {
          gsap.fromTo(img, { xPercent: -5 }, { xPercent: 5, ease: "none", scrollTrigger: { trigger: ".strip", start: "top top", end: () => "+=" + dist(), scrub: true } });
        });
      });
    }, root);

    const refresh = () => measureAnchors();
    ScrollTrigger.addEventListener("refresh", refresh);
    measureAnchors();
    window.addEventListener("resize", refresh);
    const ro = new ResizeObserver(() => ScrollTrigger.refresh());
    ro.observe(document.body);

    return () => {
      ctx.revert();
      mm.revert();
      gsap.ticker.remove(tick);
      lenis?.destroy();
      ro.disconnect();
      window.removeEventListener("resize", refresh);
      ScrollTrigger.removeEventListener("refresh", refresh);
    };
  }, []);

  useEffect(() => {
    const go = (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const el = document.querySelector(a.getAttribute("href"));
      if (!el) return;
      e.preventDefault();
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 60, behavior: live.reduced ? "auto" : "smooth" });
    };
    document.addEventListener("click", go);
    return () => document.removeEventListener("click", go);
  }, []);

  const toggleSound = () => {
    const v = video.current;
    if (!v) return;
    const on = v.muted;
    v.muted = !on;
    if (on) {
      v.currentTime = 0;
      v.play().catch(() => {});
    }
    setSoundOn(on);
  };

  return (
    <div ref={root}>
      <BgTiles />
      <div className="webgl-wrap" aria-hidden="true">
        <Scene />
      </div>
      <div className="grain" aria-hidden="true" />

      <header className="top">
        <a href="#topo" className="lockup" aria-label="Dental Life DF × KG Sorensen, voltar ao topo">
          <img src="assets/dentallife-symbol.png" alt="" width="40" height="37" />
          <span className="lockup-name">DentalLife</span>
          <span className="lockup-x">×</span>
          <img src="assets/kg-mark-light.png" alt="" width="30" height="35" />
        </a>
        <nav aria-label="Seções">
          <a href="#condicoes">Condições</a>
          <a href="#filme">Filme</a>
          <a href="#kg">KG Sorensen</a>
          <a href="#pedido" className="btn btn-primary">Confirmar pedido</a>
        </nav>
      </header>

      <main id="topo">
        {/* HERO */}
        <section className="hero" data-pose="hero" aria-labelledby="hero-title">
          <i className="sq" style={{ left: "38%", top: "14%" }} aria-hidden="true" />
          <i className="sq" style={{ left: "46%", top: "30%" }} aria-hidden="true" />
          <i className="sq" style={{ left: "4%", top: "72%" }} aria-hidden="true" />
          <i className="sq" style={{ left: "30%", top: "86%" }} aria-hidden="true" />
          <i className="sq" style={{ right: "4%", top: "64%" }} aria-hidden="true" />
          <div className="wrap hero-in">
            <div className="hero-copy">
              <p className="bracket" data-scramble>[ Dental Life DF × KG Sorensen ]</p>
              <h1 id="hero-title" className="hero-title">
                <span className="ln">Mais que brocas,</span>
                <span className="ln grad">movimento.</span>
              </h1>
              <p className="lede">
                Hiltinho, separamos condições KG para a Dental Life DF: ponta diamantada com valor percebido de R$ 6,99 e KG Brush que
                já vem com ponta FG.
              </p>
              <div className="actions">
                <a href="#condicoes" className="btn btn-primary">Ver condições</a>
                <a href="#filme" className="btn">Assistir ao filme</a>
              </div>
            </div>
          </div>
          <p className="hero-foot">
            <span>Ponta diamantada KG</span>
            <i aria-hidden="true">|</i>
            <span>Produtos Odontológicos · Brasília/DF</span>
          </p>
        </section>

        {/* WORDMARK */}
        <section className="marca" data-pose="marca" aria-label="Dental Life DF">
          <div className="marca-blocks" aria-hidden="true">
            <figure className="block b1" data-speed="0.6"><img src="assets/p-loja.jpg" alt="" width="720" height="900" /></figure>
            <figure className="block b2" data-speed="1.3"><img src="assets/p-orbita.jpg" alt="" width="720" height="900" /></figure>
          </div>
          <p className="wordmark grad" aria-hidden="true">DentalLife</p>
          <div className="wrap marca-foot">
            <p className="bracket" data-scramble>[ Produtos Odontológicos · Brasília/DF ]</p>
            <p className="marca-copy">Do Planalto Central para cada consultório do DF, com a ponta diamantada que o dentista já reconhece na bandeja.</p>
          </div>
        </section>

        {/* CONDIÇÕES */}
        <section id="condicoes" className="sec" data-pose="condicoes" aria-labelledby="cond-title">
          <div className="wrap">
            <div className="sec-head">
              <p className="bracket" data-scramble>[ Condições ]</p>
              <h2 className="sec-title" id="cond-title">
                Condições KG para a <span className="grad">Dental Life DF.</span>
              </h2>
            </div>

            <div className="offers">
              <article className="glass offer" data-reveal>
                <div className="offer-top">
                  <span className="app-tile"><PixelGlyph name="bur" size={34} /></span>
                  <div>
                    <h3>Ponta diamantada KG</h3>
                    <p className="sub">Valores por unidade</p>
                  </div>
                </div>
                <div className="prices">
                  <div>
                    <span className="k">Na nota</span>
                    <span className="price"><small>R$</small><span data-count="9.10">9,10</span></span>
                  </div>
                  <div>
                    <span className="k">Valor percebido</span>
                    <span className="price grad"><small>R$</small><span data-count="6.99">6,99</span></span>
                  </div>
                </div>
                <div className="meter" role="img" aria-label="Valor percebido de R$ 6,99 é 76,8% do valor na nota de R$ 9,10">
                  <div className="meter-track"><span className="meter-fill" /></div>
                  <div className="meter-legend"><span>R$ 6,99 · 76,8% da nota</span><span>R$ 9,10</span></div>
                </div>
              </article>

              <article className="glass offer" data-reveal>
                <div className="offer-top">
                  <span className="app-tile"><PixelGlyph name="brush" size={34} /></span>
                  <div>
                    <h3>KG Brush</h3>
                    <p className="sub">Valor por unidade</p>
                  </div>
                </div>
                <div className="prices">
                  <div>
                    <span className="k">Valor</span>
                    <span className="price grad"><small>R$</small><span data-count="15">15,00</span></span>
                  </div>
                  <div>
                    <span className="k">Ganha</span>
                    <span className="price">+1 FG</span>
                  </div>
                </div>
                <div className="dock" aria-label="A cada 1 KG Brush, ganha 1 ponta diamantada FG">
                  <div className="dock-item">
                    <span className="app-tile lg"><PixelGlyph name="brush" size={40} /></span>
                    <span>1 KG Brush</span>
                  </div>
                  <span className="dock-plus" aria-hidden="true">+</span>
                  <div className="dock-item">
                    <span className="app-tile lg on"><PixelGlyph name="bur" size={40} /></span>
                    <span>1 ponta diamantada FG</span>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* FILME — horizontal strip */}
        <section id="filme" className="strip" data-pose="filme" aria-labelledby="film-title">
          <div className="strip-track">
            <div className="card text-card">
              <p className="bracket">[ O filme ]</p>
              <h2 className="card-title" id="film-title">
                Da órbita <span className="grad">até a porta da loja.</span>
              </h2>
              <p className="card-note">15 segundos, da Terra vista do espaço até a fachada da Dental Life DF.</p>
            </div>

            <figure className="card img-card">
              <img src="assets/p-orbita.jpg" alt="Terra vista da órbita, com o Brasil em destaque" width="720" height="900" />
              <figcaption className="bracket">[ 00:00 · órbita ]</figcaption>
            </figure>

            <div className="card phone">
              <div className="phone-bar">
                <span className="avatar"><img src="assets/dentallife-symbol.png" alt="" width="40" height="37" /></span>
                <span>Dental Life DF</span>
                <span className="kebab" aria-hidden="true">⋮</span>
              </div>
              <div className="phone-media">
                <video
                  ref={video}
                  src="assets/dentallife-film.mp4"
                  poster="assets/poster.jpg"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-label="Filme Dental Life DF: da órbita da Terra até a porta da loja em Brasília"
                />
                <button type="button" className="sound" aria-pressed={soundOn} onClick={toggleSound}>
                  {soundOn ? "Som ligado" : "Ativar som"}
                </button>
              </div>
            </div>

            <figure className="card img-card flat">
              <Dots />
              <img src="assets/p-brasilia.jpg" alt="Brasília vista do alto" width="720" height="900" />
              <figcaption className="flat-text">Do Planalto Central, direto para o consultório.</figcaption>
            </figure>

            <figure className="card img-card">
              <img src="assets/p-loja.jpg" alt="Fachada da Dental Life DF com a ponta KG na entrada" width="720" height="900" />
              <figcaption className="bracket">[ 00:12 · Dental Life DF ]</figcaption>
            </figure>

            <div className="card text-card end">
              <p className="big-bracket">[ mais que brocas, movimento ]</p>
            </div>
          </div>
        </section>

        {/* KG GARANTIA */}
        <section id="kg" className="sec" data-pose="garantia" aria-labelledby="kg-title">
          <div className="wrap kg">
            <div className="kg-copy">
              <img src="assets/kg-logo-light.png" alt="KG Sorensen · More than a brand, a stamp of warranty" width="900" height="523" className="kg-logo" />
              <h2 className="sec-title" id="kg-title">
                Mais que uma marca, <span className="grad">um selo de garantia.</span>
              </h2>
              <p className="body">O dentista reconhece a KG na bandeja. É por isso que a ponta diamantada KG sai mais rápido da prateleira da Dental Life DF.</p>
            </div>
            <figure className="kg-img" data-speed="0.5">
              <Dots />
              <img src="assets/p-garantia.jpg" alt="Dentista de máscara, campanha KG Sorensen" width="720" height="900" />
            </figure>
          </div>
        </section>

        {/* FINAL */}
        <section id="pedido" className="final" data-pose="final" aria-labelledby="final-title">
          <div className="wrap final-in">
            <PixelGlyph name="bur" size={58} />
            <p className="final-line">
              <span>Ponta diamantada KG</span>
              <i aria-hidden="true">|</i>
              <span>Dental Life DF</span>
            </p>
            <h2 className="sec-title" id="final-title">
              Hiltinho, <span className="grad">é só confirmar o pedido.</span>
            </h2>
            <div className="actions center">
              <a className="btn btn-primary" href={WA} target="_blank" rel="noopener">Confirmar pelo WhatsApp</a>
              <a className="btn" href="#condicoes">Rever condições</a>
            </div>
            <p className="wa-number">WhatsApp <span>+55 11 96415-9518</span></p>
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap foot-in">
          <div className="foot-logos">
            <img src="assets/dentallife-logo-dark.png" alt="Dental Life DF · Produtos Odontológicos" width="779" height="705" />
            <img src="assets/kg-mark-light.png" alt="KG Sorensen" width="173" height="200" className="kg" />
          </div>
          <p>
            Dental Life DF × KG Sorensen. Ponta diamantada KG: R$ 9,10 na nota, valor percebido de R$ 6,99. KG Brush: R$ 15,00, a cada 1
            ganha 1 ponta diamantada FG.
          </p>
        </div>
      </footer>
    </div>
  );
}
