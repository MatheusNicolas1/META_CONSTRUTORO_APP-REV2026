
import { useState } from "react";
import { Lock, Shield, Smartphone, Trash2, Download, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

export const SecurityCard = () => {
    const { toast } = useToast();

    // --- Delete Account ---
    const [showDeleteStep1, setShowDeleteStep1] = useState(false);
    const [showDeleteStep2, setShowDeleteStep2] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    // --- Export Data ---
    const [isExporting, setIsExporting] = useState(false);

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
                            <Button variant="outline" size="sm" onClick={handlePasswordReset} className="ml-2 flex-shrink-0">
                                Alterar
                            </Button>
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
