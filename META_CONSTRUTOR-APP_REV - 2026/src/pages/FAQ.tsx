import { HelpCircle, Search, Book, Phone } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdvancedChat } from "@/components/ui/advanced-chat";

const FAQ = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showChat, setShowChat] = useState(false);

  const faqData = [
    {
      category: "Obras",
      questions: [
        {
          question: "Como criar uma nova obra?",
          answer: "Para criar uma nova obra, acesse a seção 'Obras' no menu lateral e clique no botão 'Nova Obra'. Preencha todos os campos obrigatórios como nome da obra, endereço, cliente e datas previstas de início e término.",
        },
        {
          question: "Como acompanhar o progresso de uma obra?",
          answer: "O progresso pode ser acompanhado através do dashboard principal ou na página específica da obra. Você verá indicadores de progresso, atividades concluídas e próximas etapas.",
        },
        {
          question: "Posso editar informações de uma obra em andamento?",
          answer: "Sim, você pode editar a maioria das informações de uma obra. Acesse a obra desejada e clique no botão 'Editar'. Algumas informações críticas podem requerer permissões especiais.",
        },
      ],
    },
    {
      category: "RDO",
      questions: [
        {
          question: "O que é um RDO e como preencher?",
          answer: "RDO (Relatório Diário de Obra) é um documento que registra todas as atividades, ocorrências e recursos utilizados diariamente na obra. Para preencher, acesse 'RDO' no menu e selecione a obra e data correspondentes.",
        },
        {
          question: "Posso alterar um RDO já enviado?",
          answer: "RDOs já enviados têm edição restrita por questões de auditoria. Dependendo da configuração da sua empresa, você pode ter um período de carência para edições ou precisará de aprovação especial.",
        },
        {
          question: "Como anexar fotos ao RDO?",
          answer: "Durante o preenchimento do RDO, você encontrará a seção 'Anexos' onde pode carregar fotos do progresso da obra. São aceitos arquivos JPG, PNG e PDF até 10MB cada.",
        },
      ],
    },
    {
      category: "Equipes",
      questions: [
        {
          question: "Como gerenciar equipes de trabalho?",
          answer: "Na seção 'Equipes', você pode criar grupos de trabalho, adicionar membros, definir funções e acompanhar a produtividade. Cada membro pode ter diferentes níveis de acesso.",
        },
        {
          question: "Como adicionar novos funcionários?",
          answer: "Acesse 'Equipes' > 'Adicionar Membro'. Preencha os dados pessoais, função, salário (se autorizado) e defina as permissões de acesso ao sistema.",
        },
        {
          question: "Posso transferir funcionários entre obras?",
          answer: "Sim, você pode realocar funcionários entre obras diferentes através da seção de gerenciamento de equipes. O histórico de trabalho é mantido para controle.",
        },
      ],
    },
    {
      category: "Relatórios",
      questions: [
        {
          question: "Que tipos de relatórios estão disponíveis?",
          answer: "O sistema oferece relatórios de progresso de obras, produtividade de equipes, consumo de materiais, análise de custos e relatórios personalizáveis por período.",
        },
        {
          question: "Como exportar relatórios?",
          answer: "Todos os relatórios podem ser exportados em formato PDF. Clique no botão 'Exportar' na parte superior do relatório para baixar o arquivo.",
        },
        {
          question: "Relatorios automaticos ja estao disponiveis?",
          answer: "Nao como rotina agendada independente. Hoje os relatorios podem ser gerados/exportados nos fluxos reais do app; envios por integracao dependem de backend e credenciais configuradas.",
        },
      ],
    },
    {
      category: "Sistema",
      questions: [
        {
          question: "Como alterar minha senha?",
          answer: "Acesse 'Configurações' no menu do seu perfil, vá para a seção 'Segurança' e clique em 'Alterar Senha'. Você precisará informar a senha atual e a nova senha.",
        },
        {
          question: "O sistema funciona offline?",
          answer: "O sistema tem funcionalidade offline limitada. Você pode visualizar dados já carregados e fazer anotações, mas sincronização completa requer conexão com internet.",
        },
        {
          question: "Como fazer backup dos dados?",
          answer: "Os dados operacionais ficam persistidos no Supabase conforme as acoes do app. Esta versao nao oferece uma rotina de backup automatico configuravel pelo usuario; exportacoes e copias externas devem ser tratadas como processo operacional.",
        },
      ],
    },
  ];

  const filteredFAQ = faqData.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => 
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.category.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter(category => category.questions.length > 0);

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Central de Ajuda</h1>
          <p className="text-muted-foreground mt-2">
            Encontre respostas para as principais dúvidas sobre o sistema
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por dúvidas, palavras-chave..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            {filteredFAQ.map((category, categoryIndex) => (
              <Card key={categoryIndex}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-primary" />
                      {category.category}
                    </CardTitle>
                    <Badge variant="secondary">{category.questions.length} pergunta(s)</Badge>
                  </div>
                  <CardDescription>
                    Principais dúvidas sobre {category.category.toLowerCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible>
                    {category.questions.map((faq, questionIndex) => (
                      <AccordionItem key={questionIndex} value={`${categoryIndex}-${questionIndex}`}>
                        <AccordionTrigger className="text-left">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}

            {filteredFAQ.length === 0 && searchTerm && (
              <Card>
                <CardContent className="text-center py-12">
                  <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Nenhuma pergunta encontrada
                  </h3>
                  <p className="text-muted-foreground">
                    Não encontramos nenhuma pergunta relacionada à "{searchTerm}".
                    <br />
                    Tente usar palavras-chave diferentes ou entre em contato conosco.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Book className="h-4 w-4" />
                  Documentação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Manual do Usuário
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Guia de Início Rápido
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Vídeos Tutoriais
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Phone className="h-4 w-4" />
                  Precisa de Ajuda?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button size="sm" className="w-full" onClick={() => setShowChat(true)}>
                  Abrir Chamado
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {showChat && <AdvancedChat onClose={() => setShowChat(false)} />}
    </>
  );
};

export default FAQ;
