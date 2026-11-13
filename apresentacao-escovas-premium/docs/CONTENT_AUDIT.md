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
| Infográfico | "Doce de golaba" | "Doce de goiaba tradicional de Minas Gerais" | Erro de digitação |
| Pedido do usuário | Mostrar que é "tão bom quanto" o concorrente | "Escova premium de 5.460 cerdas por menos da metade do preço de referência" + nota de que a comparação é de preço | O briefing veta afirmar equivalência técnica sem ficha técnica; pode ser ajustado quando houver especificação |

## Decisões de conteúdo

- Os três públicos da rede (9 mi, 25 mil, 50 mil) aparecem separados, com nota de que não se somam.
- 25.000 dentistas não são tratados como 25.000 consultórios cadastrados.
- A recepção não recebe função de venda, meta, comissão ou obrigação.
- O brinde é apresentado como "doce de goiaba tradicional de Minas Gerais", sem a alegação de "patrimônio cultural imaterial" e sem afirmação de eficácia comercial.
- "Tecnologia alemã" vem acompanhada da nota de que não significa fabricação na Alemanha.
- A comparação com R$ 44,00 é identificada como referência atribuída à Curaprox no briefing, sem pesquisa de preço atual.
- Comissão: R$ 1,246 exato, exibido como "aprox. R$ 1,25"; regra de pagamento e divisão a confirmar.
- Nenhum CTA de aprovação, assinatura ou envio de dados.

## Pendências (capítulo 09)

Especificações da escova; aprovação das marcas; desenho e capacidade do expositor; financiamento e aquisição do kit; adesão, logística, instalação e reposição; regra da comissão e itens bonificados; bases e premissas de alcance.

## Divergências registradas

- Aplicação das marcas: o briefing fala em "faces distintas"; o render enviado pelo usuário mostra os dois adesivos na face frontal. A cena 3D segue o render do usuário (Odontoprev à esquerda, Dental Partner à direita, na frente).
- Fonte: o briefing pede SF Pro com OTFs anexados, mas os arquivos não foram recebidos. A pilha usa a SF Pro do sistema nos aparelhos Apple e Zalando Sans (OFL) nos demais.
