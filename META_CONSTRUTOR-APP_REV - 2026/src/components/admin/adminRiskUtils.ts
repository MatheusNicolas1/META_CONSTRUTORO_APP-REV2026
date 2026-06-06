export type AdminRiskLevel = "high" | "medium" | "low" | "none" | string;

export type AdminRiskListItem = {
  user_id: string | null;
  org_label?: string | null;
  plan_type?: string | null;
  roles?: string[] | null;
  activity_segment?: string | null;
  risk_level?: AdminRiskLevel | null;
  last_event_at?: string | null;
  total_events?: number | null;
};

export const getAdminRiskLabel = (riskLevel?: AdminRiskLevel | null) => {
  if (riskLevel === "high") return "Alto risco";
  if (riskLevel === "medium") return "Risco medio";
  if (riskLevel === "low") return "Baixo risco";
  return "Sem risco";
};

export const getAdminRiskReason = (item: AdminRiskListItem) => {
  if (item.activity_segment === "no_activity") return "Cadastro sem atividade registrada";
  if (item.activity_segment === "inactive") return "Sem evento nos ultimos 30 dias";
  if (!item.last_event_at) return "Sem ultimo uso registrado";
  return "Queda de atividade no recorte atual";
};

export const getAdminRiskSuggestedAction = (item: AdminRiskListItem) => {
  if (item.risk_level === "high") return "Acionar onboarding/suporte";
  if (item.risk_level === "medium") return "Enviar follow-up comercial";
  return "Monitorar no proximo ciclo";
};

export const getAdminRiskTone = (riskLevel?: AdminRiskLevel | null) => {
  if (riskLevel === "high") return "destructive";
  if (riskLevel === "medium") return "secondary";
  return "outline";
};

export const getAdminRiskPriority = (riskLevel?: AdminRiskLevel | null) => {
  if (riskLevel === "high") return 0;
  if (riskLevel === "medium") return 1;
  if (riskLevel === "low") return 2;
  return 3;
};
