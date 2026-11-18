import { useState } from 'react';
import {
  COMMISSION_RATE_PERCENT,
  PURCHASE_COST_CENTS,
  REFERENCE_PRICE_CENTS,
  RESALE_OPTIONS_CENTS,
  commissionExactCents,
  unitEconomics,
  type ResaleCents,
} from '../domain/economics';
import { formatBRL, formatPercent } from '../domain/money';
import { Reveal } from '../components/Reveal';
import { Scramble } from '../components/Scramble';
import { LineDraw } from '../components/ScrollBits';

/**
 * Capítulo de dados: sem parallax, contadores ou desfoque em preços. Os
 * valores vêm de funções puras testadas (src/domain).
 */
export function Economics() {
  const [sale, setSale] = useState<ResaleCents>(1980);
  const e = unitEconomics(sale);
  const low = unitEconomics(1780);
  const high = unitEconomics(1980);
  const commission = commissionExactCents(PURCHASE_COST_CENTS, COMMISSION_RATE_PERCENT);

  const rows = [
    { k: 'Compra pelo dentista', v: formatBRL(e.costCents), f: 'Premissa fornecida, por escova' },
    { k: 'Preço de revenda', v: formatBRL(e.saleCents), f: 'Faixa proposta: R$ 17,80 a R$ 19,80' },
    { k: 'Diferença bruta por escova', v: formatBRL(e.grossCents), f: 'venda − compra' },
    { k: 'Markup', v: formatPercent(e.markup), f: '(venda − compra) ÷ compra' },
    { k: 'Margem sobre a venda', v: formatPercent(e.margin), f: '(venda − compra) ÷ venda' },
  ];

  return (
    <section id="economia" className="chapter sec-financial" data-header="dark" aria-labelledby="t-economia">
      <div className="wrap sec-head">
        <div className="sec-head__label">
          <p className="t-label">Economia unitária</p>
          <Scramble as="p" className="t-tag" text="POR ESCOVA, ANTES DE IMPOSTOS" />
        </div>
        <div>
          <Reveal as="h2" className="t-h2" text="R$ 8,90 na compra. Até R$ 19,80 na revenda." />
          <span id="t-economia" hidden>
            Economia unitária
          </span>
        </div>
      </div>

      <div className="wrap econ">
        <div className="econ__controls" role="radiogroup" aria-label="Preço de revenda simulado">
          {RESALE_OPTIONS_CENTS.map((c) => (
            <button key={c} type="button" role="radio" aria-checked={sale === c} className="seg" onClick={() => setSale(c)}>
              Revenda a {formatBRL(c)}
            </button>
          ))}
        </div>

        <div className="ledger" role="table" aria-label={`Economia por escova com revenda a ${formatBRL(sale)}`}>
          {rows.map((r) => (
            <div className="ledger__row" role="row" key={r.k}>
              <span role="cell" className="ledger__k">
                {r.k}
              </span>
              <span role="cell" className="ledger__v num">
                {r.v}
              </span>
              <span role="cell" className="ledger__f">
                {r.f}
              </span>
              <LineDraw className="row__line" />
            </div>
          ))}
        </div>
        <p className="t-note">
          Cálculos antes de impostos, taxas e outras despesas. Diferença bruta não é lucro líquido.
        </p>

        <div className="econ__grid">
          <div className="econ__compare">
            <h3 className="econ__h3">Preço de referência</h3>
            <p className="econ__big num">
              {formatPercent(high.belowReference)} a {formatPercent(low.belowReference)}
              <span>abaixo da referência informada</span>
            </p>
            <p className="t-body">
              Escova premium de 5.460 cerdas por menos da metade do preço de referência de mercado informado no
              briefing.
            </p>
            <div className="bars" aria-hidden="true">
              {[
                { cls: 'bar--ref', label: `Referência informada (Curaprox): ${formatBRL(REFERENCE_PRICE_CENTS)}`, cents: REFERENCE_PRICE_CENTS },
                { cls: 'bar--ours', label: `Revenda proposta: até ${formatBRL(1980)}`, cents: 1980 },
                { cls: 'bar--ours bar--low', label: `Revenda proposta: a partir de ${formatBRL(1780)}`, cents: 1780 },
              ].map((b) => (
                <div className={`bar ${b.cls}`} key={b.label}>
                  <span className="bar__label">{b.label}</span>
                  <span className="bar__track">
                    <span className="bar__fill" style={{ width: `${(b.cents / REFERENCE_PRICE_CENTS) * 100}%` }} />
                  </span>
                </div>
              ))}
            </div>
            <p className="t-note">
              Referência atribuída à Curaprox no briefing, sem pesquisa de preço atual. A comparação é de preço;
              equivalência de desempenho depende da ficha técnica do produto.
            </p>
          </div>

          <div className="econ__side">
            <div className="econ__card">
              <h3 className="econ__h3">Custo de importação</h3>
              <p className="econ__mid num">35% abaixo</p>
              <p className="t-body">Importação 35% mais barata que a da Curaprox.</p>
            </div>
            <div className="econ__card">
              <h3 className="econ__h3">Comissão indicada</h3>
              <p className="econ__mid num">aprox. {formatBRL(commission)}</p>
              <p className="t-body">
                {COMMISSION_RATE_PERCENT}% sobre {formatBRL(PURCHASE_COST_CENTS)} por escova (R$ 1,246 antes do
                arredondamento).
              </p>
              <p className="t-note">Regra de pagamento, incidência e divisão entre as marcas a confirmar.</p>
            </div>
            <div className="econ__card">
              <h3 className="econ__h3">Os dois cenários</h3>
              <table className="mini-table">
                <thead>
                  <tr>
                    <th scope="col">Venda</th>
                    <th scope="col">Diferença</th>
                    <th scope="col">Markup</th>
                    <th scope="col">Margem</th>
                  </tr>
                </thead>
                <tbody>
                  {[low, high].map((x) => (
                    <tr key={x.saleCents} className={x.saleCents === sale ? 'is-current' : ''}>
                      <th scope="row" className="num">
                        {formatBRL(x.saleCents)}
                      </th>
                      <td className="num">{formatBRL(x.grossCents)}</td>
                      <td className="num">{formatPercent(x.markup)}</td>
                      <td className="num">{formatPercent(x.margin)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
