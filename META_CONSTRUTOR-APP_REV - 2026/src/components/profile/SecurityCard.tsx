
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Lock, Shield, Smartphone, Trash2, Download, AlertTriangle, Loader2, Globe, Eye, EyeOff, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { supportedLanguages } from "@/lib/i18n";

export const SecurityCard = () => {
    const { toast } = useToast();
    const { t, i18n } = useTranslation();

    // --- Change Password ---
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // --- Delete Account ---
    const [showDeleteStep1, setShowDeleteStep1] = useState(false);
    const [showDeleteStep2, setShowDeleteStep2] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    // --- Export Data ---
    const [isExporting, setIsExporting] = useState(false);

    const handleChangePassword = async () => {
        if (!currentPassword) {
            toast({
                title: "Senha atual obrigatória",
                description: "Digite sua senha atual para alterá-la.",
                variant: "destructive",
            });
            return;
        }

        if (newPassword.length < 10) {
            toast({
                title: "Senha muito curta",
                description: "A nova senha deve ter pelo menos 10 caracteres.",
                variant: "destructive",
            });
            return;
        }

        if (newPassword !== confirmNewPassword) {
            toast({
                title: "Senhas não conferem",
                description: "A nova senha e a confirmação devem ser iguais.",
                variant: "destructive",
            });
            return;
        }

        if (currentPassword === newPassword) {
            toast({
                title: "Senha igual à atual",
                description: "A nova senha deve ser diferente da atual.",
                variant: "destructive",
            });
            return;
        }

        setIsChangingPassword(true);
        try {
            // Get user email first
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.email) {
                toast({
                    title: "Usuário não encontrado",
                    description: "Não foi possível identificar sua conta. Faça login novamente.",
                    variant: "destructive",
                });
                return;
            }

            // Verify current password by attempting to sign in again
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword,
            });

            if (signInError) {
                toast({
                    title: "Senha atual incorreta",
                    description: "A senha atual digitada não corresponde à sua senha.",
                    variant: "destructive",
                });
                return;
            }

            // Update to new password
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (updateError) throw updateError;

            toast({
                title: "Senha alterada com sucesso",
                description: "Sua senha foi atualizada. Use a nova senha no próximo login.",
            });

            // Reset form
            setShowPasswordForm(false);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
        } catch (err: any) {
            toast({
                title: "Erro ao alterar senha",
                description: err?.message || "Não foi possível alterar a senha. Tente novamente.",
                variant: "destructive",
            });
        } finally {
            setIsChangingPassword(false);
        }
    };

    // --- Language ---
    const handleLanguageChange = (newLanguage: string) => {
        i18n.changeLanguage(newLanguage);
        toast({
            title: "Idioma alterado",
            description: `Idioma alterado para ${supportedLanguages.find(l => l.code === newLanguage)?.name}`,
        });
    };

    const handlePasswordReset = async () => {
        const email = (await supabase.auth.getUser()).data.user?.email;
        if (!email) return;

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/redefinir-senha`,
        });

        if (error) {
            toast({
                title: "Erro ao enviar email",
                description: error.message,
                variant: "destructive",
            });
        } else {
            toast({
                title: "Email enviado",
                description: "Verifique sua caixa de entrada para redefinir sua senha.",
            });
        }
    };

    const handleSessions = () => {
        toast({
            title: "Sessão Atual",
            description: "Você está logado neste dispositivo.",
        });
    };

    // --- Excluir Conta ---
    const handleDeleteStep1 = () => {
        setDeletePassword("");
        setDeleteConfirmText("");
        setShowDeleteStep1(true);
    };

    const handleDeleteStep2 = () => {
        setShowDeleteStep1(false);
        setShowDeleteStep2(true);
    };

    const handleDeleteConfirm = async () => {
        if (deleteConfirmText !== "EXCLUIR") return;
        if (!deletePassword) {
            toast({
                title: "Senha obrigatória",
                description: "Digite sua senha para confirmar a exclusão.",
                variant: "destructive",
            });
            return;
        }

        setIsDeleting(true);
        try {
            const session = (await supabase.auth.getSession()).data.session;
            if (!session) {
                toast({
                    title: "Sessão expirada",
                    description: "Faça login novamente para continuar.",
                    variant: "destructive",
                });
                return;
            }

            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.access_token}`,
                        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
                    },
                    body: JSON.stringify({ password: deletePassword }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                toast({
                    title: "Erro ao excluir conta",
                    description: data.error || "Tente novamente.",
                    variant: "destructive",
                });
                return;
            }

            toast({
                title: "Conta excluída",
                description: "Sua conta foi excluída permanentemente. Você será desconectado.",
            });

            // Logout após 2s
            setTimeout(async () => {
                await supabase.auth.signOut();
                window.location.href = "/home";
            }, 2000);

        } catch (err) {
            toast({
                title: "Erro inesperado",
                description: "Não foi possível excluir a conta. Tente novamente.",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
            setShowDeleteStep2(false);
        }
    };

    // --- Exportar Meus Dados ---
    const handleExportData = async () => {
        setIsExporting(true);
        try {
            const session = (await supabase.auth.getSession()).data.session;
            if (!session) {
                toast({
                    title: "Sessão expirada",
                    description: "Faça login novamente para continuar.",
                    variant: "destructive",
                });
                return;
            }

            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-my-data`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.access_token}`,
                        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
                    },
                }
            );

            if (!response.ok) {
                const errData = await response.json();
                toast({
                    title: "Erro ao exportar",
                    description: errData.error || "Tente novamente.",
                    variant: "destructive",
                });
                return;
            }

            const blob = await response.blob();
            const now = new Date();
            const filename = `meus-dados-${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}.json`;

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            toast({
                title: "Dados exportados",
                description: "Seu arquivo JSON foi baixado com sucesso.",
            });
        } catch (err) {
            toast({
                title: "Erro inesperado",
                description: "Não foi possível exportar os dados. Tente novamente.",
                variant: "destructive",
            });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <>
            <Card className="h-full">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Segurança da Conta
                    </CardTitle>
                    <CardDescription>
                        Gerencie o acesso e proteção da sua conta
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Alterar Senha */}
                        <div className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2.5 rounded-full flex-shrink-0">
                                    <Lock className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-sm">Senha de Acesso</h4>
                                    <p className="text-xs text-muted-foreground mt-0.5">Recomendamos alterar periodicamente</p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setShowPasswordForm(!showPasswordForm)} className="ml-2 flex-shrink-0">
                                {showPasswordForm ? "Cancelar" : "Alterar"}
                            </Button>
                        </div>

                        {/* Inline Password Change Form */}
                        {showPasswordForm && (
                            <div className="md:col-span-2 p-4 border border-primary/20 rounded-xl bg-primary/5 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                    <KeyRound className="h-4 w-4" />
                                    Alterar Senha
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {/* Senha Atual */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="currentPassword" className="text-xs">Senha Atual</Label>
                                        <div className="relative">
                                            <Input
                                                id="currentPassword"
                                                type={showCurrentPassword ? "text" : "password"}
                                                placeholder="Digite sua senha atual"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                className="pr-9 text-sm"
                                                autoComplete="current-password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPassword((v) => !v)}
                                                className="absolute inset-y-0 right-2 flex items-center text-muted-foreground"
                                                aria-label={showCurrentPassword ? "Ocultar senha" : "Mostrar senha"}
                                            >
                                                {showCurrentPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Nova Senha */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="newPassword" className="text-xs">Nova Senha</Label>
                                        <div className="relative">
                                            <Input
                                                id="newPassword"
                                                type={showNewPassword ? "text" : "password"}
                                                placeholder="Mínimo 10 caracteres"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="pr-9 text-sm"
                                                autoComplete="new-password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword((v) => !v)}
                                                className="absolute inset-y-0 right-2 flex items-center text-muted-foreground"
                                                aria-label={showNewPassword ? "Ocultar senha" : "Mostrar senha"}
                                            >
                                                {showNewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Confirmar Nova Senha */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="confirmNewPassword" className="text-xs">Confirmar Nova Senha</Label>
                                        <div className="relative">
                                            <Input
                                                id="confirmNewPassword"
                                                type={showConfirmNewPassword ? "text" : "password"}
                                                placeholder="Repita a nova senha"
                                                value={confirmNewPassword}
                                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                                className="pr-9 text-sm"
                                                autoComplete="new-password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmNewPassword((v) => !v)}
                                                className="absolute inset-y-0 right-2 flex items-center text-muted-foreground"
                                                aria-label={showConfirmNewPassword ? "Ocultar confirmação" : "Mostrar confirmação"}
                                            >
                                                {showConfirmNewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setShowPasswordForm(false);
                                            setCurrentPassword("");
                                            setNewPassword("");
                                            setConfirmNewPassword("");
                                        }}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleChangePassword}
                                        disabled={isChangingPassword || !currentPassword || !newPassword || !confirmNewPassword}
                                        className="gap-1.5"
                                    >
                                        {isChangingPassword ? (
                                            <>
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                Alterando...
                                            </>
                                        ) : (
                                            <>
                                                <KeyRound className="h-3.5 w-3.5" />
                                                Alterar Senha
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Idioma / Localidade */}
                        <div className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2.5 rounded-full flex-shrink-0">
                                    <Globe className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-sm">Idioma / Localidade</h4>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {supportedLanguages.find(l => l.code === i18n.language)?.flag}{" "}
                                        {supportedLanguages.find(l => l.code === i18n.language)?.name || "Português (Brasil)"}
                                    </p>
                                </div>
                            </div>
                            <Select
                                value={i18n.language}
                                onValueChange={handleLanguageChange}
                            >
                                <SelectTrigger className="w-[180px] ml-2 flex-shrink-0">
                                    <SelectValue placeholder="Selecionar idioma" />
                                </SelectTrigger>
                                <SelectContent>
                                    {supportedLanguages.map((lang) => (
                                        <SelectItem key={lang.code} value={lang.code}>
                                            <span className="flex items-center gap-2">
                                                <span className="text-base">{lang.flag}</span>
                                                <span>{lang.name}</span>
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Sessões */}
                        <div className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors md:col-span-2">
                            <div className="flex items-center gap-3">
                                <div className="bg-red-500/10 p-2.5 rounded-full flex-shrink-0">
                                    <Smartphone className="h-4 w-4 text-red-500" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-sm">Sessões Ativas</h4>
                                    <p className="text-xs text-muted-foreground mt-0.5">Gerencie os dispositivos conectados à sua conta</p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleSessions} className="ml-2 flex-shrink-0">
                                Ver detalhes
                            </Button>
                        </div>

                        {/* LGPD — Separador */}
                        <div className="md:col-span-2 border-t pt-4 mt-2">
                            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                                Privacidade & LGPD
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Exportar Dados */}
                                <div className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-500/10 p-2.5 rounded-full flex-shrink-0">
                                            <Download className="h-4 w-4 text-blue-500" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-sm">Exportar Meus Dados</h4>
                                            <p className="text-xs text-muted-foreground mt-0.5">Baixe todos os seus dados em JSON (LGPD Art. 18)</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleExportData}
                                        disabled={isExporting}
                                        className="ml-2 flex-shrink-0"
                                    >
                                        {isExporting ? (
                                            <>
                                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                Exportando...
                                            </>
                                        ) : (
                                            "Exportar"
                                        )}
                                    </Button>
                                </div>

                                {/* Excluir Conta */}
                                <div className="flex items-center justify-between p-4 border border-destructive/30 rounded-xl hover:bg-destructive/5 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-destructive/10 p-2.5 rounded-full flex-shrink-0">
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-sm text-destructive">Excluir Minha Conta</h4>
                                            <p className="text-xs text-muted-foreground mt-0.5">Ação permanente e irreversível</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={handleDeleteStep1}
                                        className="ml-2 flex-shrink-0"
                                    >
                                        Excluir
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Modal Step 1: Aviso inicial */}
            <AlertDialog open={showDeleteStep1} onOpenChange={setShowDeleteStep1}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Excluir Conta Permanentemente
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3">
                            <p>
                                Esta ação é <strong>irreversível</strong>. Ao excluir sua conta, todos os dados abaixo serão
                                permanentemente removidos:
                            </p>
                            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                                <li>Perfil e configurações pessoais</li>
                                <li>Obras, RDOs e atividades</li>
                                <li>Equipes, equipamentos e fornecedores</li>
                                <li>Checklists e documentos</li>
                                <li>Créditos e assinaturas</li>
                                <li>Organizações que você é o único membro</li>
                            </ul>
                            <p className="text-sm font-medium text-destructive">
                                Organizações com outros membros terão a propriedade transferida automaticamente.
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <Button variant="destructive" onClick={handleDeleteStep2}>
                            Entendo, continuar
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Modal Step 2: Confirmação com senha */}
            <AlertDialog open={showDeleteStep2} onOpenChange={setShowDeleteStep2}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Confirmar Exclusão
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-4">
                                <p>Para confirmar, digite sua <strong>senha atual</strong> e a palavra <strong>EXCLUIR</strong>.</p>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Sua senha</label>
                                    <Input
                                        type="password"
                                        placeholder="Digite sua senha"
                                        value={deletePassword}
                                        onChange={(e) => setDeletePassword(e.target.value)}
                                        autoComplete="current-password"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">
                                        Digite <span className="text-destructive font-bold">EXCLUIR</span> para confirmar
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="EXCLUIR"
                                        value={deleteConfirmText}
                                        onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                                    />
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting || deleteConfirmText !== "EXCLUIR" || !deletePassword}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Excluindo...
                                </>
                            ) : (
                                "Excluir minha conta"
                            )}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
