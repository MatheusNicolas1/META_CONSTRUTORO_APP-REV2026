import { useState } from "react";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { Users, Trash2, UserPlus, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { RDOFormData } from "@/schemas/rdoSchema";
import { useEquipesSupabase } from "@/hooks/useEquipesSupabase";

interface RDOTeamSectionProps {
    form: UseFormReturn<RDOFormData>;
}

export function RDOTeamSection({ form }: RDOTeamSectionProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { equipes, isLoading } = useEquipesSupabase();

    const {
        fields: teamFields,
        append: appendTeam,
        remove: removeTeam,
        update: updateTeam,
    } = useFieldArray({
        control: form.control,
        name: "equipesPresentes",
    });

    const handleAddTeamMember = (memberId: string) => {
        const member = equipes.find(e => e.id === memberId);
        if (member && !teamFields.find(f => f.id === member.id)) {
            appendTeam({
                id: member.id,
                nome: member.nome,
                funcao: member.funcao,
                horasTrabalho: 8,
                presente: true,
                horasOciosas: 0,
            });
        }
    };

    return (
        <div className="space-y-4">
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <Card className="bg-card border-border">
                    <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                            <CardTitle className="text-lg text-card-foreground flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-construction-blue" />
                                    Equipe Presente
                                    {teamFields.length > 0 && (
                                        <Badge variant="secondary" className="ml-2">
                                            {teamFields.length}
                                        </Badge>
                                    )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {isOpen ? "Recolher" : "Expandir"}
                                </div>
                            </CardTitle>
                        </CardHeader>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                        <CardContent className="space-y-4">
                            {/* Add Member */}
                            <div className="flex gap-2">
                                <Select onValueChange={handleAddTeamMember}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder={isLoading ? "Carregando..." : "Adicionar colaborador à equipe"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {equipes
                                            .filter(member => !teamFields.find(f => f.id === member.id))
                                            .map((member) => (
                                                <SelectItem key={member.id} value={member.id}>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{member.nome}</span>
                                                        <span className="text-sm text-muted-foreground">{member.funcao}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Members List */}
                            <div className="space-y-3">
                                {teamFields.map((field, index) => (
                                    <div key={field.id} className="p-4 bg-muted/20 rounded-lg border space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-primary/10 p-2 rounded-full">
                                                    <Users className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-card-foreground">{field.nome}</p>
                                                    <Badge variant="outline" className="text-xs">{field.funcao}</Badge>
                                                </div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => removeTeam(index)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* Horas de Trabalho */}
                                            <div>
                                                <Label className="text-sm flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> Horas Trabalhadas
                                                </Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max="24"
                                                    step="0.5"
                                                    value={field.horasTrabalho}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value) || 0;
                                                        updateTeam(index, { ...field, horasTrabalho: val });
                                                    }}
                                                    className="mt-1"
                                                />
                                            </div>

                                            {/* Presente Toggle */}
                                            <div className="flex flex-col justify-end pb-2">
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`presente-${field.id}`}
                                                        checked={field.presente}
                                                        onCheckedChange={(checked) => {
                                                            updateTeam(index, { ...field, presente: !!checked });
                                                        }}
                                                    />
                                                    <Label htmlFor={`presente-${field.id}`} className="cursor-pointer">
                                                        Presente na obra
                                                    </Label>
                                                </div>
                                            </div>

                                            {/* Horas Ociosas */}
                                            <div>
                                                <Label className="text-sm text-muted-foreground">Horas Ociosas (opcional)</Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max="24"
                                                    step="0.5"
                                                    value={field.horasOciosas || 0}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value) || 0;
                                                        updateTeam(index, { ...field, horasOciosas: val });
                                                    }}
                                                    className="mt-1"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {teamFields.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <UserPlus className="mx-auto h-12 w-12 mb-2 opacity-50" />
                                    <p>Nenhum colaborador registrado</p>
                                    <p className="text-sm">Use o campo acima para adicionar membros da equipe</p>
                                </div>
                            )}
                        </CardContent>
                    </CollapsibleContent>
                </Card>
            </Collapsible>
        </div>
    );
}
