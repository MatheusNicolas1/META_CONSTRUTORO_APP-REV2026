import React from 'react';
import { Quote } from 'lucide-react';

const InstitutionalTestimonials = () => {
  const testimonials = [
    {
      quote: "O MetaConstrutor transformou nossa gestão de obras. Reduzimos 40% do retrabalho e aumentamos nossa produtividade significativamente.",
      author: "Roberto Mendes",
      position: "Diretor Executivo",
      company: "Construtora Horizonte",
      profileImage: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=160&h=160&fit=crop&crop=face&auto=format&q=90",
      companyLogo: "/lovable-uploads/76a9f4dd-826d-4e37-96e0-af347f2966eb.png"
    },
    {
      quote: "A plataforma é intuitiva e o suporte é excepcional. Nossa equipe se adaptou rapidamente e os resultados apareceram em poucas semanas.",
      author: "Fernanda Lima",
      position: "Gerente de Projetos",
      company: "Incorporadora Moderna",
      profileImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&h=160&fit=crop&crop=face&auto=format&q=90",
      companyLogo: "/lovable-uploads/90cfd2dd-c274-4760-ae9a-7d4c004e0180.png"
    },
    {
      quote: "Finalmente uma solução brasileira que entende as necessidades reais do nosso setor. Recomendo para qualquer construtora séria.",
      author: "André Silva",
      position: "Sócio-Diretor",
      company: "Engenharia Silva & Associados",
      profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&h=160&fit=crop&crop=face&auto=format&q=90",
      companyLogo: "/lovable-uploads/d26b1c16-cf45-4b95-907f-6a9dc3d91c1b.png"
    }
  ];

  return (
    <section className="py-16 md:py-20 bg-muted/30 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight text-foreground mb-4 break-words">
            Depoimentos de Líderes do Setor
          </h2>
          <p className="text-base sm:text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
            Veja o que nossos parceiros dizem sobre o impacto do MetaConstrutor em suas empresas.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-card rounded-xl p-4 sm:p-6 lg:p-8 border border-border hover:shadow-lg transition-all duration-300 relative"
            >
              {/* Quote icon */}
              <div className="absolute top-4 sm:top-6 right-4 sm:right-6 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Quote className="w-4 h-4 text-primary" />
              </div>

              {/* Testimonial text */}
              <blockquote className="text-muted-foreground mb-6 leading-relaxed italic text-sm sm:text-base break-words hyphens-auto pr-8 line-clamp-6">
                "{testimonial.quote}"
              </blockquote>

              {/* Author info */}
              <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                {/* Profile image */}
                <div className="flex-shrink-0">
                  <img 
                    src={testimonial.profileImage} 
                    alt={`Foto de perfil de ${testimonial.author}`}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border-2 border-border shadow-sm"
                    loading="lazy"
                  />
                </div>

                {/* Author details */}
                <div className="min-w-0 flex-1">
                  <cite className="text-foreground font-semibold leading-snug not-italic text-sm sm:text-base block mb-1 break-words">
                    {testimonial.author}
                  </cite>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1 break-words leading-tight">
                    {testimonial.position}
                  </p>
                  <p className="text-xs sm:text-sm text-primary font-medium break-words leading-tight">
                    {testimonial.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InstitutionalTestimonials;
