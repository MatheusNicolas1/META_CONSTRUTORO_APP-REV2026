export const rdoTemplateHtml = 
`<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório Diário de Obra (RDO) - MetaConstrutor</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @page {
            size: A4;
            margin: 15mm; /* Margens ajustadas para 1.5cm */
        }

        body {
            font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
            background-color: #f5f5f5;
            color: #333;
            line-height: 1.3; /* Linha de altura reduzida */
            font-size: 8.5pt; /* Tamanho de fonte base reduzido */
        }

        .container {
            background-color: white;
            /* page-break-after: always; REMOVIDO para permitir fluxo contínuo */
            padding: 0; /* Removido padding do container, as margens @page cuidam disso */
        }

        /* Cabeçalho */
        .header {
            border-bottom: 2px solid #0066cc;
            padding: 10px 0 8px 0;
            margin-bottom: 15px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }

        .header-left {
            flex: 1;
        }

        .logo {
            font-size: 16px; /* Fonte do logo reduzida */
            font-weight: 700;
            color: #0066cc;
            margin-bottom: 3px;
        }

        .header-title {
            font-size: 15pt; /* Fonte do título reduzida */
            font-weight: 700;
            color: #0066cc;
            margin-bottom: 5px;
        }

        .header-right {
            text-align: right;
            font-size: 7.5pt; /* Fonte reduzida */
        }

        .header-info {
            margin-bottom: 3px;
            color: #666;
        }

        .header-info-label {
            font-weight: 600;
            color: #333;
        }

        /* Cabeçalho para páginas subsequentes */
        .header-on-subsequent-pages {
            display: none; /* Escondido por padrão */
            text-align: right;
            font-size: 9pt;
            color: #666;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #eee;
        }

        /* Seções */
        .section {
            margin-bottom: 15px; /* Margem reduzida */
            /* page-break-inside: avoid; Evita quebra de página dentro da seção */
        }

        .section-title {
            font-size: 10.5pt; /* Fonte do título da seção reduzida */
            font-weight: 700;
            color: white;
            background-color: #0066cc;
            padding: 6px 10px; /* Padding reduzido */
            margin-bottom: 10px; /* Margem reduzida */
            border-radius: 3px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* Informações Básicas */
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px; /* Espaçamento reduzido */
            margin-bottom: 8px; /* Margem reduzida */
        }

        .info-grid.full {
            grid-template-columns: 1fr;
        }

        .info-item {
            border: 1px solid #ddd;
            padding: 7px; /* Padding reduzido */
            background-color: #f9f9f9;
            border-radius: 3px;
        }

        .info-label {
            font-weight: 600;
            color: #0066cc;
            font-size: 7.5pt; /* Fonte reduzida */
            text-transform: uppercase;
            margin-bottom: 3px; /* Margem reduzida */
            display: block;
        }

        .info-value {
            color: #333;
            font-size: 9pt; /* Fonte reduzida */
            word-break: break-word;
        }

        .climate-indicators {
            display: flex;
            gap: 10px;
            margin-top: 5px;
            flex-wrap: wrap;
        }

        .climate-item {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 9pt;
        }

        .climate-icon {
            font-size: 14px; /* Ícone reduzido */
        }

        /* Tabelas */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px; /* Margem reduzida */
            font-size: 8pt; /* Fonte reduzida */
        }

        table th {
            background-color: #e8e8e8;
            color: #333;
            padding: 6px; /* Padding reduzido */
            text-align: left;
            font-weight: 600;
            border: 1px solid #ccc;
            text-transform: uppercase;
            font-size: 7pt; /* Fonte reduzida */
        }

        table td {
            padding: 6px; /* Padding reduzido */
            border: 1px solid #ddd;
            color: #333;
        }

        table tbody tr:nth-child(even) {
            background-color: #f9f9f9;
        }

        .status-badge {
            display: inline-block;
            padding: 2px 5px; /* Padding reduzido */
            border-radius: 3px;
            font-weight: 600;
            font-size: 6.5pt; /* Fonte reduzida */
        }

        .status-concluida {
            background-color: #d4edda;
            color: #155724;
        }

        .status-andamento {
            background-color: #fff3cd;
            color: #856404;
        }

        .status-nao-iniciada {
            background-color: #e2e3e5;
            color: #383d41;
        }

        .status-paralisada {
            background-color: #f8d7da;
            color: #721c24;
        }

        .status-pendente {
            background-color: #fff3cd;
            color: #856404;
        }

        .status-resolvido {
            background-color: #d4edda;
            color: #155724;
        }

        /* Mensagens Vazias */
        .empty-message {
            background-color: #f0f0f0;
            border-left: 3px solid #0066cc;
            padding: 8px; /* Padding reduzido */
            margin-bottom: 10px; /* Margem reduzida */
            color: #666;
            font-style: italic;
            border-radius: 3px;
            font-size: 8pt;
        }

        /* Observações */
        .observations-box {
            background-color: #f9f9f9;
            border: 1px solid #ddd;
            padding: 8px; /* Padding reduzido */
            border-radius: 3px;
            min-height: 30px; /* Altura mínima reduzida */
            white-space: pre-wrap;
            word-wrap: break-word;
            font-size: 9pt;
            line-height: 1.4;
        }

        /* Anexos */
        .attachment-counter {
            font-size: 9pt;
            margin-bottom: 10px;
            color: #666;
        }

        .attachment-item {
            display: flex;
            align-items: center;
            gap: 6px; /* Espaçamento reduzido */
            padding: 6px; /* Padding reduzido */
            border: 1px solid #ddd;
            margin-bottom: 6px; /* Margem reduzida */
            border-radius: 3px;
            background-color: #f9f9f9;
        }

        .attachment-icon {
            font-size: 16px; /* Ícone reduzido */
            min-width: 20px;
            text-align: center;
        }

        .attachment-info {
            flex: 1;
        }

        .attachment-name {
            font-weight: 600;
            color: #333;
            font-size: 8.5pt; /* Fonte reduzida */
        }

        .attachment-meta {
            font-size: 6.5pt; /* Fonte reduzida */
            color: #999;
            margin-top: 2px;
        }

        .gallery {
            display: grid;
            grid-template-columns: repeat(4, 1fr); /* Mais colunas para galeria */
            gap: 8px; /* Espaçamento reduzido */
            margin-bottom: 15px;
        }

        .gallery-item {
            text-align: center;
        }

        .gallery-image {
            max-width: 100%;
            max-height: 70px; /* Altura máxima reduzida */
            border: 1px solid #ddd;
            border-radius: 3px;
            margin-bottom: 5px;
        }

        .gallery-caption {
            font-size: 6.5pt; /* Fonte reduzida */
            color: #666;
            word-break: break-word;
        }

        /* Campos de Identificação */
        .identification-field {
            background-color: #eef;
            border: 1px solid #ccf;
            padding: 8px;
            margin-top: 15px;
            margin-bottom: 15px;
            border-radius: 3px;
            font-size: 8.5pt;
            color: #333;
        }

        .identification-field strong {
            color: #0066cc;
        }

        /* Rodapé */
        .footer {
            border-top: 2px solid #0066cc;
            padding-top: 15px;
            margin-top: 20px;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 30px;
        }

        .signature-block {
            text-align: center;
        }

        .signature-line {
            border-bottom: 1px solid #333;
            margin-bottom: 8px;
            height: 30px; /* Altura reduzida */
        }

        .signature-label {
            font-size: 8pt;
            font-weight: 600;
            color: #333;
            text-transform: uppercase;
        }

        .page-info {
            position: fixed;
            bottom: 8mm;
            right: 15mm;
            font-size: 7pt;
            color: #999;
        }

        /* Impressão */
        @media print {
            body {
                background-color: white;
            }

            .container {
                box-shadow: none;
            }

            .section {
                page-break-inside: avoid;
            }

            table {
                page-break-inside: avoid;
            }

            /* Controla o cabeçalho para a primeira e demais páginas */
            .header {
                display: flex; /* Garante que o cabeçalho completo apareça na primeira página */
            }

            .header-on-subsequent-pages {
                display: none; /* Esconde o cabeçalho simplificado na primeira página */
            }

            @page:first {
                /* Margens já definidas no @page geral */
            }

            @page:not(:first) {
                /* Margens já definidas no @page geral */
            }

            /* Regra para exibir o cabeçalho simplificado nas páginas subsequentes */
            .container:not(:first-child) .header-on-subsequent-pages {
                display: block;
            }

            .container:not(:first-child) .header {
                display: none; /* Esconde o cabeçalho completo nas páginas subsequentes */
            }
        }

        .break-page {
            page-break-before: always;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Cabeçalho Completo (apenas na primeira página) -->
        <div class="header">
            <div class="header-left">
                <div class="logo">MetaConstrutor</div>
                <div class="header-title">RELATÓRIO DIÁRIO DE OBRA (RDO)</div>
            </div>
            <div class="header-right">
                <div class="header-info"><span class="header-info-label">RDO Nº:</span> {{rdo.numero}}</div>
                <div class="header-info"><span class="header-info-label">Código da Obra:</span> {{obra.codigo}}</div>
                <div class="header-info"><span class="header-info-label">Data de Emissão:</span> 15/03/2024</div>
            </div>
        </div>

        <!-- SEÇÃO 1: INFORMAÇÕES BÁSICAS -->
        <div class="section">
            <div class="section-title">1. Informações Básicas</div>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Data do Relatório</span>
                    <div class="info-value">{{rdo.data_emissao}}</div>
                </div>
                <div class="info-item">
                    <span class="info-label">Obra Selecionada</span>
                    <div class="info-value">{{obra.nome}} - {{obra.endereco}}</div>
                </div>
            </div>
            <div class="info-grid full">
                <div class="info-item">
                    <span class="info-label">Condições Climáticas</span>
                    <div class="info-value">{{rdo.clima_manha}} | {{rdo.clima_tarde}}</div>
                </div>
            </div>
            <div class="info-grid full">
                <div class="info-item">
                    <span class="info-label">Equipe Ociosa</span>
                    <div class="info-value">{{rdo.equipe_ociosa}}</div>
                </div>
            </div>
        </div>

        <!-- SEÇÃO 2: PERÍODOS DE TRABALHO -->
        <div class="section">
            <div class="section-title">2. Períodos de Trabalho</div>
            <table>
                <thead>
                    <tr>
                        <th>Tipo do Período</th>
                        <th>Horário Início</th>
                        <th>Horário Fim</th>
                        <th>Total de Horas</th>
                    </tr>
                </thead>
                <tbody>
                    {{rdo.periodos}}
                </tbody>
            </table>
            <!-- Exemplo de seção vazia -->
            <!-- <div class="empty-message">Nenhum registro nesta seção.</div> -->
        </div>

        <!-- SEÇÃO 3: EQUIPES PRESENTES -->
        <div class="section">
            <div class="section-title">3. Equipes Presentes</div>
            <table>
                <thead>
                    <tr>
                        <th>Equipe</th>
                        <th>Líder</th>
                        <th>Membros</th>
                        <th>Função</th>
                    </tr>
                </thead>
                <tbody>
                    {{rdo.equipes}}
                </tbody>
            </table>
            <!-- Exemplo de seção vazia -->
            <!-- <div class="empty-message">Nenhum registro nesta seção.</div> -->
        </div>

        <!-- SEÇÃO 4: ATIVIDADES REALIZADAS -->
        <div class="section">
            <div class="section-title">4. Atividades Realizadas</div>
            
            <h4 style="font-size: 9.5pt; font-weight: 600; color: #0066cc; margin-bottom: 8px;">Atividades Planejadas</h4>
            <table>
                <thead>
                    <tr>
                        <th>Nome da Atividade</th>
                        <th>Responsável</th>
                        <th>Status</th>
                        <th>% Concluído</th>
                        <th>Observações</th>
                    </tr>
                </thead>
                <tbody>
                    {{rdo.atividades_planejadas}}
                </tbody>
            </table>

            <h4 style="font-size: 9.5pt; font-weight: 600; color: #0066cc; margin-bottom: 8px; margin-top: 10px;">Atividades Extras</h4>
            <table>
                <thead>
                    <tr>
                        <th>Descrição da Atividade</th>
                        <th>Motivo</th>
                        <th>Responsável</th>
                        <th>Horário</th>
                    </tr>
                </thead>
                <tbody>
                    {{rdo.atividades_extras}}
                </tbody>
            </table>
            <!-- <div class="empty-message">Nenhum registro nesta seção.</div> -->
        </div>

        <!-- SEÇÃO 5: EQUIPAMENTOS UTILIZADOS -->
        <div class="section">
            <div class="section-title">5. Equipamentos Utilizados</div>
            <table>
                <thead>
                    <tr>
                        <th>Equipamento</th>
                        <th>Quantidade</th>
                        <th>Horário de Uso</th>
                        <th>Operador</th>
                        <th>Observações</th>
                    </tr>
                </thead>
                <tbody>
                    {{rdo.equipamentos}}
                </tbody>
            </table>
            <!-- <div class="empty-message">Nenhum registro nesta seção.</div> -->
        </div>
        <!-- SEÇÃO 6: PROBLEMAS E OCORRÊNCIAS -->
        <div class="section">
            <div class="section-title">6. Problemas e Ocorrências</div>
            <table>
                <thead>
                    <tr>
                        <th>Tipo</th>
                        <th>Descrição</th>
                        <th>Envolvidos</th>
                        <th>Ações Tomadas</th>
                        <th>Status</th>
                        <th>Horário</th>
                    </tr>
                </thead>
                <tbody>
                    {{rdo.ocorrencias}}
                </tbody>
            </table>
            <!-- <div class="empty-message">Nenhum registro nesta seção.</div> -->
        </div>

        <!-- SEÇÃO 7: OBSERVAÇÕES GERAIS -->
        <div class="section">
            <div class="section-title">7. Observações Gerais</div>
            <div class="observations-box">{{rdo.observacoes}}</div>
        </div>

        <!-- CAMPO ELABORADO POR -->
        <div class="identification-field">
            <strong>Elaborado por:</strong> {{usuario.nome}} - {{usuario.cargo}} - {{rdo.data_elaboracao}}
        </div>

        <!-- SEÇÃO 8: ANEXOS -->
        <div class="section">
            <div class="section-title">8. Anexos</div>
            <p class="attachment-counter">📎 Total de {{anexos.total}} arquivos anexados</p>
            
            <h4 style="font-size: 9.5pt; font-weight: 600; color: #0066cc; margin-bottom: 8px;">Imagens</h4>
            <div class="gallery">
                {{anexos.imagens}}
            </div>

            <h4 style="font-size: 9.5pt; font-weight: 600; color: #0066cc; margin-bottom: 8px; margin-top: 10px;">Outros Documentos</h4>
            {{anexos.documentos}}
            <!-- <div class="empty-message">Nenhum registro nesta seção.</div> -->
        </div>

        <!-- CAMPO APROVADO POR -->
        {{status_aprovacao}}
        <!-- Exemplo de Aguardando Aprovação -->
        <!-- <div class="identification-field" style="background-color: #fff8e6; border-color: #ffcc66;">
            <strong>Status:</strong> Aguardando aprovação
        </div> -->
        <!-- Exemplo de Rejeitado -->
        <!-- <div class="identification-field" style="background-color: #ffe6e6; border-color: #ff9999;">
            <strong>Status:</strong> Rejeitado - <span style="font-weight: normal;">Documentação incompleta</span>
        </div> -->

        <!-- Rodapé -->
        <div class="footer">
            <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-label">Responsável pela Obra</div>
                <div style="font-size: 7.5pt; color: #999; margin-top: 3px;">Data: ___/___/______</div>
            </div>
            <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-label">Gestor do Contrato</div>
                <div style="font-size: 7.5pt; color: #999; margin-top: 3px;">Data: ___/___/______</div>
            </div>
        </div>

        <div style="text-align: center; margin-top: 20px; font-size: 7pt; color: #999; border-top: 1px solid #ddd; padding-top: 10px;">
            <p>Página <span class="page-number"></span> de <span class="total-pages"></span> | Gerado em {{rdo.data_geracao}}</p>
        </div>
    </div>
</body>
</html>`
;
