import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, TrendingUp, DollarSign, Calendar, FileText, Users, Wrench } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Progress } from "@/components/ui/progress";
import { useRequireOrg } from "@/hooks/requireOrg";

const AdminOperationalMetrics = () => {
    const { orgId, isLoading: orgLoading } = useRequireOrg();

    const { data: metrics, isLoading } = useQuery({
        queryKey: ['admin-operational-metrics', orgId],
        queryFn: async () => {
            // Operational usage is shown as activation signal, not as the primary Admin KPI.
            const { data: obras, error: obrasError } = await supabase
                .from('obras')
                .select('*')
                .eq('org_id', orgId);

            if (obrasError) throw obrasError;

            const totalObras = obras?.length || 0;
            const progressoMedio = totalObras > 0
                ? obras.reduce((acc, obra) => acc + (obra.progresso || 0), 0) / totalObras
                : 0;

            // Orçamento Previsto
            const orcamentoPrevisto = obras.reduce((acc, obra) => acc + (obra.orcamento_previsto || 0), 0);

            // Prazo Médio (Dias restantes)
            const now = new Date();
            let totalDiasRestantes = 0;
            let obrasComPrazo = 0;

            obras.forEach((obra) => {
                if (obra.previsao_termino) {
                    const termino = new Date(obra.previsao_termino);
                    if (termino > now) {
                        const diffTime = Math.abs(termino.getTime() - now.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        totalDiasRestantes += diffDays;
                        obrasComPrazo++;
                    }
                }
            });
            const prazoMedio = obrasComPrazo > 0 ? Math.round(totalDiasRestantes / obrasComPrazo) : 0;


            // 2. Orçamento Executado (Despesas Aprovadas na org ativa)
            const { data: expenses, error: expenseError } = await supabase
                .from('expenses')
                .select('amount')
                .eq('org_id', orgId)
                .eq('approval_status', 'Approved');

            // If chart/table doesn't exist, handle gracefully
            const orcamentoExecutado = expenses
                ? expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0)
                : 0;

            // 3. Totais (RDOs, Colaboradores, Equipamentos)
            const { count: totalRDOs } = await supabase.from('rdos').select('*', { count: 'exact', head: true }).eq('org_id', orgId);
            const { count: totalColaboradores } = await supabase.from('org_members').select('*', { count: 'exact', head: true }).eq('org_id', orgId);
            const { count: totalEquipamentos } = await supabase.from('equipamentos').select('*', { count: 'exact', head: true }).eq('org_id', orgId || ''); // Fixed possible null orgId

            return {
                totalObras,
                progressoMedio: Math.round(progressoMedio),
                orcamentoPrevisto,
                orcamentoExecutado,
                prazoMedio,
                totalRDOs: totalRDOs || 0,
                totalColaboradores: totalColaboradores || 0,
                totalEquipamentos: totalEquipamentos || 0
            };
        },
        enabled: !orgLoading && !!orgId,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
            </div>
        );
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Ativacao e uso operacional</h2>
            <p className="text-sm text-muted-foreground">
                Obras, RDOs, colaboradores e equipamentos reclassificados como sinais de ativacao do app.
            </p>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Obras</CardTitle>
                        <Building2 className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics?.totalObras}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Sinal de ativacao por organizacao
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Progresso Médio</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics?.progressoMedio}%</div>
                        <Progress value={metrics?.progressoMedio} className="mt-2 h-2" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Prazo Médio</CardTitle>
                        <Calendar className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics?.prazoMedio} dias</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Restantes para conclusão
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Orçamento Executado</CardTitle>
                        <DollarSign className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">
                            {formatCurrency(metrics?.orcamentoExecutado || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            de {formatCurrency(metrics?.orcamentoPrevisto || 0)} previsto
                        </p>
                        <Progress
                            value={metrics?.orcamentoPrevisto ? (metrics.orcamentoExecutado / metrics.orcamentoPrevisto) * 100 : 0}
                            className="mt-2 h-2"
                            indicatorClassName={metrics?.orcamentoExecutado > (metrics?.orcamentoPrevisto || 0) ? "bg-red-500" : "bg-green-500"}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Secondary Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-full">
                            <FileText className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total RDOs</p>
                            <h3 className="text-2xl font-bold">{metrics?.totalRDOs}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="p-3 bg-purple-500/10 rounded-full">
                            <Users className="h-6 w-6 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Colaboradores</p>
                            <h3 className="text-2xl font-bold">{metrics?.totalColaboradores}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="p-3 bg-orange-500/10 rounded-full">
                            <Wrench className="h-6 w-6 text-orange-500" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Equipamentos</p>
                            <h3 className="text-2xl font-bold">{metrics?.totalEquipamentos}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminOperationalMetrics;
