import { supabase } from '@/integrations/supabase/client';
import { getActiveOrgIdLocal } from '@/helpers/storage';
import { eventManager } from '@/services/eventManager';
import { integrationService } from '@/services/integrationService';

const asArray = <T>(value: T[] | null | undefined): T[] => Array.isArray(value) ? value : [];

const getCurrentUserEmail = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.email ?? null;
};

const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
};

const persistChainTestLog = async (
  status: 'success' | 'error',
  message: string,
  data?: Record<string, any>,
  error?: string
) => {
  const { data: { session } } = await supabase.auth.getSession();
  const orgId = getActiveOrgIdLocal();

  if (!session?.user?.id || !orgId) {
    return false;
  }

  const { error: insertError } = await supabase
    .from('analytics_events' as any)
    .insert({
      event: 'integrations.chain.test',
      org_id: orgId,
      user_id: session.user.id,
      source: 'frontend',
      success: status === 'success',
      error,
      properties: {
        orgId,
        userId: session.user.id,
        source: 'integration-helpers',
        integrationId: 'integration-chain',
        integrationType: 'webhook',
        status,
        message,
        data,
        error
      }
    });

  return !insertError;
};

export class IntegrationHelpers {
  static async handleObraCriada(obraData: any) {
    try {
      const result = await eventManager.dispatchObraCreated(obraData.id, obraData);

      if (result.success) {
        const tasks: Promise<unknown>[] = [];
        const telefone = obraData.responsavel?.telefone;
        const gestores = asArray<string>(obraData.gestores);

        if (telefone) {
          tasks.push(
            integrationService.sendWhatsAppMessage(
              telefone,
              `Nova obra criada: ${obraData.nome}\nResponsavel: ${obraData.responsavel?.nome ?? 'Nao informado'}\nPrazo: ${obraData.prazo ?? 'Nao informado'}`
            )
          );
        }

        if (gestores.length > 0) {
          tasks.push(
            integrationService.sendEmail(
              gestores,
              `Nova Obra: ${obraData.nome}`,
              `Uma nova obra foi cadastrada no sistema:\n\nNome: ${obraData.nome}\nResponsavel: ${obraData.responsavel?.nome ?? 'Nao informado'}\nData de Inicio: ${obraData.dataInicio ?? 'Nao informada'}\nPrazo: ${obraData.prazo ?? 'Nao informado'}`
            )
          );
        }

        const results = await Promise.allSettled(tasks);
        const failed = results.filter((item) => item.status === 'rejected');
        if (failed.length > 0) {
          throw new Error(`${failed.length} integracao(oes) falharam no fluxo de obra criada`);
        }
      }

      return result;
    } catch (error) {
      console.error('Erro no fluxo de obra criada:', error);
      throw error;
    }
  }

  static async handleRDOAprovado(rdoData: any) {
    try {
      const result = await eventManager.dispatchRDOApproved(rdoData.id, rdoData);

      if (result.success) {
        const tasks: Promise<unknown>[] = [];
        const supervisores = asArray<string>(rdoData.supervisores);
        const equipe = asArray<any>(rdoData.equipe);

        if (supervisores.length > 0) {
          tasks.push(
            integrationService.sendEmail(
              supervisores,
              `RDO Aprovado - ${rdoData.obra?.nome ?? 'Obra'}`,
              `RDO aprovado com sucesso!\n\nObra: ${rdoData.obra?.nome ?? 'Obra'}\nData: ${rdoData.data ?? 'Nao informada'}\nAtividades: ${rdoData.atividades?.length ?? 0}\nEquipe: ${equipe.length} colaboradores`
            )
          );
        }

        equipe.forEach((colaborador) => {
          if (colaborador.telefone) {
            tasks.push(
              integrationService.sendWhatsAppMessage(
                colaborador.telefone,
                `RDO aprovado para ${rdoData.obra?.nome ?? 'obra'} em ${rdoData.data ?? 'data nao informada'}.`
              )
            );
          }
        });

        const results = await Promise.allSettled(tasks);
        const failed = results.filter((item) => item.status === 'rejected');
        if (failed.length > 0) {
          throw new Error(`${failed.length} integracao(oes) falharam no fluxo de RDO aprovado`);
        }
      }

      return result;
    } catch (error) {
      console.error('Erro no fluxo de RDO aprovado:', error);
      throw error;
    }
  }

  static async handleDocumentoUpload(file: File, obraId: string, tipo: string) {
    try {
      const driveResult = await integrationService.uploadToGoogleDrive(
        file,
        `/MetaConstrutor/Obras/${obraId}/${tipo}`
      );

      if (driveResult.success) {
        const { data: obra } = await supabase
          .from('obras')
          .select('nome, responsavel')
          .eq('id', obraId)
          .maybeSingle();

        const dispatchResult = await eventManager.dispatchDocumentoUploaded(driveResult.data.fileId, {
          fileName: file.name,
          obraId,
          obraNome: (obra as any)?.nome ?? null,
          responsavel: (obra as any)?.responsavel ?? null,
          tipo,
          url: driveResult.data.url,
          uploadedAt: new Date().toISOString()
        });

        if (!dispatchResult.success) {
          return {
            success: false,
            error: dispatchResult.error || 'Evento de documento nao foi persistido'
          };
        }

        const notifyPhone = driveResult.data?.responsavelTelefone || driveResult.data?.notifyPhone;
        if (notifyPhone) {
          await integrationService.sendWhatsAppMessage(
            notifyPhone,
            `Novo documento carregado: ${file.name}\nObra: ${(obra as any)?.nome ?? obraId}\nTipo: ${tipo}`
          );
        }
      }

      return driveResult;
    } catch (error) {
      console.error('Erro no upload de documento:', error);
      throw error;
    }
  }

  static async handleAtividadeAtrasada(atividadeData: any) {
    try {
      const dispatchResult = await eventManager.dispatch({
        event: 'notification.urgent',
        entityId: atividadeData.id,
        entityType: 'atividade',
        data: atividadeData,
        timestamp: new Date().toISOString(),
        metadata: {
          priority: 'high',
          reason: 'overdue'
        }
      });

      if (!dispatchResult.success) {
        return dispatchResult;
      }

      const tasks: Promise<unknown>[] = [];
      if (atividadeData.responsavel?.telefone) {
        tasks.push(
          integrationService.sendWhatsAppMessage(
            atividadeData.responsavel.telefone,
            `ATIVIDADE ATRASADA\n\n${atividadeData.nome}\nObra: ${atividadeData.obra?.nome ?? 'Nao informada'}\nPrazo: ${atividadeData.prazo ?? 'Nao informado'}\n\nAcao necessaria.`
          )
        );
      }

      const gestores = asArray<string>(atividadeData.gestores);
      if (gestores.length > 0) {
        tasks.push(
          integrationService.sendEmail(
            gestores,
            `Atividade Atrasada: ${atividadeData.nome}`,
            `ALERTA: A atividade "${atividadeData.nome}" da obra "${atividadeData.obra?.nome ?? 'Nao informada'}" esta atrasada.\n\nPrazo original: ${atividadeData.prazo ?? 'Nao informado'}\nResponsavel: ${atividadeData.responsavel?.nome ?? 'Nao informado'}\n\nAcompanhe o progresso no sistema.`
          )
        );
      }

      await Promise.allSettled(tasks);
    } catch (error) {
      console.error('Erro no fluxo de atividade atrasada:', error);
      throw error;
    }
  }

  static async handleRelatorioDaily(obraId?: string) {
    try {
      const { start, end } = getTodayRange();
      let query: any = supabase
        .from('rdos')
        .select('id, data, obra_id, status, rdo_atividades(id, status), rdo_equipes(id, presente)')
        .gte('data', start)
        .lt('data', end);

      if (obraId) {
        query = query.eq('obra_id', obraId);
      }

      const { data: rdos, error } = await query;
      if (error) throw error;

      const atividades = asArray<any>(rdos).flatMap((rdo) => asArray<any>(rdo.rdo_atividades));
      const equipes = asArray<any>(rdos).flatMap((rdo) => asArray<any>(rdo.rdo_equipes));
      const relatorioData = {
        data: new Date().toISOString(),
        obraId,
        resumo: {
          rdos: asArray<any>(rdos).length,
          atividades: atividades.length,
          concluidas: atividades.filter((atividade) => String(atividade.status ?? '').toLowerCase().includes('conclu')).length,
          atrasadas: atividades.filter((atividade) => String(atividade.status ?? '').toLowerCase().includes('atras')).length,
          equipePresente: equipes.filter((equipe) => equipe.presente !== false).length
        }
      };

      const dispatchResult = await eventManager.dispatch({
        event: 'report.daily',
        entityId: `relatorio-${Date.now()}`,
        entityType: 'relatorio',
        data: relatorioData,
        timestamp: new Date().toISOString()
      });

      if (!dispatchResult.success) {
        return {
          success: false,
          error: dispatchResult.error || 'Evento do relatorio diario nao foi persistido'
        };
      }

      const userEmail = await getCurrentUserEmail();
      if (!userEmail) {
        return {
          success: false,
          error: 'Usuario sem email autenticado para receber o relatorio'
        };
      }

      return integrationService.sendEmail(
        [userEmail],
        `Relatorio Diario ${obraId ? `- Obra ${obraId}` : '- Geral'}`,
        `Resumo das atividades do dia:\n\nRDOs: ${relatorioData.resumo.rdos}\nAtividades: ${relatorioData.resumo.atividades}\nConcluidas: ${relatorioData.resumo.concluidas}\nAtrasadas: ${relatorioData.resumo.atrasadas}\nEquipe presente: ${relatorioData.resumo.equipePresente}\n\nAcesse o sistema para mais detalhes.`
      );
    } catch (error) {
      console.error('Erro no relatorio diario:', error);
      throw error;
    }
  }

  static async testIntegrationChain() {
    try {
      const dailyReport = await this.handleRelatorioDaily();
      const message = dailyReport.success
        ? 'Cadeia de integracoes validada com dados reais do dia'
        : dailyReport.error || 'Falha na cadeia de integracoes';
      const logPersisted = await persistChainTestLog(
        dailyReport.success ? 'success' : 'error',
        message,
        { dailyReport },
        dailyReport.error
      );

      if (dailyReport.success && !logPersisted) {
        return {
          success: false,
          error: 'Teste executado, mas a evidencia persistida nao foi registrada'
        };
      }

      return {
        success: dailyReport.success,
        message,
        data: { dailyReport },
        error: dailyReport.error
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      await persistChainTestLog('error', message, undefined, message);
      return {
        success: false,
        error: message
      };
    }
  }
}

export default IntegrationHelpers;
