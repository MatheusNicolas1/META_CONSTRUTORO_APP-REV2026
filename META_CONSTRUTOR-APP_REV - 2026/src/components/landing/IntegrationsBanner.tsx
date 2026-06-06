import {
  Calendar,
  Database,
  HardDrive,
  Instagram,
  Lock,
  Mail,
  MessageCircle,
  Shield,
} from "lucide-react";

const integrations = [
  { icon: MessageCircle, name: "WhatsApp Business" },
  { icon: Mail, name: "Gmail" },
  { icon: HardDrive, name: "Google Drive" },
  { icon: Calendar, name: "Google Agenda" },
  { icon: Instagram, name: "Instagram" },
];

const seals = [
  { icon: Shield, text: "LGPD-ready" },
  { icon: Lock, text: "HTTPS/TLS" },
  { icon: Database, text: "Backups diarios" },
];

const IntegrationsBanner = () => {
  return (
    <section className="bg-muted/30 px-2 py-10 md:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="mb-2 text-xl font-semibold leading-tight text-foreground md:text-2xl">
            Integra com o que sua obra ja usa
          </h2>
          <p className="mx-auto max-w-[64ch] text-sm leading-relaxed text-muted-foreground md:text-base">
            Conecte ferramentas do dia a dia e mantenha a seguranca em primeiro lugar.
          </p>
        </div>

        <div className="hidden items-center justify-center gap-8 lg:flex">
          <div className="flex items-center justify-center gap-6">
            {integrations.map((integration) => (
              <div key={integration.name} className="flex w-20 flex-col items-center justify-center gap-2.5">
                <div className="flex h-14 w-14 items-center justify-center text-primary">
                  <integration.icon className="h-7 w-7" />
                </div>
                <span className="text-center text-xs font-medium leading-tight text-muted-foreground">
                  {integration.name}
                </span>
              </div>
            ))}
          </div>

          <div className="mx-8 h-20 w-px bg-border" />

          <div className="flex items-center gap-4">
            {seals.map((seal) => (
              <div
                key={seal.text}
                className="flex items-center gap-2 px-2 py-2 text-sm text-foreground"
              >
                <seal.icon className="h-4 w-4 text-primary" />
                <span className="font-medium leading-none">{seal.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:hidden">
          <div className="mx-auto mb-6 grid max-w-md grid-cols-3 gap-4">
            {integrations.map((integration) => (
              <div key={integration.name} className="flex flex-col items-center justify-center gap-2.5">
                <div className="flex h-12 w-12 items-center justify-center text-primary sm:h-14 sm:w-14">
                  <integration.icon className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <span className="text-center text-xs font-medium leading-tight text-muted-foreground">
                  {integration.name}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2 px-2">
            {seals.map((seal) => (
              <div
                key={seal.text}
                className="flex items-center gap-1.5 px-2 py-2 text-xs leading-none text-foreground sm:gap-2"
              >
                <seal.icon className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium leading-none">{seal.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntegrationsBanner;
