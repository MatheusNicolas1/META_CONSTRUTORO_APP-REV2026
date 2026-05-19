import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const DemoSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const demoSlides = [
    {
      title: 'Dashboard Intuitivo',
      description: 'Acompanhe o progresso de todas as obras em tempo real',
      image: '/lovable-uploads/d26b1c16-cf45-4b95-907f-6a9dc3d91c1b.png',
      alt: 'Dashboard do MetaConstrutor mostrando visão geral das obras'
    },
    {
      title: 'RDO Digital Completo',
      description: 'Relatório diário com assinaturas digitais e anexos',
      image: '/lovable-uploads/88fb2ed6-4112-4143-87be-f4c2c06e74ff.png',
      alt: 'Interface do RDO digital com campos preenchidos'
    },
    {
      title: 'Checklist Inteligente',
      description: 'Verificações automatizadas para controle de qualidade',
      image: '/lovable-uploads/6ab8d367-0546-4675-963c-ff7a7066b414.png',
      alt: 'Tela de checklist com itens marcados e fotos anexadas'
    },
    {
      title: 'Gestão de Equipes',
      description: 'Controle de produtividade e alocação de recursos',
      image: '/lovable-uploads/76a9f4dd-826d-4e37-96e0-af347f2966eb.png',
      alt: 'Interface de gestão de equipes e cronograma'
    },
    {
      title: 'Relatórios Avançados',
      description: 'Analytics completos para tomada de decisão',
      image: '/lovable-uploads/90cfd2dd-c274-4760-ae9a-7d4c004e0180.png',
      alt: 'Dashboards com gráficos e métricas de performance'
    },
    {
      title: 'Integrações Poderosas',
      description: 'Conecte com WhatsApp, Gmail e outras ferramentas',
      image: '/lovable-uploads/5557c860-388b-4ad5-bde2-5718350a8197.png',
      alt: 'Tela de configuração de integrações com diversos serviços'
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % demoSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + demoSlides.length) % demoSlides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <section className="py-12 md:py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Veja o MetaConstrutor em ação
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Conheça as principais funcionalidades através de um tour visual 
            da nossa plataforma completa de gestão de obras.
          </p>
        </div>

        {/* Demo Carousel */}
        <div className="relative max-w-5xl mx-auto">
          <Card className="overflow-hidden border-0 shadow-xl">
            <CardContent className="p-0">
              <div className="relative">
                {/* Main Image */}
                <div className="relative aspect-video md:aspect-[16/10] overflow-hidden">
                  <img
                    src={demoSlides[currentSlide].image}
                    alt={demoSlides[currentSlide].alt}
                    className="w-full h-full object-cover object-top transition-opacity duration-500"
                    loading="lazy"
                  />
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
          {/* Content overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 text-white">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2">
              {demoSlides[currentSlide].title}
            </h3>
            <p className="text-white/90 max-w-lg text-sm sm:text-base">
              {demoSlides[currentSlide].description}
            </p>
          </div>
                </div>

                {/* Navigation Arrows */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white border-0 w-8 h-8 sm:w-10 sm:h-10"
                  onClick={prevSlide}
                  aria-label="Slide anterior"
                >
                  <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white border-0 w-8 h-8 sm:w-10 sm:h-10"
                  onClick={nextSlide}
                  aria-label="Próximo slide"
                >
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Slide Indicators */}
          <div className="flex justify-center mt-6 space-x-2">
            {demoSlides.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'bg-primary scale-125' 
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                onClick={() => goToSlide(index)}
                aria-label={`Ir para slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Mini thumbnails */}
          <div className="hidden lg:flex justify-center mt-8 space-x-4">
            {demoSlides.map((slide, index) => (
              <button
                key={index}
                className={`relative w-20 h-12 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                  index === currentSlide 
                    ? 'border-primary scale-110' 
                    : 'border-transparent opacity-60 hover:opacity-80'
                }`}
                onClick={() => goToSlide(index)}
              >
                <img
                  src={slide.image}
                  alt={slide.alt}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-8 sm:mt-10">
          <Button 
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-xl"
            onClick={() => {
              if ((window as any).gtag) {
                (window as any).gtag('event', 'demo_cta_click', {
                  page_location: window.location.href
                });
              }
              window.open('/checkout?plan=free', '_blank');
            }}
          >
            <Play className="mr-2 h-5 w-5" />
            Experimente Agora Grátis
          </Button>
        </div>
      </div>
    </section>
  );
};

export default DemoSection;
