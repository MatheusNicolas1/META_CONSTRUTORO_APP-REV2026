import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRequireOrg } from '@/hooks/requireOrg';
import {
  useAudioTopics,
  useCreateAudioTopic,
  useUpdateAudioTopic,
  useDeleteAudioTopic,
  useVoiceProfiles,
  useCreateVoiceProfile,
  useUpdateVoiceProfile,
  useDeleteVoiceProfile,
  useAudioSubscriptions,
  useCreateAudioSubscription,
  useUpdateAudioSubscription,
  useDeleteAudioSubscription,
  useAudioJobs,
  useAudioCosts,
} from '@/hooks/useAudio';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Plus,
  Edit3,
  Trash2,
  ArrowLeft,
  Volume2,
  Mic,
  Bell,
  Radio,
  DollarSign,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

type TabType = 'topics' | 'voices' | 'subscriptions' | 'history';

export default function AdminAudioPage() {
  const navigate = useNavigate();
  const { orgId } = useRequireOrg();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Volume2 className="h-6 w-6 text-primary" />
            Áudio e Resumos
          </h1>
          <p className="text-muted-foreground">
            Gerencie assuntos, vozes e assinaturas de áudio para resumos automáticos
          </p>
        </div>
      </div>

      <Tabs defaultValue="topics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="topics" className="flex items-center gap-2">
            <Radio className="h-4 w-4" />
            Assuntos
          </TabsTrigger>
          <TabsTrigger value="voices" className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            Vozes
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Assinaturas
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="topics">
          <TopicsTab orgId={orgId} />
        </TabsContent>

        <TabsContent value="voices">
          <VoicesTab orgId={orgId} />
        </TabsContent>

        <TabsContent value="subscriptions">
          <SubscriptionsTab orgId={orgId} />
        </TabsContent>

        <TabsContent value="history">
          <HistoryTab orgId={orgId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ===== Topics Tab ===== */
function TopicsTab({ orgId }: { orgId: string | undefined }) {
  const { data: topics, isLoading } = useAudioTopics(orgId);
  const createTopic = useCreateAudioTopic();
  const updateTopic = useUpdateAudioTopic();
  const deleteTopic = useDeleteAudioTopic();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', cron_schedule: '' });

  function openCreate() {
    setEditing(null);
    setForm({ name: '', description: '', cron_schedule: '' });
    setDialogOpen(true);
  }

  function openEdit(topic: any) {
    setEditing(topic);
    setForm({
      name: topic.name,
      description: topic.description || '',
      cron_schedule: topic.cron_schedule || '',
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!orgId) return;
    try {
      if (editing) {
        await updateTopic.mutateAsync({ id: editing.id, ...form });
      } else {
        await createTopic.mutateAsync({ org_id: orgId, ...form, is_active: true });
      }
      setDialogOpen(false);
    } catch {}
  }

  if (isLoading) return <Skeleton className="h-48" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {topics?.length ?? 0} assunto{(topics?.length ?? 0) !== 1 ? 's' : ''} cadastrado{(topics?.length ?? 0) !== 1 ? 's' : ''}
        </p>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Novo Assunto
        </Button>
      </div>

      {(!topics || topics.length === 0) ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Radio className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Nenhum assunto cadastrado</p>
            <p className="text-sm">Crie assuntos para gerar resumos automáticos de áudio</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {topics.map((topic) => (
            <Card key={topic.id} className={topic.is_active ? '' : 'opacity-60'}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {topic.name}
                    {topic.is_active ? (
                      <Badge variant="default" className="text-xs">Ativo</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Inativo</Badge>
                    )}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(topic)}>
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(topic)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {topic.description && (
                  <CardDescription className="text-xs">{topic.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {topic.cron_schedule && <p>Agendamento: {topic.cron_schedule}</p>}
                <p>Criado em: {new Date(topic.created_at).toLocaleDateString('pt-BR')}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Assunto' : 'Novo Assunto'}</DialogTitle>
            <DialogDescription>
              Configure o assunto para geração de resumos automáticos de áudio
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Agendamento (cron)</label>
              <Input
                value={form.cron_schedule}
                onChange={(e) => setForm({ ...form, cron_schedule: e.target.value })}
                placeholder="0 8 * * * (diário 8h)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.name || createTopic.isPending || updateTopic.isPending}>
              {createTopic.isPending || updateTopic.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {editing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir assunto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O assunto &quot;{deleteConfirm?.name}&quot; será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteConfirm) {
                  await deleteTopic.mutateAsync(deleteConfirm.id);
                  setDeleteConfirm(null);
                }
              }}
              className="bg-destructive text-destructive-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ===== Voices Tab ===== */
function VoicesTab({ orgId }: { orgId: string | undefined }) {
  const { data: voices, isLoading } = useVoiceProfiles(orgId);
  const createVoice = useCreateVoiceProfile();
  const updateVoice = useUpdateVoiceProfile();
  const deleteVoice = useDeleteVoiceProfile();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [form, setForm] = useState({ label: '', elevenlabs_voice_id: '', language: '' });

  function openCreate() {
    setEditing(null);
    setForm({ label: '', elevenlabs_voice_id: '', language: '' });
    setDialogOpen(true);
  }

  function openEdit(voice: any) {
    setEditing(voice);
    setForm({
      label: voice.label,
      elevenlabs_voice_id: voice.elevenlabs_voice_id,
      language: voice.language || '',
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!orgId) return;
    try {
      if (editing) {
        await updateVoice.mutateAsync({ id: editing.id, ...form });
      } else {
        await createVoice.mutateAsync({ org_id: orgId, ...form });
      }
      setDialogOpen(false);
    } catch {}
  }

  if (isLoading) return <Skeleton className="h-48" />;

  const defaultVoices = [
    { label: 'Masculina (Padrão)', voiceId: 'pqHfZKP75CvOlQylNhV4' },
    { label: 'Feminina', voiceId: 'XrExE9yKIg1WjnnlVkGX' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {voices?.length ?? 0} voz(es) personalizada(s)
        </p>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nova Voz
        </Button>
      </div>

      {/* Default voices info */}
      <Card className="bg-muted/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Vozes Padrão (ElevenLabs)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {defaultVoices.map((v) => (
            <div key={v.voiceId} className="flex items-center gap-2 text-sm">
              <Mic className="h-4 w-4 text-muted-foreground" />
              <span>{v.label}</span>
              <code className="text-xs text-muted-foreground ml-auto">{v.voiceId}</code>
            </div>
          ))}
        </CardContent>
      </Card>

      {(!voices || voices.length === 0) ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Mic className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Nenhuma voz personalizada</p>
            <p className="text-sm">Adicione vozes personalizadas da sua conta ElevenLabs</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {voices.map((voice) => (
            <Card key={voice.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Mic className="h-4 w-4 text-primary" />
                    {voice.label}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(voice)}>
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(voice)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <p>Voice ID: <code>{voice.elevenlabs_voice_id}</code></p>
                {voice.language && <p>Idioma: {voice.language}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Voz' : 'Nova Voz'}</DialogTitle>
            <DialogDescription>
              Configure uma voz personalizada da sua conta ElevenLabs
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome</label>
              <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Voice ID (ElevenLabs)</label>
              <Input
                value={form.elevenlabs_voice_id}
                onChange={(e) => setForm({ ...form, elevenlabs_voice_id: e.target.value })}
                placeholder="pqHfZKP75CvOlQylNhV4"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Idioma (opcional)</label>
              <Input
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
                placeholder="pt-BR"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.label || !form.elevenlabs_voice_id}>
              {editing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir voz?</AlertDialogTitle>
            <AlertDialogDescription>
              A voz &quot;{deleteConfirm?.label}&quot; será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteConfirm) {
                  await deleteVoice.mutateAsync(deleteConfirm.id);
                  setDeleteConfirm(null);
                }
              }}
              className="bg-destructive text-destructive-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ===== Subscriptions Tab ===== */
function SubscriptionsTab({ orgId }: { orgId: string | undefined }) {
  const { data: subs, isLoading } = useAudioSubscriptions(orgId);
  const { data: topics } = useAudioTopics(orgId);
  const { data: voices } = useVoiceProfiles(orgId);
  const createSub = useCreateAudioSubscription();
  const updateSub = useUpdateAudioSubscription();
  const deleteSub = useDeleteAudioSubscription();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [form, setForm] = useState({
    topic_id: '',
    voice_profile_id: '',
    channel: 'whatsapp',
    recipient_phone: '',
    cron_schedule: '',
    quiet_hours_start: '',
    quiet_hours_end: '',
  });

  const allVoices = [
    ...(voices || []),
    ...[
      { id: 'pqHfZKP75CvOlQylNhV4', label: 'Masculina (Bill - Padrão)', elevenlabs_voice_id: 'pqHfZKP75CvOlQylNhV4' },
      { id: 'XrExE9yKIg1WjnnlVkGX', label: 'Feminina (Charlotte)', elevenlabs_voice_id: 'XrExE9yKIg1WjnnlVkGX' },
    ],
  ];

  function openCreate() {
    setEditing(null);
    setForm({ topic_id: '', voice_profile_id: '', channel: 'whatsapp', recipient_phone: '', cron_schedule: '', quiet_hours_start: '', quiet_hours_end: '' });
    setDialogOpen(true);
  }

  function openEdit(sub: any) {
    setEditing(sub);
    setForm({
      topic_id: sub.topic_id || '',
      voice_profile_id: sub.voice_profile_id || '',
      channel: sub.channel || 'whatsapp',
      recipient_phone: sub.recipient_phone || '',
      cron_schedule: sub.cron_schedule || '',
      quiet_hours_start: sub.quiet_hours_start || '',
      quiet_hours_end: sub.quiet_hours_end || '',
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!orgId) return;
    try {
      if (editing) {
        await updateSub.mutateAsync({ id: editing.id, ...form, org_id: orgId });
      } else {
        await createSub.mutateAsync({ org_id: orgId, ...form, is_active: true });
      }
      setDialogOpen(false);
    } catch {}
  }

  if (isLoading) return <Skeleton className="h-48" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {subs?.length ?? 0} assinatura{(subs?.length ?? 0) !== 1 ? 's' : ''}
        </p>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nova Assinatura
        </Button>
      </div>

      {(!subs || subs.length === 0) ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Nenhuma assinatura de áudio</p>
            <p className="text-sm">Assine um assunto para receber resumos automáticos no WhatsApp</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {subs.map((sub: any) => (
            <Card key={sub.id} className={sub.is_active ? '' : 'opacity-60'}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" />
                    {sub.topic?.name || 'Sem assunto'}
                    {sub.is_active ? (
                      <Badge variant="default" className="text-xs">Ativo</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Inativo</Badge>
                    )}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(sub)}>
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(sub)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <p>Canal: <Badge variant="outline">{sub.channel}</Badge></p>
                {sub.recipient_phone && <p>WhatsApp: {sub.recipient_phone}</p>}
                {sub.voice_profile && <p>Voz: {sub.voice_profile.label}</p>}
                {sub.cron_schedule && <p>Agendamento: {sub.cron_schedule}</p>}
                {sub.quiet_hours_start && sub.quiet_hours_end && (
                  <p>Horário silencioso: {sub.quiet_hours_start}h às {sub.quiet_hours_end}h</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Assinatura' : 'Nova Assinatura'}</DialogTitle>
            <DialogDescription>
              Configure o disparo automático de resumos de áudio
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Assunto</label>
              <Select value={form.topic_id} onValueChange={(v) => setForm({ ...form, topic_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um assunto" />
                </SelectTrigger>
                <SelectContent>
                  {(topics || []).map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Voz</label>
              <Select value={form.voice_profile_id} onValueChange={(v) => setForm({ ...form, voice_profile_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma voz" />
                </SelectTrigger>
                <SelectContent>
                  {allVoices.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Canal</label>
              <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="app">App (notificação)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">WhatsApp (com DDI)</label>
              <Input
                value={form.recipient_phone}
                onChange={(e) => setForm({ ...form, recipient_phone: e.target.value })}
                placeholder="5511999999999"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Agendamento (cron)</label>
              <Input
                value={form.cron_schedule}
                onChange={(e) => setForm({ ...form, cron_schedule: e.target.value })}
                placeholder="0 8 * * * (diário 8h)"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Hora início silêncio</label>
                <Input
                  value={form.quiet_hours_start}
                  onChange={(e) => setForm({ ...form, quiet_hours_start: e.target.value })}
                  placeholder="22"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Hora fim silêncio</label>
                <Input
                  value={form.quiet_hours_end}
                  onChange={(e) => setForm({ ...form, quiet_hours_end: e.target.value })}
                  placeholder="07"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.topic_id || createSub.isPending}>
              {editing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir assinatura?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta assinatura será removida e você não receberá mais resumos automáticos deste assunto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteConfirm) {
                  await deleteSub.mutateAsync(deleteConfirm.id);
                  setDeleteConfirm(null);
                }
              }}
              className="bg-destructive text-destructive-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ===== History Tab ===== */
function HistoryTab({ orgId }: { orgId: string | undefined }) {
  const { data: jobs, isLoading } = useAudioJobs(orgId);
  const { data: costs } = useAudioCosts(orgId);

  if (isLoading) return <Skeleton className="h-48" />;

  const totalChars = (jobs || []).reduce((acc, j) => acc + (j.tts_chars_consumed || 0), 0);
  const totalCost = (costs || []).reduce((acc: number, c: any) => acc + (c.estimated_cost || 0), 0);

  const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
    pending: { label: 'Pendente', icon: Loader2, color: 'text-muted-foreground' },
    generating: { label: 'Gerando', icon: Loader2, color: 'text-blue-500' },
    generated: { label: 'Gerado', icon: CheckCircle2, color: 'text-green-500' },
    sent: { label: 'Enviado', icon: CheckCircle2, color: 'text-green-500' },
    failed: { label: 'Falhou', icon: XCircle, color: 'text-destructive' },
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Áudios</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{jobs?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Chars Consumidos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalChars.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Custo Estimado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${totalCost.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Jobs List */}
      {(!jobs || jobs.length === 0) ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Nenhum áudio gerado ainda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {jobs.map((job: any) => {
            const status = statusConfig[job.status] || statusConfig.pending;
            const StatusIcon = status.icon;
            return (
              <Card key={job.id} className="py-2">
                <CardContent className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusIcon className={`h-4 w-4 ${status.color}`} />
                    <div>
                      <p className="text-sm font-medium">{job.topic?.name || 'Sem assunto'}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(job.created_at).toLocaleString('pt-BR')}
                        {job.tts_chars_consumed ? ` · ${job.tts_chars_consumed} chars` : ''}
                      </p>
                    </div>
                  </div>
                  <Badge variant={job.status === 'sent' || job.status === 'generated' ? 'default' : 'secondary'}>
                    {status.label}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
