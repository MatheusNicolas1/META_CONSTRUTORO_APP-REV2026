/**
 * Perguntas frequentes exibidas na home e em /preco.
 * Fonte única para o texto visível e para o JSON-LD FAQPage (o Google exige que as
 * perguntas marcadas no schema estejam visíveis na página).
 */

export interface PublicFaq {
  question: string;
  answer: string;
}

export const homeFaq: PublicFaq[] = [
  { question: 'Preciso instalar algo?', answer: 'Não. O Meta Construtor funciona 100% online. Basta acessar pelo navegador no computador, tablet ou celular.' },
  { question: 'Meus dados estão seguros?', answer: 'Sim. Usamos criptografia em trânsito e em repouso, autenticação segura e seguimos a LGPD. Seus dados são isolados por obra e organização.' },
  { question: 'Funciona offline?', answer: 'O Meta Construtor precisa de internet para salvar os registros. Se a conexão cair, telas já abertas podem continuar visíveis, mas RDOs e fotos só são enviados com conexão.' },
  { question: 'Posso migrar meus dados?', answer: 'Hoje não há importação automática de planilhas. Fale com a equipe para avaliarmos a migração dos seus dados.' },
  { question: 'Tem suporte em português?', answer: 'Sim! Nosso time fala português e entende o dia a dia da construção civil brasileira.' },
  { question: 'Como funciona o cancelamento?', answer: 'Você pode cancelar a qualquer momento. Seus dados ficam disponíveis por 30 dias para exportação.' },
];

export const precoFaq: PublicFaq[] = [
  { question: 'Posso trocar de plano depois?', answer: 'Sim. Você pode fazer upgrade ou downgrade a qualquer momento. No upgrade, você paga apenas a diferença proporcional.' },
  { question: 'Como funciona o cancelamento?', answer: 'Você pode cancelar a qualquer momento pelo painel. Seus dados ficam disponíveis para exportação por 30 dias.' },
  { question: 'Preciso de cartão para o plano grátis?', answer: 'Não. O plano Grátis não pede cartão de crédito. Basta criar sua conta e começar a usar.' },
  { question: 'Tem desconto no plano anual?', answer: 'Sim! No plano anual você economiza 20% em relação ao valor mensal. Por exemplo, o plano Master sai de R$ 347,00/mês para R$ 277,60/mês — uma economia de R$ 832,80 por ano.' },
  { question: 'Qual a diferença entre Profissional e Master?', answer: 'O Master inclui tudo do Profissional, mais API personalizada, integração com ERP, suporte prioritário (SLA 8h) e treinamento dedicado.' },
  { question: 'O que acontece se eu atingir o limite de obras?', answer: 'Você recebe um aviso e pode fazer upgrade para o plano superior a qualquer momento, sem perder dados.' },
  { question: 'O plano Grátis tem limite de RDOs?', answer: 'Sim. O plano Grátis oferece 7 RDOs por mês. Ao atingir o limite, você pode fazer upgrade para um plano pago e continuar usando sem interrupção. Os créditos são resetados mensalmente.' },
  { question: 'Vocês emitem nota fiscal?', answer: 'Sim. Emitimos nota fiscal para todos os planos pagos.' },
];
