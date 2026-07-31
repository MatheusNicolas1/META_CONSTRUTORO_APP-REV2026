import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthContext";
import { supportedLanguages } from "@/lib/i18n";
import { Building2, Users, Bell, Shield, Palette, Database, Save, Upload, Globe } from "lucide-react";
import SEO from "@/components/SEO";
import { useTheme } from "@/components/ThemeProvider";
import { OrgUsersSettings } from "@/components/settings/OrgUsersSettings";
import { normalizePersistedTheme, persistUserThemePreference, resolvePersistedTheme } from "@/utils/themePreference";

interface UserSettings {
  theme: string;
  language: string;
  primaryColor: string;
  fontSize: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  deadlineAlerts: boolean;
  weeklyReports: boolean;
  twoFactorEnabled: boolean;
  sessionTimeout: boolean;
  autoBackup: boolean;
  backupFrequency: string;
  cloudSync: boolean;
}

interface CompanyData {
  name: string;
  cnpj: string;
  phone: string;
  email: string;
  address: string;
  logo_url: string;
}

const Configuracoes = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { theme: appTheme, setTheme, systemTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("company");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingThemeRef = useRef<string | null>(null);

  const [settings, setSettings] = useState<UserSettings>({
    theme: "light",
    language: "pt-BR",
    primaryColor: "orange",
    fontSize: "medium",
    emailNotifications: true,
    pushNotifications: true,
    deadlineAlerts: true,
    weeklyReports: true,
    twoFactorEnabled: false,
    sessionTimeout: true,
    autoBackup: true,
    backupFrequency: "daily",
    cloudSync: true,
  });

  const [companyData, setCompanyData] = useState<CompanyData>({
    name: "",
    cnpj: "",
    phone: "",
    email: "",
    address: "",
    logo_url: "",
  });

  const tt = (key: string, defaultValue: string) => t(key, { defaultValue });
  const activeTheme = resolvePersistedTheme(appTheme, systemTheme);

  useEffect(() => {
    if (user) {
      loadSettings();
      loadCompanyData();
    }
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Erro ao carregar configurações:", error);
        return;
      }

      if (data) {
        setSettings({
          theme: normalizePersistedTheme(data.theme),
          language: data.language || "pt-BR",
          primaryColor: data.primary_color || "orange",
          fontSize: data.font_size || "medium",
          emailNotifications: data.email_notifications ?? true,
          pushNotifications: data.push_notifications ?? true,
          deadlineAlerts: data.deadline_alerts ?? true,
          weeklyReports: data.weekly_reports ?? true,
          twoFactorEnabled: data.two_factor_enabled ?? false,
          sessionTimeout: data.session_timeout ?? true,
          autoBackup: data.auto_backup ?? true,
          backupFrequency: data.backup_frequency || "daily",
          cloudSync: data.cloud_sync ?? true,
        });

        // Aplicar idioma carregado
        if (data.language && data.language !== i18n.language) {
          i18n.changeLanguage(data.language);
        }

        // Aplicar tema carregado
        if (data.theme) {
          setTheme(normalizePersistedTheme(data.theme));
        }
      } else {
        setSettings((prev) => ({ ...prev, theme: activeTheme }));
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    }
  };

  const loadCompanyData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("name, email, phone, avatar_url, company, cpf_cnpj, company_address")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Erro ao carregar dados da empresa:", error);
        return;
      }

      if (data) {
        setCompanyData({
          name: data.company || "",
          cnpj: data.cpf_cnpj || "",
          phone: data.phone || "",
          email: data.email || "",
          address: data.company_address || "",
          logo_url: data.avatar_url || "",
        });
      }
    } catch (error) {
      console.error("Erro ao carregar dados da empresa:", error);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validar tipo de arquivo
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Formato inválido. Use PNG, JPG ou SVG.");
      return;
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 5MB.");
      return;
    }

    setUploading(true);

    try {
      // Upload para Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("community_media")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from("community_media")
        .getPublicUrl(filePath);

      // Atualizar perfil com nova logo
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlData.publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setCompanyData((prev) => ({ ...prev, logo_url: urlData.publicUrl }));
      toast.success("Logo atualizado com sucesso.");
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      toast.error(`Erro ao fazer upload: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleLanguageChange = async (newLanguage: string) => {
    setSettings((prev) => ({ ...prev, language: newLanguage }));
    await i18n.changeLanguage(newLanguage);
    toast.success(`Idioma alterado para ${supportedLanguages.find(l => l.code === newLanguage)?.name}`);
  };

  const handleThemeChange = async (newTheme: string) => {
    const theme = normalizePersistedTheme(newTheme);
    pendingThemeRef.current = theme;
    setSettings((prev) => ({ ...prev, theme }));
    setTheme(theme);

    if (!user?.id) return;

    try {
      await persistUserThemePreference(user.id, theme);
      toast.success("Tema salvo com sucesso.");
    } catch (error: any) {
      console.error("Erro ao salvar tema:", error);
      toast.error(`Erro ao salvar tema: ${error.message}`);
    }
  };

  const handleSaveAll = async () => {
    if (!user) {
      toast.error("Erro: Usuário não autenticado");
      return;
    }

    setLoading(true);

    try {
      const storedTheme = typeof window !== "undefined"
        ? localStorage.getItem("vite-ui-theme") || localStorage.getItem("theme")
        : null;
      const themeToSave = normalizePersistedTheme(pendingThemeRef.current || storedTheme || settings.theme || activeTheme);

      // Salvar configurações do usuário
      const { error: settingsError } = await supabase
        .from("user_settings")
        .upsert({
          user_id: user.id,
          theme: themeToSave,
          language: settings.language,
          primary_color: settings.primaryColor,
          font_size: settings.fontSize,
          email_notifications: settings.emailNotifications,
          push_notifications: settings.pushNotifications,
          deadline_alerts: settings.deadlineAlerts,
          weekly_reports: settings.weeklyReports,
          two_factor_enabled: settings.twoFactorEnabled,
          session_timeout: settings.sessionTimeout,
          auto_backup: settings.autoBackup,
          backup_frequency: settings.backupFrequency,
          cloud_sync: settings.cloudSync,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id"
        });

      if (settingsError) throw settingsError;

      // Salvar dados da empresa
      const { error: companyError } = await supabase
        .from("profiles")
        .update({
          company: companyData.name,
          cpf_cnpj: companyData.cnpj || null,
          phone: companyData.phone,
          email: companyData.email,
          company_address: companyData.address || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (companyError) throw companyError;

      // Aplicar tema imediatamente e manter o recarregamento consistente.
      setTheme(themeToSave);

      toast.success("Configurações salvas com sucesso.");
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast.error(`Erro ao salvar configurações: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <SEO 
        title={`${t("settings.title")} | Meta Construtor`}
        description={t("settings.subtitle")}
        canonical={window.location.href}
      />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-8 w-8" />
              {t("settings.title")}
            </h1>
            <p className="text-muted-foreground mt-1">{t("settings.subtitle")}</p>
          </div>
          <Button 
            onClick={handleSaveAll} 
            disabled={loading}
            size="lg"
            className="w-full sm:w-auto"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? t("settings.saving") : t("settings.saveAll")}
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 h-auto p-1">
            <TabsTrigger value="company" className="min-w-0 px-2 sm:px-3 flex items-center justify-center gap-2">
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="min-w-0 truncate">{tt("settings.tabs.company", "Empresa")}</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="min-w-0 px-2 sm:px-3 flex items-center justify-center gap-2">
              <Users className="h-4 w-4 shrink-0" />
              <span className="min-w-0 truncate">{tt("settings.tabs.users", "Usuários")}</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="min-w-0 px-2 sm:px-3 flex items-center justify-center gap-2">
              <Bell className="h-4 w-4 shrink-0" />
              <span className="min-w-0 truncate">{tt("settings.tabs.notifications", "Notificações")}</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="min-w-0 px-2 sm:px-3 flex items-center justify-center gap-2">
              <Shield className="h-4 w-4 shrink-0" />
              <span className="min-w-0 truncate">{tt("settings.tabs.security", "Segurança")}</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="min-w-0 px-2 sm:px-3 flex items-center justify-center gap-2">
              <Palette className="h-4 w-4 shrink-0" />
              <span className="min-w-0 truncate">{tt("settings.tabs.appearance", "Aparência")}</span>
            </TabsTrigger>
            <TabsTrigger value="backup" className="min-w-0 px-2 sm:px-3 flex items-center justify-center gap-2">
              <Database className="h-4 w-4 shrink-0" />
              <span className="min-w-0 truncate">{tt("settings.tabs.backup", "Backup")}</span>
            </TabsTrigger>
          </TabsList>

          {/* Company Tab */}
          <TabsContent value="company" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{tt("settings.company.title", "Informações da Empresa")}</CardTitle>
                <CardDescription>Informações da sua empresa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">{tt("settings.company.name", "Nome da Empresa")}</Label>
                    <Input
                      id="companyName"
                      value={companyData.name}
                      onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                      placeholder="Nome da empresa"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyCnpj">{tt("settings.company.cnpj", "CNPJ")}</Label>
                    <Input
                      id="companyCnpj"
                      value={companyData.cnpj}
                      onChange={(e) => setCompanyData({ ...companyData, cnpj: e.target.value })}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyPhone">{tt("settings.company.phone", "Telefone")}</Label>
                    <Input
                      id="companyPhone"
                      value={companyData.phone}
                      onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyEmail">{tt("settings.company.email", "E-mail")}</Label>
                    <Input
                      id="companyEmail"
                      type="email"
                      value={companyData.email}
                      onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                      placeholder="contato@empresa.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyAddress">{tt("settings.company.address", "Endereço")}</Label>
                  <Input
                    id="companyAddress"
                    value={companyData.address}
                    onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                    placeholder="Endereço completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{tt("settings.company.logo", "Logo da Empresa")}</Label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {companyData.logo_url && (
                      <img 
                        src={companyData.logo_url} 
                        alt="Logo" 
                        className="h-20 w-20 object-contain rounded-lg border-2 border-border"
                      />
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button 
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      disabled={uploading}
                      className="w-full sm:w-auto"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? tt("settings.company.uploading", "Enviando...") : tt("settings.company.uploadLogo", "Enviar Logo")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4 mt-6">
            <OrgUsersSettings />
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{tt("settings.tabs.notifications", "Notificações")}</CardTitle>
                <CardDescription>Preferências de notificações</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="emailNotifications">{tt("settings.emailNotifications", "Notificações por e-mail")}</Label>
                  <Switch
                    id="emailNotifications"
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, emailNotifications: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="pushNotifications">{tt("settings.pushNotifications", "Notificações push")}</Label>
                  <Switch
                    id="pushNotifications"
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, pushNotifications: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="deadlineAlerts">Alertas de prazo</Label>
                  <Switch
                    id="deadlineAlerts"
                    checked={settings.deadlineAlerts}
                    onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, deadlineAlerts: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="weeklyReports">Relatórios semanais</Label>
                  <Switch
                    id="weeklyReports"
                    checked={settings.weeklyReports}
                    onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, weeklyReports: checked }))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{tt("settings.tabs.security", "Segurança")}</CardTitle>
                <CardDescription>Configurações de segurança</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="twoFactor">{tt("settings.twoFactor", "Autenticação em duas etapas")}</Label>
                  <Switch
                    id="twoFactor"
                    checked={settings.twoFactorEnabled}
                    onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, twoFactorEnabled: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sessionTimeout">{tt("settings.sessionTimeout", "Encerrar sessão automaticamente")}</Label>
                  <Switch
                    id="sessionTimeout"
                    checked={settings.sessionTimeout}
                    onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, sessionTimeout: checked }))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{tt("settings.appearance.title", "Aparência e Personalização")}</CardTitle>
                <CardDescription>Personalização visual</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="theme">{tt("settings.appearance.theme", "Tema")}</Label>
                  <Select value={settings.theme || activeTheme} onValueChange={handleThemeChange}>
                    <SelectTrigger id="theme" data-testid="settings-theme-trigger">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light" data-testid="settings-theme-light">{tt("settings.appearance.light", "Claro")}</SelectItem>
                      <SelectItem value="dark" data-testid="settings-theme-dark">{tt("settings.appearance.dark", "Escuro")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    {tt("settings.appearance.language", "Idioma")}
                  </Label>
                  <Select value={settings.language} onValueChange={handleLanguageChange}>
                    <SelectTrigger id="language" data-testid="settings-language-trigger">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {supportedLanguages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code} data-testid={`settings-language-${lang.code}`}>
                          {lang.flag} {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fontSize">{tt("settings.appearance.fontSize", "Tamanho da Fonte")}</Label>
                  <Select value={settings.fontSize} onValueChange={(value) => setSettings((prev) => ({ ...prev, fontSize: value }))}>
                    <SelectTrigger id="fontSize" data-testid="settings-font-size-trigger">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small" data-testid="settings-font-size-small">{tt("settings.appearance.small", "Pequeno")}</SelectItem>
                      <SelectItem value="medium" data-testid="settings-font-size-medium">{tt("settings.appearance.medium", "Médio")}</SelectItem>
                      <SelectItem value="large" data-testid="settings-font-size-large">{tt("settings.appearance.large", "Grande")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primaryColor">{tt("settings.appearance.primaryColor", "Cor Principal")}</Label>
                  <Select value={settings.primaryColor} onValueChange={(value) => setSettings((prev) => ({ ...prev, primaryColor: value }))}>
                    <SelectTrigger id="primaryColor" data-testid="settings-primary-color-trigger">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="orange" data-testid="settings-primary-color-orange">🟠 Laranja</SelectItem>
                      <SelectItem value="blue" data-testid="settings-primary-color-blue">🔵 Azul</SelectItem>
                      <SelectItem value="green" data-testid="settings-primary-color-green">🟢 Verde</SelectItem>
                      <SelectItem value="red" data-testid="settings-primary-color-red">🔴 Vermelho</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Backup Tab */}
          <TabsContent value="backup" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{tt("settings.tabs.backup", "Preferencias de backup")}</CardTitle>
                <CardDescription>Preferencias registradas. Esta tela nao executa uma rotina automatica de backup.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoBackup">{tt("settings.autoBackup", "Solicitar rotina de backup")}</Label>
                  <Switch
                    id="autoBackup"
                    checked={settings.autoBackup}
                    onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, autoBackup: checked }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backupFrequency">Frequencia desejada</Label>
                  <Select value={settings.backupFrequency} onValueChange={(value) => setSettings((prev) => ({ ...prev, backupFrequency: value }))}>
                    <SelectTrigger id="backupFrequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diario</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="cloudSync">Permitir sincronizacao externa quando houver integracao real</Label>
                  <Switch
                    id="cloudSync"
                    checked={settings.cloudSync}
                    onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, cloudSync: checked }))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Configuracoes;
