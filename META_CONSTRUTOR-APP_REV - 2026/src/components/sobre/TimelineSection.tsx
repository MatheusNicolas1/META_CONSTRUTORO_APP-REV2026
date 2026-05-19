import React from 'react';
import { Calendar, Users, Rocket, Globe } from 'lucide-react';

const TimelineSection = () => {
  const milestones = [
    {
      year: '2022',
      title: 'Início do projeto',
      description: 'Idealização da plataforma após identificar as principais dores do setor de construção civil.',
      icon: Calendar,
      color: 'from-blue-500 to-blue-600'
    },
    {
      year: '2023',
      title: 'Primeiros clientes e pilotos',
      description: 'Lançamento dos primeiros pilotos com construtoras parceiras em Salvador/BA.',
      icon: Users,
      color: 'from-green-500 to-green-600'
    },
    {
      year: '2024',
      title: 'Lançamento da plataforma SaaS',
      description: 'Disponibilização oficial da plataforma completa de gestão de obras.',
      icon: Rocket,
      color: 'from-purple-500 to-purple-600'
    },
    {
      year: '2025',
      title: 'Integrações e expansão nacional',
      description: 'Desenvolvimento de integrações nativas e expansão para todo território nacional.',
      icon: Globe,
      color: 'from-orange-500 to-orange-600'
    }
  ];

  return (
    <section className="py-16 md:py-20 bg-muted/30 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight text-foreground mb-4 break-words">
            Nossa História
          </h2>
          <p className="text-base sm:text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
            Uma jornada de inovação e crescimento no setor da construção civil.
          </p>
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-1/2 transform -translate-x-px h-full w-0.5 bg-border md:block hidden"></div>
          
          <div className="space-y-12">
            {milestones.map((milestone, index) => (
              <div key={index} className="relative flex items-center">
                {/* Desktop layout */}
                <div className="hidden md:flex items-center w-full">
                  {index % 2 === 0 ? (
                    <>
                      {/* Left content */}
                      <div className="w-1/2 pr-8 text-right">
                        <div className="bg-card rounded-lg p-6 border border-border shadow-sm hover:shadow-md transition-shadow">
                          <div className="text-2xl font-semibold leading-none text-primary mb-2">
                            {milestone.year}
                          </div>
                          <h3 className="text-xl font-semibold leading-snug text-foreground mb-3">
                            {milestone.title}
                          </h3>
                          <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                            {milestone.description}
                          </p>
                        </div>
                      </div>
                      
                      {/* Center icon */}
                      <div className="relative z-10 flex items-center justify-center w-12 h-12 bg-background border-4 border-primary rounded-full shadow-lg">
                        <milestone.icon className="w-6 h-6 text-primary" />
                      </div>
                      
                      {/* Right spacer */}
                      <div className="w-1/2 pl-8"></div>
                    </>
                  ) : (
                    <>
                      {/* Left spacer */}
                      <div className="w-1/2 pr-8"></div>
                      
                      {/* Center icon */}
                      <div className="relative z-10 flex items-center justify-center w-12 h-12 bg-background border-4 border-primary rounded-full shadow-lg">
                        <milestone.icon className="w-6 h-6 text-primary" />
                      </div>
                      
                      {/* Right content */}
                      <div className="w-1/2 pl-8">
                        <div className="bg-card rounded-lg p-6 border border-border shadow-sm hover:shadow-md transition-shadow">
                          <div className="text-2xl font-semibold leading-none text-primary mb-2">
                            {milestone.year}
                          </div>
                          <h3 className="text-xl font-semibold leading-snug text-foreground mb-3">
                            {milestone.title}
                          </h3>
                          <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                            {milestone.description}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Mobile layout */}
                <div className="md:hidden w-full min-w-0 flex items-start gap-3 sm:gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <milestone.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="bg-card rounded-lg p-4 border border-border flex-1 min-w-0">
                    <div className="text-lg font-semibold leading-none text-primary mb-1">
                      {milestone.year}
                    </div>
                    <h3 className="text-lg font-semibold leading-snug text-foreground mb-2 break-words">
                      {milestone.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground break-words">
                      {milestone.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TimelineSection;
