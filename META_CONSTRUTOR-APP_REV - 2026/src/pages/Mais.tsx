import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  FileText, 
  Users, 
  Wrench, 
  Settings, 
  BarChart3, 
  Link as LinkIcon, 
  User,
  Building2,
  ClipboardList,
  Package
} from "lucide-react";

const menuItems = [
  {
    title: "Documentos",
    description: "Gerencie documentos das obras",
    icon: FileText,
    to: "/app/documentos",
  },
  {
    title: "Fornecedores",
    description: "Cadastro de fornecedores",
    icon: Package,
    to: "/app/fornecedores",
  },
  {
    title: "Equipes",
    description: "Gestão de equipes",
    icon: Users,
    to: "/app/equipes",
  },
  {
    title: "Equipamentos",
    description: "Controle de equipamentos",
    icon: Wrench,
    to: "/app/equipamentos",
  },
  {
    title: "Checklist",
    description: "Checklists de segurança",
    icon: ClipboardList,
    to: "/app/checklist",
  },
  {
    title: "Relatórios",
    description: "Relatórios e análises",
    icon: BarChart3,
    to: "/app/relatorios",
  },
  {
    title: "Integrações",
    description: "Integrações e automações",
    icon: LinkIcon,
    to: "/app/integracoes",
  },
  {
    title: "Perfil",
    description: "Seu perfil e configurações",
    icon: User,
    to: "/app/perfil",
  },
  {
    title: "Configurações",
    description: "Configurações do sistema",
    icon: Settings,
    to: "/app/configuracoes",
  },
];

export default function Mais() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Mais Opções</h1>
        <p className="text-muted-foreground">Acesse todas as funcionalidades do sistema</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{item.title}</CardTitle>
                      <CardDescription className="text-xs">{item.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
