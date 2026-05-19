import { useState, useEffect } from "react";
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
  onRefresh: () => void;
  statuses?: IntegrationStatus[];
}

export const IntegrationDashboard = ({ logs, onRefresh, statuses = [] }: IntegrationDashboardProps) => {
  const [stats, setStats] = useState({
    totalEvents: 0,
    successRate: 0,
    errorCount: 0,
    lastHourEvents: 0
  });

  const integrationStatuses = statuses;

  useEffect(() => {
    calculateStats();
    const interval = setInterval(calculateStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [logs]);

  const calculateStats = () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentLogs = logs.filter(log => new Date(log.timestamp) > oneHourAgo);
    const successLogs = logs.filter(log => log.status === 'success');
    const errorLogs = logs.filter(log => log.status === 'error');

    setStats({
      totalEvents: logs.length,
      successRate: logs.length > 0 ? Math.round((successLogs.length / logs.length) * 100) : 0,
      errorCount: errorLogs.length,
      lastHourEvents: recentLogs.length
    });
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'n8n': return <Zap className="h-4 w-4" />;
      case 'whatsapp': return <Smartphone className="h-4 w-4" />;
      case 'gmail': return <Mail className="h-4 w-4" />;
      case 'googledrive': return <Cloud className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (isHealthy: boolean) => {
    return isHealthy ? "text-green-600" : "text-red-600";
  };

  const testIntegration = async () => {
    onRefresh();
  };

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
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <Progress value={stats.successRate} className="mt-2" />
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
            <div className="text-2xl font-bold text-green-600">99.2%</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
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
                          Last check: {new Date(status.lastCheck).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          Success Rate: {status.successRate}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Latency: {status.latency}ms
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={status.isHealthy ? "default" : "destructive"}
                          className="flex items-center gap-1"
                        >
                          {status.isHealthy ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <AlertCircle className="h-3 w-3" />
                          )}
                          {status.isHealthy ? "Healthy" : "Error"}
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
                  
                  {!status.isHealthy && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">
                        Integration is experiencing issues. Error count: {status.errorCount}
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
                      <div className="text-2xl font-bold">{status.uptime}%</div>
                      <Progress value={status.uptime} className="mt-1" />
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground">Success Rate</div>
                      <div className="text-2xl font-bold">{status.successRate}%</div>
                      <Progress value={status.successRate} className="mt-1" />
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground">Avg. Latency</div>
                      <div className="text-2xl font-bold">{status.latency}ms</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {status.latency < 300 ? 'Excellent' : 
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
