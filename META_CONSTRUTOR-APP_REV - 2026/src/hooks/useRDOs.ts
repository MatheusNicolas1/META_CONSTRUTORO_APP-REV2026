import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { notifyRDOChange } from '@/utils/notificationService';
import { useRequireOrg } from '@/hooks/requireOrg';
import { track } from '@/integrations/analytics';

import { CreateRDOData } from "@/types/rdo";
import { RDOSupabase } from '@/types/supabase-rdo';

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']);

const isImageAttachment = (file: File, fileExt: string) =>
  file.type.startsWith('image/') || IMAGE_EXTENSIONS.has(fileExt);

const buildRdoAttachmentStoragePath = (obraId: string, rdoId: string, file: File) => {
  const fileExt = (file.name.split('.').pop() || 'bin').toLowerCase();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const folder = isImageAttachment(file, fileExt) ? 'imagens' : 'documentos';
  const uniquePrefix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return {
    fileExt,
    storagePath: `${obraId}/${folder}/rdo-${rdoId}/${uniquePrefix}-${safeName}`,
  };
};

export const useRDOs = () => {
  const queryClient = useQueryClient();
  const { orgId, isLoading: orgLoading } = useRequireOrg();

  // Realtime subscription for RDOs updates (Singleton + Grace Period)
  useEffect(() => {
    if (!orgId) return;

    const channelKey = `rdos-realtime-${orgId}`;
    const REGISTRY_KEY = '__meta_rdos_realtime_registry__';

    // Initialize registry if needed
    if (!(globalThis as any)[REGISTRY_KEY]) {
      (globalThis as any)[REGISTRY_KEY] = new Map();
    }
    const registry = (globalThis as any)[REGISTRY_KEY];

    let entry = registry.get(channelKey);
    let didSubscribe = false;

    // Setup function
    const setup = () => {
      if (!entry) {
        const channel = supabase
          .channel(channelKey)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'rdos',
              filter: `org_id=eq.${orgId}`
            },
            () => {
              // Dispatch global event for all hooks
              window.dispatchEvent(new CustomEvent(`rdos-changed-${channelKey}`));
            }
          )
          .subscribe((status) => {
            if (status === 'CHANNEL_ERROR') console.error(`[Realtime-RDO] Error: ${channelKey}`);
          });

        entry = { channel, refCount: 0, cleanupTimeout: null };
        registry.set(channelKey, entry);
      }

      // Cancel pending cleanup
      if (entry.cleanupTimeout) {
        window.clearTimeout(entry.cleanupTimeout);
        entry.cleanupTimeout = null;
      }

      entry.refCount++;
      didSubscribe = true;
    };

    setup();

    // Event listener for data reload
    const handleRemoteChange = () => {
      queryClient.invalidateQueries({ queryKey: ['rdos', orgId] });
      queryClient.invalidateQueries({ queryKey: ['recent-rdos', orgId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', orgId] });
    };
    window.addEventListener(`rdos-changed-${channelKey}`, handleRemoteChange);

    return () => {
      window.removeEventListener(`rdos-changed-${channelKey}`, handleRemoteChange);

      if (didSubscribe && entry) {
        entry.refCount--;
        if (entry.refCount <= 0) {
          // Grace period 2s
          entry.cleanupTimeout = window.setTimeout(() => {
            if (entry.refCount <= 0) {
              supabase.removeChannel(entry.channel);
              registry.delete(channelKey);
            }
          }, 2000);
        }
      }
    };
  }, [queryClient, orgId]);

  const rdosQuery = useQuery({
    queryKey: ['rdos', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rdos')
        .select(`
          *,
          obras (nome),
          documentos (*),
          rdo_atividades (*),
          rdo_equipes (*, equipes(*)),
          rdo_equipamentos (*, equipamentos(*))
        `)
        .order('data', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data as unknown as RDOSupabase[]) || [];
    },
    enabled: !orgLoading && !!orgId,
  });

  const createRDO = useMutation({
    mutationFn: async (input: CreateRDOData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const {
        atividadesRealizadas,
        atividadesExtras,
        equipesPresentes,
        equipamentosUtilizados,
        files,
        equipamentosQuebrados,
        acidentes,
        materiaisFalta,
        estoqueMateriais,
        ...baseData
      } = input;

      const detalhes = {
        equipamentosQuebrados,
        acidentes,
        materiaisFalta,
        estoqueMateriais,
        tempo_ocioso: baseData.tempoOcioso
      };

      const insertPayload = {
        obra_id: baseData.obraId,
        data: baseData.data,
        periodo: baseData.periodo,
        clima: baseData.clima,
        equipe_ociosa: baseData.equipeOciosa,
        observacoes: baseData.observacoes,
        created_by: user.id,
        org_id: orgId,
        status: 'DRAFT',
        detalhes: detalhes
      };

      const { data: rdoRaw, error } = await supabase
        .from('rdos')
        .insert(insertPayload as any)
        .select()
        .single();
      const rdo = rdoRaw as any;

      if (error) {
        console.error('[RDO-CREATE] Supabase error:', error.code, error.message, error.details, error.hint);
        throw error;
      }
      if (!rdo) throw new Error('[RDO-CREATE] rdo null após insert');

      const promises = [];

      // Atividades
      if (atividadesRealizadas?.length > 0) {
        const payload = atividadesRealizadas.map(a => ({
          rdo_id: rdo.id,
          nome: a.nome,
          categoria: a.categoria,
          quantidade: a.quantidade,
          unidade_medida: a.unidadeMedida,
          percentual_concluido: a.percentualConcluido,
          status: a.status,
          observacoes: a.observacoes,
          is_extra: false
        }));
        promises.push(supabase.from('rdo_atividades').insert(payload as any).throwOnError());
      }

      // Atividades Extras
      if (atividadesExtras?.length > 0) {
        const payload = atividadesExtras.map(a => ({
          rdo_id: rdo.id,
          nome: a.nome,
          categoria: a.categoria,
          quantidade: a.quantidade,
          unidade_medida: a.unidadeMedida,
          percentual_concluido: a.percentualConcluido,
          justificativa: a.justificativa,
          is_extra: true,
          status: 'Concluida'
        }));
        promises.push(supabase.from('rdo_atividades').insert(payload as any).throwOnError());
      }

      // Helper: valida UUID v4 (exige pelo menos um hífen e 36 chars)
      const isValidUUID = (id: any): boolean =>
        typeof id === 'string' && id.includes('-') && id.length >= 32;

      // Equipes — insere com FK se UUID real, senão passa pelos detalhes JSONB
      const equipesComUUID = (equipesPresentes ?? []).filter(e => isValidUUID(e.id));
      const equipeSemUUID = (equipesPresentes ?? []).filter(e => !isValidUUID(e.id));

      if (equipesComUUID.length > 0) {
        const payload = equipesComUUID.map(e => ({
          rdo_id: rdo.id,
          equipe_id: e.id,
          horas_trabalho: e.horasTrabalho,
          presente: e.presente ?? true,
          horas_ociosas: e.horasOciosas ?? 0
        }));
        promises.push(supabase.from('rdo_equipes').insert(payload as any).throwOnError());
      }

      // Equipamentos — insere com FK se UUID real, senão passa pelos detalhes JSONB
      const equipComUUID = (equipamentosUtilizados ?? []).filter(e => isValidUUID(e.id));
      const equipSemUUID = (equipamentosUtilizados ?? []).filter(e => !isValidUUID(e.id));

      if (equipComUUID.length > 0) {
        const payload = equipComUUID.map(e => ({
          rdo_id: rdo.id,
          equipamento_id: e.id,
          horas_uso: e.horasUso ?? 0,
          status: e.status ?? 'Operacional',
          observacoes: e.observacoes ?? null
        }));
        promises.push(supabase.from('rdo_equipamentos').insert(payload as any).throwOnError());
      }

      // Gravar itens sem UUID no JSONB detalhes do RDO (update)
      const equipesJsonb = equipeSemUUID.map(e => ({
        nome: e.nome, funcao: e.funcao, horasTrabalho: e.horasTrabalho,
        presente: e.presente ?? true, horasOciosas: e.horasOciosas ?? 0
      }));
      const equipamentosJsonb = equipSemUUID.map(e => ({
        nome: e.nome, categoria: e.categoria, horasUso: e.horasUso ?? 0,
        status: e.status ?? 'Operacional', observacoes: e.observacoes ?? null
      }));

      if (equipesJsonb.length > 0 || equipamentosJsonb.length > 0) {
        promises.push(
          supabase.from('rdos').update({
            detalhes: {
              ...detalhes,
              equipes: equipesJsonb,
              equipamentos: equipamentosJsonb,
            }
          } as any).eq('id', rdo.id).throwOnError()
        );
      }

      // Files — salva o storage path no banco (bucket privado: não usar publicUrl)
      if (files?.length > 0) {
        const uploadPromises = files.map(async (file) => {
          const fileExt = (file.name.split('.').pop() || 'bin').toLowerCase();
          // Sanitizar nome: remover espaços e caracteres especiais
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const folder = isImageAttachment(file, fileExt) ? 'imagens' : 'documentos';
          const uniquePrefix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
          const storagePath = `${baseData.obraId}/${folder}/rdo-${rdo.id}/${uniquePrefix}-${safeName}`;

          const { error: uploadError } = await supabase.storage
            .from('documentos')
            .upload(storagePath, file, { upsert: false });

          if (uploadError) {
            console.error('[RDO-UPLOAD] upload failed:', uploadError.message);
            return null; // não bloqueia criação do RDO
          }

          // Salva o PATH (não publicUrl) — downloads usarão createSignedUrl
          return supabase.from('documentos').insert({
            nome: file.name,
            tipo: fileExt,
            categoria: 'Relatório',
            url: storagePath,  // path relativo no bucket
            uploaded_by: user.id,
            org_id: orgId,
            obra_id: baseData.obraId,
            rdo_id: rdo.id,
            tamanho: file.size
          } as any).throwOnError();
        });
        promises.push(...uploadPromises);
      }

      await Promise.all(promises);

      // Enviar notificação
      const obraName = (rdo as any).obras?.nome || 'Obra';
      await notifyRDOChange(user.id, obraName, baseData.data, 'created', rdo.id);

      // M9: Analytics
      track('product.rdo_created', {
        rdo_id: rdo.id,
        org_id: orgId,
        obra_id: baseData.obraId,
        data: baseData.data
      });

      return rdo;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rdos', orgId] });
      queryClient.invalidateQueries({ queryKey: ['rdos-by-obra', variables.obraId] });
      queryClient.invalidateQueries({ queryKey: ['obra', variables.obraId] });
      queryClient.invalidateQueries({ queryKey: ['recent-rdos', orgId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', orgId] });
      toast.success('RDO criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar RDO:', error);
      toast.error('Erro ao criar RDO. ' + error.message);
    },
  });

  const updateRDO = useMutation({
    mutationFn: async ({ id, ...updateData }: { id: string } & Partial<CreateRDOData>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Destructure same as create
      const {
        atividadesRealizadas,
        atividadesExtras,
        equipesPresentes,
        equipamentosUtilizados,
        files,
        equipamentosQuebrados,
        acidentes,
        materiaisFalta,
        estoqueMateriais,
        ...baseData
      } = updateData;

      const detalhes = {
        equipamentosQuebrados,
        acidentes,
        materiaisFalta,
        estoqueMateriais,
        tempo_ocioso: baseData.tempoOcioso
      };

      const updatePayload: any = {
        ...baseData,
        detalhes
      }

      // Remove tempoOcioso from top level object since it exists in detalhes only
      delete updatePayload.tempoOcioso;

      // Clean undefined
      Object.keys(updatePayload).forEach(key => updatePayload[key] === undefined && delete updatePayload[key]);

      const { data: updateRaw, error } = await supabase
        .from('rdos')
        .update(updatePayload as any)
        .eq('id', id)
        .select(`*, obras (nome), rdo_atividades(*), rdo_equipes(*, equipes(*)), rdo_equipamentos(*, equipamentos(*))`)
        .single();
      const data = updateRaw as any;

      if (error) throw error;

      // Handle files (add new ones)
      if (files?.length > 0) {
        const uploadPromises = files.map(async (file) => {
          const obraIdForPath = baseData.obraId || data.obra_id;
          if (!obraIdForPath) throw new Error('Obra do RDO nao encontrada para upload de anexos');

          const { fileExt, storagePath } = buildRdoAttachmentStoragePath(obraIdForPath, id, file);
          const { error: upErr } = await supabase.storage.from('documentos').upload(storagePath, file, { upsert: false });
          if (upErr) { console.error('[RDO-UPDATE] upload failed:', upErr.message); return null; }
          return supabase.from('documentos').insert({
            nome: file.name,
            tipo: fileExt,
            categoria: 'Relatório',
            url: storagePath,
            uploaded_by: user.id,
            org_id: orgId,
            obra_id: obraIdForPath,
            rdo_id: id,
            tamanho: file.size
          } as any);
        });
        await Promise.all(uploadPromises);
      }

      return data;
    },
    onSuccess: (data, variables) => {
      const obraId = variables.obraId || (data as any)?.obra_id;

      queryClient.invalidateQueries({ queryKey: ['rdos', orgId] });
      queryClient.invalidateQueries({ queryKey: ['rdo', variables.id, orgId] });
      if (obraId) {
        queryClient.invalidateQueries({ queryKey: ['rdos-by-obra', obraId] });
        queryClient.invalidateQueries({ queryKey: ['obra', obraId] });
      }
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', orgId] });
      toast.success('RDO atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar RDO:', error);
      toast.error('Erro ao atualizar RDO.');
    },
  });

  const submitForApproval = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: submitRaw, error } = await supabase
        .from('rdos')
        .update({ status: 'SUBMITTED' } as any)
        .eq('id', id)
        .eq('created_by', user.id)
        .select(`*, obras (nome)`)
        .single();
      const data = submitRaw as any;

      if (error) throw error;

      // Enviar notificação especial para aprovação
      const obraName = data?.obras?.nome || 'Obra';
      await notifyRDOChange(user.id, obraName, data?.data, 'submitted', id);

      // M9: Analytics
      track('product.rdo_submitted', {
        rdo_id: id,
        org_id: orgId,
        obra_id: data?.obra_id,
        status_to: 'SUBMITTED'
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rdos', orgId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', orgId] });
      toast.success('RDO enviado para aprovação!');
    },
    onError: (error) => {
      console.error('Erro ao enviar RDO:', error);
      toast.error('Erro ao enviar RDO para aprovação.');
    },
  });

  const deleteRDO = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar dados do RDO antes de deletar
      const { data: rdoDataRaw } = await supabase
        .from('rdos')
        .select(`*, obras (nome)`)
        .eq('id', id)
        .eq('created_by', user.id)
        .single();
      const rdoData = rdoDataRaw as any;

      const { error } = await supabase
        .from('rdos')
        .delete()
        .eq('id', id)
        .eq('created_by', user.id);

      if (error) throw error;

      // Enviar notificação
      if (rdoData) {
        const obraName = rdoData.obras?.nome || 'Obra';
        await notifyRDOChange(user.id, obraName, rdoData.data, 'deleted');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rdos', orgId] });
      queryClient.invalidateQueries({ queryKey: ['recent-rdos', orgId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', orgId] });
      toast.success('RDO excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir RDO:', error);
      toast.error('Erro ao excluir RDO. Tente novamente.');
    },
  });

  return {
    rdos: rdosQuery.data || [],
    isLoading: rdosQuery.isLoading,
    error: rdosQuery.error,
    createRDO,
    updateRDO,
    submitForApproval,
    deleteRDO,
    refetch: rdosQuery.refetch,
  };
};
