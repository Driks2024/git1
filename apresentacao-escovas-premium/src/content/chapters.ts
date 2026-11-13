export type Chapter = {
  id: string;
  number: string;
  title: string;
  short: string;
};

export const chapters: Chapter[] = [
  { id: 'abertura', number: '01', title: 'Projeto Escovas Premium', short: 'Abertura' },
  { id: 'rede', number: '02', title: 'A rede considerada', short: 'Rede' },
  { id: 'produto', number: '03', title: 'O produto em detalhe', short: 'Produto' },
  { id: 'kit', number: '04', title: 'O kit expositor', short: 'Kit' },
  { id: 'ativacao', number: '05', title: 'Ativação no consultório', short: 'Ativação' },
  { id: 'economia', number: '06', title: 'Economia unitária', short: 'Economia' },
  { id: 'implantacao', number: '07', title: 'Implantação em 5 meses', short: 'Implantação' },
  { id: 'alcance', number: '08', title: 'Alcance potencial', short: 'Alcance' },
  { id: 'condicoes', number: '09', title: 'Condições para execução', short: 'Condições' },
  { id: 'encerramento', number: '10', title: 'Encerramento', short: 'Encerramento' },
];
