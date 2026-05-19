import React from 'react';
import { Linkedin, Github, Mail } from 'lucide-react';

const TeamSection = () => {
  const teamMembers = [
    {
      name: 'Ana Silva',
      role: 'CEO & Co-fundadora',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&h=160&fit=crop&crop=face&auto=format&q=90',
      linkedin: '#',
      email: 'ana@metaconstrutor.com.br',
      bio: 'Engenheira Civil com 15+ anos de experiência em gestão de obras de grande porte.'
    },
    {
      name: 'Carlos Santos',
      role: 'CTO & Co-fundador',
      photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=160&h=160&fit=crop&crop=face&auto=format&q=90',
      linkedin: '#',
      github: '#',
      email: 'carlos@metaconstrutor.com.br',
      bio: 'Desenvolvedor Full Stack especializado em soluções SaaS para o setor industrial.'
    },
    {
      name: 'Maria Oliveira',
      role: 'Head de Produto',
      photo: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=160&h=160&fit=crop&crop=face&auto=format&q=90',
      linkedin: '#',
      email: 'maria@metaconstrutor.com.br',
      bio: 'Product Manager com foco em UX/UI e experiência do usuário em ferramentas B2B.'
    },
    {
      name: 'João Costa',
      role: 'Head de Vendas',
      photo: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=160&h=160&fit=crop&crop=face&auto=format&q=90',
      linkedin: '#',
      email: 'joao@metaconstrutor.com.br',
      bio: 'Especialista em vendas B2B com ampla experiência no mercado de construção civil.'
    }
  ];

  return (
    <section className="py-16 md:py-20 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight text-foreground mb-4 break-words">
            Quem está por trás
          </h2>
          <p className="text-base sm:text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
            Conheça a equipe que trabalha diariamente para revolucionar a gestão de obras no Brasil.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {teamMembers.map((member, index) => (
            <div 
              key={index}
              className="bg-card rounded-xl p-4 sm:p-6 border border-border text-center hover:shadow-lg transition-all duration-300 group"
            >
              {/* Photo */}
              <div className="relative mb-4 sm:mb-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full overflow-hidden border-4 border-primary/20 group-hover:border-primary/40 transition-colors shadow-md">
                  <img 
                    src={member.photo} 
                    alt={`${member.name} - ${member.role}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>

              {/* Info */}
              <h3 className="text-base sm:text-lg font-semibold leading-snug text-foreground mb-1 break-words">
                {member.name}
              </h3>
              <p className="text-primary font-medium mb-3 text-xs sm:text-sm break-words leading-tight">
                {member.role}
              </p>
              <p className="text-muted-foreground text-xs sm:text-sm mb-4 leading-relaxed break-words line-clamp-3">
                {member.bio}
              </p>

              {/* Social Links */}
              <div className="flex justify-center space-x-2 sm:space-x-3">
                {member.linkedin && (
                  <a 
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 sm:w-8 sm:h-8 bg-primary/10 hover:bg-primary/20 rounded-full flex items-center justify-center transition-colors"
                    aria-label={`LinkedIn de ${member.name}`}
                  >
                    <Linkedin className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                  </a>
                )}
                {member.github && (
                  <a 
                    href={member.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 sm:w-8 sm:h-8 bg-primary/10 hover:bg-primary/20 rounded-full flex items-center justify-center transition-colors"
                    aria-label={`GitHub de ${member.name}`}
                  >
                    <Github className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                  </a>
                )}
                {member.email && (
                  <a 
                    href={`mailto:${member.email}`}
                    className="w-7 h-7 sm:w-8 sm:h-8 bg-primary/10 hover:bg-primary/20 rounded-full flex items-center justify-center transition-colors"
                    aria-label={`Email de ${member.name}`}
                  >
                    <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
