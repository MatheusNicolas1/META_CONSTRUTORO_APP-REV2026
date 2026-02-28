import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "./DatePicker";
import { RDO, CreateRDOData, AtividadeRDO, EquipeRDO, EquipamentoRDO } from "@/types/rdo";
import { Plus, Trash2, Upload, FileText, X, Loader2 } from "lucide-react";
import { useObras } from "@/hooks/useObras";
import { useEquipesSupabase } from "@/hooks/useEquipesSupabase";
import { useEquipamentosSupabase } from "@/hooks/useEquipamentosSupabase";
import { Badge } from "@/components/ui/badge";

interface RDOFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateRDOData) => void;
  rdo?: RDO;
  isEditing?: boolean;
}

export function RDOForm({ isOpen, onClose, onSubmit, rdo, isEditing = false }: RDOFormProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    rdo ? new Date(rdo.data) : new Date()
  );
  const [selectedObra, setSelectedObra] = useState<string>(
    rdo ? rdo.obraId.toString() : ""
  );
  const [periodo, setPeriodo] = useState<string>(rdo?.periodo || "Manhã");
  const [clima, setClima] = useState<string>(rdo?.clima || "Ensolarado");
  const [observacoes, setObservacoes] = useState(rdo?.observacoes || "");
  const [atividades, setAtividades] = useState<AtividadeRDO[]>(rdo?.atividadesRealizadas || []);
  const [equipes, setEquipes] = useState<EquipeRDO[]>(rdo?.equipesPresentes || []);
  const [equipamentos, setEquipamentos] = useState<EquipamentoRDO[]>(rdo?.equipamentosUtilizados || []);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dados reais do Supabase
  const { obras: obrasData, isLoading: isLoadingObras } = useObras();
  const { equipes: equipesReais, isLoading: isLoadingEquipes } = useEquipesSupabase();
  const { equipamentos: equipamentosReais, isLoading: isLoadingEquipamentos } = useEquipamentosSupabase();

  const obras = (obrasData as any[])?.map((o: any) => ({ id: o.id, nome: o.nome })) || [];

  // Atividades ainda são estáticas (sem tabela de templates no banco)
  const atividadesDisponiveis = [
    { id: "1", nome: "Escavação de Fundação", categoria: "Terraplanagem", unidadeMedida: "m³" },
    { id: "2", nome: "Concretagem de Laje", categoria: "Estrutura", unidadeMedida: "m²" },
    { id: "3", nome: "Instalação Elétrica", categoria: "Instalações", unidadeMedida: "m" },
    { id: "4", nome: "Alvenaria de Vedação", categoria: "Alvenaria", unidadeMedida: "m²" },
    { id: "5", nome: "Revestimento Cerâmico", categoria: "Acabamento", unidadeMedida: "m²" },
    { id: "6", nome: "Pintura Interna", categoria: "Acabamento", unidadeMedida: "m²" },
    { id: "7", nome: "Instalação Hidráulica", categoria: "Instalações", unidadeMedida: "m" },
    { id: "8", nome: "Impermeabilização", categoria: "Estrutura", unidadeMedida: "m²" },
  ];

  const handleSubmit = () => {
    if (!selectedDate || !selectedObra) {
      alert("Por favor, preencha a data e selecione uma obra");
      return;
    }
    const data: CreateRDOData = {
      data: selectedDate.toISOString().split('T')[0],
      obraId: selectedObra,
      periodo: periodo as any,
      clima,
      equipeOciosa: false,
      atividadesRealizadas: atividades.map(({ id, ...rest }) => rest),
      atividadesExtras: [],
      equipesPresentes: equipes,
      equipamentosUtilizados: equipamentos,
      equipamentosQuebrados: [],
      acidentes: [],
      materiaisFalta: [],
      estoqueMateriais: [],
      observacoes,
      files,
    };
    onSubmit(data);
    onClose();
  };

  /* ── Atividades ── */
  const adicionarAtividade = (atividadeId: string) => {
    const atividade = atividadesDisponiveis.find(a => a.id === atividadeId);
    if (atividade && !atividades.find(a => a.nome === atividade.nome)) {
      setAtividades([...atividades, {
        id: atividade.id,
        nome: atividade.nome,
        categoria: atividade.categoria,
        quantidade: 1,
        unidadeMedida: atividade.unidadeMedida,
        percentualConcluido: 0,
        status: 'Iniciada'
      }]);
    }
  };

  /* ── Equipes (dados reais) ── */
  const adicionarEquipe = (equipeId: string) => {
    const equipe = (equipesReais as any[]).find((e: any) => e.id === equipeId);
    if (equipe && !equipes.find(e => e.id === equipe.id)) {
      setEquipes([...equipes, {
        id: equipe.id,
        nome: equipe.nome,
        funcao: equipe.funcao || 'Colaborador',
        horasTrabalho: 8,
        presente: true
      }]);
    }
  };

  /* ── Equipamentos (dados reais) ── */
  const adicionarEquipamento = (equipamentoId: string) => {
    const equipamento = (equipamentosReais as any[]).find((e: any) => e.id === equipamentoId);
    if (equipamento && !equipamentos.find(e => e.id === equipamento.id)) {
      setEquipamentos([...equipamentos, {
        id: equipamento.id,
        nome: equipamento.nome,
        categoria: equipamento.categoria || 'Geral',
        horasUso: 8,
        status: 'Operacional'
      }]);
    }
  };

  /* ── Upload de Arquivos ── */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const novosArquivos = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...novosArquivos]);
    // Reset input para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removerArquivo = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const formatarTamanho = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">
            {isEditing ? "Editar RDO" : "Novo Relatório Diário de Obra (RDO)"}
          </DialogTitle>
          <DialogDescription>
            Preencha as informações do relatório diário
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Data / Obra / Período / Clima */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data do Relatório <span className="text-red-500">*</span></Label>
              <DatePicker
                date={selectedDate}
                onDateChange={setSelectedDate}
                placeholder="Selecione a data"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label>Obra <span className="text-red-500">*</span></Label>
              <Select value={selectedObra} onValueChange={setSelectedObra}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingObras ? "Carregando..." : "Selecione a obra"} />
                </SelectTrigger>
                <SelectContent>
                  {obras.map((obra) => (
                    <SelectItem key={obra.id} value={obra.id.toString()}>
                      {obra.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Período</Label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Manhã", "Tarde", "Noite", "Integral", "Meio período", "Turno noturno", "Turno estendido"].map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Condição Climática</Label>
              <Select value={clima} onValueChange={setClima}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Ensolarado", "Nublado", "Chuvoso", "Parcialmente nublado", "Ventoso", "Tempestade"].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Atividades Realizadas */}
          <Card className="bg-muted/20 border-border">
            <CardHeader>
              <CardTitle className="text-lg text-card-foreground">Atividades Realizadas</CardTitle>
              <CardDescription>Selecione as atividades executadas no dia</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select onValueChange={adicionarAtividade}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Adicionar atividade" />
                </SelectTrigger>
                <SelectContent>
                  {atividadesDisponiveis.map((atividade) => (
                    <SelectItem key={atividade.id} value={atividade.id}>
                      {atividade.nome} ({atividade.categoria})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {atividades.map((atividade, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-card rounded-lg border">
                  <div className="flex-1">
                    <p className="font-medium text-card-foreground">{atividade.nome}</p>
                    <p className="text-sm text-muted-foreground">{atividade.categoria}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      className="w-20"
                      value={atividade.quantidade}
                      onChange={(e) => {
                        const newAtividades = [...atividades];
                        newAtividades[index].quantidade = parseFloat(e.target.value) || 0;
                        setAtividades(newAtividades);
                      }}
                    />
                    <span className="text-sm text-muted-foreground">{atividade.unidadeMedida}</span>
                    <Select
                      value={atividade.status}
                      onValueChange={(value) => {
                        const newAtividades = [...atividades];
                        newAtividades[index].status = value as any;
                        setAtividades(newAtividades);
                      }}
                    >
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Iniciada">Iniciada</SelectItem>
                        <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                        <SelectItem value="Concluída">Concluída</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => setAtividades(atividades.filter((_, i) => i !== index))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Equipes Presentes — dados reais */}
          <Card className="bg-muted/20 border-border">
            <CardHeader>
              <CardTitle className="text-lg text-card-foreground">Equipes Presentes</CardTitle>
              <CardDescription>
                Colaboradores cadastrados em Equipes
                {isLoadingEquipes && <Loader2 className="inline ml-2 h-3 w-3 animate-spin" />}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(equipesReais as any[]).length === 0 && !isLoadingEquipes ? (
                <p className="text-sm text-muted-foreground">Nenhuma equipe cadastrada. Cadastre em <strong>Equipes</strong>.</p>
              ) : (
                <Select onValueChange={adicionarEquipe}>
                  <SelectTrigger>
                    <SelectValue placeholder="Adicionar membro da equipe" />
                  </SelectTrigger>
                  <SelectContent>
                    {(equipesReais as any[]).map((equipe: any) => (
                      <SelectItem key={equipe.id} value={equipe.id}>
                        {equipe.nome} — {equipe.funcao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {equipes.map((equipe, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-card rounded-lg border">
                  <div className="flex-1">
                    <p className="font-medium text-card-foreground">{equipe.nome}</p>
                    <p className="text-sm text-muted-foreground">{equipe.funcao}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Horas:</Label>
                    <Input
                      type="number"
                      className="w-20"
                      value={equipe.horasTrabalho}
                      onChange={(e) => {
                        const newEquipes = [...equipes];
                        newEquipes[index].horasTrabalho = parseFloat(e.target.value) || 0;
                        setEquipes(newEquipes);
                      }}
                    />
                    <Button variant="outline" size="sm" onClick={() => setEquipes(equipes.filter((_, i) => i !== index))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Equipamentos — dados reais */}
          <Card className="bg-muted/20 border-border">
            <CardHeader>
              <CardTitle className="text-lg text-card-foreground">Equipamentos Utilizados</CardTitle>
              <CardDescription>
                Equipamentos cadastrados
                {isLoadingEquipamentos && <Loader2 className="inline ml-2 h-3 w-3 animate-spin" />}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(equipamentosReais as any[]).length === 0 && !isLoadingEquipamentos ? (
                <p className="text-sm text-muted-foreground">Nenhum equipamento cadastrado. Cadastre em <strong>Equipamentos</strong>.</p>
              ) : (
                <Select onValueChange={adicionarEquipamento}>
                  <SelectTrigger>
                    <SelectValue placeholder="Adicionar equipamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {(equipamentosReais as any[]).map((eq: any) => (
                      <SelectItem key={eq.id} value={eq.id}>
                        {eq.nome} ({eq.categoria || 'Geral'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {equipamentos.map((equipamento, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-card rounded-lg border">
                  <div className="flex-1">
                    <p className="font-medium text-card-foreground">{equipamento.nome}</p>
                    <p className="text-sm text-muted-foreground">{equipamento.categoria}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Horas:</Label>
                    <Input
                      type="number"
                      className="w-20"
                      value={equipamento.horasUso}
                      onChange={(e) => {
                        const newEquipamentos = [...equipamentos];
                        newEquipamentos[index].horasUso = parseFloat(e.target.value) || 0;
                        setEquipamentos(newEquipamentos);
                      }}
                    />
                    <Select
                      value={equipamento.status}
                      onValueChange={(value) => {
                        const newEquipamentos = [...equipamentos];
                        newEquipamentos[index].status = value as any;
                        setEquipamentos(newEquipamentos);
                      }}
                    >
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Operacional">Operacional</SelectItem>
                        <SelectItem value="Manutenção">Manutenção</SelectItem>
                        <SelectItem value="Parado">Parado</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => setEquipamentos(equipamentos.filter((_, i) => i !== index))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Upload de Arquivos — funcional */}
          <Card className="bg-muted/20 border-border">
            <CardHeader>
              <CardTitle className="text-lg text-card-foreground">Anexos</CardTitle>
              <CardDescription>Imagens e documentos relacionados ao RDO</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Input file oculto */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                onChange={handleFileChange}
              />

              <div
                className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto h-8 w-8 mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Clique ou arraste arquivos aqui
                </p>
                <p className="text-xs text-muted-foreground">
                  Imagens (JPG, PNG), PDF, Excel, Word
                </p>
                <Button variant="outline" size="sm" className="mt-3" type="button">
                  <Plus className="h-4 w-4 mr-1" /> Selecionar Arquivos
                </Button>
              </div>

              {/* Lista de arquivos selecionados */}
              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-card rounded-lg border">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatarTamanho(file.size)}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {file.type.includes('image') ? 'Imagem' : file.name.split('.').pop()?.toUpperCase()}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => removerArquivo(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    {files.length} arquivo(s) selecionado(s) — serão enviados ao salvar
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Observações */}
          <div className="space-y-2">
            <Label>Observações Gerais</Label>
            <Textarea
              placeholder="Registre observações importantes do dia..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button className="gradient-construction border-0" onClick={handleSubmit}>
            {isEditing ? "Atualizar RDO" : "Salvar RDO"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}