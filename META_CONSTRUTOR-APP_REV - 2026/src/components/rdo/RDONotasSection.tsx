import { useState } from 'react';
import { useNotas } from '@/hooks/useNotas';
import { useAuthUserId } from '@/hooks/useAuthUserId';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Trash2, Loader2, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RDONotasSectionProps {
    rdoId: string;
}

export const RDONotasSection = ({ rdoId }: RDONotasSectionProps) => {
    const { notas, isLoading, addNota, isAdding, deleteNota, isDeleting } = useNotas(rdoId);
    const { userId: currentUserId } = useAuthUserId();
    const [newNota, setNewNota] = useState('');

    const handleAddNota = async () => {
        if (!newNota.trim()) return;
        try {
            await addNota(newNota);
            setNewNota('');
        } catch (e) {
            // O hook já gerencia os toasts de erro
        }
    };

    return (
        <Card className="bg-card border-border mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg text-card-foreground flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-construction-orange" />
                    Notas e Comentários
                    {!isLoading && notas && (
                        <Badge variant="secondary" className="ml-2">
                            {notas.length}
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Adicionar nova nota */}
                <div className="flex flex-col gap-3">
                    <Textarea
                        placeholder="Adicione uma nota ou comentário a este RDO..."
                        value={newNota}
                        onChange={(e) => setNewNota(e.target.value)}
                        disabled={isAdding}
                        className="min-h-[100px] resize-y"
                    />
                    <div className="flex justify-end">
                        <Button
                            onClick={handleAddNota}
                            disabled={isAdding || !newNota.trim()}
                            className="bg-construction-blue hover:bg-construction-blue/90"
                        >
                            {isAdding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MessageSquare className="h-4 w-4 mr-2" />}
                            Adicionar Nota
                        </Button>
                    </div>
                </div>

                {/* Lista de NOTAS */}
                <div className="space-y-4 pt-4 border-t border-border">
                    {isLoading ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : notas?.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
                            <MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-40" />
                            <p className="text-sm">Nenhuma nota registrada para este RDO.</p>
                        </div>
                    ) : (
                        notas?.map((nota) => (
                            <div key={nota.id} className="bg-muted/30 p-4 rounded-lg border border-border flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                                            {nota.profiles?.avatar_url ? (
                                                <img src={nota.profiles.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                                            ) : (
                                                <User className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{nota.profiles?.name || 'Usuário Desconhecido'}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {format(new Date(nota.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Somente o próprio autor da nota pode excluí-la (regra do RLS refletida no UI) */}
                                    {currentUserId === nota.user_id && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                if (confirm('Tem certeza que deseja excluir esta nota?')) {
                                                    deleteNota(nota.id);
                                                }
                                            }}
                                            disabled={isDeleting}
                                            className="text-muted-foreground hover:text-destructive h-8 px-2"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                                <p className="text-sm text-card-foreground whitespace-pre-wrap pl-10 border-l-2 border-muted ml-3">
                                    {nota.texto}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
