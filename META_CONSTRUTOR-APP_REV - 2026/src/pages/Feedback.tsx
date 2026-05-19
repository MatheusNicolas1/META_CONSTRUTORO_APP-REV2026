import { useState, useEffect } from "react";
import { MessageSquarePlus, Send, FileText, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/FileUpload";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUserId } from "@/hooks/useAuthUserId";

const Feedback = () => {
  const { toast } = useToast();
  const { permissions } = useUserPermissions();
  const { userId } = useAuthUserId();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    type: "",
    rating: "",
    message: "",
    attachments: [] as File[]
  });

  // Feedbacks reais do banco
  const [userFeedbacks, setUserFeedbacks] = useState<any[]>([]);
  const [allFeedbacks, setAllFeedbacks] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;
    const fetchFeedbacks = async () => {
      const { data } = await supabase
        .from('feedbacks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      setUserFeedbacks(data || []);
    };
    fetchFeedbacks();
  }, [userId]);

  useEffect(() => {
    if (!permissions?.canManageFeedbacks) return;
    const fetchAll = async () => {
      const { data } = await supabase
        .from('feedbacks')
        .select('*')
        .order('created_at', { ascending: false });
      setAllFeedbacks(data || []);
    };
    fetchAll();
  }, [permissions?.canManageFeedbacks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke('send-feedback', {
        body: {
          title: formData.title,
          type: formData.type,
          rating: formData.rating ? Number(formData.rating) : undefined,
          message: formData.message,
        },
      });

      if (error) throw error;

      toast({
        title: "Feedback enviado com sucesso!",
        description: "Seu feedback foi enviado com sucesso, obrigado por contribuir com melhorias para o Meta Construtor!",
      });

      setFormData({ title: "", type: "", rating: "", message: "", attachments: [] });

      // Refresh feedbacks
      const { data } = await supabase
        .from('feedbacks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      setUserFeedbacks(data || []);
    } catch (error) {
      toast({
        title: "Erro ao enviar feedback",
        description: "Ocorreu um erro ao enviar seu feedback. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Recebido":
        return "default";
      case "Em anÃ¡lise":
        return "secondary";
      case "Implementado":
        return "default";
      case "NÃ£o serÃ¡ implementado":
        return "destructive";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Recebido":
        return <Clock className="h-3 w-3" />;
      case "Em anÃ¡lise":
        return <AlertCircle className="h-3 w-3" />;
      case "Implementado":
        return <CheckCircle className="h-3 w-3" />;
      case "NÃ£o serÃ¡ implementado":
        return <XCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Feedback</h1>
        <p className="text-muted-foreground mt-2">
          Compartilhe suas sugestÃµes, relate problemas ou envie elogios
        </p>
      </div>

      <Tabs defaultValue="novo-feedback" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="novo-feedback">Novo Feedback</TabsTrigger>
          <TabsTrigger value="meus-feedbacks">Meus Feedbacks</TabsTrigger>
          {permissions.canManageFeedbacks && (
            <TabsTrigger value="todos-feedbacks">Gerenciar Feedbacks</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="novo-feedback">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquarePlus className="h-5 w-5" />
                Enviar Feedback
              </CardTitle>
              <CardDescription>
                Conte-nos sua experiÃªncia, sugestÃµes ou problemas encontrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">TÃ­tulo (Opcional)</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="Digite um tÃ­tulo para seu feedback"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de Feedback *</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sugestao">SugestÃ£o de melhoria</SelectItem>
                        <SelectItem value="problema">Problema encontrado</SelectItem>
                        <SelectItem value="elogio">Elogio</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rating">Satisfacao</Label>
                    <Select value={formData.rating} onValueChange={(value) => setFormData({...formData, rating: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Nota de 1 a 5" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 - Excelente</SelectItem>
                        <SelectItem value="4">4 - Bom</SelectItem>
                        <SelectItem value="3">3 - Regular</SelectItem>
                        <SelectItem value="2">2 - Ruim</SelectItem>
                        <SelectItem value="1">1 - Critico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem *</Label>
                  <Textarea
                    id="message"
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder="Descreva detalhadamente seu feedback..."
                    className="min-h-[120px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Anexos (Opcional)</Label>
                  <FileUpload
                    onFilesUploaded={(uploadedFiles) => {
                      const files = uploadedFiles.map(uf => new File([], uf.name, { type: uf.type }));
                      setFormData({...formData, attachments: files});
                    }}
                    accept="image/*,.pdf,.doc,.docx"
                    multiple={true}
                    maxSize={5}
                    uploadType="all"
                  />
                  <p className="text-sm text-muted-foreground">
                    Anexe imagens, prints ou documentos para exemplificar (mÃ¡ximo 5 arquivos)
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !formData.message || !formData.type}
                    className="flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {isSubmitting ? "Enviando..." : "Enviar Feedback"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meus-feedbacks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Meus Feedbacks
              </CardTitle>
              <CardDescription>
                Acompanhe o status dos seus feedbacks enviados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userFeedbacks.map((feedback) => (
                  <Card key={feedback.id} className="border-l-4 border-l-primary/20">
                    <CardContent className="pt-4">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-foreground">
                              {feedback.titulo || (feedback.mensagem || "").substring(0, 50) + "..."}
                            </h4>
                            <Badge variant={getStatusColor(feedback.status)} className="flex items-center gap-1">
                              {getStatusIcon(feedback.status)}
                              {feedback.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Tipo: {feedback.tipo}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {feedback.mensagem}
                          </p>
                          {feedback.nota_satisfacao && (
                            <p className="text-sm text-muted-foreground mt-2">
                              Satisfacao: {feedback.nota_satisfacao}/5
                            </p>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground text-right">
                          <p>Enviado: {formatDate(feedback.created_at)}</p>
                          {feedback.updated_at !== feedback.created_at && (
                            <p>Atualizado: {formatDate(feedback.updated_at)}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {userFeedbacks.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      VocÃª ainda nÃ£o enviou nenhum feedback
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {permissions.canManageFeedbacks && (
          <TabsContent value="todos-feedbacks">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquarePlus className="h-5 w-5" />
                  Gerenciar Feedbacks
                </CardTitle>
                <CardDescription>
                  Visualize e gerencie todos os feedbacks dos usuÃ¡rios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allFeedbacks.map((feedback) => (
                    <Card key={feedback.id} className="border">
                      <CardContent className="pt-4">
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium text-foreground">
                                  {feedback.titulo || (feedback.mensagem || "").substring(0, 50) + "..."}
                                </h4>
                                <Badge variant={getStatusColor(feedback.status)} className="flex items-center gap-1">
                                  {getStatusIcon(feedback.status)}
                                  {feedback.status}
                                </Badge>
                              </div>
                              {feedback.user_id && (
                                <p className="text-sm text-muted-foreground mb-1">
                                  UsuÃ¡rio: {feedback.user_id}
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground mb-2">
                                Tipo: {feedback.tipo}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {feedback.mensagem}
                              </p>
                              {feedback.nota_satisfacao && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  Satisfacao: {feedback.nota_satisfacao}/5
                                </p>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground text-right">
                              <p>Enviado: {formatDate(feedback.created_at)}</p>
                              {feedback.updated_at !== feedback.created_at && (
                                <p>Atualizado: {formatDate(feedback.updated_at)}</p>
                              )}
                            </div>
                          </div>

                          <Separator />

                          <div className="flex flex-col md:flex-row gap-2">
                            <Select
                              defaultValue={feedback.status}
                              onValueChange={async (value) => {
                                const { error } = await supabase
                                  .from('feedbacks')
                                  .update({ status: value })
                                  .eq('id', feedback.id);
                                if (error) {
                                  toast({ title: "Erro", description: "Falha ao atualizar status", variant: "destructive" });
                                } else {
                                  toast({ title: "Sucesso", description: "Status atualizado!" });
                                  // Update local state if needed or force re-fetch
                                  const { data } = await supabase.from('feedbacks').select('*').order('created_at', { ascending: false });
                                  setAllFeedbacks(data || []);
                                }
                              }}
                            >
                              <SelectTrigger className="w-full md:w-[200px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Recebido">Recebido</SelectItem>
                                <SelectItem value="Em anÃ¡lise">Em anÃ¡lise</SelectItem>
                                <SelectItem value="Implementado">Implementado</SelectItem>
                                <SelectItem value="NÃ£o serÃ¡ implementado">NÃ£o serÃ¡ implementado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {allFeedbacks.length === 0 && (
                    <div className="text-center py-8">
                      <MessageSquarePlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Nenhum feedback foi enviado ainda
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Feedback;
