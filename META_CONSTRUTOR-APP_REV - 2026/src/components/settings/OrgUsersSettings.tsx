import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Mail,
  RefreshCw,
  Send,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";

type OrgMemberRow = {
  id: string;
  user_id: string;
  role: "Presidente" | "Administrador" | "Gerente" | "Colaborador";
  status: "active" | "invited" | "inactive";
  invited_at: string | null;
  joined_at: string | null;
  created_at: string;
};

type ProfileRow = {
  id: string;
  name: string | null;
  email: string | null;
};

type MemberView = OrgMemberRow & {
  name: string;
  email: string;
};

const emptyInvite = {
  name: "",
  email: "",
  role: "Colaborador",
};

const statusLabel = {
  active: "Ativo",
  invited: "Convite pendente",
  inactive: "Inativo",
};

const statusClassName = {
  active: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  invited: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  inactive: "border-muted bg-muted text-muted-foreground",
};

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export function OrgUsersSettings() {
  const { activeOrgId, activeRole, isLoading: isOrgLoading } = useOrg();
  const [members, setMembers] = useState<MemberView[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteData, setInviteData] = useState(emptyInvite);

  const canInvite = useMemo(
    () => ["Presidente", "Administrador", "Gerente"].includes(activeRole ?? ""),
    [activeRole],
  );

  const loadMembers = useCallback(async () => {
    if (!activeOrgId) return;

    setLoadingMembers(true);
    try {
      const { data: memberRows, error: membersError } = await supabase
        .from("org_members")
        .select("id, user_id, role, status, invited_at, joined_at, created_at")
        .eq("org_id", activeOrgId)
        .in("status", ["active", "invited"])
        .order("created_at", { ascending: false });

      if (membersError) throw membersError;

      const rows = (memberRows ?? []) as OrgMemberRow[];
      const userIds = rows.map((member) => member.user_id);
      let profilesById = new Map<string, ProfileRow>();

      if (userIds.length > 0) {
        const { data: profileRows, error: profilesError } = await supabase
          .from("profiles")
          .select("id, name, email")
          .in("id", userIds);

        if (!profilesError && profileRows) {
          profilesById = new Map((profileRows as ProfileRow[]).map((profile) => [profile.id, profile]));
        }
      }

      setMembers(rows.map((member) => {
        const profile = profilesById.get(member.user_id);
        return {
          ...member,
          name: profile?.name || "Usuario convidado",
          email: profile?.email || "E-mail indisponivel",
        };
      }));
    } catch (error: any) {
      console.error("Erro ao carregar membros:", error);
      toast.error(`Erro ao carregar usuarios: ${error.message}`);
    } finally {
      setLoadingMembers(false);
    }
  }, [activeOrgId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleInvite = async (event: FormEvent) => {
    event.preventDefault();

    if (!activeOrgId) {
      toast.error("Organizacao ativa nao carregada.");
      return;
    }

    const email = inviteData.email.trim().toLowerCase();
    const name = inviteData.name.trim();

    if (!isEmail(email)) {
      toast.error("Informe um e-mail valido.");
      return;
    }

    if (!name) {
      toast.error("Informe o nome do colaborador.");
      return;
    }

    setInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke("invite-member", {
        body: {
          org_id: activeOrgId,
          email,
          name,
          role: "Colaborador",
          create_team_member: true,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error.message || "Falha ao enviar convite.");

      setInviteData(emptyInvite);
      await loadMembers();

      if (data?.status === "active") {
        toast.success("Colaborador vinculado com sucesso.");
      } else if (data?.email_sent) {
        toast.success("Convite enviado por e-mail.");
      } else {
        toast.success("Convite registrado. Envio de e-mail pendente de configuracao.");
      }
    } catch (error: any) {
      console.error("Erro ao convidar colaborador:", error);
      toast.error(`Erro ao convidar colaborador: ${error.message}`);
    } finally {
      setInviting(false);
    }
  };

  if (isOrgLoading) {
    return (
      <Card>
        <CardContent className="flex min-h-[180px] items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Convidar colaborador
          </CardTitle>
          <CardDescription>
            Envie um convite por e-mail para adicionar um usuario como Colaborador da organizacao ativa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!canInvite ? (
            <Alert>
              <Users className="h-4 w-4" />
              <AlertTitle>Permissao insuficiente</AlertTitle>
              <AlertDescription>
                Apenas administradores e gerentes podem convidar colaboradores.
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleInvite} className="grid gap-4 lg:grid-cols-[1fr_1fr_180px_auto] lg:items-end">
              <div className="space-y-2">
                <Label htmlFor="invite-name">Nome completo</Label>
                <Input
                  id="invite-name"
                  value={inviteData.name}
                  onChange={(event) => setInviteData((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Nome do colaborador"
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-email">E-mail</Label>
                <Input
                  id="invite-email"
                  value={inviteData.email}
                  onChange={(event) => setInviteData((current) => ({ ...current, email: event.target.value }))}
                  placeholder="colaborador@empresa.com"
                  type="email"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Cargo</Label>
                <Select value={inviteData.role} onValueChange={(role) => setInviteData((current) => ({ ...current, role }))}>
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Colaborador">Colaborador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={inviting} className="w-full lg:w-auto">
                {inviting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Enviar convite
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Usuarios da organizacao
            </CardTitle>
            <CardDescription>
              Acompanhe membros ativos e convites pendentes.
            </CardDescription>
          </div>
          <Button variant="outline" onClick={loadMembers} disabled={loadingMembers} className="w-full sm:w-auto">
            {loadingMembers ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Nenhum usuario encontrado nesta organizacao.
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="rounded-lg border bg-card p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        {member.status === "active" ? (
                          <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                        ) : (
                          <Mail className="h-4 w-4 flex-shrink-0 text-amber-600" />
                        )}
                        <p className="truncate font-medium text-card-foreground">{member.name}</p>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">{member.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{member.role}</Badge>
                      <Badge variant="outline" className={statusClassName[member.status]}>
                        {statusLabel[member.status]}
                      </Badge>
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                    <span>Convidado: {member.invited_at ? new Date(member.invited_at).toLocaleString("pt-BR") : "Nao informado"}</span>
                    <span>Entrada: {member.joined_at ? new Date(member.joined_at).toLocaleString("pt-BR") : "Pendente"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
