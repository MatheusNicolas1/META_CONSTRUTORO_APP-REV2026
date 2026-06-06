import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Zap,
  Mail,
  Smartphone,
  Cloud,
  RefreshCw
} from "lucide-react";
import { IntegrationLog, IntegrationStatus } from "@/types/integration";

interface IntegrationDashboardProps {
  logs: IntegrationLog[];
  onRefresh: () => void | Promise<void>;
  statuses?: IntegrationStatus[];
}

export const IntegrationDashboard = ({ logs, onRefresh, statuses = [] }: IntegrationDashboardProps) => {
  const integrationStatuses = statuses;
  const statusesWithEvidence = integrationStatuses.filter(status => status.hasEvidence && typeof status.uptime === 'number');
  const aggregateUptime = statusesWithEvidence.length > 0
    ? Math.round(statusesWithEvidence.reduce((sum, status) => sum + (status.uptime || 0), 0) / statusesWithEvidence.length)
    : null;

  const stats = useMemo(() => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentLogs = logs.filter(log => new Date(log.timestamp) > oneHourAgo);
    const successLogs = logs.filter(log => log.status === 'success');
    const errorLogs = logs.filter(log => log.status === 'error');

    return {
      totalEvents: logs.length,
      successRate: logs.length > 0 ? Math.round((successLogs.length / logs.length) * 100) : null,
      errorCount: errorLogs.length,
      lastHourEvents: recentLogs.length
    };
  }, [logs]);

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'n8n': return <Zap className="h-4 w-4" />;
      case 'whatsapp': return <Smartphone className="h-4 w-4" />;
      case 'gmail': return <Mail className="h-4 w-4" />;
      case 'googledrive': return <Cloud className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const testIntegration = async () => {
    await onRefresh();
  };

  const getEvidenceLabel = (status: IntegrationStatus) => {
    if (!status.hasEvidence) return "Sem evidencia";
    return status.isHealthy ? "Saudavel" : "Erro";
  };

  const getEvidenceBadgeVariant = (status: IntegrationStatus) => {
    if (!status.hasEvidence) return "secondary";
    return status.isHealthy ? "default" : "destructive";
  };

  const formatLastCheck = (status: IntegrationStatus) => {
    if (!status.lastCheck) return "Sem teste registrado";
    return new Date(status.lastCheck).toLocaleTimeString();
  };

  const formatPercent = (value?: number) => typeof value === "number" ? `${value}%` : "-";

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
            <p className="text-xs text-muted-foreground">
              {stats.lastHourEvents} in the last hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercent(stats.successRate ?? undefined)}</div>
            <Progress value={stats.successRate ?? 0} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.successRate === null ? "Sem logs persistidos" : "Calculado a partir dos logs"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.errorCount}</div>
            <p className="text-xs text-muted-foreground">
              Total error count
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {aggregateUptime === null ? "-" : `${aggregateUptime}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              {aggregateUptime === null ? "Sem evidencias de teste" : "Media dos logs reais"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="status" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="status">Integration Status</TabsTrigger>
          <TabsTrigger value="events">Recent Events</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Integration Health Status</h3>
            <Button onClick={onRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          
          <div className="grid gap-4">
            {integrationStatuses.map((status) => (
              <Card key={status.integrationId}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getIntegrationIcon(status.type)}
                      <div>
                        <h4 className="font-medium">{status.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Ultima evidencia: {formatLastCheck(status)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          Taxa de sucesso: {formatPercent(status.successRate)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Eventos reais: {status.evidenceCount}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={getEvidenceBadgeVariant(status)}
                          className="flex items-center gap-1"
                        >
                          {status.hasEvidence && status.isHealthy ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <AlertCircle className="h-3 w-3" />
                          )}
                          {getEvidenceLabel(status)}
                        </Badge>
                        
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => testIntegration()}
                        >
                          Refresh
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {!status.hasEvidence && (
                    <div className="mt-3 p-3 bg-muted border border-border rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Nenhum teste ou execucao persistida em logs para esta integracao.
                      </p>
                    </div>
                  )}

                  {status.hasEvidence && !status.isHealthy && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">
                        Integracao com falhas registradas. Erros persistidos: {status.errorCount}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <div className="space-y-3">
            {logs.slice(0, 10).map((log) => (
              <Card key={log.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getIntegrationIcon(log.integrationType)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{log.event}</span>
                          <Badge 
                            variant={
                              log.status === 'success' ? 'default' :
                              log.status === 'error' ? 'destructive' : 'secondary'
                            }
                          >
                            {log.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{log.message}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                      {log.duration && (
                        <div className="text-xs text-muted-foreground">
                          {log.duration}ms
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {log.error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      {log.error}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-6">
            {integrationStatuses.map((status) => (
              <Card key={status.integrationId}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getIntegrationIcon(status.type)}
                    {status.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <div className="text-sm text-muted-foreground">Uptime</div>
                      <div className="text-2xl font-bold">{formatPercent(status.uptime)}</div>
                      <Progress value={status.uptime ?? 0} className="mt-1" />
                      {!status.hasEvidence && (
                        <div className="text-xs text-muted-foreground mt-1">Sem evidencias reais</div>
                      )}
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground">Success Rate</div>
                      <div className="text-2xl font-bold">{formatPercent(status.successRate)}</div>
                      <Progress value={status.successRate ?? 0} className="mt-1" />
                      <div className="text-xs text-muted-foreground mt-1">
                        {status.hasEvidence ? `${status.successfulEvents}/${status.evidenceCount} eventos com sucesso` : 'Sem logs persistidos'}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground">Avg. Latency</div>
                      <div className="text-2xl font-bold">{status.latency == null ? "-" : `${status.latency}ms`}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {status.latency == null ? 'No latency data' :
                         status.latency < 300 ? 'Excellent' :
                         status.latency < 600 ? 'Good' : 'Needs attention'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegrationDashboard;
