import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Obra } from '@/types/obra';
import { getStoragePath } from '@/utils/storageUtils';

const isImageDocument = (documento: any) => {
    const type = String(documento?.tipo || '').toLowerCase();
    const name = String(documento?.nome || '').toLowerCase();
    return type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(type) || /\.(jpg|jpeg|png|webp|gif)$/i.test(name);
};

const asNumber = (value: unknown) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const parsed = Number(value.replace(/[^\d,.-]/g, '').replace(',', '.'));
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
};

const isDirectPreviewUrl = (value?: string | null) =>
    Boolean(value && /^(https?:|blob:|data:)/i.test(value));

const withImagePreviewUrls = async <T extends { url?: string | null }>(
    imagens: T[]
): Promise<Array<T & { previewUrl: string | null }>> => {
    const pathItems = imagens.filter((imagem) => imagem.url && !isDirectPreviewUrl(imagem.url));
    const paths = Array.from(new Set(pathItems.map((imagem) => getStoragePath(imagem.url!, 'documentos'))));
    const previewByPath = new Map<string, string>();

    if (paths.length > 0) {
        const { data, error } = await supabase.storage
            .from('documentos')
            .createSignedUrls(paths, 60 * 60);

        if (error) {
            console.error('[useObraDetails] Erro ao gerar previews das imagens:', error.message);
        } else {
            data?.forEach((item: any) => {
                if (item?.path && item?.signedUrl && !item?.error) {
                    previewByPath.set(item.path, item.signedUrl);
                }
            });
        }

        paths.forEach((path) => {
            if (!previewByPath.has(path)) {
                const { data: publicData } = supabase.storage.from('documentos').getPublicUrl(path);
                if (publicData?.publicUrl) previewByPath.set(path, publicData.publicUrl);
            }
        });
    }

    return imagens.map((imagem) => {
        if (!imagem.url) return { ...imagem, previewUrl: null };
        if (isDirectPreviewUrl(imagem.url)) return { ...imagem, previewUrl: imagem.url };

        const path = getStoragePath(imagem.url, 'documentos');
        return { ...imagem, previewUrl: previewByPath.get(path) ?? null };
    });
};

export const useObraDetails = (id: string) => {
    return useQuery({
        queryKey: ['obra', id],
        queryFn: async (): Promise<Obra> => {
            const { data, error } = await supabase
                .from('obras')
                .select(`
                    *,
                    documentos (*),
                    expenses (*),
                    rdos (
                        *,
                        documentos (*),
                        rdo_atividades (*),
                        rdo_equipes (*, equipes (*)),
                        rdo_equipamentos (*, equipamentos (*))
                    )
                `)
                .eq('id', id)
                .single();

            if (error) throw error;

            const obraRaw = data as any;
            const rdos = Array.isArray(obraRaw.rdos) ? obraRaw.rdos : [];
            const expenses = Array.isArray(obraRaw.expenses) ? obraRaw.expenses : [];

            const documentosDiretos = (Array.isArray(obraRaw.documentos) ? obraRaw.documentos : []).map((doc: any) => ({
                id: doc.id,
                nome: doc.nome,
                tipo: doc.tipo,
                categoria: doc.categoria,
                tamanho: doc.tamanho,
                url: doc.url,
                created_at: doc.created_at,
                origem: 'Obra' as const,
                rdo_id: doc.rdo_id,
            }));

            const documentosRDO = rdos.flatMap((rdo: any) =>
                (Array.isArray(rdo.documentos) ? rdo.documentos : []).map((doc: any) => ({
                    id: doc.id,
                    nome: doc.nome,
                    tipo: doc.tipo,
                    categoria: doc.categoria,
                    tamanho: doc.tamanho,
                    url: doc.url,
                    created_at: doc.created_at,
                    origem: 'RDO' as const,
                    rdo_id: rdo.id,
                }))
            );

            const documentos = [...documentosDiretos, ...documentosRDO]
                .filter((doc, index, all) => all.findIndex(item => item.id === doc.id) === index)
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            const imagensBase = documentos
                .filter(isImageDocument)
                .map((doc) => ({
                    id: doc.id,
                    nome: doc.nome,
                    tipo: doc.tipo,
                    url: doc.url,
                    created_at: doc.created_at,
                    origem: doc.origem,
                    rdo_id: doc.rdo_id,
                }));

            const imagens = await withImagePreviewUrls(imagensBase);

            const atividadesDetalhadas = rdos.flatMap((rdo: any) =>
                (Array.isArray(rdo.rdo_atividades) ? rdo.rdo_atividades : []).map((atividade: any) => ({
                    id: atividade.id,
                    nome: atividade.nome,
                    categoria: atividade.categoria,
                    quantidade: asNumber(atividade.quantidade),
                    unidadeMedida: atividade.unidade_medida,
                    percentualConcluido: asNumber(atividade.percentual_concluido),
                    status: atividade.status,
                    data: rdo.data,
                    rdoId: rdo.id,
                    isExtra: Boolean(atividade.is_extra),
                }))
            ).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

            const equipesMap = new Map<string, { nome: string; membros: number; funcao: string; horasTrabalho: number; ultimoRDO: string }>();
            rdos.forEach((rdo: any) => {
                (Array.isArray(rdo.rdo_equipes) ? rdo.rdo_equipes : []).forEach((item: any) => {
                    const equipe = item.equipes;
                    const key = item.equipe_id || equipe?.id || `${equipe?.nome}-${equipe?.funcao}`;
                    if (!key) return;
                    const current = equipesMap.get(key) || {
                        nome: equipe?.nome || 'Equipe sem nome',
                        membros: 0,
                        funcao: equipe?.funcao || 'Geral',
                        horasTrabalho: 0,
                        ultimoRDO: rdo.data,
                    };
                    current.membros += 1;
                    current.horasTrabalho += asNumber(item.horas_trabalho);
                    if (new Date(rdo.data) > new Date(current.ultimoRDO)) current.ultimoRDO = rdo.data;
                    equipesMap.set(key, current);
                });

                (Array.isArray(rdo.detalhes?.equipes) ? rdo.detalhes.equipes : []).forEach((item: any) => {
                    const key = `${item.nome}-${item.funcao}`;
                    const current = equipesMap.get(key) || {
                        nome: item.nome || 'Equipe sem nome',
                        membros: 0,
                        funcao: item.funcao || 'Geral',
                        horasTrabalho: 0,
                        ultimoRDO: rdo.data,
                    };
                    current.membros += 1;
                    current.horasTrabalho += asNumber(item.horasTrabalho);
                    if (new Date(rdo.data) > new Date(current.ultimoRDO)) current.ultimoRDO = rdo.data;
                    equipesMap.set(key, current);
                });
            });

            const equipamentosMap = new Map<string, { nome: string; status: string; categoria: string; horasUso: number; ultimoRDO: string }>();
            rdos.forEach((rdo: any) => {
                (Array.isArray(rdo.rdo_equipamentos) ? rdo.rdo_equipamentos : []).forEach((item: any) => {
                    const equipamento = item.equipamentos;
                    const key = item.equipamento_id || equipamento?.id || `${equipamento?.nome}-${equipamento?.categoria}`;
                    if (!key) return;
                    const current = equipamentosMap.get(key) || {
                        nome: equipamento?.nome || 'Equipamento sem nome',
                        status: item.status || equipamento?.status || 'Em uso',
                        categoria: equipamento?.categoria || 'Geral',
                        horasUso: 0,
                        ultimoRDO: rdo.data,
                    };
                    current.status = item.status || current.status;
                    current.horasUso += asNumber(item.horas_uso);
                    if (new Date(rdo.data) > new Date(current.ultimoRDO)) current.ultimoRDO = rdo.data;
                    equipamentosMap.set(key, current);
                });

                (Array.isArray(rdo.detalhes?.equipamentos) ? rdo.detalhes.equipamentos : []).forEach((item: any) => {
                    const key = `${item.nome}-${item.categoria}`;
                    const current = equipamentosMap.get(key) || {
                        nome: item.nome || 'Equipamento sem nome',
                        status: item.status || 'Em uso',
                        categoria: item.categoria || 'Geral',
                        horasUso: 0,
                        ultimoRDO: rdo.data,
                    };
                    current.status = item.status || current.status;
                    current.horasUso += asNumber(item.horasUso);
                    if (new Date(rdo.data) > new Date(current.ultimoRDO)) current.ultimoRDO = rdo.data;
                    equipamentosMap.set(key, current);
                });
            });

            const orcamentoTotal = asNumber(obraRaw.orcamento_previsto ?? obraRaw.orcamento);
            const despesas = expenses.map((expense: any) => ({
                id: expense.id,
                categoria: expense.cost_category || 'Sem categoria',
                fornecedor: expense.supplier_name || 'Fornecedor nao informado',
                valor: asNumber(expense.amount),
                status: expense.approval_status || 'Sem status',
                data: expense.date_of_expense || expense.created_at,
                notaFiscal: expense.invoice_number || '-',
            }));
            const valorExecutado = despesas.reduce((total, expense) => total + expense.valor, 0);

            const itensOrcamento = Array.from(
                despesas.reduce((map, expense) => {
                    const current = map.get(expense.categoria) || { valorExecutado: 0, count: 0 };
                    current.valorExecutado += expense.valor;
                    current.count += 1;
                    map.set(expense.categoria, current);
                    return map;
                }, new Map<string, { valorExecutado: number; count: number }>())
            ).map(([categoria, item], index) => ({
                id: index + 1,
                atividade: categoria,
                valorPrevisto: 0,
                valorExecutado: item.valorExecutado,
                diferenca: item.valorExecutado,
                status: item.valorExecutado > 0 ? 'Executado' : 'Sem movimentacao',
                percentualExecutado: orcamentoTotal > 0 ? (item.valorExecutado / orcamentoTotal) * 100 : 0,
            }));

            return {
                ...obraRaw,
                id: obraRaw.id,
                dataInicio: obraRaw.data_inicio,
                previsaoTermino: obraRaw.previsao_termino,
                orcamento: orcamentoTotal,
                atividades: atividadesDetalhadas.length,
                documentos,
                imagens,
                atividadesDetalhadas,
                despesas,
                equipes: Array.from(equipesMap.values()),
                equipamentos: Array.from(equipamentosMap.values()),
                rdos,
                financeiro: {
                    orcamentoTotal,
                    valorExecutado,
                    saldoRestante: Math.max(orcamentoTotal - valorExecutado, 0),
                    itensOrcamento
                }
            } as unknown as Obra;
        },
        enabled: !!id,
    });
};
