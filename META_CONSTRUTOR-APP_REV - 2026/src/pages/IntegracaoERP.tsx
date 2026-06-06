import React, { useState } from 'react';
import { useIntegracaoERP, ErpProvider, ErpAuthType, ErpConfigRecord, SyncLogRecord, WebhookQueueRecord } from '@/hooks/useIntegracaoERP';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plug, RefreshCw, Clock, CheckCircle, XCircle, AlertTriangle, Shield, Zap, History, Settings, Activity, RotateCw, Ban } from 'lucide-react';

// --- Helpers ---

const statusBadge = (status: string) => {
  const map: Record<string, { label: string; className: string }> = {
    conectado: { label: 'Conectado', className: 'bg-green-100 text-green-800' },
    desconectado: { label: 'Desconectado', className: 'bg-gray-100 text-gray-800' },
    erro: { label: 'Erro', className: 'bg-red-100 text-red-800' },
    pendente: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
    sincronizando: { label: 'Sincronizando...', className: 'bg-blue-100 text-blue-800' },
    sucesso: { label: 'Sucesso', className: 'bg-green-100 text-green-800' },
    falha: { label: 'Falha', className: 'bg-red-100 text-red-800' },
    parcial: { label: 'Parcial', className: 'bg-orange-100 text-orange-800' },
    em_andamento: { label: 'Em andamento', className: 'bg-blue-100 text-blue-800' },
    processando: { label: 'Processando', className: 'bg-blue-100 text-blue-800' },
    cancelado: { label: 'Cancelado', className: 'bg-gray-100 text-gray-800' },
  };
  const info = map[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
  return <Badge className={info.className}>{info.label}</Badge>;
};

const formatDate = (d?: string | null) => {
  if (!d) return '-';
  return new Date(d).toLocaleString('pt-BR');
};

const providers: { value: ErpProvider; label: string }[] = [
  { value: 'sienge', label: 'Sienge' },
  { value: 'totvs', label: 'TOTVS' },
  { value: 'protheus', label: 'Protheus' },
  { value: 'sap', label: 'SAP' },
  { value: 'megasoft', label: 'MegaSoft' },
  { value: 'sieng', label: 'SIENg' },
  { value: 'personalizado', label: 'Personalizado' },
];

const authTypes: { value: ErpAuthType; label: string }[] = [
  { value: 'api_key', label: 'API Key' },
  { value: 'oauth2', label: 'OAuth 2.0' },
  { value: 'basic', label: 'Basic Auth' },
  { value: 'token', label: 'Token' },
];

const entidadesDisponiveis = ['obras', 'clientes', 'fornecedores', 'medicoes', 'financeiro'];

// --- Componente ---

export default function IntegracaoERP() {
  const [activeTab, setActiveTab] = useState('config');
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);

  const {
    isLoading,
    configs,
    config,
    logs,
    queue,
    planGate,
    isLogsLoading,
    isQueueLoading,
    saveConfig,
    testConnection,
    triggerSync,
    retryWebhook,
    cancelWebhook,
  } = useIntegracaoERP(selectedConfigId || undefined);

  // Form state
  const [formProvider, setFormProvider] = useState<ErpProvider>('sienge');
  const [formNome, setFormNome] = useState('');
  const [formBaseUrl, setFormBaseUrl] = useState('');
  const [formApiKey, setFormApiKey] = useState('');
  const [formApiSecret, setFormApiSecret] = useState('');
  const [formTenantId, setFormTenantId] = useState('');
  const [formAuthType, setFormAuthType] = useState<ErpAuthType>('api_key');
  const [formSyncInterval, setFormSyncInterval] = useState(60);
  const [formEntidades, setFormEntidades] = useState<string[]>(['obras', 'clientes', 'fornecedores', 'medicoes', 'financeiro']);
  const [formEndpoints, setFormEndpoints] = useState<Record<string, string>>({});
  const [formFieldMapping, setFormFieldMapping] = useState<Record<string, string>>({});

  // Filtros de logs
  const [logFilterEntidade, setLogFilterEntidade] = useState('');
  const [logFilterStatus, setLogFilterStatus] = useState('');
  const [logFilterAcao, setLogFilterAcao] = useState('');

  const selectConfig = (c: ErpConfigRecord) => {
    setSelectedConfigId(c.id);
    setFormProvider(c.provider);
    setFormNome(c.nome);
    setFormBaseUrl(c.base_url);
    setFormApiKey(c.api_key || '');
    setFormApiSecret(c.api_secret || '');
    setFormTenantId(c.tenant_id || '');
    setFormAuthType(c.auth_type);
    setFormSyncInterval(c.sync_interval_minutes);
    setFormEntidades(c.entidades_sincronizar || []);
    setFormEndpoints(c.endpoints || {});
    setFormFieldMapping(c.field_mapping || {});
  };

  const handleSave = () => {
    saveConfig.mutate({
      id: selectedConfigId || undefined,
      provider: formProvider,
      nome: formNome,
      base_url: formBaseUrl,
      api_key: formApiKey || undefined,
      api_secret: formApiSecret || undefined,
      tenant_id: formTenantId || undefined,
      auth_type: formAuthType,
      sync_interval_minutes: formSyncInterval,
      entidades_sincronizar: formEntidades,
      endpoints: formEndpoints,
      field_mapping: formFieldMapping,
    });
  };

  // Filtragem de logs
  const filteredLogs = logs.filter((l: SyncLogRecord) => {
    if (logFilterEntidade && l.entidade !== logFilterEntidade) return false;
    if (logFilterStatus && l.status !== logFilterStatus) return false;
    if (logFilterAcao && l.acao !== logFilterAcao) return false;
    return true;
  });

  // Filtragem de queue
  const [queueFilterStatus, setQueueFilterStatus] = useState('');
  const filteredQueue = queue.filter((q: WebhookQueueRecord) => {
    if (queueFilterStatus && q.status !== queueFilterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold">Integração com ERP</h1>
        <p className="mt-1 text-gray-600">
          Conecte seu sistema ERP (Sienge, TOTVS, SAP e outros) para sincronizar obras, clientes, fornecedores e dados financeiros.
        </p>
      </div>

      {/* Gate de plano */}
      {!planGate.allowed && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <Shield className="h-5 w-5" />
              Plano {planGate.plan}
            </CardTitle>
            <CardDescription className="text-amber-700">{planGate.message}</CardDescription>
          </CardHeader>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="config">
            <Settings className="h-4 w-4 mr-1" /> Configuração
          </TabsTrigger>
          <TabsTrigger value="eventos">
            <Zap className="h-4 w-4 mr-1" /> Eventos / Webhooks
          </TabsTrigger>
          <TabsTrigger value="logs">
            <History className="h-4 w-4 mr-1" /> Logs
          </TabsTrigger>
          <TabsTrigger value="permissoes">
            <Shield className="h-4 w-4 mr-1" /> Permissões
          </TabsTrigger>
        </TabsList>

        {/* Aba: Configuração */}
        <TabsContent value="config" className="space-y-4 pt-4">
          {/* Lista de configs existentes */}
          {isLoading ? (
            <div className="flex items-center gap-2 text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
          ) : configs.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {configs.map((c: ErpConfigRecord) => (
                <Card
                  key={c.id}
                  className={`cursor-pointer border-2 transition-colors ${selectedConfigId === c.id ? 'border-blue-400' : 'hover:border-gray-300'}`}
                  onClick={() => selectConfig(c)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Plug className="h-4 w-4" /> {c.nome}
                      </CardTitle>
                      {statusBadge(c.status)}
                    </div>
                    <CardDescription>
                      {providers.find(p => p.value === c.provider)?.label || c.provider} &middot;{' '}
                      {c.ativo ? 'Ativo' : 'Inativo'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-xs text-gray-500 space-y-1">
                    <div>Base URL: {c.base_url}</div>
                    <div>Sincronização: a cada {c.sync_interval_minutes} min</div>
                    <div>Última sinc: {formatDate(c.ultima_sincronizacao)}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                <Plug className="h-8 w-8 mx-auto mb-2" />
                <p>Nenhuma configuração ERP encontrada.</p>
                <p className="text-sm">Crie uma nova abaixo.</p>
              </CardContent>
            </Card>
          )}

          {/* Formulário de configuração */}
          <Card>
            <CardHeader>
              <CardTitle>{selectedConfigId ? 'Editar Configuração' : 'Nova Configuração ERP'}</CardTitle>
              <CardDescription>Preencha os dados do provedor ERP</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Provider */}
                <div>
                  <label className="block text-sm font-medium mb-1">Provedor</label>
                  <select
                    className="w-full rounded-lg border border-border bg-card p-2 text-sm"
                    value={formProvider}
                    onChange={e => setFormProvider(e.target.value as ErpProvider)}
                  >
                    {providers.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium mb-1">Nome da Conexão</label>
                  <input
                    className="w-full rounded-lg border border-border bg-card p-2 text-sm"
                    placeholder="Ex: Sienge Produção"
                    value={formNome}
                    onChange={e => setFormNome(e.target.value)}
                  />
                </div>

                {/* Base URL */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">URL Base da API</label>
                  <input
                    className="w-full rounded-lg border border-border bg-card p-2 text-sm"
                    placeholder="https://api.erp.exemplo.com/v2"
                    value={formBaseUrl}
                    onChange={e => setFormBaseUrl(e.target.value)}
                  />
                </div>

                {/* Auth type */}
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo de Autenticação</label>
                  <select
                    className="w-full rounded-lg border border-border bg-card p-2 text-sm"
                    value={formAuthType}
                    onChange={e => setFormAuthType(e.target.value as ErpAuthType)}
                  >
                    {authTypes.map(a => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </div>

                {/* Sync interval */}
                <div>
                  <label className="block text-sm font-medium mb-1">Intervalo de Sinc. (min)</label>
                  <input
                    type="number"
                    min={15}
                    className="w-full rounded-lg border border-border bg-card p-2 text-sm"
                    value={formSyncInterval}
                    onChange={e => setFormSyncInterval(Number(e.target.value))}
                  />
                </div>

                {/* API Key */}
                <div>
                  <label className="block text-sm font-medium mb-1">API Key / Client ID</label>
                  <input
                    className="w-full rounded-lg border border-border bg-card p-2 text-sm"
                    type="password"
                    placeholder="••••••••"
                    value={formApiKey}
                    onChange={e => setFormApiKey(e.target.value)}
                  />
                </div>

                {/* API Secret */}
                <div>
                  <label className="block text-sm font-medium mb-1">API Secret / Client Secret</label>
                  <input
                    className="w-full rounded-lg border border-border bg-card p-2 text-sm"
                    type="password"
                    placeholder="••••••••"
                    value={formApiSecret}
                    onChange={e => setFormApiSecret(e.target.value)}
                  />
                </div>

                {/* Tenant ID */}
                <div>
                  <label className="block text-sm font-medium mb-1">Tenant / Empresa ID</label>
                  <input
                    className="w-full rounded-lg border border-border bg-card p-2 text-sm"
                    placeholder="ID do tenant/empresa no ERP"
                    value={formTenantId}
                    onChange={e => setFormTenantId(e.target.value)}
                  />
                </div>
              </div>

              {/* Entidades */}
              <div>
                <label className="block text-sm font-medium mb-2">Entidades para Sincronizar</label>
                <div className="flex flex-wrap gap-2">
                  {entidadesDisponiveis.map(e => (
                    <label key={e} className="flex items-center gap-1 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formEntidades.includes(e)}
                        onChange={() => {
                          setFormEntidades(prev =>
                            prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]
                          );
                        }}
                      />
                      {e.charAt(0).toUpperCase() + e.slice(1)}
                    </label>
                  ))}
                </div>
              </div>

              {/* Endpoints personalizados */}
              <div>
                <label className="block text-sm font-medium mb-2">Endpoints Personalizados (JSON)</label>
                <textarea
                  className="w-full rounded-lg border border-border bg-card p-2 text-sm font-mono"
                  rows={4}
                  placeholder='{"obras": "/api/obras", "clientes": "/api/clientes"}'
                  value={JSON.stringify(formEndpoints, null, 2)}
                  onChange={e => {
                    try { setFormEndpoints(JSON.parse(e.target.value)); } catch { /* aguarda JSON válido */ }
                  }}
                />
              </div>

              {/* Field mapping */}
              <div>
                <label className="block text-sm font-medium mb-2">Mapeamento de Campos (JSON)</label>
                <textarea
                  className="w-full rounded-lg border border-border bg-card p-2 text-sm font-mono"
                  rows={4}
                  placeholder='{"nome": "name", "endereco": "address"}'
                  value={JSON.stringify(formFieldMapping, null, 2)}
                  onChange={e => {
                    try { setFormFieldMapping(JSON.parse(e.target.value)); } catch { /* aguarda JSON válido */ }
                  }}
                />
              </div>

              {/* Ações */}
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={saveConfig.isPending || !formNome || !formBaseUrl}>
                  {saveConfig.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Salvar Configuração
                </Button>
                {selectedConfigId && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => testConnection.mutate(selectedConfigId)}
                      disabled={testConnection.isPending}
                    >
                      {testConnection.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Activity className="h-4 w-4 mr-1" />}
                      Testar Conexão
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => triggerSync.mutate({ configId: selectedConfigId })}
                      disabled={triggerSync.isPending}
                    >
                      {triggerSync.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                      Sincronizar Agora
                    </Button>
                  </>
                )}
                {selectedConfigId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setSelectedConfigId(null); }}
                  >
                    Nova
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Eventos / Webhooks */}
        <TabsContent value="eventos" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" /> Fila de Webhooks
              </CardTitle>
              <CardDescription>Eventos de sincronização com retry automático</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filtro */}
              <div className="mb-4">
                <select
                  className="rounded-lg border border-border bg-card p-2 text-sm"
                  value={queueFilterStatus}
                  onChange={e => setQueueFilterStatus(e.target.value)}
                >
                  <option value="">Todos os status</option>
                  <option value="pendente">Pendente</option>
                  <option value="processando">Processando</option>
                  <option value="sucesso">Sucesso</option>
                  <option value="falha">Falha</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              {isQueueLoading ? (
                <div className="flex items-center gap-2 text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
              ) : filteredQueue.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <Clock className="h-8 w-8 mx-auto mb-2" />
                  <p>Nenhum evento na fila.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredQueue.map((item: WebhookQueueRecord) => (
                    <div key={item.id} className="rounded-lg border border-border bg-card p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{item.evento}</span>
                          {statusBadge(item.status)}
                        </div>
                        <div className="flex items-center gap-1">
                          {item.status === 'falha' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Retry"
                              onClick={() => retryWebhook.mutate(item.id)}
                              disabled={retryWebhook.isPending}
                            >
                              <RotateCw className="h-3 w-3" />
                            </Button>
                          )}
                          {(item.status === 'pendente' || item.status === 'falha') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Cancelar"
                              onClick={() => cancelWebhook.mutate(item.id)}
                              disabled={cancelWebhook.isPending}
                            >
                              <Ban className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Tentativas: {item.tentativas}/{item.max_tentativas} &middot;{' '}
                        Prioridade: {item.prioridade} &middot;{' '}
                        Próx: {formatDate(item.proxima_tentativa)}
                      </div>
                      {item.erro_ultima_tentativa && (
                        <div className="text-xs text-red-600 mt-1 bg-red-50 p-1 rounded">
                          Erro: {item.erro_ultima_tentativa}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Logs */}
        <TabsContent value="logs" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" /> Logs de Sincronização
              </CardTitle>
              <CardDescription>Histórico de operações de sincronização com o ERP</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filtros */}
              <div className="flex flex-wrap gap-2 mb-4">
                <select
                  className="rounded-lg border border-border bg-card p-2 text-sm"
                  value={logFilterEntidade}
                  onChange={e => setLogFilterEntidade(e.target.value)}
                >
                  <option value="">Todas entidades</option>
                  <option value="obras">Obras</option>
                  <option value="clientes">Clientes</option>
                  <option value="fornecedores">Fornecedores</option>
                  <option value="medicoes">Medições</option>
                  <option value="financeiro">Financeiro</option>
                  <option value="conexao">Conexão</option>
                  <option value="sync">Sync</option>
                </select>
                <select
                  className="rounded-lg border border-border bg-card p-2 text-sm"
                  value={logFilterAcao}
                  onChange={e => setLogFilterAcao(e.target.value)}
                >
                  <option value="">Todas ações</option>
                  <option value="import">Import</option>
                  <option value="export">Export</option>
                  <option value="sync">Sync</option>
                  <option value="test">Test</option>
                  <option value="error">Error</option>
                </select>
                <select
                  className="rounded-lg border border-border bg-card p-2 text-sm"
                  value={logFilterStatus}
                  onChange={e => setLogFilterStatus(e.target.value)}
                >
                  <option value="">Todos status</option>
                  <option value="sucesso">Sucesso</option>
                  <option value="falha">Falha</option>
                  <option value="pendente">Pendente</option>
                  <option value="parcial">Parcial</option>
                  <option value="em_andamento">Em andamento</option>
                </select>
              </div>

              {isLogsLoading ? (
                <div className="flex items-center gap-2 text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
              ) : filteredLogs.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <Activity className="h-8 w-8 mx-auto mb-2" />
                  <p>Nenhum log encontrado.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs text-gray-500">
                        <th className="p-2">Data</th>
                        <th className="p-2">Entidade</th>
                        <th className="p-2">Ação</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Registros</th>
                        <th className="p-2">Duração</th>
                        <th className="p-2">Mensagem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log: SyncLogRecord) => (
                        <tr key={log.id} className="border-b border-border/50 hover:bg-gray-50">
                          <td className="p-2 whitespace-nowrap">{formatDate(log.iniciado_em)}</td>
                          <td className="p-2">{log.entidade}</td>
                          <td className="p-2">{log.acao}</td>
                          <td className="p-2">{statusBadge(log.status)}</td>
                          <td className="p-2">
                            {log.registros_processados}
                            {log.registros_erro > 0 && (
                              <span className="text-red-600 ml-1">({log.registros_erro} err)</span>
                            )}
                          </td>
                          <td className="p-2">{log.duracao_ms ? `${log.duracao_ms}ms` : '-'}</td>
                          <td className="p-2 max-w-xs truncate" title={log.mensagem || ''}>
                            {log.mensagem || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Permissões */}
        <TabsContent value="permissoes" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" /> Permissões e Plano
              </CardTitle>
              <CardDescription>Informações sobre o gate de plano e permissões de acesso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  {planGate.allowed ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="font-medium">Integração ERP</span>
                </div>
                <p className="text-sm text-gray-600">{planGate.message}</p>
                <p className="text-xs text-gray-400 mt-1">Plano atual: <strong>{planGate.plan}</strong></p>
              </div>

              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="font-medium mb-2">Permissões por Perfil</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-800">Presidente</Badge>
                    <span className="text-gray-600">Acesso total: configurar, testar, sincronizar, excluir</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-800">Administrador</Badge>
                    <span className="text-gray-600">Acesso total: configurar, testar, sincronizar, excluir</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">Gerente</Badge>
                    <span className="text-gray-600">Configurar, testar e sincronizar (sem exclusão)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-gray-100 text-gray-800">Colaborador</Badge>
                    <span className="text-gray-600">Somente visualização de logs e status</span>
                  </div>
                </div>
              </div>

              {!planGate.allowed && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <span className="font-medium text-amber-800">Upgrade Necessário</span>
                  </div>
                  <p className="text-sm text-amber-700">
                    A integração com ERP está disponível nos planos Business e Enterprise.
                    Entre em contato com o suporte para fazer o upgrade do seu plano.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
