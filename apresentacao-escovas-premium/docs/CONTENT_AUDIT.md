# Auditoria de conteúdo

Fontes, por prioridade: `PROMPT_UNICO_CLAUDE_COWORK.md` (briefing normativo), infográfico `Proposta_Estrategica_de_Escovas_Premium.png`, imagens enviadas pelo usuário e o site de referência designbybrandin.com (apenas padrão visual). O arquivo `claude-code-threejs-landing-page_2.md` foi tratado como rascunho substituído, como o próprio briefing indica. O vídeo `Projeto_Dental_Partner.mp4` não foi recebido e não foi analisado.

Todos os números vivem em `src/content/claims.ts`, com status `fornecido`, `calculado`, `estimativa` ou `pendente-validacao`, e aparecem no diálogo "Premissas e fontes".

## Correções em relação ao material de origem

| Origem | Texto original | Na apresentação | Motivo |
|---|---|---|---|
| Infográfico | "Margem de lucro do dentista ~100%" | Markup 100,0% a 122,5%; margem sobre a venda 50,0% a 55,1% | Markup e margem são conceitos diferentes; o briefing proíbe "100% de margem" |
| Rascunho antigo | "Mais de 100% de Margem Bruta" | Removido | Idem |
| Rascunho antigo | "Padrão Cirúrgico", "35% Menor Custo de Importação", "sem agredir o tecido gengival" | Removidos | Alegações sem respaldo, vetadas pelo briefing |
| Imagens 1 milhão | "1 milhão impactados" | "1.000.000 de exposições potenciais por mês" + nota de estimativa | Não são pessoas únicas medidas |
| Infográfico | "Investimento global para 25.000 expositores instalados" | "Valor total projetado" de 25.000 kits | Distribuição não é instalação; quem financia não está definido |
| Infográfico | Ilustração com 5 escovas | 4 escovas expostas | Texto do infográfico e briefing dizem 4 |
| Infográfico | "Doce de golaba" | "Goiabada cascão em lata, de Minas Gerais" | Erro de digitação; o cliente depois informou que o brinde real é goiabada em lata |
| Correção do cliente | 12 escovas bonificadas soltas | "12 escovas fora do expositor", além das 4 no expositor | O cliente informou: display com 4 escovas e mais 12 fora do display |
| Informação do cliente | Kit como item comercial | "Presente para o dentista": expositor, 4 + 12 escovas e goiabada; R$ 258,00 por kit completo; todos os kits entregues em 5 meses | Mensagem do cliente; quem financia segue pendente |
| Informação do cliente | "Goiabada cascão em lata, de Minas Gerais" | "Goiabada cascão de Ponte Nova (MG)" no texto da página | O cliente pediu destacar a origem |
| Pedido do cliente | "A importação vai ser 35% mais barato que Curaprox" | Cartão "Custo de importação: 35% abaixo. Importação 35% mais barata que a da Curaprox.", status "Fornecido", sem nota (pedido do cliente: na apresentação, só a informação) | O briefing havia retirado "35% Menor Custo de Importação" por falta de respaldo; o cliente reafirmou duas vezes que a importação é 35% mais barata que a da Curaprox. Valores absolutos não foram informados |
| Pedido do cliente | "Patrimônio histórico e imaterial" | "Patrimônio cultural imaterial de Ponte Nova, desde 2016" na ficha da goiabada, status "Fornecido" | Fonte: reportagem do Estado de Minas (29/07/2021), que cita a Secretaria Municipal de Cultura, e a página da Doces Zélia enviada pelo cliente. O termo segue a fonte ("cultural imaterial"). As páginas não abriram nesta sessão por bloqueio de rede; a reportagem foi lida pelo resumo da busca. O número do ato segue pendente |
| Correção do cliente | Expositor genérico de acrílico | Expositor original das fotos (L inclinado, trilhos, escovas no blister) | O expositor precisa ser o original |
| Pedido do usuário | Mostrar que é "tão bom quanto" o concorrente | "Escova premium de 5.460 cerdas por menos da metade do preço de referência" + nota de que a comparação é de preço | O briefing veta afirmar equivalência técnica sem ficha técnica; pode ser ajustado quando houver especificação |

## Decisões de conteúdo

- Os três públicos da rede (9 mi, 25 mil, 50 mil) aparecem separados, com nota de que não se somam.
- 25.000 dentistas não são tratados como 25.000 consultórios cadastrados.
- A recepção não recebe função de venda, meta, comissão ou obrigação.
- A goiabada é apresentada como "goiabada cascão em lata, de Ponte Nova (MG)", uma lata por kit, sem afirmação de eficácia comercial. "Patrimônio cultural imaterial de Ponte Nova, desde 2016" aparece na ficha da goiabada, com a fonte nas premissas. Peso e fornecedor a confirmar.
- O kit inteiro é tratado como presente para o dentista; o texto não diz quem paga os kits.
- "Tecnologia alemã" vem acompanhada da nota de que não significa fabricação na Alemanha.
- A comparação com R$ 44,00 é identificada como referência atribuída à Curaprox no briefing, sem pesquisa de preço atual.
- Comissão: R$ 1,246 exato, exibido como "aprox. R$ 1,25"; regra de pagamento e divisão a confirmar.
- Nenhum CTA de aprovação, assinatura ou envio de dados.
- O texto visível não atribui dados ao cliente ("informado pelo cliente"): é uma apresentação, e a origem de cada dado fica registrada aqui e em `sourceAsset`, que não aparece na página.

## Pendências (capítulo 09)

Especificações da escova; aplicação das marcas; desenho e capacidade do expositor; financiamento do kit; adesão, logística, instalação e reposição; regra da comissão e tratamento do presente; goiabada: fornecimento e número do ato de registro; bases e premissas de alcance (8 itens).

## Divergências registradas

- Aplicação das marcas: o briefing fala em "faces distintas"; as fotos do expositor original mostram as duas marcas na faixa frontal. A cena 3D segue as fotos (Odontoprev à esquerda, Dental Partner à direita).
- Embalagem das escovas: as fotos do expositor original mostram blister com bandeira da Alemanha e a palavra "Germany". A apresentação não reproduz esses elementos, porque o briefing diz que "tecnologia alemã" não equivale a fabricação na Alemanha. Confirmar a arte final da embalagem. A foto de frente com blister (visualizador de ângulos) mostra a embalagem como ela é, com a bandeira; o texto da página não afirma fabricação na Alemanha.
- Fotos com blister (frente e 3/4): a pedido do cliente, "Germany" (que saiu "Gammy"/"Gemany") e "5460" (que saiu "S460"/"5400") foram reescritos nos 12 cartões, localmente, com `scripts/tools/retext.py`. Continuam deformados textos menores que não fazem parte da correção pedida ("Pro…ech Orales", "Gentle and h… care"); no tamanho da página quase não se leem.
- Origem: o cliente confirmou "só tecnologia alemã". O texto da página mantém "tecnologia alemã" com a ressalva de que não significa fabricação na Alemanha; a bandeira e "Germany" aparecem só nas fotos da embalagem.
- Fonte: o briefing pede SF Pro com OTFs anexados, mas os arquivos não foram recebidos. A pilha usa a SF Pro do sistema nos aparelhos Apple e Zalando Sans (OFL) nos demais.
