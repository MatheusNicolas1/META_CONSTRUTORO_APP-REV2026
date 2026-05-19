import React from 'react';
import { 
  MessageCircle, 
  Mail, 
  HardDrive, 
  Calendar,
  Instagram,
  Shield,
  Lock,
  Database
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const IntegrationsBanner = () => {
  const integrations = [
    { icon: MessageCircle, name: 'WhatsApp Business', color: 'text-green-600' },
    { icon: Mail, name: 'Gmail', color: 'text-red-500' },
    { icon: HardDrive, name: 'Google Drive', color: 'text-blue-500' },
    { icon: Calendar, name: 'Google Agenda', color: 'text-blue-600' },
    { icon: Instagram, name: 'Instagram', color: 'text-pink-500' }
  ];

  const seals = [
    { icon: Shield, text: 'LGPD-ready', color: 'text-green-600' },
    { icon: Lock, text: 'HTTPS/TLS', color: 'text-blue-600' },
    { icon: Database, text: 'Backups diários', color: 'text-purple-600' }
  ];

  return (
    <section className="py-10 md:py-14 bg-muted/30 border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-semibold leading-tight text-foreground mb-2">
            Integra com o que sua obra já usa
          </h2>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
            Conecte suas ferramentas favoritas e mantenha a segurança em primeiro lugar
          </p>
        </div>

        {/* Desktop Layout - Single Row */}
        <div className="hidden lg:flex items-center justify-center gap-8">
          {/* Integrations */}
          <div className="flex items-center justify-center gap-6">
            {integrations.map((integration, index) => (
              <div
                key={index}
                className="flex flex-col items-center justify-center gap-2.5 group hover:scale-105 transition-transform duration-200 w-20"
              >
                <div className="w-14 h-14 rounded-lg bg-background border border-border flex items-center justify-center group-hover:shadow-md transition-shadow">
                  <integration.icon className={`h-7 w-7 ${integration.color}`} />
                </div>
                <span className="text-xs text-muted-foreground font-medium text-center leading-tight">
                  {integration.name}
                </span>
              </div>
            ))}
          </div>

          {/* Separator */}
          <div className="w-px h-20 bg-border mx-8" />

          {/* Seals */}
          <div className="flex items-center gap-4">
            {seals.map((seal, index) => (
              <Badge
                key={index}
                variant="outline"
                className="flex items-center gap-2 py-2.5 px-4 bg-background border-border hover:bg-muted transition-colors"
              >
                <seal.icon className={`h-4 w-4 ${seal.color}`} />
                <span className="font-medium leading-none">{seal.text}</span>
              </Badge>
            ))}
          </div>
        </div>

        {/* Mobile & Tablet Layout */}
        <div className="lg:hidden">
          {/* Integration Grid for Mobile */}
          <div className="grid grid-cols-3 gap-4 mb-6 max-w-md mx-auto">
            {integrations.map((integration, index) => (
              <div
                key={index}
                className="flex flex-col items-center justify-center gap-2.5"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-background border border-border flex items-center justify-center">
                  <integration.icon className={`h-6 w-6 sm:h-7 sm:w-7 ${integration.color}`} />
                </div>
                <span className="text-xs text-muted-foreground font-medium text-center leading-tight">
                  {integration.name}
                </span>
              </div>
            ))}
          </div>

          {/* Mobile Seals */}
          <div className="flex flex-wrap justify-center gap-2 mt-6 px-2">
            {seals.map((seal, index) => (
              <Badge
                key={index}
                variant="outline"
                className="flex items-center gap-1.5 sm:gap-2 py-2 px-3 bg-background border-border text-xs leading-none"
              >
                <seal.icon className={`h-3.5 w-3.5 ${seal.color}`} />
                <span className="font-medium leading-none">{seal.text}</span>
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntegrationsBanner;
