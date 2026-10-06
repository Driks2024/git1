import { useState } from "react";

// Unit values of the partnership, in cents.
const PONTA_NOTA = 910;
const PONTA_PERCEBIDO = 699;
const KG_BRUSH = 1500;

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const money = (cents) => brl.format(cents / 100);
const clean = (v) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n > 0 ? Math.min(n, 5000) : 0;
};

function Qty({ id, label, hint, value, onChange, step, max }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="stepper">
        <button type="button" aria-label={`Menos ${step}`} onClick={() => onChange(clean(value - step))}>−</button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min="0"
          max="5000"
          value={value}
          onChange={(e) => onChange(clean(e.target.value))}
        />
        <button type="button" aria-label={`Mais ${step}`} onClick={() => onChange(clean(value + step))}>+</button>
      </div>
      <input
        id={`${id}-range`}
        type="range"
        min="0"
        max={max}
        step={step}
        value={Math.min(value, max)}
        aria-label={label}
        onChange={(e) => onChange(clean(e.target.value))}
      />
      <span className="hint mono">{hint}</span>
    </div>
  );
}

export default function Simulator() {
  const [pontas, setPontas] = useState(200);
  const [brush, setBrush] = useState(30);

  return (
    <form className="sim" onSubmit={(e) => e.preventDefault()} noValidate>
      <div className="panel sim-in" data-reveal>
        <i className="c tl" aria-hidden="true" />
        <i className="c br" aria-hidden="true" />
        <div className="panel-bar mono"><span>INPUT</span><span>Vendas no balcão</span></div>
        <Qty
          id="q-ponta"
          label="Pontas diamantadas KG"
          hint="R$ 9,10 na nota · R$ 6,99 valor percebido"
          value={pontas}
          onChange={setPontas}
          step={10}
          max={1000}
        />
        <Qty
          id="q-brush"
          label="KG Brush"
          hint="R$ 15,00 · cada 1 ganha 1 ponta FG"
          value={brush}
          onChange={setBrush}
          step={5}
          max={300}
        />
      </div>

      <div className="panel sim-out" data-reveal aria-live="polite">
        <i className="c tr" aria-hidden="true" />
        <i className="c bl" aria-hidden="true" />
        <div className="panel-bar mono"><span>OUTPUT</span><span>Placar</span></div>
        <div className="out-row"><span>Pontas KG · total na nota</span><output>{money(pontas * PONTA_NOTA)}</output></div>
        <div className="out-row big"><span>Pontas KG · valor percebido</span><output>{money(pontas * PONTA_PERCEBIDO)}</output></div>
        <div className="out-row"><span>Bonificação KG nas pontas</span><output>{money(pontas * (PONTA_NOTA - PONTA_PERCEBIDO))}</output></div>
        <div className="out-row"><span>KG Brush · total</span><output>{money(brush * KG_BRUSH)}</output></div>
        <div className="out-row on"><span>Pontas diamantadas FG ganhas</span><output>{brush} {brush === 1 ? "ponta" : "pontas"}</output></div>
        <p className="foot-note mono">Simulação com os valores por unidade da campanha.</p>
      </div>
    </form>
  );
}
