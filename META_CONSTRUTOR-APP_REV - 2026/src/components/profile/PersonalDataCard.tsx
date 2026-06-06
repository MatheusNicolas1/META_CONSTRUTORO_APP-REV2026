
import { useState, useRef, useEffect } from "react";
import { User, Mail, Building2, FileText, Phone, Camera, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/components/auth/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PersonalDataCardProps {
    initialData?: {
        name: string;
        email: string;
        phone: string;
        company: string;
        cpf_cnpj: string;
        avatar_url: string;
    };
}

export const PersonalDataCard = ({ initialData }: PersonalDataCardProps) => {
    const { user, refreshSession } = useAuth();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        company: "",
        cpf_cnpj: "",
        avatar_url: "",
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else if (user) {
            // Fallback se não vier initialData, mas o ideal é o pai passar
            setFormData(prev => ({ ...prev, email: user.email || "" }));
        }
    }, [initialData, user]);

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        setUploading(true);
        try {
            const fileExt = file.name.split(".").pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const bucket = 'community_media';
            const path = `${user.id}/avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(path, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from(bucket)
                .getPublicUrl(path);

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: urlData.publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            setFormData(prev => ({ ...prev, avatar_url: urlData.publicUrl }));
            await refreshSession();

            toast({
                title: "Foto atualizada",
                description: "Sua foto de perfil foi alterada com sucesso.",
            });
        } catch (error: any) {
            console.error("Erro no upload:", error);
            toast({
                title: "Erro no upload",
                description: "Não foi possível atualizar a foto.",
                variant: "destructive",
            });
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    name: formData.name,
                    phone: formData.phone,
                    company: formData.company,
                    cpf_cnpj: formData.cpf_cnpj,
                })
                .eq('id', user.id);

            if (error) throw error;

            await refreshSession();
            toast({
                title: "Perfil atualizado",
                description: "Suas informações foram salvas com sucesso.",
            });
        } catch (error) {
            console.error("Erro ao salvar:", error);
            toast({
                title: "Erro ao salvar",
                description: "Ocorreu um erro ao salvar as informações.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name: string) => {
        return (name || "U")
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Dados Pessoais
                </CardTitle>
                <CardDescription>
                    Gerencie suas informações de identificação
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Avatar Section */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-6 border-b">
                    <Avatar className="h-20 w-20 border-2 border-border flex-shrink-0">
                        <AvatarImage src={formData.avatar_url} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                            {getInitials(formData.name)}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col gap-2 items-center sm:items-start text-center sm:text-left flex-1">
                        <div>
                            <h3 className="font-semibold text-base text-foreground">{formData.name || "Usuário"}</h3>
                            <p className="text-sm text-muted-foreground">{formData.email || "Foto de perfil"}</p>
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            data-testid="profile-avatar-input"
                            onChange={handleAvatarUpload}
                        />

                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 h-8"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                        >
                            {uploading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Camera className="h-3.5 w-3.5" />
                            )}
                            {uploading ? "Enviando..." : "Alterar foto"}
                        </Button>
                    </div>
                </div>

                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 gap-y-5">
                    {/* Nome */}
                    <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            Nome Completo
                        </Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="Seu nome completo"
                        />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            Email
                        </Label>
                        <Input
                            id="email"
                            value={formData.email}
                            disabled
                            className="bg-muted/50 text-muted-foreground cursor-not-allowed"
                        />
                    </div>

                    {/* Telefone */}
                    <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            Telefone
                        </Label>
                        <Input
                            id="phone"
                            value={formData.phone || ""}
                            onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                            placeholder="(00) 00000-0000"
                        />
                    </div>

                    {/* Empresa */}
                    <div className="space-y-2">
                        <Label htmlFor="company" className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            Empresa
                        </Label>
                        <Input
                            id="company"
                            value={formData.company || ""}
                            onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
                            placeholder="Nome da sua empresa"
                        />
                    </div>

                    {/* CPF/CNPJ */}
                    <div className="space-y-2">
                        <Label htmlFor="cpf_cnpj" className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            CPF / CNPJ
                        </Label>
                        <Input
                            id="cpf_cnpj"
                            value={formData.cpf_cnpj || ""}
                            onChange={(e) => setFormData((prev) => ({ ...prev, cpf_cnpj: e.target.value }))}
                            placeholder="000.000.000-00"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button onClick={handleSave} disabled={loading} className="gap-2 w-full sm:w-auto">
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        {loading ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
