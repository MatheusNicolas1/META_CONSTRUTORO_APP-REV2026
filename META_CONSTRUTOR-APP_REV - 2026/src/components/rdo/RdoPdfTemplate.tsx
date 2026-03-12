import React from 'react';
import { RDOPdfData } from '@/utils/generateRDOPdf';

// Helpers de formatação
const formatDate = (dateStr: string): string => {
    try {
        const parts = dateStr.split('T')[0].split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch { return dateStr; }
};

const formatTimeAndDate = (dateStr: string): string => {
    try {
        const d = new Date(dateStr);
        return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } catch { return dateStr; }
};

interface Props {
    rdo: RDOPdfData;
}

export const RdoPdfTemplate: React.FC<Props> = ({ rdo }) => {
    const hasPeriodos = rdo.periodos && rdo.periodos.length > 0;
    const hasEquipes = rdo.equipes && rdo.equipes.length > 0;
    const hasAtividades = rdo.atividades && rdo.atividades.length > 0;
    const hasExtras = rdo.atividadesExtras && rdo.atividadesExtras.length > 0;
    const hasEquipamentos = rdo.equipamentos && rdo.equipamentos.length > 0;
    const hasOcorrencias = rdo.ocorrencias && rdo.ocorrencias.length > 0;
    const hasAcidentes = rdo.acidentes && rdo.acidentes.length > 0;
    const hasObservacoes = !!(rdo.observacoesTexto?.trim() || (rdo.comentarios && rdo.comentarios.length > 0));
    const hasFotos = rdo.fotos && rdo.fotos.length > 0;
    const hasDocs = rdo.documentos && rdo.documentos.length > 0;

    const dataGeracao = new Date().toLocaleString('pt-BR');

    // Mapeamento dinâmico do Clima Manhã/Tarde
    const climaManha = rdo.climaManha || rdo.clima || 'Não informado';
    const climaTarde = rdo.climaTarde || 'Não informado';

    // Helper icon getter
    const getClimaIcon = (climaStr: string) => {
        const cl = climaStr.toLowerCase();
        if (cl.includes('claro') || cl.includes('sol')) return '☀️';
        if (cl.includes('nublado')) return '⛅';
        if (cl.includes('chuva') || cl.includes('chuvoso')) return '🌧️';
        if (cl.includes('tempestade')) return '⛈️';
        return '🌤️';
    };

    return (
        <div className="pdf-container">
            <style dangerouslySetInnerHTML={{
                __html: `
                * { margin: 0; padding: 0; box-sizing: border-box; }
                .pdf-container {
                    font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
                    background-color: white;
                    color: #333;
                    line-height: 1.3;
                    font-size: 8.5pt;
                    padding: 40px;
                }
                .header { border-bottom: 2px solid #0066cc; padding: 10px 0 8px 0; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: flex-start; }
                .header-left { flex: 1; display: flex; align-items: center; }
                .logo-img { max-height: 40px; max-width: 150px; object-fit: contain; margin-right: 15px; }
                .logo-text { font-size: 16px; font-weight: 700; color: #0066cc; margin-bottom: 3px; margin-right: 15px; }
                .header-title { font-size: 14pt; font-weight: 700; color: #0066cc; margin-bottom: 5px; }
                .header-right { text-align: right; font-size: 7.5pt; }
                .header-info { margin-bottom: 3px; color: #666; }
                .header-info-label { font-weight: 600; color: #333; }
                
                .section { margin-bottom: 15px; page-break-inside: avoid; }
                .section-title { font-size: 10.5pt; font-weight: 700; color: white; background-color: #0066cc; padding: 6px 10px; margin-bottom: 10px; border-radius: 3px; text-transform: uppercase; letter-spacing: 0.5px; }
                
                .info-grid { display: flex; margin-bottom: 8px; }
                .info-grid > * { flex: 1; min-width: 0; margin-right: 8px; }
                .info-grid > *:last-child { margin-right: 0; }
                .info-grid.full { flex-direction: column; }
                .info-grid.full > * { margin-right: 0; margin-bottom: 8px; }
                .info-grid.full > *:last-child { margin-bottom: 0; }
                .info-item { border: 1px solid #ddd; padding: 7px; background-color: #f9f9f9; border-radius: 3px; }
                .info-label { font-weight: 600; color: #0066cc; font-size: 7.5pt; text-transform: uppercase; margin-bottom: 3px; display: block; }
                .info-value { color: #333; font-size: 9pt; word-break: break-word; }
                
                table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 8pt; }
                table th { background-color: #e8e8e8; color: #333; padding: 6px; text-align: left; font-weight: 600; border: 1px solid #ccc; text-transform: uppercase; font-size: 7pt; }
                table td { padding: 6px; border: 1px solid #ddd; color: #333; }
                table tbody tr:nth-child(even) { background-color: #f9f9f9; }
                
                .status-badge { display: inline-block; padding: 2px 5px; border-radius: 3px; font-weight: 600; font-size: 6.5pt; }
                .status-concluida { background-color: #d4edda; color: #155724; }
                .status-andamento { background-color: #fff3cd; color: #856404; }
                .status-nao-iniciada { background-color: #e2e3e5; color: #383d41; }
                .status-paralisada { background-color: #f8d7da; color: #721c24; }
                .status-resolvido { background-color: #d4edda; color: #155724; }
                .status-pendente { background-color: #fff3cd; color: #856404; }
                
                .empty-message { background-color: #f0f0f0; border-left: 3px solid #0066cc; padding: 8px; margin-bottom: 10px; color: #666; font-style: italic; border-radius: 3px; font-size: 8pt; }
                
                .observations-box { background-color: #f9f9f9; border: 1px solid #ddd; padding: 8px; border-radius: 3px; min-height: 30px; white-space: pre-wrap; word-wrap: break-word; font-size: 9pt; line-height: 1.4; }
                .comment-item { border-bottom: 1px dashed #ccc; padding-bottom: 5px; margin-bottom: 5px; }
                
                .attachment-counter { font-size: 9pt; margin-bottom: 10px; color: #666; }
                .attachment-item { display: flex; align-items: center; padding: 6px; border: 1px solid #ddd; margin-bottom: 6px; border-radius: 3px; background-color: #f9f9f9; }
                .attachment-icon { font-size: 16px; min-width: 20px; text-align: center; margin-right: 6px; }
                .attachment-info { flex: 1; }
                .attachment-name { font-weight: 600; color: #333; font-size: 8.5pt; }
                .attachment-meta { font-size: 6.5pt; color: #999; margin-top: 2px; }
                
                .gallery { display: flex; flex-wrap: wrap; margin-bottom: 15px; }
                .gallery-item { text-align: center; width: 23%; margin-right: 2%; margin-bottom: 8px; box-sizing: border-box; }
                .gallery-item:nth-child(4n) { margin-right: 0; }
                .gallery-image { width: 100%; height: 90px; object-fit: cover; border: 1px solid #ddd; border-radius: 3px; margin-bottom: 5px; }
                .gallery-caption { font-size: 6.5pt; color: #666; word-break: break-word; }
                
                .identification-field { background-color: #eef; border: 1px solid #ccf; padding: 8px; margin-top: 15px; margin-bottom: 15px; border-radius: 3px; font-size: 8.5pt; color: #333; }
                .identification-field strong { color: #0066cc; }
                
                .footer { border-top: 2px solid #0066cc; padding-top: 15px; margin-top: 20px; display: flex; page-break-inside: avoid; }
                .footer > * { flex: 1; min-width: 0; margin-right: 30px; }
                .footer > *:last-child { margin-right: 0; }
                .signature-block { text-align: center; }
                .signature-line { border-bottom: 1px solid #333; margin-bottom: 8px; height: 30px; }
                .signature-label { font-size: 8pt; font-weight: 600; color: #333; text-transform: uppercase; }
                
                .break-page { page-break-before: always; }
                .text-red { color: #d32f2f; }
            `}} />

            {/* CABEÇALHO */}
            <div className="header">
                <div className="header-left">
                    {rdo.empresaLogo ? (
                        <img src={rdo.empresaLogo} alt="Logo" className="logo-img" />
                    ) : (
                        <div className="logo-text">MetaConstrutor</div>
                    )}
                    <div>
                        <div className="header-title">RELATÓRIO DIÁRIO DE OBRA (RDO)</div>
                    </div>
                </div>
                <div className="header-right">
                    <div className="header-info"><span className="header-info-label">RDO Nº:</span> {rdo.numero}</div>
                    <div className="header-info"><span className="header-info-label">Obra:</span> {rdo.obraNome}</div>
                    <div className="header-info"><span className="header-info-label">Data:</span> {formatDate(rdo.data)}</div>
                </div>
            </div>

            {/* SEÇÃO 1: INFORMAÇÕES BÁSICAS */}
            <div className="section">
                <div className="section-title">1. Informações Básicas</div>
                <div className="info-grid">
                    <div className="info-item">
                        <span className="info-label">Data do Relatório</span>
                        <div className="info-value">{formatDate(rdo.data)}</div>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Obra Selecionada</span>
                        <div className="info-value">{rdo.obraNome} {rdo.obraLocal && `- ${rdo.obraLocal}`}</div>
                    </div>
                </div>
                <div className="info-grid full">
                    <div className="info-item">
                        <span className="info-label">Condições Climáticas</span>
                        <div className="info-value">
                            {getClimaIcon(climaManha)} Manhã: {climaManha} | {getClimaIcon(climaTarde)} Tarde: {climaTarde}
                        </div>
                    </div>
                </div>
                {/* <div className="info-grid full">
                    <div className="info-item">
                        <span className="info-label">Equipe Ociosa</span>
                        <div className="info-value">{rdo.equipeOciosa ? `Sim (${rdo.tempoOcioso || 0}h)` : 'Não'}</div>
                    </div>
                </div> */}
            </div>

            {/* SEÇÃO 2: PERÍODOS DE TRABALHO */}
            <div className="section">
                <div className="section-title">2. Períodos de Trabalho</div>
                {hasPeriodos ? (
                    <table>
                        <thead>
                            <tr>
                                <th>Tipo do Período</th>
                                <th>Horário Início</th>
                                <th>Horário Fim</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rdo.periodos?.map((p, i) => (
                                <tr key={i}>
                                    <td>{p.tipo || '—'}</td>
                                    <td>{p.horarioInicio || '—'}</td>
                                    <td>{p.horarioFim || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    rdo.periodo ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>Período Geral</th>
                                    <th>Equipe Ociosa</th>
                                    <th>Tempo Ocioso</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{rdo.periodo}</td>
                                    <td>{rdo.equipeOciosa ? 'Sim' : 'Não'}</td>
                                    <td>{rdo.tempoOcioso ? `${rdo.tempoOcioso}h` : '—'}</td>
                                </tr>
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-message">Nenhum registro nesta seção.</div>
                    )
                )}
            </div>

            {/* SEÇÃO 3: EQUIPES PRESENTES */}
            <div className="section">
                <div className="section-title">3. Equipes Presentes</div>
                {hasEquipes ? (
                    <table>
                        <thead>
                            <tr>
                                <th>Equipe / Colaborador</th>
                                <th>Função</th>
                                <th>Horas Trabalhadas</th>
                                <th>Horas Ociosas</th>
                                <th>Presente</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rdo.equipes?.map((e, i) => (
                                <tr key={i}>
                                    <td><strong>{e.nome}</strong></td>
                                    <td>{e.funcao || '—'}</td>
                                    <td>{e.horasTrabalho ? `${e.horasTrabalho}h` : '—'}</td>
                                    <td>{e.horasOciosas ? `${e.horasOciosas}h` : '—'}</td>
                                    <td>{e.presente !== false ? 'Sim' : 'Não'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-message">Nenhum registro nesta seção.</div>
                )}
            </div>

            {/* SEÇÃO 4: ATIVIDADES REALIZADAS */}
            <div className="section">
                <div className="section-title">4. Atividades Realizadas</div>

                {hasAtividades && (
                    <>
                        <h4 style={{ fontSize: '9.5pt', fontWeight: 600, color: '#0066cc', marginBottom: '8px' }}>Atividades Planejadas</h4>
                        <table>
                            <thead>
                                <tr>
                                    <th>Nome da Atividade</th>
                                    <th>Status</th>
                                    <th>% Concluído</th>
                                    <th>Qtd/Unid.</th>
                                    <th>Observações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rdo.atividades?.map((a, i) => {
                                    let badgeClass = 'status-pendente';
                                    if (a.status?.toLowerCase().includes('conclu')) badgeClass = 'status-concluida';
                                    if (a.status?.toLowerCase().includes('andamento')) badgeClass = 'status-andamento';
                                    if (a.status?.toLowerCase().includes('não')) badgeClass = 'status-nao-iniciada';
                                    if (a.status?.toLowerCase().includes('paralisada')) badgeClass = 'status-paralisada';

                                    return (
                                        <tr key={i}>
                                            <td>{a.descricao}</td>
                                            <td><span className={`status-badge ${badgeClass}`}>{a.status || '—'}</span></td>
                                            <td>{a.percentual !== undefined ? `${a.percentual}%` : '—'}</td>
                                            <td>{a.quantidade !== undefined ? `${a.quantidade} ${a.unidade || ''}` : '—'}</td>
                                            <td>{a.observacoes || '—'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </>
                )}

                {hasExtras && (
                    <>
                        <h4 style={{ fontSize: '9.5pt', fontWeight: 600, color: '#0066cc', marginBottom: '8px', marginTop: '10px' }}>Atividades Extras</h4>
                        <table>
                            <thead>
                                <tr>
                                    <th>Descrição da Atividade</th>
                                    <th>Motivo/Justificativa</th>
                                    <th>% Concluído</th>
                                    <th>Qtd/Unid.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rdo.atividadesExtras?.map((ax, i) => (
                                    <tr key={i}>
                                        <td>{ax.descricao}</td>
                                        <td>{ax.justificativa || '—'}</td>
                                        <td>{ax.percentual !== undefined ? `${ax.percentual}%` : '—'}</td>
                                        <td>{ax.quantidade !== undefined ? `${ax.quantidade} ${ax.unidade || ''}` : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}

                {!hasAtividades && !hasExtras && <div className="empty-message">Nenhum registro nesta seção.</div>}
            </div>

            {/* SEÇÃO 5: EQUIPAMENTOS UTILIZADOS */}
            <div className="section">
                <div className="section-title">5. Equipamentos Utilizados</div>
                {hasEquipamentos ? (
                    <table>
                        <thead>
                            <tr>
                                <th>Equipamento</th>
                                <th>Status</th>
                                <th>Qtd.</th>
                                <th>Horas de Uso</th>
                                <th>Observações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rdo.equipamentos?.map((eq, i) => (
                                <tr key={i}>
                                    <td>{eq.nome}</td>
                                    <td>{eq.status || '—'}</td>
                                    <td>{eq.quantidade || 1}</td>
                                    <td>{eq.horasUso ? `${eq.horasUso}h` : '—'}</td>
                                    <td>{eq.observacoes || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-message">Nenhum registro nesta seção.</div>
                )}
            </div>

            {/* Forçar quebra de página antes de seções pesadas se desejável. HTML2PDF resolve automaticamente, mas ocorrências/fotos podem precisar */}

            {/* SEÇÃO 6: PROBLEMAS E OCORRÊNCIAS */}
            <div className="section" style={{ pageBreakInside: 'auto' }}>
                <div className="section-title">6. Problemas e Ocorrências</div>

                {hasOcorrencias && (
                    <table style={{ marginBottom: hasAcidentes ? '10px' : '0' }}>
                        <thead>
                            <tr>
                                <th>Descrição / Problema</th>
                                <th>Tipo</th>
                                <th>Envolvidos</th>
                                <th>Ações Tomadas</th>
                                <th>Causou Ociosidade?</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rdo.ocorrencias?.map((oc, i) => (
                                <tr key={i}>
                                    <td>{oc.descricao}</td>
                                    <td>{oc.tipo || '—'}</td>
                                    <td>{oc.envolvidos?.join(', ') || '—'}</td>
                                    <td>{oc.acoesTomadas || '—'}</td>
                                    <td>{oc.causouOciosidade ? `Sim (${oc.horasParada || 0}h)` : 'Não'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {hasAcidentes && (
                    <>
                        <h4 style={{ fontSize: '9.5pt', fontWeight: 600, color: '#d32f2f', marginBottom: '8px' }}>⚠ Acidentes de Trabalho</h4>
                        <table style={{ border: '1px solid #ffccbc' }}>
                            <thead>
                                <tr>
                                    <th style={{ backgroundColor: '#fff3e0', color: '#d32f2f' }}>Descrição</th>
                                    <th style={{ backgroundColor: '#fff3e0', color: '#d32f2f' }}>Gravidade</th>
                                    <th style={{ backgroundColor: '#fff3e0', color: '#d32f2f' }}>Hora</th>
                                    <th style={{ backgroundColor: '#fff3e0', color: '#d32f2f' }}>Envolvidos</th>
                                    <th style={{ backgroundColor: '#fff3e0', color: '#d32f2f' }}>Providências</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rdo.acidentes?.map((ac, i) => (
                                    <tr key={i} style={{ backgroundColor: '#fffde7' }}>
                                        <td><strong>{ac.descricao}</strong></td>
                                        <td>{ac.gravidade || '—'}</td>
                                        <td>{ac.horaOcorrencia || '—'}</td>
                                        <td>{ac.colaboradoresEnvolvidos?.join(', ') || '—'}</td>
                                        <td>{ac.providenciasTomadas || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}

                {!hasOcorrencias && !hasAcidentes && <div className="empty-message">Nenhum registro nesta seção.</div>}
            </div>

            {/* SEÇÃO 7: OBSERVAÇÕES GERAIS */}
            <div className="section">
                <div className="section-title">7. Observações Gerais</div>
                {hasObservacoes ? (
                    <div className="observations-box">
                        {rdo.observacoesTexto && (
                            <div style={{ marginBottom: rdo.comentarios?.length ? '10px' : '0' }}>
                                {rdo.observacoesTexto}
                            </div>
                        )}
                        {rdo.comentarios?.map((c, i) => (
                            <div key={i} className="comment-item">
                                <strong style={{ color: '#0066cc' }}>{c.autor}</strong> <span style={{ fontSize: '7pt', color: '#888' }}>({c.data}):</span><br />
                                {c.texto}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-message">Nenhum registro nesta seção.</div>
                )}
            </div>

            {/* SEÇÃO 8: ANEXOS */}
            <div className="section break-page">
                <div className="section-title">8. Anexos e Registros Fotográficos</div>
                {hasFotos || hasDocs ? (
                    <>
                        <p className="attachment-counter">📎 Total de {(rdo.fotos?.length || 0) + (rdo.documentos?.length || 0)} arquivos anexados</p>

                        {hasFotos && (
                            <>
                                <h4 style={{ fontSize: '9.5pt', fontWeight: 600, color: '#0066cc', marginBottom: '8px' }}>Registro Fotográfico</h4>
                                <div className="gallery">
                                    {rdo.fotos?.map((f, i) => (
                                        <div className="gallery-item" key={i}>
                                            <img src={f.base64} alt={`Foto ${i + 1}`} className="gallery-image" />
                                            <div className="gallery-caption">{f.legenda || `Foto ${i + 1}`}</div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {hasDocs && (
                            <>
                                <h4 style={{ fontSize: '9.5pt', fontWeight: 600, color: '#0066cc', marginBottom: '8px', marginTop: '10px' }}>Documentos Anexos</h4>
                                {rdo.documentos?.map((d, i) => (
                                    <div className="attachment-item" key={i}>
                                        <div className="attachment-icon">📄</div>
                                        <div className="attachment-info">
                                            <div className="attachment-name">{d.nome || 'Documento Anexo'}</div>
                                            <div className="attachment-meta">{d.tipo || 'PDF/Doc'}</div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </>
                ) : (
                    <div className="empty-message">Nenhum registro nesta seção.</div>
                )}
            </div>

            {/* CAMPO ELABORADO POR */}
            <div className="identification-field">
                <strong>Elaborado por:</strong> {rdo.responsavel || 'Usuário Responsável'} - {formatTimeAndDate(rdo.data)}
            </div>

            {rdo.status?.toLowerCase() === 'aprovado' && (
                <div className="identification-field" style={{ backgroundColor: '#e6ffe6', borderColor: '#99cc99' }}>
                    <strong>Aprovado por:</strong> {rdo.aprovadoPor || 'Gestor da Obra'} - {formatTimeAndDate(new Date().toISOString())}
                </div>
            )}

            {rdo.status?.toLowerCase() === 'rejeitado' && (
                <div className="identification-field" style={{ backgroundColor: '#ffe6e6', borderColor: '#ff9999' }}>
                    <strong>Status:</strong> Rejeitado
                </div>
            )}

            {/* Rodapé e Assinaturas */}
            <div className="footer">
                <div className="signature-block">
                    <div className="signature-line"></div>
                    <div className="signature-label">Responsável Elaboração</div>
                    <div style={{ fontSize: '7.5pt', color: '#999', marginTop: '3px' }}>Data: ___/___/______</div>
                </div>
                <div className="signature-block">
                    <div className="signature-line"></div>
                    <div className="signature-label">Responsável Aprovação</div>
                    <div style={{ fontSize: '7.5pt', color: '#999', marginTop: '3px' }}>Data: ___/___/______</div>
                </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '7pt', color: '#999', borderTop: '1px solid #ddd', paddingTop: '10px' }}>
                <p>Gerado pelo sistema Meta Construtor em {dataGeracao}</p>
            </div>
        </div>
    );
};
