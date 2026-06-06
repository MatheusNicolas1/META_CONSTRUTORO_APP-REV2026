export interface BlogArticleSection {
  title: string;
  body: string;
  items?: string[];
}

export interface BlogArticleFAQ {
  question: string;
  answer: string;
}

export interface BlogArticle {
  slug: string;
  path: string;
  title: string;
  seoTitle: string;
  description: string;
  category: string;
  intent: string;
  readingTime: string;
  summary: string;
  publishedAt: string;
  updatedAt: string;
  keywords: string[];
  takeaways: string[];
  sections: BlogArticleSection[];
  faq: BlogArticleFAQ[];
  cta: {
    title: string;
    description: string;
    label: string;
    href: string;
  };
}

export const blogArticles: BlogArticle[] = [
  {
    slug: 'o-que-e-rdo',
    path: '/blog/o-que-e-rdo',
    title: 'O que e um RDO? Entenda o relatorio diario de obra',
    seoTitle: 'O que e um RDO? Relatorio diario de obra | Meta Construtor',
    description:
      'Entenda o que e RDO na construcao civil, para que serve e quais campos registrar no relatorio diario de obra.',
    category: 'RDO digital',
    intent: 'Busca informacional para quem esta descobrindo a sigla RDO',
    readingTime: '5 min',
    summary:
      'RDO e a sigla mais usada para Relatorio Diario de Obra. Ele registra o que aconteceu no canteiro em um dia especifico, com atividades, equipe, clima, fotos, pendencias e ocorrencias.',
    publishedAt: '2026-06-06',
    updatedAt: '2026-06-06',
    keywords: ['o que e um rdo', 'rdo', 'relatorio diario de obra', 'rdo digital'],
    takeaways: [
      'RDO, na rotina de construcao, significa Relatorio Diario de Obra.',
      'O registro ajuda a documentar atividades, equipe, clima, ocorrencias e evidencias.',
      'Um RDO bem feito reduz perda de informacao entre campo, engenharia e gestao.',
    ],
    sections: [
      {
        title: 'Resposta curta',
        body:
          'Um RDO e um relatorio diario que documenta a rotina de uma obra. Ele mostra o que foi feito, quem trabalhou, quais recursos foram usados, quais problemas apareceram e quais evidencias comprovam o andamento do servico.',
      },
      {
        title: 'Para que serve um RDO',
        body:
          'O RDO cria memoria operacional. Sem esse registro, a empresa depende de mensagens soltas, fotos sem contexto e lembrancas individuais. Com o RDO, gestores conseguem revisar prazos, justificar atrasos, acompanhar produtividade e consultar o historico da obra com mais seguranca.',
      },
      {
        title: 'O que deve entrar no relatorio',
        body:
          'A estrutura muda conforme a empresa, mas alguns campos formam uma base confiavel para quase toda obra.',
        items: [
          'Obra, data, periodo, responsavel pelo registro e responsavel tecnico.',
          'Condicao do tempo, equipe presente, equipamentos e materiais relevantes.',
          'Atividades executadas, servicos parados, interferencias e ocorrencias.',
          'Fotos, anexos, pendencias, aprovacoes e observacoes tecnicas.',
        ],
      },
      {
        title: 'Quem deve preencher',
        body:
          'Normalmente o preenchimento fica com alguem proximo da execucao: encarregado, mestre de obras, tecnico, engenheiro ou outro responsavel definido pela empresa. O ponto importante e ter rotina diaria e criterio claro de revisao.',
      },
      {
        title: 'RDO digital ou planilha',
        body:
          'Planilha pode funcionar no inicio, mas perde forca quando a obra cresce. Um RDO digital facilita anexar fotos, manter historico por obra, padronizar campos, buscar registros antigos e compartilhar informacoes sem depender de arquivos dispersos.',
      },
    ],
    faq: [
      {
        question: 'O que e um RDO?',
        answer:
          'RDO e o Relatorio Diario de Obra, usado para registrar diariamente atividades, equipe, clima, materiais, ocorrencias, fotos e pendencias de uma obra.',
      },
      {
        question: 'RDO e obrigatorio?',
        answer:
          'A obrigatoriedade depende do contrato, do tipo de obra e das exigencias tecnicas ou de gestao. Mesmo quando nao e exigido formalmente, o RDO e uma boa pratica para rastreabilidade.',
      },
      {
        question: 'Qual a diferenca entre RDO e diario de obra?',
        answer:
          'Na pratica, os termos costumam ser usados para registros parecidos. RDO destaca o relatorio diario; diario de obra pode ser usado de forma mais ampla para o historico continuo da obra.',
      },
    ],
    cta: {
      title: 'Quer padronizar o RDO da sua obra?',
      description:
        'O Meta Construtor organiza RDO, fotos, pendencias, atividades e documentos em uma rotina unica por obra.',
      label: 'Ver planos',
      href: '/preco',
    },
  },
  {
    slug: 'o-que-e-rdos',
    path: '/blog/o-que-e-rdos',
    title: 'O que e RDOs? Entenda o plural da sigla RDO',
    seoTitle: 'O que e RDOs? Plural de RDO explicado | Meta Construtor',
    description:
      'RDOs e o plural de RDO. Entenda quando usar a sigla, como organizar varios relatorios diarios de obra e evitar confusao.',
    category: 'RDO digital',
    intent: 'Busca de variacao e plural da sigla RDO',
    readingTime: '4 min',
    summary:
      'RDOs e apenas a forma plural de RDO. Em empresas de construcao, o termo aparece quando a equipe fala de varios relatorios diarios de obra, normalmente separados por data, obra ou frente de servico.',
    publishedAt: '2026-06-06',
    updatedAt: '2026-06-06',
    keywords: ['o que e rdos', 'rdos', 'plural de rdo', 'relatorios diarios de obra'],
    takeaways: [
      'RDOs significa varios Relatorios Diarios de Obra.',
      'A sigla no plural deve continuar ligada a uma obra, data e responsavel.',
      'Organizar muitos RDOs exige padrao de busca, status e anexos.',
    ],
    sections: [
      {
        title: 'Resposta curta',
        body:
          'RDOs e o plural de RDO. Quando alguem fala em RDOs, normalmente esta se referindo a varios Relatorios Diarios de Obra gerados ao longo de dias, obras, equipes ou contratos diferentes.',
      },
      {
        title: 'Quando o termo aparece na empresa',
        body:
          'A forma plural surge em reunioes de engenharia, fiscalizacao, auditoria e controle de obra. Exemplos comuns: revisar RDOs da semana, separar RDOs por obra, conferir RDOs pendentes de aprovacao ou localizar RDOs com ocorrencias.',
      },
      {
        title: 'Como organizar varios RDOs',
        body:
          'O problema nao e criar muitos registros, e sim conseguir encontrar o registro certo depois. Para isso, cada RDO precisa manter campos padronizados.',
        items: [
          'Obra, data, responsavel, status e tipo de ocorrencia.',
          'Vinculo com fotos, anexos, atividades, equipes e pendencias.',
          'Filtros por periodo, obra, aprovacao e responsavel.',
          'Historico de alteracoes quando o relatorio for revisado.',
        ],
      },
      {
        title: 'Evite canibalizar a busca principal',
        body:
          'Para SEO, a pagina sobre RDOs deve explicar o plural e apontar para o guia principal de RDO. Isso ajuda o usuario que digitou a variacao da sigla sem criar conteudo repetido demais.',
      },
    ],
    faq: [
      {
        question: 'O que e RDOS?',
        answer:
          'RDOS, geralmente escrito como RDOs, e o plural de RDO. No contexto de obras, significa varios Relatorios Diarios de Obra.',
      },
      {
        question: 'RDOs e diferente de RDO?',
        answer:
          'Nao no conceito principal. RDO e um relatorio; RDOs sao varios relatorios ou uma colecao de registros diarios.',
      },
      {
        question: 'Como procurar RDOs antigos?',
        answer:
          'O ideal e buscar por obra, data, responsavel, status, ocorrencia ou anexo. Em planilhas e pastas soltas, essa busca costuma ser mais lenta.',
      },
    ],
    cta: {
      title: 'Centralize todos os RDOs por obra',
      description:
        'Com o Meta Construtor, os registros diarios ficam organizados por obra, data, status e evidencias.',
      label: 'Conhecer a plataforma',
      href: '/home',
    },
  },
  {
    slug: 'rdo-na-policia',
    path: '/blog/rdo-na-policia',
    title: 'O que significa RDO na policia?',
    seoTitle: 'O que significa RDO na policia? | Meta Construtor',
    description:
      'Na policia, RDO costuma significar Registro Digital de Ocorrencia. Entenda a diferenca para o RDO de obras.',
    category: 'Significados de RDO',
    intent: 'Busca informacional ampla sobre a sigla RDO fora da construcao',
    readingTime: '4 min',
    summary:
      'A sigla RDO pode ter mais de um significado. No contexto policial, ela costuma aparecer como Registro Digital de Ocorrencia. Na construcao civil, o significado mais comum e Relatorio Diario de Obra.',
    publishedAt: '2026-06-06',
    updatedAt: '2026-06-06',
    keywords: ['rdo na policia', 'registro digital de ocorrencia', 'rdo policia', 'rdo significado'],
    takeaways: [
      'Na policia, RDO costuma se referir a Registro Digital de Ocorrencia.',
      'Na construcao civil, RDO normalmente significa Relatorio Diario de Obra.',
      'A intencao da busca define qual significado faz sentido.',
    ],
    sections: [
      {
        title: 'Resposta curta',
        body:
          'No uso policial, RDO costuma significar Registro Digital de Ocorrencia, um sistema ou registro digital relacionado a boletins e ocorrencias policiais. Esse significado nao e o mesmo usado na rotina de obras.',
      },
      {
        title: 'Por que existe confusao',
        body:
          'RDO e uma sigla curta e usada em areas diferentes. Quem pesquisa apenas a sigla pode encontrar resultados de policia, construcao civil, empresas e sistemas internos. Por isso, o contexto da frase e essencial.',
      },
      {
        title: 'Diferenca entre RDO policial e RDO de obra',
        body:
          'Apesar da sigla parecida, os objetivos sao diferentes.',
        items: [
          'RDO na policia: ligado a registro digital de ocorrencia e boletim de ocorrencia.',
          'RDO na obra: ligado ao relatorio diario do canteiro, atividades, equipe e evidencias.',
          'RDO de empresa: pode ser um relatorio operacional diario, especialmente em obras e servicos de campo.',
        ],
      },
      {
        title: 'Quando voce precisa de informacao policial',
        body:
          'Se a sua busca e sobre boletim de ocorrencia, consulta policial, delegacia eletronica ou documento oficial, use sempre os canais oficiais do seu estado. Este artigo apenas diferencia os significados da sigla.',
      },
      {
        title: 'Quando voce precisa de RDO de obra',
        body:
          'Se a sua duvida e sobre controle de obra, registro de atividades, fotos de campo, equipe, materiais ou ocorrencias de canteiro, o significado relevante e Relatorio Diario de Obra.',
      },
    ],
    faq: [
      {
        question: 'O que significa RDO na policia?',
        answer:
          'No contexto policial, RDO costuma significar Registro Digital de Ocorrencia, ligado ao registro digital de boletins e ocorrencias.',
      },
      {
        question: 'RDO da policia e o mesmo que RDO de obra?',
        answer:
          'Nao. RDO da policia esta ligado a ocorrencia policial. RDO de obra e o Relatorio Diario de Obra usado na construcao civil.',
      },
      {
        question: 'Onde consultar RDO policial?',
        answer:
          'Para informacoes policiais, procure os canais oficiais da Policia Civil ou da Secretaria de Seguranca Publica do seu estado.',
      },
    ],
    cta: {
      title: 'Procurando RDO para obra?',
      description:
        'Veja como o Meta Construtor ajuda empresas de construcao a registrar a rotina de campo com evidencias e historico.',
      label: 'Ler sobre RDO de obra',
      href: '/blog/o-que-e-rdo',
    },
  },
  {
    slug: 'rdo-de-empresa',
    path: '/blog/rdo-de-empresa',
    title: 'O que e um RDO de empresa?',
    seoTitle: 'O que e um RDO de empresa? | Meta Construtor',
    description:
      'Entenda o que e RDO de empresa, como ele registra a rotina operacional e por que construtoras usam esse controle.',
    category: 'Gestao de obras',
    intent: 'Busca de decisores que querem entender RDO como controle empresarial',
    readingTime: '5 min',
    summary:
      'Um RDO de empresa e um registro diario usado para documentar operacoes, principalmente em construcao civil e servicos de campo. Ele transforma o que aconteceu no dia em historico consultavel para gestao.',
    publishedAt: '2026-06-06',
    updatedAt: '2026-06-06',
    keywords: ['rdo de empresa', 'relatorio diario de obra empresa', 'controle diario de obra', 'gestao de obras'],
    takeaways: [
      'RDO de empresa registra rotina, responsaveis, ocorrencias e evidencias.',
      'Ele ajuda diretoria e gestores a enxergar prazos, riscos e produtividade.',
      'O valor do RDO aumenta quando ele se conecta a documentos, atividades e aprovacoes.',
    ],
    sections: [
      {
        title: 'Resposta curta',
        body:
          'RDO de empresa e um relatorio diario usado para registrar a execucao de uma operacao. Em construtoras, geralmente significa Relatorio Diario de Obra, com informacoes sobre o canteiro, equipe, atividades, materiais, clima, pendencias e ocorrencias.',
      },
      {
        title: 'Por que empresas usam RDO',
        body:
          'A empresa usa RDO para reduzir dependencia de conversas informais e criar uma base de consulta. Isso ajuda a acompanhar obras, responder clientes, revisar atrasos, analisar produtividade e provar o que foi feito em determinada data.',
      },
      {
        title: 'O que um gestor deve cobrar',
        body:
          'Para ter valor executivo, o RDO precisa ser curto o suficiente para a equipe preencher e completo o suficiente para sustentar decisao.',
        items: [
          'Resumo objetivo do dia e atividades executadas.',
          'Equipe, equipamentos, materiais e interferencias relevantes.',
          'Fotos ou anexos que comprovem execucao e problemas.',
          'Pendencias, responsaveis, prazos e status de revisao.',
        ],
      },
      {
        title: 'Como o RDO ajuda a diretoria',
        body:
          'Um RDO bem estruturado nao serve apenas para o campo. Ele apoia reunioes de producao, analise de atraso, cobranca de fornecedores, relatorio para cliente e decisao sobre reforco de equipe ou mudanca de planejamento.',
      },
      {
        title: 'Quando digitalizar o processo',
        body:
          'A digitalizacao passa a fazer sentido quando a empresa perde tempo consolidando planilhas, procurando fotos, cobrando preenchimento ou respondendo duvidas que ja deveriam estar no historico da obra.',
      },
    ],
    faq: [
      {
        question: 'O que e um RDO de empresa?',
        answer:
          'E um relatorio diario usado pela empresa para registrar rotina, atividades, equipe, ocorrencias, evidencias e pendencias de uma operacao ou obra.',
      },
      {
        question: 'Toda empresa precisa de RDO?',
        answer:
          'Nem toda empresa usa esse nome, mas operacoes com campo, obra, equipe externa ou servicos recorrentes costumam se beneficiar de algum registro diario padronizado.',
      },
      {
        question: 'RDO ajuda no controle de custo?',
        answer:
          'Sim, quando registra equipe, equipamentos, retrabalho, paradas, materiais e ocorrencias que impactam prazo ou produtividade.',
      },
    ],
    cta: {
      title: 'Transforme o RDO em controle de gestao',
      description:
        'Organize rotina de obra, documentos, aprovacoes e relatorios em uma plataforma feita para construtoras.',
      label: 'Falar com a equipe',
      href: '/contato',
    },
  },
  {
    slug: 'como-estruturar-rdo',
    path: '/blog/como-estruturar-rdo',
    title: 'Como estruturar um RDO util para campo, engenharia e cliente',
    seoTitle: 'Como estruturar RDO util | Meta Construtor',
    description:
      'Veja como organizar RDO digital com clima, equipe, atividades, fotos, pendencias e aprovacao para reduzir retrabalho na obra.',
    category: 'RDO digital',
    intent: 'Guia pratico para estruturar relatorios de obra',
    readingTime: '6 min',
    summary:
      'Um RDO bom nao e apenas um formulario preenchido. Ele precisa explicar o dia da obra para quem executou, revisou, aprovou e vai consultar o historico depois.',
    publishedAt: '2026-06-02',
    updatedAt: '2026-06-06',
    keywords: ['como estruturar rdo', 'rdo digital', 'modelo de rdo', 'relatorio de obra'],
    takeaways: [
      'Registre o que aconteceu, quem participou e qual evidencia comprova.',
      'Separe rotina normal de ocorrencia que exige decisao.',
      'Mantenha fotos, anexos e pendencias ligados ao mesmo dia de obra.',
    ],
    sections: [
      {
        title: 'Comece pelo objetivo do registro',
        body:
          'O RDO deve servir como memoria operacional da obra. Antes de criar campos, defina quem vai usar a informacao: encarregado, engenheiro, cliente, diretoria ou administracao. Isso evita registros longos que ninguem consulta.',
      },
      {
        title: 'Campos que normalmente precisam estar juntos',
        body:
          'A estrutura pode variar por construtora, mas alguns blocos ajudam a manter rastreabilidade.',
        items: [
          'Identificacao da obra, data, responsavel e periodo registrado.',
          'Condicao do tempo, equipe presente, equipamentos e atividades executadas.',
          'Fotos, anexos, ocorrencias, pendencias e decisoes tomadas no dia.',
          'Status de revisao ou aprovacao quando o RDO precisa virar documento formal.',
        ],
      },
      {
        title: 'Evite transformar tudo em observacao livre',
        body:
          'Campo livre ajuda em excecoes, mas atrapalha relatorio quando vira a regra. Use listas e categorias para informacoes recorrentes, mantendo observacao para contexto, justificativa ou detalhe tecnico.',
      },
      {
        title: 'Aprovacao precisa ter criterio',
        body:
          'Quando o RDO exige aprovacao, deixe claro o que esta sendo aprovado: presenca, servico executado, evidencia, medicao ou comunicacao ao cliente. Sem criterio, a aprovacao vira apenas um clique sem valor operacional.',
      },
    ],
    faq: [
      {
        question: 'Como estruturar um RDO?',
        answer:
          'Comece por obra, data, responsavel, clima, equipe, atividades, ocorrencias, fotos, pendencias e status de revisao ou aprovacao.',
      },
      {
        question: 'O que nao pode faltar no RDO?',
        answer:
          'Nao pode faltar contexto: onde aconteceu, quando aconteceu, quem participou, o que foi executado e qual evidencia comprova o registro.',
      },
      {
        question: 'RDO precisa ter aprovacao?',
        answer:
          'Depende da rotina da empresa e do contrato. Quando houver aprovacao, o criterio deve estar claro para nao virar apenas um clique formal.',
      },
    ],
    cta: {
      title: 'Quer tirar o RDO da planilha?',
      description:
        'O Meta Construtor organiza RDO, fotos, atividades, pendencias e documentos por obra em uma rotina unica.',
      label: 'Ver planos',
      href: '/preco',
    },
  },
  {
    slug: 'documentos-por-obra',
    path: '/blog/documentos-por-obra',
    title: 'Quais documentos precisam estar ligados a cada obra',
    seoTitle: 'Documentos por obra | Meta Construtor',
    description:
      'Entenda como organizar documentos de obra por rotina, responsabilidade e finalidade para facilitar consulta, auditoria e entrega.',
    category: 'Documentos',
    intent: 'Apoio de conteudo para organizacao documental em obras',
    readingTime: '5 min',
    summary:
      'Documento solto em pasta compartilhada perde contexto. Documento ligado a obra, etapa e responsavel vira evidencia consultavel.',
    publishedAt: '2026-06-02',
    updatedAt: '2026-06-06',
    keywords: ['documentos por obra', 'documentos de obra', 'gestao documental obra', 'anexos de obra'],
    takeaways: [
      'Classifique documentos por finalidade, nao apenas por nome de arquivo.',
      'Ligue anexos a RDOs, checklists, ocorrencias ou etapas da obra.',
      'Defina responsavel por atualizar e validar documentos sensiveis.',
    ],
    sections: [
      {
        title: 'Documentos precisam de contexto',
        body:
          'Uma foto, contrato, ART, nota, laudo ou termo nao deveria depender de memoria de equipe para ser encontrado. O contexto minimo e obra, tipo, data, responsavel e motivo do documento existir.',
      },
      {
        title: 'Grupos comuns em construtoras',
        body:
          'A lista exata depende da operacao, mas alguns grupos costumam aparecer em obras de pequeno e medio porte.',
        items: [
          'Contratos, propostas, aditivos e documentos comerciais.',
          'Projetos, plantas, memorias, ARTs, laudos e registros tecnicos.',
          'RDOs, fotos de campo, checklists, ocorrencias e aprovacoes.',
          'Notas fiscais, medicoes, comprovantes, documentos de fornecedores e entrega ao cliente.',
        ],
      },
      {
        title: 'Nome do arquivo nao basta',
        body:
          'Padrao de nome ajuda, mas nao substitui campos de consulta. Se a equipe so consegue achar documentos pelo nome exato do arquivo, a operacao continua fragil.',
      },
      {
        title: 'Controle versao e validade',
        body:
          'Alguns documentos mudam, vencem ou precisam de revisao. Nesses casos, registre versao, validade, substituicao e responsavel. Isso reduz risco de equipe usar arquivo antigo por engano.',
      },
    ],
    faq: [
      {
        question: 'Quais documentos devem ficar ligados a obra?',
        answer:
          'Contratos, projetos, ARTs, laudos, RDOs, fotos, checklists, notas, medicoes, comprovantes e documentos de fornecedores costumam precisar de vinculo com a obra.',
      },
      {
        question: 'Como organizar documentos de obra?',
        answer:
          'Organize por obra, tipo, data, responsavel, etapa e relacao com RDO, checklist, ocorrencia ou entrega.',
      },
      {
        question: 'Nome de arquivo resolve a gestao documental?',
        answer:
          'Ajuda, mas nao resolve sozinho. Campos estruturados e vinculo com a rotina da obra tornam a consulta mais confiavel.',
      },
    ],
    cta: {
      title: 'Organize documentos junto da rotina da obra',
      description:
        'Centralize anexos, RDOs, checklists e relatorios para diminuir arquivos duplicados e consultas manuais.',
      label: 'Falar com a equipe',
      href: '/contato',
    },
  },
  {
    slug: 'checklist-qualidade-obra',
    path: '/blog/checklist-qualidade-obra',
    title: 'Quando usar checklist, ocorrencia, atividade ou anexo',
    seoTitle: 'Checklist de qualidade na obra | Meta Construtor',
    description:
      'Aprenda a separar checklist, ocorrencia, atividade e anexo na gestao de obras para melhorar qualidade, rastreabilidade e decisao.',
    category: 'Checklists',
    intent: 'Apoio de conteudo para padronizacao de controles de obra',
    readingTime: '5 min',
    summary:
      'Muitas equipes registram tudo no mesmo lugar. A rotina fica mais clara quando cada tipo de registro tem uma funcao.',
    publishedAt: '2026-06-02',
    updatedAt: '2026-06-06',
    keywords: ['checklist de qualidade obra', 'ocorrencia de obra', 'atividade de obra', 'anexo de obra'],
    takeaways: [
      'Use checklist para verificar criterio repetivel.',
      'Use ocorrencia quando houver desvio, impedimento ou decisao pendente.',
      'Use anexo como evidencia conectada ao registro certo.',
    ],
    sections: [
      {
        title: 'Checklist e para criterio',
        body:
          'Checklist funciona melhor quando existe uma lista de verificacao clara: qualidade, seguranca, entrega, limpeza, material, documentacao ou etapa de execucao. Ele responde se o criterio foi atendido e qual evidencia sustenta a resposta.',
      },
      {
        title: 'Atividade e para execucao',
        body:
          'Atividade descreve o que foi planejado ou executado. Ela ajuda a acompanhar andamento, equipe, responsavel e prazo. Quando a atividade falha, atrasa ou depende de decisao, pode gerar ocorrencia.',
      },
      {
        title: 'Ocorrencia e para excecao',
        body:
          'Ocorrencia deve destacar algo que saiu do fluxo normal: impedimento, retrabalho, falta de material, mudanca de escopo, acidente, divergencia ou pendencia de cliente.',
      },
      {
        title: 'Anexo e evidencia, nao destino final',
        body:
          'Foto ou arquivo precisa estar conectado ao registro que explica seu significado. Um anexo solto prova pouco. Um anexo ligado a checklist, RDO ou ocorrencia ajuda a equipe a entender contexto e responsabilidade.',
      },
    ],
    faq: [
      {
        question: 'Quando usar checklist de obra?',
        answer:
          'Use checklist quando houver criterio repetivel de verificacao, como qualidade, seguranca, entrega, limpeza, material ou documentacao.',
      },
      {
        question: 'Quando registrar ocorrencia?',
        answer:
          'Registre ocorrencia quando houver desvio, impedimento, retrabalho, falta de material, mudanca de escopo ou decisao pendente.',
      },
      {
        question: 'Foto deve ficar onde?',
        answer:
          'A foto deve ficar ligada ao registro que explica seu contexto: RDO, checklist, ocorrencia, atividade ou documento.',
      },
    ],
    cta: {
      title: 'Padronize a rotina de campo',
      description:
        'Use checklists, RDOs, anexos e pendencias de forma integrada para reduzir retrabalho entre campo e gestao.',
      label: 'Conhecer a plataforma',
      href: '/home',
    },
  },
];

export const getBlogArticle = (slug?: string) =>
  blogArticles.find((article) => article.slug === slug);
