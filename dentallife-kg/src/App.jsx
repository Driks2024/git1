import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import Lenis from "lenis";
import { live, measureAnchors } from "./pose.js";
import Scene from "./Scene.jsx";

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);

const WA =
  "https://wa.me/?text=" +
  encodeURIComponent("Olá! Sou o Hiltinho, balconista da Dental Life DF, e quero entrar na Campanha Balcão KG.");

function Corners() {
  return (
    <>
      <i className="c tl" aria-hidden="true" />
      <i className="c tr" aria-hidden="true" />
      <i className="c bl" aria-hidden="true" />
      <i className="c br" aria-hidden="true" />
    </>
  );
}

function HeroWord() {
  // Spaced title, HUD style: letters spread across the frame with short tick separators.
  const letters = "HILTINHO".split("");
  return (
    <h1 className="hero-word" aria-label="Hiltinho">
      {letters.map((ch, i) => (
        <span className="hw-slot" key={i} aria-hidden="true">
          <span className="hw-ch">{ch}</span>
          {(i === 1 || i === 4) && <span className="hw-tick" />}
        </span>
      ))}
    </h1>
  );
}

export default function App() {
  const root = useRef(null);
  const pct = useRef(null);
  const [soundOn, setSoundOn] = useState(false);
  const video = useRef(null);

  useLayoutEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    live.reduced = reduced;

    let lenis;
    if (!reduced) {
      lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
      lenis.on("scroll", (e) => {
        live.velocity = e.velocity;
        ScrollTrigger.update();
      });
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    const ctx = gsap.context(() => {
      // progress readout in the HUD
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (st) => {
          if (pct.current) pct.current.textContent = String(Math.round(st.progress * 100)).padStart(3, "0");
        },
      });

      if (reduced) return;

      // hero intro
      const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
      intro
        .from(".hw-ch", { yPercent: 60, opacity: 0.15, duration: 1.4, stagger: 0.06 })
        .from(".hero .rule", { scaleX: 0, transformOrigin: "left center", duration: 1.2, stagger: 0.1 }, 0.2)
        .from(".hero-base > *", { y: 24, duration: 1, stagger: 0.08 }, 0.35);

      // hero exit: letters drift apart, layers move at different speeds
      gsap.to(".hw-slot", {
        x: (i, _el, arr) => (i - (arr.length - 1) / 2) * 34,
        opacity: 0.12,
        ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
      });

      // parallax layers
      gsap.utils.toArray("[data-speed]").forEach((el) => {
        const s = parseFloat(el.dataset.speed);
        gsap.fromTo(
          el,
          { y: () => -s * 60 },
          { y: () => s * 60, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true } }
        );
      });
      gsap.utils.toArray("[data-inner-parallax]").forEach((img) => {
        gsap.fromTo(img, { yPercent: -9 }, { yPercent: 9, ease: "none", scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
      });

      // section titles: lines rise in
      gsap.utils.toArray(".sec-title").forEach((el) => {
        const split = new SplitText(el, { type: "lines", mask: "lines" });
        gsap.from(split.lines, {
          yPercent: 100,
          duration: 1.1,
          ease: "expo.out",
          stagger: 0.08,
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      });

      // HUD labels decode
      gsap.utils.toArray("[data-scramble]").forEach((el) => {
        const text = el.textContent;
        gsap.to(el, {
          scrambleText: { text, chars: "01<>/\\|#_+-", speed: 0.5 },
          duration: 1.2,
          scrollTrigger: { trigger: el, start: "top 92%", once: true },
        });
      });

      // panels slide in, rules draw
      gsap.utils.toArray("[data-reveal]").forEach((el) => {
        gsap.from(el, { y: 70, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 92%" } });
      });
      gsap.utils.toArray(".rule.draw").forEach((el) => {
        gsap.from(el, { scaleX: 0, transformOrigin: "left center", duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 92%" } });
      });

      // price counters
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

      // marquee
      gsap.to(".marquee-track", { xPercent: -50, duration: 40, ease: "none", repeat: -1 });

      // video frame scan line
      gsap.to(".scan", { yPercent: 2400, duration: 3.2, ease: "none", repeat: -1 });
    }, root);

    const refresh = () => measureAnchors();
    ScrollTrigger.addEventListener("refresh", refresh);
    measureAnchors();
    const onResize = () => measureAnchors();
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(() => ScrollTrigger.refresh());
    ro.observe(document.body);

    return () => {
      ctx.revert();
      lenis?.destroy();
      ro.disconnect();
      window.removeEventListener("resize", onResize);
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
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: live.reduced ? "auto" : "smooth" });
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
      <div className="webgl-wrap" aria-hidden="true">
        <Scene />
      </div>
      <div className="grain" aria-hidden="true" />

      {/* fixed HUD chrome */}
      <div className="hud" aria-hidden="true">
        <Corners />
        <div className="hud-rail left">
          {Array.from({ length: 24 }, (_, i) => <span key={i} className={i % 6 === 0 ? "long" : ""} />)}
        </div>
        <div className="hud-bl mono">15°47′S 47°52′O · Brasília/DF</div>
        <div className="hud-br mono">
          Scroll <span ref={pct}>000</span>% · <span className="blink">●</span> Rec
        </div>
      </div>

      <header className="top">
        <a href="#topo" className="brand" aria-label="Dental Life DF × KG Sorensen, voltar ao topo">
          <img src="assets/dentallife-symbol.png" alt="" width="40" height="37" />
          <span className="mono brand-name">Dental Life DF</span>
          <span className="mono x">×</span>
          <img src="assets/kg-mark-light.png" alt="" width="30" height="35" />
        </a>
        <nav aria-label="Seções">
          <a href="#protocolo" className="mono">01 Protocolo</a>
          <a href="#campanha" className="mono">02 Campanha</a>
          <a href="#condicoes" className="mono">03 Condições</a>
          <a href="#entrar" className="btn btn-primary">Entrar na campanha</a>
        </nav>
      </header>

      <main id="topo">
        {/* HERO */}
        <section className="hero" data-pose="hero" aria-labelledby="hero-tag">
          <HeroWord />

          <div className="hero-foot">
            <div className="hero-side left" data-speed="0.5">
              <p className="mono label">Dossiê · campanha balcão kg</p>
              <dl className="dossier">
                <div><dt className="mono">Agente</dt><dd>Hiltinho</dd></div>
                <div><dt className="mono">Função</dt><dd>Balconista</dd></div>
                <div><dt className="mono">Base</dt><dd>Dental Life DF · Nº 45</dd></div>
                <div><dt className="mono">Status</dt><dd className="on">Campanha ativa</dd></div>
              </dl>
              <span className="rule" />
            </div>
            <div className="hero-base">
              <p className="mono label">Campanha de balcão · Dental Life DF × KG Sorensen</p>
              <p className="hero-tag" id="hero-tag">
                Mais que brocas, <em>movimento.</em>
              </p>
              <div className="actions">
                <a href="#campanha" className="btn btn-primary">Ver a campanha</a>
                <a href="#protocolo" className="btn">Como funciona</a>
              </div>
            </div>
            <div className="hero-side right" data-speed="1.2">
              <p className="mono label">Ponta diamantada KG</p>
              <dl className="dossier">
                <div><dt className="mono">Na nota</dt><dd className="num">R$ 9,10</dd></div>
                <div><dt className="mono">Valor percebido</dt><dd className="num on">R$ 6,99</dd></div>
                <div><dt className="mono">KG Brush</dt><dd className="num">R$ 15,00 · +1 FG</dd></div>
              </dl>
              <span className="rule" />
            </div>
          </div>
          <div className="scroll-cue mono" aria-hidden="true">Role <span>↓</span></div>
        </section>

        <div className="marquee" aria-hidden="true">
          <div className="marquee-track">
            {[0, 1].map((k) => (
              <span key={k}>
                <b>Ponta diamantada KG</b> na nota R$ 9,10 <i>◆</i> valor percebido <b>R$ 6,99</b> <i>◆</i> KG Brush <b>R$ 15,00</b> <i>◆</i> a cada 1, ganha <b>1 ponta diamantada FG</b> <i>◆</i> Hiltinho no balcão <i>◆</i>{" "}
              </span>
            ))}
          </div>
        </div>

        {/* PROTOCOLO */}
        <section id="protocolo" className="sec" data-pose="protocolo" aria-labelledby="proto-title">
          <div className="wrap">
            <div className="sec-head">
              <p className="mono label" data-scramble>Protocolo · 3 movimentos</p>
              <h2 className="sec-title" id="proto-title">
                Cada venda no balcão <em>gira a roda inteira.</em>
              </h2>
            </div>
            <ol className="steps">
              <li className="panel" data-reveal>
                <Corners />
                <div className="panel-bar mono"><span>MOV-01</span><span>Balcão</span></div>
                <span className="step-n">01</span>
                <h3>Você vende</h3>
                <p>Hiltinho oferece KG em cada atendimento de balcão: pontas diamantadas e KG Brush.</p>
              </li>
              <li className="panel" data-reveal>
                <Corners />
                <div className="panel-bar mono"><span>MOV-02</span><span>Dental Life DF</span></div>
                <span className="step-n">02</span>
                <h3>A Dental Life paga o incentivo</h3>
                <p>Cada unidade vendida no balcão vira incentivo, pago pela Dental Life direto para o Hiltinho.</p>
              </li>
              <li className="panel" data-reveal>
                <Corners />
                <div className="panel-bar mono"><span>MOV-03</span><span>KG Sorensen</span></div>
                <span className="step-n">03</span>
                <h3>A KG bonifica a Dental Life</h3>
                <p>A KG devolve à loja em bonificação. Por isso a ponta de R$ 9,10 na nota chega a R$ 6,99 de valor percebido.</p>
              </li>
            </ol>
            <p className="flow mono" aria-hidden="true">
              Hiltinho <i>→</i> Dental Life <i>→</i> KG Sorensen <i>↺</i> Dental Life
            </p>
          </div>
        </section>

        {/* CAMPANHA */}
        <section id="campanha" className="sec" data-pose="campanha" aria-labelledby="camp-title">
          <div className="wrap camp">
            <figure className="target" data-speed="0.4">
              <Corners />
              <div className="target-img">
                <img src="assets/mascote-loja.jpg" alt="Fachada da Dental Life DF com a ponta KG acenando na entrada" width="720" height="900" data-inner-parallax />
              </div>
              <span className="reticle" aria-hidden="true" />
              <figcaption className="mono">Base de operação · Dental Life DF · Nº 45</figcaption>
            </figure>

            <div className="camp-copy">
              <p className="mono label" data-scramble>Campanha balcão KG · agente Hiltinho</p>
              <h2 className="sec-title" id="camp-title">
                Hiltinho, <em>o balcão é seu.</em>
              </h2>
              <p className="body">
                Esta campanha é de quem atende o dentista todo dia no balcão da Dental Life. Cada ponta diamantada KG e cada KG Brush
                que sai pelas suas mãos vira incentivo, e a loja ainda é bonificada pela KG.
              </p>

              <ul className="missions">
                <li data-reveal>
                  <span className="mono m-id">M-01</span>
                  <div>
                    <h3>Comece pela KG</h3>
                    <p>Pediram ponta diamantada? A primeira oferta do balcão é KG.</p>
                  </div>
                </li>
                <li data-reveal>
                  <span className="mono m-id">M-02</span>
                  <div>
                    <h3>Apresente o KG Brush</h3>
                    <p>R$ 15,00, e a cada 1 KG Brush, ganha 1 ponta diamantada FG.</p>
                  </div>
                </li>
                <li data-reveal>
                  <span className="mono m-id">M-03</span>
                  <div>
                    <h3>Cada unidade conta</h3>
                    <p>Toda ponta KG e todo KG Brush vendidos no balcão entram no seu incentivo.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* FILME */}
        <section className="sec" data-pose="filme" aria-labelledby="film-title">
          <div className="wrap film-grid">
            <div className="film-copy">
              <p className="mono label" data-scramble>Transmissão · 00:15</p>
              <h2 className="sec-title" id="film-title">
                Da órbita <em>até o balcão.</em>
              </h2>
              <p className="body">
                O filme sai do espaço, encontra o Brasil, desce sobre Brasília e pousa na fachada verde da Dental Life DF, onde a
                ponta KG já está esperando o Hiltinho.
              </p>
              <ol className="timecodes">
                <li><span className="mono">00:00</span>Terra vista da órbita</li>
                <li><span className="mono">00:03</span>Brasil em destaque</li>
                <li><span className="mono">00:06</span>Descida sobre Brasília</li>
                <li><span className="mono">00:12</span>Fachada da Dental Life DF</li>
              </ol>
            </div>
            <div className="film" data-speed="0.8">
              <Corners />
              <div className="film-inner">
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
                <span className="scan" aria-hidden="true" />
                <div className="film-meta mono" aria-hidden="true">
                  <span><span className="blink">●</span> Rec</span>
                  <span>DL-DF · 1080×1920</span>
                </div>
                <button type="button" className="sound mono" aria-pressed={soundOn} onClick={toggleSound}>
                  {soundOn ? "Som ligado" : "Ativar som"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* CONDIÇÕES */}
        <section id="condicoes" className="sec" data-pose="condicoes" aria-labelledby="cond-title">
          <div className="wrap">
            <div className="sec-head">
              <p className="mono label" data-scramble>Condições · valores por unidade</p>
              <h2 className="sec-title" id="cond-title">
                Os números <em>na mesa.</em>
              </h2>
            </div>
            <div className="offers">
              <article className="panel offer" data-reveal>
                <Corners />
                <div className="panel-bar mono"><span>PNL-A</span><span>Ponta diamantada KG</span></div>
                <h3>Ponta diamantada KG</h3>
                <div className="prices">
                  <div>
                    <span className="mono label">Na nota</span>
                    <span className="price"><small>R$</small><span data-count="9.10">9,10</span></span>
                  </div>
                  <div>
                    <span className="mono label">Valor percebido</span>
                    <span className="price on"><small>R$</small><span data-count="6.99">6,99</span></span>
                  </div>
                </div>
                <div className="meter" role="img" aria-label="Valor percebido de R$ 6,99 corresponde a 76,8% do valor na nota de R$ 9,10">
                  <div className="meter-track"><span className="meter-fill" /></div>
                  <div className="meter-legend mono"><span>R$ 6,99 · 76,8%</span><span>R$ 2,11 de bonificação KG</span></div>
                </div>
                <p className="note">A Dental Life fatura a ponta a R$ 9,10. Com a bonificação KG, cada unidade fica com valor percebido de R$ 6,99.</p>
              </article>

              <article className="panel offer" data-reveal>
                <Corners />
                <div className="panel-bar mono"><span>PNL-B</span><span>KG Brush</span></div>
                <h3>KG Brush</h3>
                <div className="prices">
                  <div>
                    <span className="mono label">Valor</span>
                    <span className="price on"><small>R$</small><span data-count="15">15,00</span></span>
                  </div>
                  <div>
                    <span className="mono label">Bonificação</span>
                    <span className="price">+1</span>
                  </div>
                </div>
                <div className="combo">
                  <div className="chip"><span className="mono label">Compra</span><strong>1 KG Brush</strong></div>
                  <span className="plus" aria-hidden="true">+</span>
                  <div className="chip on"><span className="mono label">Ganha</span><strong>1 ponta diamantada FG</strong></div>
                </div>
                <p className="note">A cada 1 KG Brush, ganha 1 ponta diamantada FG. Dez escovas, dez pontas.</p>
              </article>
            </div>
          </div>
        </section>

        {/* GARANTIA */}
        <section className="sec" data-pose="garantia" aria-labelledby="kg-title">
          <div className="wrap">
            <div className="warranty panel" data-reveal>
              <Corners />
              <div className="warranty-img">
                <img src="assets/kg-garantia.jpg" alt="" width="930" height="843" data-inner-parallax />
              </div>
              <div className="warranty-copy">
                <img src="assets/kg-logo-light.png" alt="KG Sorensen · More than a brand, a stamp of warranty" width="900" height="523" className="kg-logo" />
                <h2 className="sec-title" id="kg-title">
                  Mais que uma marca, <em>um selo de garantia.</em>
                </h2>
                <p className="body">O dentista reconhece a KG na bandeja. A ponta sai da prateleira da Dental Life mais rápido, e o Hiltinho vende com argumento.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL */}
        <section id="entrar" className="sec final" data-pose="final" aria-labelledby="final-title">
          <div className="wrap">
            <p className="mono label" data-scramble>Próximo passo</p>
            <h2 className="sec-title big" id="final-title">
              Hiltinho, bora vender <em>KG no balcão?</em>
            </h2>
            <p className="body">Confirme sua entrada e a KG prepara o material de balcão e o primeiro pedido bonificado da Dental Life DF.</p>
            <div className="actions">
              <a className="btn btn-primary" href={WA} target="_blank" rel="noopener">Entrar pelo WhatsApp →</a>
              <a className="btn" href="#condicoes">Ver condições</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap foot-in">
          <div className="foot-logos">
            <img src="assets/dentallife-logo-dark.png" alt="Dental Life DF · Produtos Odontológicos" width="779" height="705" />
            <img src="assets/kg-mark-light.png" alt="KG Sorensen" width="173" height="200" className="kg" />
          </div>
          <p className="mono">
            Campanha Balcão KG · Dental Life DF × KG Sorensen. Ponta diamantada KG: R$ 9,10 na nota, valor percebido de R$ 6,99. KG
            Brush: R$ 15,00, a cada 1 ganha 1 ponta diamantada FG.
          </p>
        </div>
      </footer>
    </div>
  );
}
