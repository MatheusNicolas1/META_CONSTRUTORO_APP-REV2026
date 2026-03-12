import React from 'react';
import { Scale } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SEO from '@/components/SEO';
import { useNavigate } from 'react-router-dom';

const LGPD = () => {
  const navigate = useNavigate();
  return (
    <>
      <SEO
        title="LGPD - Meta Construtor"
        description="Informações sobre conformidade com a Lei Geral de Proteção de Dados"
      />

      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-3 mb-8">
            <Scale className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Conformidade com a LGPD</h1>
          </div>

          <Card className="mb-6">
            <CardContent className="p-8">
              <p className="text-lg text-muted-foreground leading-relaxed">
                A Meta Construtor está em total conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
                Este documento explica como cumprimos as exigências da LGPD e protegemos seus dados pessoais.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8 space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Nosso Compromisso</h2>
                <p className="text-muted-foreground leading-relaxed">
                  A Meta Construtor reconhece a importância da proteção de dados pessoais e implementou práticas, processos e tecnologias para garantir o tratamento adequado das informações de nossos usuários em conformidade com a LGPD.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. Bases Legais para Tratamento de Dados</h2>
                <p className="text-muted-foreground mb-3">Tratamos seus dados pessoais com base em:</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong>Consentimento:</strong> Para finalidades específicas que você autoriza</li>
                  <li><strong>Execução de contrato:</strong> Para fornecer os serviços contratados</li>
                  <li><strong>Obrigação legal:</strong> Para cumprimento de obrigações regulatórias</li>
                  <li><strong>Legítimo interesse:</strong> Para melhorias do serviço e segurança</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. Seus Direitos como Titular</h2>
                <p className="text-muted-foreground mb-3">De acordo com a LGPD, você tem os seguintes direitos:</p>
                <div className="space-y-3">
                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold text-foreground mb-1">Confirmação e Acesso</h3>
                    <p className="text-sm text-muted-foreground">Confirmar se tratamos seus dados e acessá-los</p>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold text-foreground mb-1">Correção</h3>
                    <p className="text-sm text-muted-foreground">Corrigir dados incompletos, inexatos ou desatualizados</p>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold text-foreground mb-1">Anonimização, Bloqueio ou Eliminação</h3>
                    <p className="text-sm text-muted-foreground">Solicitar anonimização, bloqueio ou eliminação de dados desnecessários</p>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold text-foreground mb-1">Portabilidade</h3>
                    <p className="text-sm text-muted-foreground">Receber seus dados em formato estruturado</p>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold text-foreground mb-1">Informação sobre Compartilhamento</h3>
                    <p className="text-sm text-muted-foreground">Saber com quem compartilhamos seus dados</p>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold text-foreground mb-1">Revogação do Consentimento</h3>
                    <p className="text-sm text-muted-foreground">Revogar consentimento a qualquer momento</p>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold text-foreground mb-1">Oposição</h3>
                    <p className="text-sm text-muted-foreground">Se opor ao tratamento em casos específicos</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">4. Como Exercer seus Direitos</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Para exercer qualquer um dos direitos acima, você pode:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Acessar as configurações da sua conta na plataforma</li>
                  <li>Entrar em contato com nosso Encarregado de Dados (DPO)</li>
                  <li>Enviar solicitação por email ou telefone</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  Responderemos sua solicitação em até 15 dias úteis.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">5. Medidas de Segurança</h2>
                <p className="text-muted-foreground mb-3">Implementamos medidas técnicas e organizacionais robustas:</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Criptografia de dados em trânsito e em repouso</li>
                  <li>Controles de acesso baseados em função (RBAC)</li>
                  <li>Monitoramento contínuo de segurança</li>
                  <li>Auditorias regulares de segurança</li>
                  <li>Treinamento de equipe em proteção de dados</li>
                  <li>Procedimentos de resposta a incidentes</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">6. Compartilhamento de Dados</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Compartilhamos dados apenas quando necessário e sempre em conformidade com a LGPD. Todos os parceiros e fornecedores são cuidadosamente selecionados e devem aderir aos mesmos padrões de proteção de dados.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Transferência Internacional</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Quando realizamos transferência internacional de dados, garantimos que o país de destino ofereça grau adequado de proteção ou utilizamos cláusulas contratuais padrão aprovadas pela ANPD.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">8. Retenção de Dados</h2>
                <p className="text-muted-foreground mb-3">Seus dados são retidos conforme as seguintes regras:</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong>Conta ativa:</strong> Dados mantidos enquanto a conta existir e for utilizada</li>
                  <li><strong>Exclusão de conta:</strong> Dados pessoais são removidos <strong>imediatamente</strong> e de forma irreversível no momento da solicitação</li>
                  <li><strong>Logs de auditoria:</strong> Registros anonimizados de ações são mantidos por 12 meses para fins de segurança e conformidade</li>
                  <li><strong>Dados financeiros:</strong> Mantidos pelo prazo legal de 5 anos conforme legislação tributária brasileira</li>
                  <li><strong>Backups:</strong> Backups criptografados são eliminados automaticamente conforme o ciclo de rotação (máximo 30 dias)</li>
                </ul>
                <p className="text-muted-foreground mt-3">
                  Não aplicamos período de retenção pós-exclusão para dados pessoais. A exclusão é imediata e definitiva.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">9. Incidentes de Segurança</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Em caso de incidente de segurança que possa acarretar risco aos seus direitos e liberdades, notificaremos você e a Autoridade Nacional de Proteção de Dados (ANPD) em até 72 horas, conforme exigido pela lei.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">10. Encarregado de Proteção de Dados (DPO)</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Designamos um Encarregado de Proteção de Dados para atuar como canal de comunicação entre a empresa, os titulares de dados e a ANPD.
                </p>
                <div className="bg-muted p-6 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-3">Entre em contato com nosso DPO:</h3>
                  <div className="space-y-2 text-muted-foreground">
                    <p><strong>Nome:</strong> João da Silva</p>
                    <p><strong>Email:</strong> dpo@metaconstrutor.com</p>
                    <p><strong>Telefone:</strong> (11) 99999-9999</p>
                    <p><strong>Horário:</strong> Segunda a Sexta, 9h às 18h</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">11. Atualização desta Página</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Esta página pode ser atualizada periodicamente para refletir mudanças em nossas práticas ou na legislação. A data da última atualização está indicada no final deste documento.
                </p>
              </section>

              <div className="text-sm text-muted-foreground pt-6 border-t">
                <p>Última atualização: Fevereiro de 2026</p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="outline" onClick={() => navigate('/app/perfil?tab=seguranca')}>
              Solicitar / Exportar Meus Dados
            </Button>
            <Button size="lg" variant="outline" onClick={() => window.location.href = 'mailto:dpo@metaconstrutor.com?subject=Solicitação LGPD'}>
              Falar com o DPO
            </Button>
            <Button size="lg" variant="destructive" onClick={() => navigate('/app/perfil?tab=seguranca')}>
              Excluir Meus Dados
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default LGPD;
