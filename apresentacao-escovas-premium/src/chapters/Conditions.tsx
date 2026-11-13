import { Accordion } from '../components/Accordion';
import { ArrowButton } from '../components/ArrowButton';
import { Reveal } from '../components/Reveal';
import { Scramble } from '../components/Scramble';

const ITEMS = [
  {
    id: 'escova',
    title: 'Especificações da escova',
    body: 'Ficha técnica com cerdas, materiais, medidas, cores e embalagem, para confirmar o que hoje está descrito no briefing.',
  },
  {
    id: 'marcas',
    title: 'Aplicação das marcas',
    body: 'Aprovação pela Odontoprev e pela Dental Partner do uso das marcas no expositor, nas escovas e nos materiais.',
  },
  {
    id: 'expositor',
    title: 'Desenho e capacidade do expositor',
    body: 'Medidas, espessura do acrílico, método de gravação e capacidade definitivos do display de balcão.',
  },
  {
    id: 'financiamento',
    title: 'Financiamento e aquisição do kit',
    body: 'Quem financia os R$ 6,45 milhões projetados, a forma de pagamento e a aquisição do kit pelos consultórios.',
  },
  {
    id: 'logistica',
    title: 'Adesão, logística, instalação e reposição',
    body: 'Adesão dos consultórios, expedição, recebimento, instalação no balcão e reposição das escovas bonificadas.',
  },
  {
    id: 'comissao',
    title: 'Regra da comissão e itens bonificados',
    body: 'Base, incidência e forma de pagamento dos 14%, e o tratamento comercial das 12 escovas bonificadas.',
  },
  {
    id: 'premissas',
    title: 'Bases e premissas de alcance',
    body: 'Confirmação dos 9 milhões de vidas, 25.000 dentistas, 50.000 secretárias, 10 pacientes por mês e 3 dependentes.',
  },
];

export function Conditions({ onOpenPremises }: { onOpenPremises: () => void }) {
  return (
    <section id="condicoes" className="chapter sec-dark conditions" data-header="dark" aria-labelledby="t-condicoes">
      <div className="wrap conditions__grid">
        <div className="conditions__left">
          <div className="conditions__sticky">
            <p className="t-label">Condições para execução</p>
            <Scramble as="p" className="t-tag" text="7 VALIDAÇÕES PENDENTES" />
            <Reveal as="h2" className="t-h2" text="O que precisa de confirmação antes de executar" />
            <span id="t-condicoes" hidden>
              Condições para execução
            </span>
            <p className="t-body">
              A proposta está pronta para discussão. Estes pontos dependem das áreas responsáveis e não são compromissos
              assumidos.
            </p>
            <ArrowButton onClick={onOpenPremises}>Abrir premissas</ArrowButton>
          </div>
        </div>
        <div className="conditions__list">
          <Accordion items={ITEMS.map((i) => ({ id: i.id, title: i.title, body: <p>{i.body}</p> }))} />
        </div>
      </div>
    </section>
  );
}
