const fs = require('fs');
const path = 'src/content/blogArticles.ts';
let content = fs.readFileSync(path, 'utf8');

console.log('File length:', content.length);

// Find marker with CRLF
const marker = '];\r\n\r\nexport const getBlogArticle';
const idx = content.indexOf(marker);

if (idx === -1) {
  console.log('ERROR: Could not find insert marker');
  process.exit(1);
}

console.log('Found marker at index:', idx);

// Build the new article object
const article = {
  slug: 'construcao-modular-industrializada-brasil',
  path: '/blog/construcao-modular-industrializada-brasil',
  title: 'Construção Modular e Industrializada no Brasil: Vantagens e Aplicações',
  seoTitle: 'Construção Modular e Industrializada no Brasil: Vantagens | Meta Construtor',
  description: 'Saiba como a construção modular e industrializada está transformando o setor no Brasil. Conheça vantagens, tipos de sistemas, aplicações e cases reais de sucesso em 2026.',
  category: 'Gestão de obras',
  intent: 'Busca informacional de engenheiros, construtores e incorporadores interessados em entender as vantagens, os sistemas construtivos industrializados e as aplicações da construção modular no Brasil em 2026.',
  readingTime: '13 min',
  summary: 'A construção modular e industrializada vem ganhando espaço no Brasil como alternativa à alvenaria convencional. Este guia completo aborda os principais sistemas construtivos industrializados — steel frame, wood frame, painéis de concreto pré-moldado, contêineres modulares e light steel framing — com tabela comparativa de custos, prazos e vantagens de cada um. Inclui passo a passo para avaliar se a construção modular é viável para seu projeto, cases reais de sucesso no Brasil, desafios regulatórios e tendências para 2026.',
  publishedAt: '2026-06-14',
  updatedAt: '2026-06-14',
  keywords: [
    'construção modular',
    'construção industrializada',
    'steel frame construção',
    'pré-moldados concreto',
    'construção modular Brasil 2026',
    'sistemas construtivos industrializados',
    'light steel framing',
    'construção seca vantagens',
  ],
  takeaways: [
    'A construção modular reduz o prazo de obra em 30% a 50% comparado à alvenaria convencional, com menor geração de resíduos e maior previsibilidade de custos.',
    'Os principais sistemas industrializados no Brasil são steel frame, wood frame, painéis pré-moldados de concreto, contêineres modulares e light steel framing — cada um com aplicações específicas.',
    'A construção modular já responde por mais de 15% dos novos empreendimentos residenciais de médio padrão no Sudeste, com crescimento acelerado em 2026.',
    'A digitalização com RDO digital, cronograma integrado e controle de qualidade é essencial para obras modulares, pois o ritmo mais acelerado exige gestão em tempo real.',
    'O custo por m² da construção modular vem caindo e já se equipara à alvenaria convencional em obras acima de 200 m², com vantagem em prazo e previsibilidade.',
  ],
  sections: [
    {
      title: 'O que é construção modular e industrializada?',
      body: 'Construção modular e industrializada são termos que descrevem um processo construtivo onde os componentes da edificação são fabricados em ambiente fabril controlado e depois transportados ao canteiro para montagem. Diferente da construção convencional (alvenaria), onde tudo é feito no local — paredes, lajes, instalações —, a construção industrializada transfere grande parte do trabalho para a fábrica, onde há controle de qualidade, clima controlado, otimização de materiais e automação de processos. A construção modular é um subconjunto da construção industrializada: módulos tridimensionais completos (paredes, piso, teto, instalações) saem da fábrica praticamente prontos e são apenas posicionados e interligados no canteiro. Já a construção industrializada em sentido amplo inclui também sistemas como painéis pré-moldados, steel frame montado in loco e fôrmas-túnel. Em 2026, esses sistemas já representam mais de 15% das novas construções residenciais de médio padrão no Sudeste brasileiro, com crescimento anual de dois dígitos impulsionado pela demanda por prazos mais curtos e previsibilidade de custos.',
      image: {
        src: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&q=80',
        alt: 'Estrutura modular steel frame sendo montada em canteiro de obra com grua e equipe técnica',
        caption: 'Construção modular industrializada: componentes fabricados fora do canteiro e montados no local',
        credit: 'Unsplash',
      },
    },
    {
      title: 'Principais sistemas construtivos industrializados no Brasil',
      body: 'O Brasil adota diferentes sistemas construtivos industrializados, cada um com características específicas de custo, prazo, aplicação e maturidade de mercado. Conhecer as diferenças é essencial para escolher o sistema mais adequado a cada projeto. A tabela abaixo compara os principais sistemas disponíveis no mercado brasileiro em 2026:',
      image: {
        src: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=1200&q=80',
        alt: 'Diferentes sistemas construtivos industrializados lado a lado em feira da construção civil',
        caption: 'Cada sistema construtivo industrializado tem vantagens e aplicações específicas. Conheça as diferenças.',
        credit: 'Unsplash',
      },
      items: [
        'Steel Frame (Light Steel Framing): estrutura de perfis de aço galvanizado formados a frio, com fechamento em painéis OSB, placa cimentícia ou drywall. Vantagens: velocidade de montagem (2 a 3x mais rápido que alvenaria), baixo peso (cargas de fundação reduzidas em até 40%), alta precisão dimensional e excelente desempenho termoacústico. Ideal para: casas de até 3 pavimentos, sobrados, edifícios de até 5 andares com estrutura mista. Custo médio: R$ 1.800 a R$ 2.500/m² (2026). Participação de mercado no Brasil: ~8% das novas construções residenciais.',
        'Concreto Pré-Moldado / Pré-Fabricado: painéis, vigas, pilares e lajes de concreto produzidos em fábrica e montados no canteiro. Vantagens: alta resistência, durabilidade, rapidez na montagem (galpões industriais em 1-2 meses), excelente para grandes vãos e obras comerciais. Ideal para: galpões logísticos, shoppings, escolas, hospitais, edifícios corporativos. Custo médio: R$ 1.500 a R$ 2.200/m². Participação: ~12% do mercado de construções comerciais e industriais.',
        'Wood Frame (Light Wood Framing): estrutura de perfis de madeira (pinho reflorestado tratado) com fechamento em OSB e placas cimentícias. Vantagens: menor carbono embutido na construção, conforto térmico natural, custo competitivo (R$ 1.600 a R$ 2.200/m²). Ideal para: casas de alto padrão, condomínios sustentáveis, resorts. Participação: ~3% do mercado, mas crescendo acima de 20% ao ano.',
        'Contêineres Modulares: módulos de contêineres marítimos reaproveitados ou construções novas em formato modular. Vantagens: velocidade extrema (casa de 50 m² montada em 15-30 dias), sustentabilidade (reuso), flexibilidade para expansão. Ideal para: escritórios temporários, alojamentos, casas compactas, lojas pop-up. Custo médio: R$ 1.200 a R$ 1.800/m². Participação: nicho (~1%), mas com forte crescimento em 2026.',
        'Painéis de EPS (Isopor) / Isolamento Termoacústico: painéis sanduíche com núcleo de EPS e faces de concreto projetado ou placas cimentícias. Vantagens: leveza, isolamento térmico superior, montagem rápida. Ideal para: galpões, câmaras frias, entrepostos logísticos, construções temporárias. Custo médio: R$ 1.300 a R$ 1.800/m².',
      ],
    },
    {
      title: 'Vantagens da construção modular sobre a alvenaria convencional',
      body: 'A construção modular oferece benefícios significativos em comparação com a alvenaria convencional. Essas vantagens vão desde a redução do prazo de obra até a melhoria da qualidade final, passando por sustentabilidade, previsibilidade de custos e segurança do trabalho. Abaixo, as principais vantagens com dados do mercado brasileiro em 2026:',
      items: [
        'Redução de prazo: obras modulares ficam prontas 30% a 50% mais rápido. Uma casa de 150 m² em alvenaria leva de 8 a 12 meses; em steel frame, de 4 a 6 meses. Em sistemas modulares 3D (contêineres ou módulos completos), o prazo cai para 2 a 4 meses.',
        'Previsibilidade de custos: como os materiais são comprados em volume e processados em ambiente fabril, a margem de erro no orçamento cai de 15-20% (alvenaria) para 5-8% (industrializada). Isso reduz drasticamente os imprevistos financeiros e as necessidades de capital de giro adicional.',
        'Menor geração de resíduos: a construção industrializada gera de 50% a 80% menos resíduos que a alvenaria convencional. O desperdício de materiais como concreto, argamassa e blocos é praticamente eliminado no ambiente fabril, onde sobras são recicladas.',
        'Qualidade superior e padronização: componentes fabricados em linha de produção seguem normas técnicas rígidas (ABNT NBR, ISO), com controle dimensional preciso. O resultado é uma edificação com paredes perfeitamente alinhadas e acabamento superior.',
        'Melhor desempenho termoacústico: sistemas como steel frame e wood frame permitem incorporar isolamento termoacústico nas paredes (lã de vidro, lã de rocha, espuma rígida), resultando em conforto térmico e acústico superior à alvenaria convencional.',
        'Segurança do trabalho: a maior parte dos serviços é feita em fábrica em condições controladas. No canteiro, o trabalho se concentra em montagem, reduzindo acidentes típicos de obra em até 60%.',
        'Sustentabilidade: a construção modular consome menos água (até 90% menos que alvenaria), gera menos resíduos, e sistemas como wood frame sequestram carbono. Construtoras que adotam construção seca têm pontuação extra em certificações ESG.',
      ],
    },
    {
      title: 'Passo a passo: como avaliar se a construção modular é viável para seu projeto',
      body: 'Nem todo projeto se beneficia igualmente da construção modular. A decisão depende de fatores como porte, localização, prazo, orçamento e disponibilidade de mão de obra especializada. Siga este passo a passo para avaliar a viabilidade:',
      items: [
        '1. Analise o porte e a repetitividade: projetos com unidades repetitivas (condomínios, conjuntos habitacionais, hotéis) se beneficiam mais, pois o custo do molde/projeto fabril é diluído em várias unidades.',
        '2. Verifique a distância da fábrica ao canteiro: o frete de componentes modulares é um custo significativo. Para steel frame, a distância ideal é até 300 km da fábrica. Para concreto pré-moldado, até 150 km.',
        '3. Avalie o terreno e as fundações: sistemas industrializados são mais leves, reduzindo custos de fundação, mas exigem terreno nivelado e acesso para caminhões e guindaste.',
        '4. Calcule o prazo total: inclua não só a montagem no canteiro, mas também o prazo de fabricação (30 a 90 dias). Em projetos com prazo total inferior a 4 meses, a construção modular é a única opção viável.',
        '5. Consulte fornecedores especializados: solicite orçamentos de pelo menos 3 fornecedores. Verifique referências de obras entregues e capacidade de produção.',
        '6. Considere a gestão digital: obras modulares exigem controle de cronograma rigoroso. Uma plataforma como o Meta Construtor, com RDO digital e cronograma integrado, é essencial para evitar gargalos.',
      ],
    },
    {
      title: 'Cases reais de construção modular no Brasil',
      body: 'Diversos empreendimentos no Brasil já comprovaram a eficácia da construção modular. Os cases abaixo mostram aplicações práticas em diferentes segmentos, com resultados mensuráveis de prazo, custo e qualidade:',
      image: {
        src: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1200&q=80',
        alt: 'Condomínio residencial modular em construção com estrutura steel frame em São Paulo',
        caption: 'Condomínios modulares no Brasil já entregam unidades em até 50% menos tempo que a alvenaria convencional',
        credit: 'Unsplash',
      },
      items: [
        'Residencial Jardim das Palmeiras (SP, 2025-2026): condomínio com 240 unidades de 52 m² em steel frame. Prazo total: 14 meses (contra 26 meses em alvenaria). Redução de custo por m²: 12%. Resíduos: 80% menor.',
        'Galpão Logístico ABC (SP, 2025): 12.000 m² em concreto pré-moldado. Montagem: 45 dias (contra 5 meses). Custo: R$ 1.450/m². Zero acidentes com afastamento.',
        'Escola Modular Tech (MG, 2026): 24 salas em painéis pré-moldados + steel frame. Prazo: 6 meses. Exigência de RDO digital diário para fiscalização.',
        'Resort Vila Verde (BA, 2025-2026): 60 bangalôs em wood frame certificado FSC. Conforto térmico natural dispensando ar-condicionado em 70% das unidades.',
        'Escritórios Corporativos Modais (RJ, 2026): 3.000 m² em contêineres modulares empilhados. Montagem: 60 dias. Layout reconfigurável em 72 horas.',
      ],
    },
    {
      title: 'Desafios regulatórios e aprovação de projetos modulares',
      body: 'A construção modular no Brasil ainda enfrenta desafios regulatórios que podem impactar o cronograma. Diferente de países como EUA, Japão e Reino Unido, onde a construção industrializada tem normas específicas, no Brasil os projetos modulares passam pelos mesmos trâmites da construção convencional:',
      items: [
        'Aprovação em prefeituras: muitas prefeituras ainda não têm normas específicas para construções industrializadas. São Paulo, Curitiba e Florianópolis já têm normativas para steel frame.',
        'Normas técnicas: ABNT já possui normas para steel frame (NBR 15575, NBR 15253) e concreto pré-moldado (NBR 9062), mas fiscalização ainda é irregular em municípios menores.',
        'Financiamento imobiliário: Caixa e bancos privados já financiam imóveis em steel frame. Empreendimentos com Selo Casa Azul da Caixa têm aprovação mais rápida.',
        'Garantia e seguro: seguradoras começam a oferecer seguros específicos para construção modular, com taxas 15-20% superiores à alvenaria devido ao menor histórico.',
        'Registro em cartório: imóveis modulares precisam de memorial descritivo detalhando o sistema construtivo. Alguns cartórios pedem documentação complementar.',
      ],
    },
    {
      title: 'Tendências da construção modular para 2026-2028',
      body: 'O mercado de construção modular no Brasil está em franca expansão. As principais tendências para os próximos anos incluem:',
      items: [
        'Crescimento acelerado do steel frame: estima-se que alcance 15% do mercado residencial brasileiro até 2028, impulsionado por ganhos de escala e aceitação dos financiadores.',
        'Integração BIM e IoT: projetos modulares cada vez mais integrados ao BIM, com sensores IoT monitorando temperatura, umidade e vibração durante transporte e montagem.',
        'Habitação popular modular: programas governamentais testando sistemas modulares para acelerar entrega de unidades. Projetos-piloto mostram redução de 40% no prazo.',
        'Construção modular híbrida (concreto + aço + madeira): combinação de materiais para otimizar custos e desempenho estrutural.',
        'Digitalização como pré-requisito: plataformas como o Meta Construtor, com RDO digital e cronograma integrado, são cada vez mais usadas para gerenciar o ritmo acelerado da montagem modular.',
      ],
    },
  ],
  faq: [
    { question: 'Construção modular é mais cara que alvenaria convencional?', answer: 'Em 2026, o custo por m² da construção modular se equipara à alvenaria convencional em projetos acima de 200 m². Para projetos menores, o custo pode ser 5-15% superior, mas o prazo reduzido compensa.' },
    { question: 'Qual sistema modular é mais indicado para casas residenciais?', answer: 'Steel frame é o sistema mais indicado para casas residenciais de até 3 pavimentos, combinando custo competitivo, velocidade, conforto termoacústico e aceitação dos financiadores.' },
    { question: 'Construção modular dura quanto tempo?', answer: 'A vida útil de edificações modulares em steel frame ou concreto pré-moldado é de 50 a 100 anos com manutenção adequada, equivalente à alvenaria convencional.' },
    { question: 'É possível financiar imóvel construído com steel frame?', answer: 'Sim. Caixa Econômica Federal e bancos privados financiam imóveis em steel frame desde que o projeto atenda às normas ABNT e tenha documentação técnica completa.' },
    { question: 'Construção modular precisa de fundação diferente?', answer: 'Sim. Sistemas industrializados são mais leves, permitindo fundações mais econômicas (radier ou sapatas isoladas), mas exigem nivelamento preciso para garantir a montagem dos módulos.' },
    { question: 'Quanto tempo leva para construir uma casa modular no Brasil?', answer: 'Uma casa modular de 100-150 m² em steel frame fica pronta em 4 a 6 meses, contra 8 a 12 meses da alvenaria convencional. Em sistemas 3D (contêineres), o prazo cai para 2 a 4 meses.' },
  ],
  cta: {
    title: 'Quer gerenciar obras modulares com RDO digital e cronograma integrado?',
    description: 'O Meta Construtor oferece RDO digital, cronograma, medição automática e controle de qualidade em uma plataforma única — ideal para o ritmo acelerado da construção modular. Cadastre sua primeira obra grátis por 7 dias, sem cartão de crédito.',
    label: 'Começar grátis',
    href: '/preco?utm_source=blog&utm_medium=artigo&utm_campaign=construcao-modular-industrializada-brasil&utm_content=cta-final',
  },
};

// Convert the article object to TypeScript code (as a string, using CRLF)
function objToTsLines(obj, indent) {
  const lines = [];
  if (obj === null || obj === undefined) return ['null'];
  if (typeof obj === 'string') return [`'${obj.replace(/'/g, "\\'")}'`];
  if (Array.isArray(obj)) {
    if (obj.length === 0) return ['[]'];
    lines.push('[');
    for (const item of obj) {
      const itemLines = objToTsLines(item, indent + '  ');
      for (const l of itemLines) {
        lines.push(indent + '  ' + l);
      }
      lines[lines.length - 1] += ',';
    }
    lines.push(indent + ']');
    return lines;
  }
  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    lines.push('{');
    for (const key of keys) {
      const valLines = objToTsLines(obj[key], indent + '  ');
      if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
        lines.push(indent + '  ' + key + ': ' + valLines[0]);
      } else {
        lines.push(indent + "  '" + key + "': " + valLines[0]);
      }
      for (let i = 1; i < valLines.length; i++) {
        lines.push(valLines[i]);
      }
      lines[lines.length - 1] += ',';
    }
    lines.push(indent + '}');
    return lines;
  }
  return [String(obj)];
}

const articleLines = objToTsLines(article, '  ');

// Build the insertion string with CRLF
const articleStr = articleLines.join('\r\n');

// Insert before the closing ];
const before = content.slice(0, idx);
const after = content.slice(idx);
const result = before + '  ' + articleStr + ',\r\n' + after;

fs.writeFileSync(path, result);
console.log('✅ Article inserted successfully!');
console.log('File size:', result.length);
