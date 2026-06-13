import os

project_dir = r'C:\Users\nicol\OneDrive\Documentos\META CONSTRUTOR\META CONSTRUTOR - APP\META_CONSTRUTOR-APP_REV - 2026'
filepath = os.path.join(project_dir, 'src/content/blogArticles.ts')

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the last occurrence of '];\n\nexport const getBlogArticle'
marker = '\n];\n\nexport const getBlogArticle'
idx = content.rfind(marker)
if idx == -1:
    print('ERROR: marker not found')
    exit(1)

# Build the new article object
new_article = '''
  {
    slug: 'orcamento-de-obra-como-calcular-corretamente',
    path: '/blog/orcamento-de-obra-como-calcular-corretamente',
    title: 'Orçamento de Obra: Como Calcular Corretamente em 2026',
    seoTitle:
      'Orçamento de Obra: Como Calcular Corretamente em 2026 | Meta Construtor',
    description:
      'Aprenda como calcular orçamento de obra corretamente em 2026: composição de custos, BDI, encargos sociais, planilha SINAPI e dicas para evitar estouro de orçamento na construção civil.',
    category: 'Orçamento',
    intent:
      'Busca informacional de engenheiros civis, construtores, arquitetos e profissionais da construção civil que querem aprender a calcular orçamento de obra com precisão, evitando erros comuns e estouro de custos no canteiro.',
    readingTime: '12 min',
    summary:
      'Calcular o orçamento de obra corretamente é uma habilidade essencial para qualquer profissional da construção civil. Um orçamento mal feito pode gerar prejuízos de até 30% do valor da obra. Este artigo apresenta o passo a passo completo para calcular o orçamento de obra em 2026: desde a composição de custos diretos e indiretos, passando pelo cálculo do BDI, encargos sociais, referências SINAPI e CUB, até as ferramentas digitais que ajudam a evitar erros. Inclui tabela comparativa de métodos orçamentários, checklist de verificação e dicas práticas para construtoras de pequeno e médio porte.',
    publishedAt: '2026-06-12',
    updatedAt: '2026-06-12',
    keywords: [
      'como calcular orçamento de obra',
      'orçamento de obra passo a passo',
      'BDI construção civil',
      'composição de custos obra',
      'SINAPI 2026',
      'custo m2 construção 2026',
      'planilha orçamentária obra',
      'encargos sociais construção civil',
    ],
    takeaways: [
      'O orçamento de obra bem calculado começa com a discriminação correta de todos os custos diretos (materiais, mão de obra, equipamentos) e indiretos (administração, mobilização, despesas financeiras).',
      'O BDI (Bonificação e Despesas Indiretas) deve ser calculado caso a caso e varia de 20% a 30% dependendo do porte da obra, prazo e riscos envolvidos.',
      'Encargos sociais na construção civil representam entre 70% e 120% sobre o salário base, dependendo do regime de contratação e convenção coletiva.',
      'Usar referências como SINAPI e CUB ajuda a validar o orçamento, mas nunca substitui a composição de custos real da sua obra.',
      'Ferramentas digitais de gestão de obras reduzem em até 40% os erros de orçamento ao integrar composição de custos, medição e faturamento em uma única plataforma.',
    ],
    sections: [
      {
        title: 'O que é o orçamento de obra e por que ele é importante',
        body: 'O orçamento de obra é a estimativa detalhada de todos os custos necessários para executar uma construção, reforma ou ampliação dentro de um prazo e especificações determinados. Ele vai muito além de uma simples planilha de "quanto custa construir": é a ferramenta que define se a obra é viável financeiramente, qual o preço de venda ideal, quanto de lucro pode ser obtido e onde estão os riscos de estouro. Um orçamento bem feito permite à construtora tomar decisões informadas sobre alocação de recursos, negociação com fornecedores, cronograma de desembolsos e margem de contribuição. Na prática, construtoras que investem tempo na elaboração do orçamento reduzem em até 25% o risco de prejuízo em obras de médio porte. Já um orçamento mal calculado — com itens esquecidos, quantitativos errados ou BDI inadequado — é a principal causa de obras deficitárias, independentemente da eficiência da execução.',
        image: {
          src: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&q=80',
          alt: 'Planilha de orçamento de obra com calculadora e gráficos financeiros sobre mesa',
          caption: 'O orçamento de obra bem elaborado é a diferença entre lucro e prejuízo na construção civil',
          credit: 'Unsplash',
        },
      },
      {
        title: 'Etapa 1: Levantamento de quantitativos',
        body: 'O levantamento de quantitativos é a base do orçamento de obra. Sem ele, qualquer estimativa de custo é apenas um chute. Esta etapa consiste em medir todos os serviços necessários para executar a obra a partir dos projetos executivos — arquitetônico, estrutural, instalações, fundações e complementares. É aqui que se define, por exemplo, quantos metros cúbicos de concreto serão necessários, quantos metros quadrados de alvenaria, quantos metros lineares de tubulação, quantas portas e janelas. O ideal é que o levantamento seja feito por um profissional experiente, de preferência utilizando softwares de BIM (Building Information Modeling) que automatizam parte do processo e reduzem erros de medição. Um erro comum nesta etapa é não considerar perdas e desperdícios: para cada material, é preciso adicionar uma taxa de perda que varia de 3% (concreto usinado) a 15% (revestimentos cerâmicos).',
        items: [
          'Listar todos os serviços da obra com base nos projetos executivos, do movimento de terra aos acabamentos.',
          'Calcular quantitativos físicos: m³ de concreto, m² de alvenaria, kg de aço, m de tubulação, unidades de esquadrias.',
          'Adicionar taxas de perda por material: 3-5% para concreto e aço, 8-10% para argamassa, 10-15% para cerâmica e revestimentos.',
          'Separar os quantitativos por etapa da obra para facilitar o planejamento de compras e o fluxo de caixa.',
        ],
      },
      {
        title: 'Etapa 2: Composição de custos diretos',
        body: 'Os custos diretos são aqueles diretamente aplicados à execução da obra: materiais, mão de obra e equipamentos. Cada serviço levantado na etapa anterior precisa ser "composto" — ou seja, detalhado em seus insumos básicos com preços atualizados. Por exemplo, para "executar 1 m² de alvenaria de blocos cerâmicos", a composição inclui: blocos, argamassa de assentamento, pedreiro, servente, colher de pedreiro, nível, prumo e outros. Cada insumo tem seu consumo unitário (ex: 13 blocos/m²) e seu custo unitário (R$ 1,50/bloco). A soma de todos os insumos vezes seus consumos gera o custo unitário do serviço. Para materiais, os preços devem ser obtidos com fornecedores locais (não usar preço nacional como regra). Para mão de obra, considerar o salário base da categoria mais encargos sociais e benefícios. Esta etapa consome tempo, mas é o que diferencia um orçamento preciso de uma estimativa genérica.',
      },
      {
        title: 'Etapa 3: Custos indiretos e administração central',
        body: 'Os custos indiretos são aqueles que não podem ser atribuídos diretamente a um serviço específico, mas são necessários para a execução da obra como um todo. Incluem: equipe técnica de apoio (engenheiro, mestre de obras, almoxarife), aluguel de escritório e barracão, vigilância, limpeza, seguros, instalações provisórias (água, luz, telefone), fretes, EPIs, exames admissionais e equipamentos de proteção coletiva. Além disso, existe a administração central da construtora: salário dos diretores, aluguel da sede, contabilidade, departamento jurídico, marketing e despesas corporativas. Esses custos são rateados entre as obras em andamento, geralmente como um percentual sobre o custo direto total. Uma construtora com 3 obras simultâneas pode ratear 5-8% de administração central; uma com 1 obra apenas pode precisar de 12-15%. É comum que orçamentistas inexperientes subestimem os custos indiretos, o que leva a orçamentos apertados e margens negativas ao final da obra.',
        items: [
          'Custos indiretos de obra: equipe técnica de apoio, barracão, instalações provisórias, vigilância, EPIs, seguros, fretes e limpeza.',
          'Administração central: rateio das despesas corporativas (sede, direção, contabilidade, jurídico, marketing) entre as obras ativas.',
          'Despesas financeiras: custo do capital de giro durante a obra, taxas bancárias, garantias e seguros de performance.',
          'Imprevistos e contingências: reserva técnica de 3-5% sobre o custo total para cobrir eventos não previstos no orçamento.',
        ],
      },
      {
        title: 'Etapa 4: Cálculo do BDI',
        body: 'O BDI (Bonificação e Despesas Indiretas) é o percentual aplicado sobre o custo total da obra (diretos + indiretos) para cobrir o lucro da construtora, os tributos sobre o faturamento, as despesas financeiras, os riscos e a administração central. Não existe um BDI padrão: ele depende do porte da obra, prazo, complexidade, localização, garantias exigidas e condições de pagamento. A fórmula mais usada é: BDI = [(1 + taxa de administração central) × (1 + taxa de risco) × (1 + taxa de despesas financeiras)] / [(1 - tributos sobre faturamento) × (1 - margem de lucro)] - 1. Na prática, para obras de médio porte na iniciativa privada, o BDI costuma ficar entre 22% e 30%. Para obras públicas licitadas, a faixa é mais apertada: 18% a 25%. Um erro frequente é usar o BDI de uma obra como referência para outra — cada projeto tem seu próprio perfil de risco e precisa de cálculo individualizado.',
        image: {
          src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80',
          alt: 'Gráfico financeiro e planilha com cálculos de BDI para orçamento de obra',
          caption: 'O cálculo correto do BDI é essencial para garantir a margem de lucro da construtora sem perder competitividade',
          credit: 'Unsplash',
        },
      },
      {
        title: 'Tabela comparativa: métodos de orçamentação na construção civil',
        body: '',
        items: [
          'Estimativa paramétrica: usa índices como R$/m² ou R$/unidade. Precisão baixa (±25%). Ideal para estudos de viabilidade. Fonte: CUB, SINAPI.',
          'Orçamento sintético (ou por analogia): usa dados de obras similares ajustados por índice. Precisão média (±15%). Fonte: banco de dados interno da construtora.',
          'Orçamento analítico (discriminado): detalha todos os serviços com composições unitárias. Precisão alta (±5%). Fonte: SINAPI, TCPO, cotação com fornecedores.',
          'Orçamento BIM: integra modelo 3D com quantitativos automáticos e composições. Precisão alta (±3%). Exige softwares específicos (Revit, Navisworks, OrçaBIM).',
        ],
      },
      {
        title: 'Etapa 5: Encargos sociais e trabalhistas',
        body: 'Os encargos sociais na construção civil são um dos itens que mais geram dúvidas e erros no orçamento. Eles incluem: INSS (20% sobre a folha), FGTS (8%), SESI/SENAI/INCRA/Salário Educação/SEBRAE (soma ~5,8%), 13º salário, férias + 1/3, aviso prévio, multa do FGTS por dispensa sem justa causa, e outros. A taxa total de encargos sociais varia conforme o regime de contratação: para empregados horistas com convenção coletiva, os encargos podem chegar a 110-120% sobre o salário base. Para mensalistas, ficam entre 80-95%. Já na contratação de empreiteiras (terceirização de serviços), a construtora paga um valor fechado por serviço e não precisa calcular encargos individualmente. A forma mais segura de calcular encargos é usando a planilha oficial do SINAPI (disponível no site da Caixa), que discrimina todos os percentuais mês a mês e serve como referência para obras públicas e privadas.',
      },
      {
        title: 'Ferramentas para fazer orçamento de obra em 2026',
        body: 'Fazer orçamento de obra na mão, com calculadora e planilha física, é não só ineficiente como arriscado. Em 2026, existem diversas ferramentas que automatizam e integram o processo orçamentário. O SINAPI (Caixa) e o TCPO (Pini) fornecem composições de custo atualizadas mensalmente e servem como base de referência. Softwares como OrçaFascio, Volare, Presto e Sienge permitem criar composições, calcular BDI, gerar cronograma físico-financeiro e emitir relatórios profissionais. Para construtoras de pequeno porte, o Meta Construtor oferece uma plataforma integrada que conecta o orçamento à execução: os custos planejados são comparados com os custos reais acompanhados via RDO e medição, permitindo ajustes em tempo real. Independentemente da ferramenta escolhida, o princípio é o mesmo: quanto mais detalhado for o orçamento, menor a chance de surpresas durante a obra.',
        items: [
          'SINAPI e TCPO: referências oficiais de composições de custo para obras públicas e privadas.',
          'OrçaFascio, Volare, Presto, Sienge: softwares especializados para orçamento, BDI e gestão.',
          'Meta Construtor: plataforma integrada que conecta orçamento, RDO e medição para controle em tempo real dos custos da obra.',
        ],
      },
    ],
    faq: [
      {
        question: 'Qual a diferença entre orçamento, proposta e planejamento financeiro?',
        answer:
          'Orçamento é a estimativa de custos da obra. Proposta é o preço oferecido ao cliente. Planejamento financeiro é o fluxo de caixa entre recebimentos e pagamentos ao longo da obra.',
      },
      {
        question: 'Como calcular o BDI de uma obra corretamente?',
        answer:
          'Use a fórmula BDI = [(1+AC)(1+R)(1+DF)] / [(1-T)(1-L)] - 1, onde AC=adm. central, R=risco, DF=despesas financeiras, T=tributos, L=lucro. Para obras privadas de médio porte, o BDI fica entre 22% e 30%.',
      },
      {
        question: 'Devo usar SINAPI ou CUB como referência de custos?',
        answer:
          'Ambos. O CUB serve para estimativas rápidas e viabilidade (R$/m²). O SINAPI fornece composições detalhadas para orçamentos analíticos. Idealmente, use os dois para validar o resultado.',
      },
      {
        question: 'O que fazer quando o orçamento fica acima do valor que o cliente quer pagar?',
        answer:
          'Revise especificações técnicas, negocie com fornecedores, otimize o projeto sem comprometer qualidade ou segurança, e apresente cenários alternativos com diferentes níveis de acabamento.',
      },
      {
        question: 'Como controlar o orçamento durante a execução da obra?',
        answer:
          'Use RDO e medições periódicas para comparar custo real vs. planejado. Acompanhe indicadores como avanço físico, consumo de materiais e produtividade da mão de obra semanalmente.',
      },
      {
        question: 'Quanto tempo leva para fazer um orçamento analítico completo?',
        answer:
          'Uma obra residencial de 200 m² leva de 3 a 7 dias úteis para um orçamentista experiente. Obras comerciais ou com projetos complexos podem levar de 2 a 4 semanas.',
      },
    ],
    cta: {
      title: 'Faça orçamentos de obra precisos com o Meta Construtor',
      description:
        'O Meta Construtor ajuda construtoras de pequeno e médio porte a criar, acompanhar e controlar orçamentos de obra com integração direta ao RDO e à medição de serviços. Reduza erros de orçamento, compare custo planejado vs. real e garanta a margem de lucro da sua obra. Experimente grátis por 7 dias sem cartão de crédito.',
      label: 'Experimentar grátis',
      href: '/preco?utm_source=blog&utm_medium=artigo&utm_campaign=orcamento-de-obra-como-calcular-corretamente&utm_content=cta-final',
    },
  },'''.lstrip('\n')

# Insert before the '];'
before = content[:idx+1]  # includes the newline before '];'
after = content[idx+1:]   # starts with '];'
new_content = before + new_article + after

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f'SUCCESS: Article inserted. Old size: {len(content)}, New size: {len(new_content)}')
print(f'Added {len(new_content) - len(content)} chars')
