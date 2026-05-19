import React from 'react';
import { Code2, Zap, Shield, Workflow } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SEO from '@/components/SEO';
import { useNavigate } from 'react-router-dom';

const APIPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Zap,
      title: 'RÃ¡pida e EscalÃ¡vel',
      description: 'Performance otimizada com respostas em menos de 50ms'
    },
    {
      icon: Shield,
      title: 'Segura',
      description: 'AutenticaÃ§Ã£o robusta e criptografia end-to-end'
    },
    {
      icon: Workflow,
      title: 'RESTful',
      description: 'Arquitetura REST padrÃ£o e fÃ¡cil de integrar'
    },
    {
      icon: Code2,
      title: 'SDKs DisponÃ­veis',
      description: 'Bibliotecas para JavaScript, Python, PHP e mais'
    }
  ];

  return (
    <>
      <SEO 
        title="API - Meta Construtor"
        description="API REST robusta para integrar o Meta Construtor em seus sistemas"
      />
      
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-primary/10 to-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                API Meta Construtor
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                Integre a gestÃ£o de obras diretamente nos seus sistemas com nossa API RESTful robusta e escalÃ¡vel
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => navigate('/documentacao')}>
                  Ver DocumentaÃ§Ã£o
                </Button>
                <Button size="lg" variant="outline">
                  Criar Conta
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index}>
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Code Example */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Comece em Minutos</h2>
            <Card>
              <CardHeader>
                <CardTitle>Exemplo de IntegraÃ§Ã£o</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-6 rounded-lg overflow-x-auto">
                  <code className="text-sm">
{`// Instale o SDK
npm install @metaconstrutor/sdk

// Inicialize o cliente
import { MetaConstrutor } from '@metaconstrutor/sdk';

const client = new MetaConstrutor({
  apiKey: process.env.METACONSTRUTOR_API_KEY
});

// Liste obras
const obras = await client.obras.list({
  status: 'em_andamento'
});

// Crie um RDO
const rdo = await client.rdos.create({
  obra_id: 'obra_123',
  data: '2024-01-15',
  clima: 'ensolarado',
  periodo: 'manha'
});
const rdoId = rdo.id;`}
                  </code>
                </pre>
              </CardContent>
            </Card>
          </div>

          {/* Pricing CTA */}
          <Card className="mt-16 bg-primary text-primary-foreground">
            <CardContent className="p-12 text-center">
              <h3 className="text-2xl font-bold mb-4">Pronto para comeÃ§ar?</h3>
              <p className="text-lg mb-6 opacity-90 max-w-2xl mx-auto">
                Acesso Ã  API incluÃ­do em todos os planos. Comece gratuitamente e escale conforme necessÃ¡rio.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="secondary" size="lg" onClick={() => navigate('/preco')}>
                  Ver Planos
                </Button>
                <Button variant="secondary" size="lg" onClick={() => navigate('/documentacao')}>
                  DocumentaÃ§Ã£o Completa
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default APIPage;
