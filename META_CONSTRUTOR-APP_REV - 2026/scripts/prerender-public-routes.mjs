import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const siteUrl = "https://www.metaconstrutor.app.br";
const defaultImage = `${siteUrl}/marketing/obras-reais/estrutura-metalica-aerea.jpg`;

const routes = [
  {
    path: "/",
    title: "Meta Construtor | Gestão de Obras para Engenheiros e Escritórios de Engenharia",
    description: "Gerencia obras, RDOs, equipes, contratos e documentação em uma plataforma desenvolvida para engenheiros, construtoras e escritórios de estruturas metálicas.",
    priorityType: "SoftwareApplication",
  },
  {
    path: "/preco",
    title: "Planos e preços | Meta Construtor",
    description: "Escolha o plano ideal para gerenciar obras, RDOs, equipes e documentos com o Meta Construtor.",
  },
  {
    path: "/sobre",
    title: "Sobre o Meta Construtor | Plataforma brasileira para obras",
    description: "Conheca a plataforma web brasileira para organizar obras, RDOs, checklists, documentos e rotinas de campo.",
  },
  {
    path: "/contato",
    title: "Contato | Fale com o Meta Construtor",
    description: "Fale com a equipe do Meta Construtor sobre suporte, demonstracao, planos, obras ou parcerias.",
    priorityType: "ContactPage",
  },
  {
    path: "/blog",
    title: "Blog Meta Construtor | Gestao de obras e RDO digital",
    description: "Artigos sobre gestao de obras, RDO digital, produtividade e tecnologia para construtoras.",
    priorityType: "Blog",
  },
  {
    path: '/blog/planejamento-de-obras-ferramentas-digitais-metodologias-ageis',
    title: 'Planejamento de Obras: Ferramentas Digitais e Metodologias Ágeis | Meta Construtor',
    description:
      'Aprenda como aplicar metodologias ágeis e ferramentas digitais no planejamento de obras. Scrum, Kanban, BIM 4D e softwares de gestão integrada para construtoras modernas.',
    priorityType: 'Article',
  },
  // ── V2 Pages ──
  {
    path: "/home2",
    title: "Meta Construtor 2 | Gestão de Obras Moderna e Inteligente",
    description: "Conheça a nova versão do Meta Construtor com hero cinematográfico, galeria de obras e depoimentos em vídeo.",
    priorityType: "SoftwareApplication",
  },
  {
    path: "/preco2",
    title: "Planos e Preços 2 | Meta Construtor",
    description: "Planos Grátis, Profissional (R$79/mês) e Enterprise (R$299/mês). Economize 20% no plano anual.",
  },
  {
    path: "/sobre2",
    title: "Sobre o Meta Construtor 2 | Quem somos e nossa história",
    description: "Conheça a história, valores e equipe do Meta Construtor. Mais de 1.500 obras gerenciadas.",
  },
  {
    path: "/contato2",
    title: "Contato 2 | Fale com o Meta Construtor",
    description: "Entre em contato com a equipe do Meta Construtor 2. WhatsApp, e-mail e formulário.",
    priorityType: "ContactPage",
  },
  {
    path: "/blog2",
    title: "Blog Meta Construtor 2 | Conteúdo para sua obra",
    description: "Artigos sobre RDO digital, checklists, relatórios financeiros e gestão de obras.",
    priorityType: "Blog",
  },
  {
    path: "/blog/page/2",
    title: "Pagina 2 - Blog Meta Construtor | Gestao de obras",
    description: "Mais artigos sobre gestao de obras, RDO digital e produtividade - pagina 2.",
    priorityType: "Blog",
  },
  {
    path: "/blog/page/3",
    title: "Pagina 3 - Blog Meta Construtor | Gestao de obras",
    description: "Continue lendo sobre gestao de obras, RDO digital e tecnologia - pagina 3.",
    priorityType: "Blog",
  },
  {
    path: "/blog/page/4",
    title: "Pagina 4 - Blog Meta Construtor | Gestao de obras",
    description: "Mais conteudos sobre obras, RDO e constucao civil - pagina 4.",
    priorityType: "Blog",
  },
  {
    path: "/blog/page/5",
    title: "Pagina 5 - Blog Meta Construtor | Gestao de obras",
    description: "Artigos sobre gestao de obras e RDO digital - pagina 5.",
    priorityType: "Blog",
  },
  {
    path: "/blog/page/6",
    title: "Pagina 6 - Blog Meta Construtor | Gestao de obras",
    description: "Ultimos artigos do blog do Meta Construtor - pagina 6.",
    priorityType: "Blog",
  },
  {
    path: "/blog/o-que-e-rdo",
    title: "O que e um RDO? Entenda o relatorio diario de obra",
    description: "Entenda o que e RDO na construcao civil, para que serve e quais campos registrar no relatorio diario de obra.",
    priorityType: "Article",
    faqs: [
      {
        question: "O que e um RDO?",
        answer: "RDO e o Relatorio Diario de Obra, usado para registrar diariamente atividades, equipe, clima, materiais, ocorrencias, fotos e pendencias de uma obra.",
      },
      {
        question: "RDO e obrigatorio?",
        answer: "A obrigatoriedade depende do contrato, do tipo de obra e das exigencias tecnicas ou de gestao. Mesmo quando nao e exigido formalmente, o RDO e uma boa pratica para rastreabilidade.",
      },
      {
        question: "Qual a diferenca entre RDO e diario de obra?",
        answer: "Na pratica, os termos costumam ser usados para registros parecidos. RDO destaca o relatorio diario; diario de obra pode ser usado de forma mais ampla para o historico continuo da obra.",
      },
    ],
  },
  {
    path: "/blog/o-que-e-rdos",
    title: "O que e RDOs? Entenda o plural da sigla RDO",
    description: "RDOs e o plural de RDO. Entenda quando usar a sigla, como organizar varios relatorios diarios de obra e evitar confusao.",
    priorityType: "Article",
    faqs: [
      {
        question: "O que e RDOS?",
        answer: "RDOS, geralmente escrito como RDOs, e o plural de RDO. No contexto de obras, significa varios Relatorios Diarios de Obra.",
      },
      {
        question: "RDOs e diferente de RDO?",
        answer: "Nao no conceito principal. RDO e um relatorio; RDOs sao varios relatorios ou uma colecao de registros diarios.",
      },
      {
        question: "Como procurar RDOs antigos?",
        answer: "O ideal e buscar por obra, data, responsavel, status, ocorrencia ou anexo. Em planilhas e pastas soltas, essa busca costuma ser mais lenta.",
      },
    ],
  },
  {
    path: "/blog/rdo-na-policia",
    title: "O que significa RDO na policia?",
    description: "Na policia, RDO costuma significar Registro Digital de Ocorrencia. Entenda a diferenca para o RDO de obras.",
    priorityType: "Article",
    faqs: [
      {
        question: "O que significa RDO na policia?",
        answer: "No contexto policial, RDO costuma significar Registro Digital de Ocorrencia, ligado ao registro digital de boletins e ocorrencias.",
      },
      {
        question: "RDO da policia e o mesmo que RDO de obra?",
        answer: "Nao. RDO da policia esta ligado a ocorrencia policial. RDO de obra e o Relatorio Diario de Obra usado na construcao civil.",
      },
      {
        question: "Onde consultar RDO policial?",
        answer: "Para informacoes policiais, procure os canais oficiais da Policia Civil ou da Secretaria de Seguranca Publica do seu estado.",
      },
    ],
  },
  {
    path: "/blog/rdo-de-empresa",
    title: "O que e um RDO de empresa?",
    description: "Entenda o que e RDO de empresa, como ele registra a rotina operacional e por que construtoras usam esse controle.",
    priorityType: "Article",
    faqs: [
      {
        question: "O que e um RDO de empresa?",
        answer: "E um relatorio diario usado pela empresa para registrar rotina, atividades, equipe, ocorrencias, evidencias e pendencias de uma operacao ou obra.",
      },
      {
        question: "Toda empresa precisa de RDO?",
        answer: "Nem toda empresa usa esse nome, mas operacoes com campo, obra, equipe externa ou servicos recorrentes costumam se beneficiar de algum registro diario padronizado.",
      },
      {
        question: "RDO ajuda no controle de custo?",
        answer: "Sim, quando registra equipe, equipamentos, retrabalho, paradas, materiais e ocorrencias que impactam prazo ou produtividade.",
      },
    ],
  },
  {
    path: "/blog/como-estruturar-rdo",
    title: "Como estruturar um RDO util para campo, engenharia e cliente",
    description: "Veja como organizar RDO digital com clima, equipe, atividades, fotos, pendencias e aprovacao para reduzir retrabalho na obra.",
    priorityType: "Article",
  },
  {
    path: "/blog/documentos-por-obra",
    title: "Quais documentos precisam estar ligados a cada obra",
    description: "Entenda como organizar documentos de obra por rotina, responsabilidade e finalidade para facilitar consulta, auditoria e entrega.",
    priorityType: "Article",
  },
  {
    path: "/blog/checklist-qualidade-obra",
    title: "Quando usar checklist, ocorrencia, atividade ou anexo",
    description: "Aprenda a separar checklist, ocorrencia, atividade e anexo na gestao de obras para melhorar qualidade, rastreabilidade e decisao.",
    priorityType: "Article",
  },
  {
    path: "/blog/rdo-como-prova-tecnica",
    title: "RDO como prova técnica: use o relatório diário de obra para mediação e faturamento",
    description: "Aprenda como o RDO pode ser usado como prova técnica para medir avanço, liberar faturamento e comprovar serviço executado em construtoras de pequeno e médio porte.",
    priorityType: "Article",
  },
  {
    path: "/blog/erros-comuns-preenchimento-rdo",
    title: "Erros comuns no preenchimento de RDO (e como evitar)",
    description: "Veja os erros mais frequentes no preenchimento de RDO — relatório genérico, foto sem contexto, campo vazio, registro atrasado — e aprenda a corrigir cada um na sua obra.",
    priorityType: "Article",
  },
  {
    path: "/blog/dados-rdo-relatorio-gerencial",
    title: "Dados de RDO viram relatório gerencial: o que o dono da construtora precisa ver",
    description: "Saiba como consolidar RDOs por semana em um relatório executivo com indicadores de produtividade, adesão e avanço físico — feito para o dono da construtora.",
    priorityType: "Article",
  },
  {
    path: "/blog/rdo-e-fotografia-de-obra",
    title: "RDO e fotografia de obra: como provar o que foi executado?",
    description: "Guia prático de evidência visual na obra: o que fotografar, quantas fotos, como nomear e como vincular cada imagem ao RDO.",
    priorityType: "Article",
  },
  {
    path: "/blog/rdo-obras-publicas-vs-privadas",
    title: "RDO em obras públicas vs. obras privadas: qual a diferença?",
    description: "Obras públicas têm mais exigência documental, fiscalização dedicada e diário de obra contratual. Entenda como adequar o RDO para cada tipo de contrato.",
    priorityType: "Article",
  },
  {
    path: "/blog/checklist-mais-rdo",
    title: "Checklist + RDO: a combinação que reduz retrabalho na obra",
    description: "Saiba como transformar checklist de qualidade em anexo do RDO e documentar a verificação de cada etapa construtiva.",
    priorityType: "Article",
  },
  {
    path: "/blog/diario-de-obra-digital",
    title: "Diário de Obra Digital: O fim da caderneta e do Excel na construção civil",
    description: "O diário de obra digital está substituindo caderneta física e planilhas de Excel na construção civil. Veja as funcionalidades essenciais e como adotar.",
    priorityType: "Article",
  },
  {
    path: "/blog/rdo-online-guia-completo",
    title: "RDO Online: Guia completo para fazer o relatório diário de obra pela internet",
    description: "Aprenda como fazer RDO online, quais campos usar, vantagens do digital sobre o papel e como escolher a melhor ferramenta para sua construtora de pequeno ou médio porte.",
    priorityType: "Article",
  },
  {
    path: "/blog/rdo-online-faturamento-contratos",
    title: "Como o RDO Online ajuda construtoras a faturar mais e discutir menos",
    description: "RDO bem preenchido é a base da medição e do faturamento na construção. Veja como o RDO online reduz glosas, acelera pagamentos e melhora o fluxo de caixa da construtora.",
    priorityType: "Article",
  },
  {
    path: "/blog/medicao-de-obra-guia-completo",
    title: "Medição de Obra: Guia completo para medir serviços na construção civil",
    description: "Guia completo sobre medição de obra na construção civil. Aprenda como medir serviços, quais documentos usar e como o RDO acelera o faturamento.",
    priorityType: "Article",
  },
  {
    path: "/blog/medicao-obras-publicas",
    title: "Medição de Obras Públicas: regras, prazos e documentação",
    description: "Entenda as regras, prazos e documentação exigidos na medição de obras públicas, incluindo a Lei 8.666 e a IN 05/2017.",
    priorityType: "Article",
  },
  {
    path: "/blog/controle-de-obra-planilha-ou-app",
    title: "Controle de Obra: planilha ou app? Qual a melhor opção para sua construtora",
    description: "Descubra as vantagens e desvantagens de usar planilhas ou aplicativos para controle de obra e veja qual solução atende melhor sua construtora.",
    priorityType: "Article",
  },
  {
    path: "/blog/fiscal-de-obra-o-que-faz",
    title: "Fiscal de Obra: o que faz, salário, como se tornar",
    description: "Descubra o que faz um fiscal de obra, qual o salário médio, quais são as principais responsabilidades e como se tornar um profissional na área.",
    priorityType: "Article",
  },
  {
    path: "/blog/seguranca-do-trabalho-obra-civil-nr18",
    title: "Segurança do Trabalho na Construção Civil: guia completo NR-18 em 2026",
    description: "Guia completo sobre segurança do trabalho na construção civil com foco na NR-18. Entenda as obrigações legais, os equipamentos de proteção, os documentos obrigatórios e como implementar um programa de segurança eficaz no canteiro de obras em 2026.",
    priorityType: "Article",
  },
  {
    path: "/blog/relatorio-fotografico-de-obra-modelo",
    title: "Relatório Fotográfico de Obra: modelo grátis e guia completo para fazer o seu",
    description: "Guia completo sobre relatório fotográfico de obra: como fazer, o que incluir, modelo grátis para download e dicas de fotografia de canteiro de obras para construtoras, engenheiros e fiscais.",
    priorityType: "Article",
  },
  {
    path: "/blog/app-gestao-de-obras-2026",
    title: "App de Gestão de Obras: os 5 melhores aplicativos para construtoras em 2026",
    description: "Descubra os melhores aplicativos para gestão de obras em 2026. Compare funcionalidades, preços e benefícios de cada ferramenta para sua construtora.",
    priorityType: "Article",
  },
  {
    path: "/blog/gestao-construtoras-pequeno-porte",
    title: "Gestão para Construtoras de Pequeno Porte: como organizar sem gastar muito",
    description: "Aprenda como organizar sua construtora de pequeno porte com processos simples, ferramentas acessíveis e estratégias práticas de gestão de obras que não exigem grandes investimentos.",
    priorityType: "Article",
  },
  {
    path: "/blog/almoxarifado-de-obra-organizacao",
    title: "Almoxarifado de Obra: como organizar, controlar estoque e reduzir perdas",
    description: "Guia prático para organizar o almoxarifado de obra, controlar entrada e saída de materiais, reduzir perdas por desvio e vencimento, e integrar o almoxarifado com o resto da gestão da construção civil.",
    priorityType: "Article",
  },
  {
    path: "/blog/cronograma-de-obra-caixa-economica",
    title: "Cronograma de Obra para Caixa Econômica: como elaborar passo a passo",
    description: "Guia completo para elaborar o cronograma físico-financeiro de obra exigido pela Caixa Econômica Federal no financiamento habitacional. Modelos, etapas, prazos e dicas para aprovação.",
    priorityType: "Article",
  },
  {
    path: "/blog/orcamento-de-obra-passo-a-passo",
    title: "Orçamento de Obra: Guia Completo com Exemplos Práticos | Meta Construtor",
    description: "Aprenda a fazer orçamento de obra do zero com exemplos práticos, planilha gratuita, composição de custos e dicas para evitar estouro. Guia completo para engenheiros e construtores.",
    priorityType: "Article",
  },
  {
    path: "/blog/diario-de-obra-app-online",
    title: "Diário de Obra Online: Como Fazer Digital Gratuito em 2026",
    description: "Aprenda como fazer diário de obra online grátis em 2026. Guia completo com app digital para RDO, fotos, assinaturas e relatórios automáticos para engenheiros e construtores.",
    priorityType: "Article",
  },
  {
    path: "/blog/planejamento-de-obra-passo-a-passo",
    title: "Planejamento de Obra: Passo a Passo Completo do Início ao Fim | Meta Construtor",
    description: "Guia completo de planejamento de obra: etapas, cronograma, recursos, custos e riscos. Aprenda o passo a passo para planejar sua construção do zero com eficiência.",
    priorityType: "Article",
  },
  {
    path: "/blog/app-gestao-de-obras-gratuito",
    title: "App de Gestão de Obras Gratuito: Melhores Opções 2026 | Meta Construtor",
    description: "Descubra os melhores apps gratuitos de gestão de obras para construtoras em 2026. Compare funcionalidades gratuitas de RDO, medição e controle financeiro sem pagar nada.",
    priorityType: "Article",
  },
  {
    path: "/blog/custo-de-obra-por-m2-2026",
    title: "Custo de obra por m² em 2026: tabela completa atualizada",
    description: "Tabela atualizada de custo de obra por m² em 2026 com base no SINAPI, CUB e mercado. Veja quanto custa construir cada tipo de edificação e como controlar gastos na sua obra.",
    priorityType: "Article",
    faqs: [
      {
        question: "Qual é o custo médio do metro quadrado de construção em 2026?",
        answer: "O custo médio nacional para construção residencial padrão normal em 2026 é de R$ 2.100 a R$ 2.600/m², variando por região e padrão construtivo.",
      },
      {
        question: "O que está incluso no custo por m² do SINAPI?",
        answer: "O SINAPI inclui materiais, mão de obra com encargos sociais, equipamentos e despesas administrativas. Não inclui terreno, projetos, taxas de licença e BDI da construtora.",
      },
      {
        question: "Como calcular o BDI no orçamento de obra?",
        answer: "O BDI (Bonificação e Despesas Indiretas) é calculado sobre o custo direto da obra e varia de 20% a 30%, incluindo lucro, riscos, tributos e despesas indiretas da construtora.",
      },
      {
        question: "Construir casa própria fica mais barato que comprar pronta em 2026?",
        answer: "Construir costuma ser 15% a 25% mais barato que comprar pronto, desde que o terreno esteja pago e a obra seja gerenciada com controle de custos e planejamento adequados.",
      },
    ],
  },
  {
    path: "/blog/checklist-de-obra-modelo-pdf",
    title: "Checklist de Obra: modelo PDF gratuito para imprimir e usar no canteiro",
    description: "Baixe grátis um modelo de checklist de obra em PDF para imprimir. Guia completo com tipos de checklist, passo a passo de uso e dicas para não esquecer nenhuma etapa da construção civil.",
    priorityType: "Article",
  },
  {
    path: '/blog/seguranca-do-trabalho-canteiro-de-obras',
    title: 'Segurança do trabalho em canteiro de obras: guia completo NR-18',
    description: 'Guia completo sobre segurança do trabalho em canteiro de obras. Entenda a NR-18, EPIs obrigatórios, sinalização, análise de risco, treinamentos e como documentar tudo no RDO digital.',
    priorityType: 'Article',
  },
  {
    path: '/blog/documentos-obra-exigidos-prefeitura',
    title: 'Documentos de obra exigidos pela prefeitura: checklist completo 2026',
    description: 'Guia completo com a lista de documentos de obra exigidos pela prefeitura para aprovação de projeto, alvará, habite-se e licenças. Checklist atualizado 2026 para construtoras e engenheiros.',
    priorityType: 'Article',
  },
  {
    path: '/blog/apostila-para-obra',
    title: 'Apostila para obra: documentos e procedimentos essenciais',
    description: 'Guia completo sobre apostila de obra: o conjunto de documentos técnicos organizados para consulta no canteiro. Saiba quais documentos incluir, como organizar e os benefícios para fiscalização e auditoria.',
    priorityType: 'Article',
  },
  {
    path: '/blog/construcao-civil-tendencias-2026',
    title: 'Construção civil 2026: tendências, mercado e oportunidades para construtoras',
    description: 'As principais tendências da construção civil em 2026: mercado aquecido, digitalização de obras, novos materiais sustentáveis e oportunidades para construtoras de pequeno e médio porte.',
    priorityType: 'Article',
  },
  {
    path: '/blog/rdo-digital-como-prova-tecnica',
    title: 'RDO digital como prova técnica: validade jurídica e modelos para 2026',
    description: 'Entenda o valor jurídico do RDO digital como prova técnica em ações trabalhistas e contratuais. Guia completo com modelos, validade legal e dicas para 2026.',
    priorityType: 'Article',
  },
  {
    path: '/blog/fiscalizacao-de-obra-publica',
    title: 'Fiscalização de obra pública: direitos e deveres do fiscal',
    description: 'Guia completo sobre fiscalização de obra pública no Brasil: direitos e deveres do fiscal, fundamentação legal na Lei 14.133/2021, rotinas de vistoria, elaboração de relatórios e mediação de conflitos em contratos administrativos.',
    priorityType: 'Article',
  },
  {
    path: '/blog/rescisao-contrato-empreitada',
    title: 'Rescisão de contrato de empreitada: direitos do construtor e do contratante',
    description:
      'Guia completo sobre rescisão de contrato de empreitada na construção civil. Entenda os direitos do construtor e do contratante, prazos, indenizações, verbas rescisórias e como o RDO pode proteger ambas as partes em caso de rompimento contratual.',
    priorityType: 'Article',
  },
  {
    path: '/blog/seguranca-do-trabalho-canteiro-obras-guia-completo',
    title: 'Segurança do Trabalho no Canteiro de Obras: Guia Completo NR-18',
    description:
      'Guia completo sobre segurança do trabalho em canteiro de obras. Entenda a NR-18, EPIs obrigatórios, sinalização, análise de risco, treinamentos e como documentar tudo no RDO digital.',
    priorityType: 'Article',
  },
  {
    path: '/blog/orcamento-de-obra-como-calcular-corretamente',
    title: 'Orçamento de Obra: Como Calcular Corretamente em 2026 | Meta Construtor',
    description:
      'Aprenda como calcular orçamento de obra corretamente em 2026: composição de custos, BDI, encargos sociais, planilha SINAPI e dicas para evitar estouro de orçamento na construção civil.',
    priorityType: 'Article',
  },
  {
    path: '/blog/curso-gestao-de-obras-online-melhorar-carreira',
    title: 'Curso de Gestão de Obras Online: Como Melhorar Sua Carreira na Construção Civil',
    description:
      'Descubra como um curso de gestão de obras online pode impulsionar sua carreira na construção civil em 2026. Guia completo com melhores cursos, certificações, habilidades e oportunidades de crescimento profissional para engenheiros, arquitetos e técnicos.',
    priorityType: 'Article',
  },
  {
    path: '/blog/convencao-coletiva-construcao-civil-2026-salarios',
    title: 'Convenção Coletiva da Construção Civil 2026: Dissídio, Pisos e Salários',
    description:
      'Guia completo sobre a Convenção Coletiva da Construção Civil 2026: dissídio, pisos salariais por função, benefícios, reajustes e direitos trabalhistas. Tabela comparativa por estado e dicas para construtoras se adequarem à nova convenção.',
    priorityType: 'Article',
  },
  {
    path: '/blog/medicao-de-obra-para-pagamento-como-fazer-guia',
    title: 'Medição de Obra para Pagamento: Guia Prático Passo a Passo',
    description:
      'Guia completo sobre medição de obra para pagamento: como medir serviços executados, emitir boletim de medição, calcular valores devidos e evitar erros que atrasam o recebimento. Passo a passo prático com planilha e exemplos reais.',
    priorityType: 'Article',
  },
  {
    path: '/blog/app-para-fiscal-de-obras-controle-rotina',
    title: 'App para Fiscal de Obras: Controle a Rotina no Canteiro | Meta Construtor',
    description:
      'Descubra o melhor app para fiscal de obras. Controle rotina, registre ocorrências, organize fotos e gere relatórios direto do canteiro com o celular. Guia completo 2026.',
    priorityType: 'Article',
  },
  {
    path: '/blog/diario-de-obra-online-gratis-melhores-opcoes-2026',
    title: 'Diário de Obra Online Grátis: Melhores Opções em 2026 | Meta Construtor',
    description:
      'Comparativo completo dos melhores diários de obra online grátis em 2026. Veja opções gratuitas, recursos, limitações e qual escolher para sua construtora.',
    priorityType: 'Article',
  },
  {
    path: '/blog/gestao-de-obras-publicas-lei-licitacoes',
    title: 'Gestão de Obras Públicas: Lei de Licitações e Contratos 2026 | Meta Construtor',
    description:
      'Guia completo sobre gestão de obras públicas com a Lei 14.133/2021. Entenda modalidades, valores atualizados para 2026, PNCP, matriz de riscos e como sua construtora pode participar de licitações.',
    priorityType: 'Article',
  },
  {
    path: '/blog/dissidio-construcao-civil-2026',
    title: 'Dissídio da Construção Civil 2026: Reajuste Salarial, Convenção Coletiva e Pisos por Função | Meta Construtor',
    description:
      'Guia completo sobre o dissídio da construção civil em 2026: reajuste salarial, data-base, pisos por função, cálculo do reajuste retroativo e como a construtora deve se preparar para evitar passivo trabalhista.',
    priorityType: 'Article',
  },
  {
    path: '/blog/relatorio-diario-de-obra-fotografico-modelo',
    title: 'Relatório Diário de Obra com Fotos: Modelo e Como Fazer',
    description:
      'Aprenda como fazer um relatório diário de obra com fotos profissionais. Modelo pronto, checklist de fotos obrigatórias e dicas para documentar sua obra como um especialista.',
    priorityType: 'Article',
  },
  {
    path: '/blog/curso-gestao-de-obras-online',
    title: 'Curso de Gestão de Obras Online: Melhores Opções em 2026 | Meta Construtor',
    description:
      'Comparativo completo dos melhores cursos de gestão de obras online para engenheiros em 2026. Veja opções gratuitas e pagas, grade curricular, certificação e como escolher o ideal para impulsionar sua carreira.',
    priorityType: 'Article',
  },
  {
    path: '/blog/gestao-de-obras-publicas-licitacoes',
    title: 'Gestão de Obras Públicas: Licitações, Medição e Fiscalização | Meta Construtor',
    description:
      'Guia completo sobre gestão de obras públicas no Brasil: licitações pela Lei 14.133/2021, medição de serviços executados, fiscalização de contratos administrativos e documentação obrigatória para construtoras que trabalham com o poder público.',
    priorityType: 'Article',
  },
  {
    path: '/blog/orcamento-de-obra-com-ia',
    title: 'Orçamento de Obra com IA: Como a Inteligência Artificial Está Transformando a Construção Civil | Meta Construtor',
    description:
      'Descubra como a inteligência artificial está revolucionando o orçamento de obra na construção civil. Veja ferramentas, benefícios, cases reais e como começar a usar IA nos seus orçamentos.',
    priorityType: 'Article',
  },
  {
    path: '/blog/gestao-de-contratos-construcao-civil',
    title:
      'Gestão de Contratos na Construção Civil: Tipos, Cláusulas e Boas Práticas | Meta Construtor',
    description:
      'Guia completo sobre gestão de contratos na construção civil: tipos de contrato (empreitada, administração, integrada), cláusulas essenciais, boas práticas de gerenciamento contratual e como o RDO digital fortalece a execução do contrato.',
    priorityType: 'Article',
    faqs: [
      {
        question: 'Quais são os principais tipos de contrato na construção civil?',
        answer:
          'Os principais tipos são: empreitada por preço global (valor fixo para escopo definido), empreitada por preço unitário (preços por serviço medido), administração contratada (custo real + taxa), contrato integrada (projeto + execução com mesma empresa), contrato semi-integrada e parceria público-privada (PPP). Cada modalidade distribui riscos de forma diferente entre contratante e contratado.',
      },
      {
        question: 'O que não pode faltar em um contrato de obra?',
        answer:
          'As cláusulas essenciais são: objeto detalhado do contrato, prazo com cronograma e multas, preço e forma de pagamento com critério de reajuste, metodologia de medição dos serviços, garantias técnicas e contratuais, procedimento para aditivos e alterações de escopo, condições de rescisão, e foro ou arbitragem para solução de disputas.',
      },
      {
        question: 'Qual a diferença entre empreitada por preço global e por preço unitário?',
        answer:
          'Na empreitada por preço global, o valor é fixo e o risco de quantidade fica com o empreiteiro. Na empreitada por preço unitário, o valor total é calculado pela medição dos serviços efetivamente executados, e o risco de quantidade fica com o contratante. A escolha depende do nível de definição do projeto antes da obra.',
      },
      {
        question: 'Como o RDO digital ajuda na gestão de contratos de obra?',
        answer:
          'O RDO digital registra diariamente as atividades executadas, a equipe alocada, os materiais aplicados, as ocorrências e as paralisações — tudo com data, horário, geolocalização e fotos. Esse registro serve como prova técnica para a medição de serviços, comprova o cumprimento do escopo contratual e protege ambas as partes em caso de disputa ou rescisão.',
      },
      {
        question: 'O que acontece se o contrato de obra não tiver cláusula de medição clara?',
        answer:
          'Sem uma cláusula clara de medição, cada parte pode interpretar o critério de seu próprio modo — o que gera glosas, atrasos no pagamento e, frequentemente, ações judiciais. A cláusula deve definir: periodicidade da medição, responsável por medir, documentos exigidos (RDO, fotos, planilha), prazo para aprovação e procedimento de glosa.',
      },
      {
        question: 'Contrato de obra pública e contrato privado têm diferenças importantes?',
        answer:
          'Sim. Contratos públicos são regidos pela Lei 14.133/2021, exigem licitação, publicação no PNCP, fiscalização dedicada e matriz de riscos para contratos de grande vulto. Contratos privados seguem o Código Civil e têm maior liberdade contratual — mas a falta de rigidez documental pode aumentar o risco de disputas se não houver disciplina por iniciativa das partes.',
      },
    ],
  },
  {
    path: '/blog/qualidade-na-construcao-civil',
    title: 'Gestão da qualidade na construção civil: normas, indicadores e como implementar | Meta Construtor',
    description:
      'Guia completo sobre gestão da qualidade na construção civil: normas ABNT NBR ISO 9001 e 15575, indicadores de desempenho (RIG, NPS, taxa de conformidade), como implementar um SGQ na prática com checklist, procedimentos e ferramentas digitais.',
    priorityType: 'Article',
  },
  {
    path: '/blog/cronograma-de-obra-como-fazer',
    title: 'Cronograma de obra passo a passo: como planejar prazos e recursos na construção civil',
    description:
      'Aprenda como fazer um cronograma de obra completo passo a passo. Guia com etapas, ferramentas, dicas de planejamento de prazos e alocação de recursos na construção civil.',
    priorityType: 'Article',
  },
  {
    path: '/blog/controle-financeiro-de-obra',
    title: 'Controle financeiro de obra: como gerenciar custos, fluxo de caixa e lucratividade | Meta Construtor',
    description:
      'Guia completo sobre controle financeiro de obra: aprenda a gerenciar custos diretos e indiretos, planejar fluxo de caixa, calcular lucratividade e usar ferramentas digitais para evitar estouro de orçamento na construção civil.',
    priorityType: 'Article',
  },
  {
    path: '/blog/diario-de-obra-app-gratis',
    title: 'Diário de Obra App Grátis: Melhores Opções Gratuitas para Registro de Obras | Meta Construtor',
    description:
      'Descubra os melhores apps grátis para diário de obra em 2026. Compare funcionalidades gratuitas para RDO digital, fotos, relatórios e gestão no canteiro sem pagar nada.',
    priorityType: 'Article',
  },
  {
    path: '/blog/relatorio-fotografico-de-obra',
    title: 'Relatório Fotográfico de Obra: Como Fazer, Modelo e Importância | Meta Construtor',
    description:
      'Aprenda como fazer um relatório fotográfico de obra profissional: guia completo com passo a passo, modelo prático, dicas de fotografia no canteiro e a importância do registro visual para a documentação técnica da construção civil.',
    priorityType: 'Article',
  },
  {
    path: '/blog/inteligencia-artificial-orcamento-obra',
    title:
      'Inteligência Artificial no Orçamento de Obras: Como a IA Está Transformando Custos | Meta Construtor',
    description:
      'Descubra como a inteligência artificial está revolucionando o orçamento de obras na construção civil. Veja aplicações práticas, ferramentas de IA, machine learning para previsão de custos e como começar a usar IA hoje mesmo para reduzir erros e aumentar a precisão dos seus orçamentos.',
    priorityType: 'Article',
  },
  {
    path: '/blog/gestao-contratos-obra-digital',
    title:
      'Gestão de Contratos de Obra na Era Digital: Aditivos, Reequilíbrio, Rastreabilidade | Meta Construtor',
    description:
      'Guia completo sobre gestão de contratos de obra na era digital: tipos de contrato, aditivos contratuais, reequilíbrio econômico-financeiro, rastreabilidade documental e as melhores ferramentas digitais para construtoras.',
    priorityType: 'Article',
  },
  {
    path: '/blog/nr-18-atualizada-2026-portaria-836',
    title:
      'NR-18 Atualizada 2026: Portaria MTE nº 836 | Meta Construtor',
    description:
      'A NR-18 foi atualizada pela Portaria MTE nº 836 em 2026. Saiba o que mudou, os novos prazos, as exigências para PCMAT, EPIs digitais e como se adequar à nova norma regulamentadora.',
    priorityType: 'Article',
  },
  {
    path: '/blog/cronograma-de-obra-digital-ferramentas',
    title:
      'Cronograma de Obra Digital: Ferramentas e Métodos para 2026 | Meta Construtor',
    description:
      'Saiba como fazer um cronograma de obra digital eficiente em 2026. Conheça ferramentas, métodos como PERT/CPM, Scrum e Kanban, e como integrar o planejamento com RDO digital e medição.',
    priorityType: 'Article',
  },
  {
    path: "/central-ajuda",
    title: "Central de ajuda | Meta Construtor",
    description: "Guias para organizar a primeira obra, entender RDO, documentos, usuarios e suporte no Meta Construtor.",
  },
  {
    path: "/documentacao",
    title: "Documentacao tecnica | Meta Construtor",
    description: "Documentacao operacional com limites reais de API, webhooks, Edge Functions e integracoes do Meta Construtor.",
    priorityType: "TechArticle",
  },
  {
    path: "/api",
    title: "API Meta Construtor | Integracoes para construtoras",
    description: "Estado real de Edge Functions, permissoes, APIs e integracoes tecnicas do Meta Construtor.",
    priorityType: "TechArticle",
  },
  {
    path: "/status",
    title: "Status da plataforma | Meta Construtor",
    description: "Status operacional do Meta Construtor sem metricas publicas ficticias.",
  },
  {
    path: "/atualizacoes",
    title: "Atualizacoes | Meta Construtor",
    description: "Atualizacoes verificaveis do Meta Construtor sobre produto, integracoes, paginas publicas e backend validado.",
  },
  {
    path: "/carreiras",
    title: "Carreiras | Meta Construtor",
    description: "Conheca o contexto de carreira no Meta Construtor e envie interesse profissional pelos canais oficiais.",
  },
  {
    path: "/legal/privacidade",
    title: "Politica de privacidade | Meta Construtor",
    description: "Saiba como o Meta Construtor coleta, usa, armazena e protege dados pessoais.",
  },
  {
    path: "/legal/termos",
    title: "Termos de uso | Meta Construtor",
    description: "Consulte os termos e condicoes de uso da plataforma Meta Construtor.",
  },
  {
    path: "/legal/cookies",
    title: "Politica de cookies | Meta Construtor",
    description: "Entenda como o Meta Construtor usa cookies e tecnologias similares.",
  },
  {
    path: "/legal/lgpd",
    title: "LGPD | Meta Construtor",
    description: "Informacoes sobre conformidade com a Lei Geral de Protecao de Dados no Meta Construtor.",
  },
  {
    path: '/blog/sustentabilidade-construcao-civil-esg',
    title: 'Sustentabilidade na Construção Civil: Práticas ESG que Valorizam sua Obra | Meta Construtor',
    description:
      'Saiba como aplicar práticas ESG na construção civil para valorizar sua obra, reduzir custos e atrair investidores em 2026. Guia completo com LEED, EDGE e passo a passo.',
    priorityType: 'Article',
  },
  {
    path: '/blog/rdo-digital-faturamento-obras-publicas',
    title: 'RDO Digital para Faturamento de Obras Públicas: Guia Completo | Meta Construtor',
    description:
      'Guia completo sobre como usar o RDO digital como base para faturamento de obras públicas. Aprenda a estruturar medições, emitir boletins e acelerar recebimentos com registros diários confiáveis.',
    priorityType: 'Article',
  },
  {
    path: '/blog/medicao-de-obra-integrada-financeiro',
    title: 'Medição de Obra Integrada ao Financeiro: Como Eliminar Defasagens | Meta Construtor',
    description:
      'Aprenda como integrar a medição de obra ao financeiro para eliminar defasagens entre serviços executados e faturamento. Guia completo com processos, ferramentas e boas práticas.',
    priorityType: 'Article',
  },
  {
    path: '/blog/construcao-modular-industrializada-brasil',
    title: 'Construção Modular e Industrializada no Brasil: Vantagens e Aplicações',
    description:
      'Saiba como a construção modular e industrializada está transformando o setor no Brasil. Conheça vantagens, tipos de sistemas, aplicações e cases reais de sucesso em 2026.',
    priorityType: 'Article',
  },
  {
    path: '/blog/bim-na-gestao-de-obras',
    title: 'BIM na Gestão de Obras: Guia Completo | Meta Construtor',
    description:
      'Guia completo sobre BIM (Building Information Modeling) na gestão de obras. Aprenda como implementar BIM da modelagem à execução no canteiro, com integração RDO, cronograma 4D e medição automatizada.',
    priorityType: 'Article',
  },
  {
    path: '/blog/bim-gestao-de-obras',
    title: 'BIM na Gestão de Obras: Como a Metodologia Transforma Projetos em 2026 | Meta Construtor',
    description:
      'Aprenda como o BIM (Building Information Modeling) está transformando a gestão de obras em 2026. Guia completo sobre implementação, níveis BIM, softwares, integração com RDO digital e cases reais.',
    priorityType: 'Article',
  },
  {
    path: '/blog/checklist-recebimento-obra-entrega-chaves',
    title:
      'Checklist de Recebimento de Obra: Guia Completo para Entrega de Chaves ao Cliente | Meta Construtor',
    description:
      'Guia completo com checklist de recebimento de obra para entrega de chaves ao cliente. Aprenda as etapas da vistoria, documentos necessários, itens de verificação e como evitar retrabalho na entrega de imóveis na construção civil.',
    priorityType: 'Article',
  },
  {
    path: '/blog/custo-materiais-construcao-2026',
    title:
      'Custo de Materiais de Construção em 2026: Guia Completo para Reduzir sua Obra | Meta Construtor',
    description:
      'O custo de materiais de construção em 2026 continua subindo. Cimento, aço, areia e tubos dispararam. Descubra por que os preços sobem, como se preparar, planejar compras e controlar o orçamento da sua obra com ferramentas digitais.',
    priorityType: 'Article',
  },
  {
    path: '/blog/obra-industrializada-construcao-seco-brasil',
    title:
      'Obra Industrializada: Construção a Seco no Brasil — Steel Frame, Wood Frame e Concreto Pré-Moldado | Meta Construtor',
    description:
      'Construção a seco no Brasil: steel frame, wood frame e concreto pré-moldado. Guia completo sobre obra industrializada com vantagens, custos, prazos, normas técnicas e dicas para engenheiros e construtoras em 2026.',
    priorityType: 'Article',
  },
  {
    path: '/blog/software-gestao-obras-2026',
    title:
      'Melhores Softwares para Construtoras em 2026: Guia Completo de Escolha | Meta Construtor',
    description:
      'Guia completo com os melhores softwares para construtoras em 2026. Compare ERP, CRM, gestao de obras, RDO digital, BIM e planejamento. Escolha o sistema ideal para sua construtora.',
    priorityType: 'Article',
  },
  {
    path: '/blog/rdo-digital-app-celular',
    title:
      'RDO Digital no Celular: Como Fazer Relatório Diário de Obra pelo App | Meta Construtor',
    description:
      'Aprenda como fazer RDO digital diretamente pelo celular. Guia completo com app para relatório diário de obra, fotos, offline, assinatura digital e integração com gestão.',
    priorityType: 'Article',
  },
  {
    path: '/blog/gestao-financeira-construtora',
    title:
      'Gestão Financeira para Construtoras: Fluxo de Caixa, DRE e Controle de Custos | Meta Construtor',
    description:
      'Guia completo de gestão financeira para construtoras: fluxo de caixa por obra, DRE gerencial, controle de custos diretos e indiretos, indicadores financeiros e como digitalizar o financeiro da sua construtora.',
    priorityType: 'Article',
  },
  {
    path: '/blog/nbr-15575-desempenho-edificacoes',
    title:
      'NBR 15575: Norma de Desempenho das Edificações — Guia Completo para Construtoras | Meta Construtor',
    description:
      'Guia completo da NBR 15575 (Norma de Desempenho das Edificações): requisitos para construtoras, prazos de garantia, ensaios obrigatórios, sistemas construtivos e como se adequar à norma sem aumentar custos.',
    priorityType: 'Article',
  },
  {
    path: '/blog/construcao-sustentavel-esg-praticas',
    title:
      'Construção Sustentável: Práticas ESG que Reduzem Custos e Agregam Valor ao Imóvel | Meta Construtor',
    description:
      'Guia completo de construção sustentável com práticas ESG para construtoras: redução de custos operacionais, certificações verdes, materiais sustentáveis, eficiência energética e como agregar valor ao imóvel com sustentabilidade.',
    priorityType: 'Article',
  },
  {
    path: '/blog/construcao-sustentavel-2026',
    title:
      'Construção Sustentável 2026: Materiais, Certificações e Práticas | Meta Construtor',
    description:
      'Guia completo sobre construção sustentável em 2026: materiais ecológicos inovadores, certificações LEED/EDGE, práticas ESG e redução de carbono em obras de todos os portes.',
    priorityType: 'Article',
  },
  {
    path: '/blog/compliance-trabalhista-construcao-civil',
    title:
      'Compliance Trabalhista na Construção Civil: Como Evitar Passivos e Multas | Meta Construtor',
    description:
      'Guia completo sobre compliance trabalhista na construção civil: como evitar passivos trabalhistas, multas do MTE, auditoria de documentação de obra e proteção legal da construtora em 2026.',
    priorityType: 'Article',
  },
  {
    path: '/blog/crm-para-construtoras',
    title: 'CRM para Construtoras: Guia Completo de Gestão de Leads e Vendas de Imóveis | Meta Construtor',
    description:
      'Guia completo sobre CRM para construtoras: como gerenciar leads, acompanhar vendas, organizar o pós-venda de imóveis e integrar CRM com RDO digital e gestão de obras.',
    priorityType: 'Article',
  },
  {
    path: '/blog/gestao-de-fornecedores-obra',
    title: 'Gestão de Fornecedores na Obra: Como Comprar Melhor e Reduzir Desperdícios | Meta Construtor',
    description:
      'Guia completo de gestão de fornecedores na construção civil: como qualificar, negociar e controlar suprimentos para reduzir custos, evitar atrasos e eliminar desperdícios em 2026.',
    priorityType: 'Article',
  },
  {
    path: '/blog/nr-18-atualizada-2026',
    title:
      'NR-18 Atualizada 2026: O que Mudou na Segurança do Trabalho em Obras | Meta Construtor',
    description:
      'Guia completo sobre a NR-18 atualizada em 2026: mudanças na segurança do trabalho em obras, novas exigências de PCMAT, proteção coletiva, treinamentos obrigatórios e como documentar tudo digitalmente.',
    priorityType: 'Article',
  },
  {
    path: '/blog/aplicativo-rdo-inteligencia-artificial',
    title:
      'Aplicativo de RDO com IA: Como a Inteligência Artificial Agiliza o Diário de Obra | Meta Construtor',
    description:
      'Descubra como um aplicativo de RDO com inteligência artificial pode transformar o diário de obra da sua construtora. Automatização, reconhecimento de fotos, preenchimento inteligente e integração com gestão de obras em 2026.',
    priorityType: 'Article',
  },
  {
    path: '/blog/custo-metro-quadrado-construcao-2026',
    title: 'Custo do Metro Quadrado na Construção Civil em 2026: Tabela Atualizada e Como Calcular | Meta Construtor',
    description:
      'Descubra o custo do metro quadrado na construção civil em 2026 com tabela atualizada por padrão construtivo. Aprenda a calcular o m² da sua obra com planilha prática e evite estouro de orçamento.',
    priorityType: 'Article',
  },
  {
    path: '/blog/construcao-modular-vantagens',
    title: 'Construção Modular: Vantagens, Custos e Aplicações no Brasil | Meta Construtor',
    description:
      'Descubra as vantagens da construção modular no Brasil, os custos envolvidos, prazos de execução e onde esse método já é realidade. Guia completo com tabela comparativa e casos práticos.',
    priorityType: 'Article',
  },
  {
    path: '/blog/fiscalizacao-de-obras-publicas',
    title:
      'Fiscalização de Obras Públicas: Regras, RDO e Documentação | Meta Construtor',
    description:
      'Saiba como funciona a fiscalização de obras públicas no Brasil: regras, RDO, documentação obrigatória e como a gestão digital facilita o trabalho do fiscal e da contratada.',
    priorityType: 'Article',
  },
  {
    path: '/blog/planejamento-de-obra-cronograma',
    title:
      'Planejamento de Obra: Como Fazer Cronograma Físico-Financeiro | Meta Construtor',
    description:
      'Aprenda como fazer o planejamento de obra com cronograma físico-financeiro completo. Guia passo a passo com planilha, tabela comparativa de métodos e dicas para evitar estouro de prazo e orçamento.',
    priorityType: 'Article',
  },
  {
    path: '/blog/gestao-de-materiais-almoxarifado',
    title:
      'Gestão de Materiais e Almoxarifado em Obras: Reduza Perdas e Aumente Produtividade | Meta Construtor',
    description:
      'Aprenda como fazer a gestão de materiais e almoxarifado em obras. Controle de estoque, compras, redução de perdas e ferramentas digitais para aumentar a produtividade no canteiro.',
    priorityType: 'Article',
  },
  {
    path: '/blog/nr-18-atualizacao-2026',
    title:
      'NR-18 Atualizada 2026: Portaria MTE nº 836/2026 na Segurança do Trabalho | Meta Construtor',
    description:
      'Guia completo sobre a Portaria MTE nº 836/2026 que atualizou a NR-18: mudanças no PCMAT, proteção coletiva, treinamentos, documentação digital, prazos de adequação e impacto direto no canteiro de obras. Tudo que engenheiros e técnicos precisam saber para evitar multas e embargos.',
    priorityType: 'Article',
  },
  {
    path: '/blog/bim-na-construcao-civil',
    title: 'BIM na Construção Civil: Como a Modelagem da Informação Está Transformando Obras no Brasil',
    description:
      'Guia completo sobre BIM (Building Information Modeling) na construção civil brasileira. Aprenda como implementar a modelagem da informação, níveis BIM, softwares, impacto em obras públicas e privadas, e como integrar com RDO digital e gestão de obras.',
    priorityType: 'Article',
  },
  {
    path: '/blog/materiais-sustentaveis-construcao',
    title: 'Materiais Sustentáveis na Construção Civil: 8 Opções Viáveis para 2026',
    description:
      'Descubra 8 materiais sustentáveis para construção civil em 2026: concreto ecológico, tijolo solo-cimento, madeira certificada, telhado verde, blocos de PET, tintas ecológicas, bambu estrutural e isolamento natural. Guia completo com vantagens, custos e aplicações práticas.',
    priorityType: 'Article',
  },
  {
    path: '/blog/planejamento-de-obra-como-fazer',
    title: 'Planejamento de Obra Passo a Passo: Do Memorial Descritivo ao Cronograma Físico | Meta Construtor',
    description:
      'Guia completo de planejamento de obra: do memorial descritivo ao cronograma físico-financeiro. Aprenda cada etapa, ferramentas, prazos e como integrar o planejamento com o RDO digital.',
    priorityType: 'Article',
  },
  {
    path: '/blog/indicadores-desempenho-obra',
    title: 'Indicadores de Desempenho na Obra: KPIs Essenciais para Gestão de Construção | Meta Construtor',
    description:
      'Guia completo de KPIs para construção civil: produtividade, prazo, custo, qualidade e segurança. Aprenda quais indicadores de desempenho monitorar na sua obra, como calculá-los e interpretá-los para tomar decisões mais assertivas no canteiro.',
    priorityType: 'Article',
  },
  {
    path: '/blog/construcao-seco-steel-frame',
    title: 'Construção a Seco: Steel Frame vs Wood Frame — Qual Escolher em 2026? | Meta Construtor',
    description:
      'Steel frame ou wood frame? Compare custo, durabilidade, isolamento, prazo de obra e sustentabilidade dos dois sistemas construtivos a seco mais usados no Brasil em 2026.',
    priorityType: 'Article',
  },
  {
    path: '/blog/obra-digital-transformacao',
    title: 'Obra Digital: Como a Transformação Tecnológica Está Revolucionando os Canteiros | Meta Construtor',
    description:
      'Descubra como a obra digital está revolucionando os canteiros: sensores IoT, BIM 4D, drones, RDO digital, inteligência artificial e softwares de gestão integrada. Guia completo para construtoras.',
    priorityType: 'Article',
  },
];

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const createJsonLd = ({ path, title, description, priorityType = "WebPage", faqs }) => {
  const primary =
    priorityType === "Article"
      ? {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: title,
          description,
          datePublished: "2026-06-06",
          dateModified: "2026-06-06",
          author: {
            "@type": "Organization",
            name: "Meta Construtor",
          },
          publisher: {
            "@type": "Organization",
            name: "Meta Construtor",
          },
          mainEntityOfPage: `${siteUrl}${path}`,
        }
      : {
    "@context": "https://schema.org",
    "@type": priorityType,
    name: title,
    description,
    url: `${siteUrl}${path}`,
    isPartOf: {
      "@type": "WebSite",
      name: "Meta Construtor",
      url: siteUrl,
    },
  };

  const jsonLd = [];

  if (priorityType === "SoftwareApplication") {
    jsonLd.push(
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Meta Construtor",
        url: siteUrl,
        logo: `${siteUrl}/logo-meta-construtor.png`,
        sameAs: [siteUrl],
      },
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Meta Construtor",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web, Android, iOS",
        url: siteUrl,
        description,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "BRL",
          priceValidUntil: "2027-12-31",
          availability: "https://schema.org/InStock",
        },
      }
    );
  }

  jsonLd.push(
    primary,
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Início",
          item: `${siteUrl}/`,
        },
      ],
    },
  );

  if (faqs?.length) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    });
  }

  return jsonLd;
};

const seoBlock = (route) => {
  const canonical = `${siteUrl}${route.path}`;
  const jsonLd = createJsonLd(route)
    .map((entry) => `<script type="application/ld+json">${JSON.stringify(entry)}</script>`)
    .join("\n  ");

  return `  <title>${escapeHtml(route.title)}</title>
  <meta name="description" content="${escapeHtml(route.description)}" />
  <meta name="robots" content="index,follow" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:site_name" content="Meta Construtor" />
  <meta property="og:title" content="${escapeHtml(route.title)}" />
  <meta property="og:description" content="${escapeHtml(route.description)}" />
  <meta property="og:type" content="${route.priorityType === "Article" ? "article" : "website"}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${defaultImage}" />
  <meta property="og:locale" content="pt_BR" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(route.title)}" />
  <meta name="twitter:description" content="${escapeHtml(route.description)}" />
  <meta name="twitter:image" content="${defaultImage}" />
  ${jsonLd}`;
};

const removeFallbackSeo = (html) =>
  html
    .replace(/  <title>[\s\S]*?<\/title>\r?\n/, "")
    .replace(/  <meta name="description"[\s\S]*?>\r?\n/, "")
    .replace(/  <meta name="robots"[\s\S]*?>\r?\n/g, "")
    .replace(/  <link rel="canonical"[\s\S]*?>\r?\n/g, "")
    .replace(/  <meta property="og:[\s\S]*?>\r?\n/g, "")
    .replace(/  <meta name="twitter:[\s\S]*?>\r?\n/g, "")
    .replace(/  <script type="application\/ld\+json">[\s\S]*?<\/script>\r?\n/g, "");

const templatePath = resolve("dist/index.html");
const template = readFileSync(templatePath, "utf8");
const cleanTemplate = removeFallbackSeo(template);

for (const route of routes) {
  const outputPath = resolve("dist", route.path.slice(1), "index.html");
  const html = cleanTemplate.replace("</head>", `${seoBlock(route)}\n</head>`);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, html);
}

console.log(`Prerendered ${routes.length} public route HTML files.`);
