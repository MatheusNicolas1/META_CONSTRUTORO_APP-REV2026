import React, { Suspense, lazy, memo, useEffect, type ReactNode } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ThemeProvider } from '@/components/ThemeProvider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';

import { SafeSuspense } from '@/components/SafeSuspense';
import OptimizedLayout from '@/components/OptimizedLayout';
import { AuthWrapper } from '@/components/auth/AuthWrapper';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PublicRoute from '@/components/auth/PublicRoute';
import type { UserRole } from '@/types/user';
import { AuditProvider } from '@/components/security/AuditLogger';
import { OrgProvider } from '@/contexts/OrgContext';
import SecurityHeaders from '@/components/security/SecurityHeaders';
import PublicThemeEffect from '@/components/public/PublicThemeEffect';
import { ServiceWorkerManager } from '@/components/ServiceWorkerManager';
import { InteractionTracker } from '@/components/InteractionTracker';
import { SuccessCheck } from '@/components/Feedback/SuccessCheck';
import PublicMarketingTracker from '@/components/analytics/PublicMarketingTracker';
import { checkUrlForAffiliateRef } from '@/utils/affiliateTracker';
import { AffiliateUrlWatcher } from '@/components/AffiliateUrlWatcher';

// Query client configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 3 * 60 * 1000, // 3 minutes
      gcTime: 8 * 60 * 1000, // 8 minutes
      retry: (failureCount, error) => {
        // Don't retry on client errors (4xx)
        if (error instanceof Error && (error as any).status >= 400 && (error as any).status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

import Index from '@/pages/Index';

import Login from '@/pages/Login';
import AuthCallback from '@/pages/AuthCallback';
import Logout from '@/pages/Logout';
import RecuperarSenha from '@/pages/RecuperarSenha';
import RedefinirSenha from '@/pages/RedefinirSenha';
import CriarConta from '@/pages/CriarConta';
import MFA from '@/pages/MFA';
import RenovarSessao from '@/pages/RenovarSessao';

// Lazy loading otimizado com chunk específicos
const Dashboard = lazy(() =>
  import('@/pages/Dashboard').then(module => ({
    default: module.default
  }))
);

const Obras = lazy(() =>
  import('@/pages/Obras').then(module => ({
    default: module.default
  }))
);

const ObraDetalhes = lazy(() =>
  import('@/pages/ObraDetalhes').then(module => ({
    default: module.default
  }))
);

const RDO = lazy(() =>
  import('@/pages/RDO').then(module => ({
    default: module.default
  }))
);

const RDONovoPage = lazy(() =>
  import('@/pages/RDONovoPage').then(module => ({
    default: module.default
  }))
);

const RDOVisualizar = lazy(() =>
  import('@/pages/RDOVisualizar').then(module => ({
    default: module.default
  }))
);

const Atividades = lazy(() =>
  import('@/pages/Atividades').then(module => ({
    default: module.default
  }))
);

const Checklist = lazy(() =>
  import('@/pages/Checklist').then(module => ({
    default: module.default
  }))
);

const ChecklistDetalhes = lazy(() =>
  import('@/pages/ChecklistDetalhes').then(module => ({
    default: module.default
  }))
);

const Equipes = lazy(() =>
  import('@/pages/Equipes').then(module => ({
    default: module.default
  }))
);

const Colaboradores = lazy(() =>
  import('@/pages/Colaboradores').then(module => ({
    default: module.default
  }))
);

const Equipamentos = lazy(() =>
  import('@/pages/Equipamentos').then(module => ({
    default: module.default
  }))
);

const Mais = lazy(() =>
  import('@/pages/Mais').then(module => ({
    default: module.default
  }))
);

const Documentos = lazy(() =>
  import('@/pages/Documentos').then(module => ({
    default: module.default
  }))
);

const Fornecedores = lazy(() =>
  import('@/pages/Fornecedores').then(module => ({
    default: module.default
  }))
);

const Relatorios = lazy(() =>
  import('@/pages/Relatorios').then(module => ({
    default: module.default
  }))
);

const Integracoes = lazy(() =>
  import('@/pages/Integracoes').then(module => ({
    default: module.default
  }))
);

const Configuracoes = lazy(() =>
  import('@/pages/Configuracoes').then(module => ({
    default: module.default
  }))
);

const Perfil = lazy(() =>
  import('@/pages/Perfil').then(module => ({
    default: module.default
  }))
);

const Planos = lazy(() =>
  import('@/pages/Planos').then(module => ({
    default: module.default
  }))
);

const Feedback = lazy(() =>
  import('@/pages/Feedback').then(module => ({
    default: module.default
  }))
);

const FAQ = lazy(() =>
  import('@/pages/FAQ').then(module => ({
    default: module.default
  }))
);

const Seguranca = lazy(() =>
  import('@/pages/Seguranca').then(module => ({
    default: module.default
  }))
);

const DDS = lazy(() =>
  import('@/pages/DDS').then(module => ({
    default: module.default
  }))
);

const NotFound = lazy(() =>
  import('@/pages/NotFound').then(module => ({
    default: module.default
  }))
);

const PortalClientePublico = lazy(() =>
  import('@/pages/PortalClientePublico').then(module => ({
    default: module.default
  }))
);

const ClientesPortal = lazy(() =>
  import('@/pages/ClientesPortal').then(module => ({
    default: module.default
  }))
);

const FluxoCaixa = lazy(() =>
  import('@/pages/FluxoCaixa').then(module => ({
    default: module.default
  }))
);

const OrdensServico = lazy(() =>
  import('@/pages/OrdensServico').then(module => ({
    default: module.default
  }))
);

const ContratosPage = lazy(() =>
  import('@/pages/Contratos').then(module => ({
    default: module.default
  }))
);

const IntegracaoERPPage = lazy(() =>
  import('@/pages/IntegracaoERP').then(module => ({
    default: module.default
  }))
);

const PublicPortal = lazy(() =>
  import('@/pages/publicPortal').then((module) => ({
    default: module.default
  }))
);

const EmailLinkTracker = lazy(() =>
  import('@/pages/EmailLinkTracker').then(module => ({
    default: module.default
  }))
);

const Sobre = lazy(() =>
  import('@/pages/Sobre').then(module => ({
    default: module.default
  }))
);

const PerfilPublico = lazy(() =>
  import('@/pages/PerfilPublico').then(module => ({
    default: module.default
  }))
);

const ConfigurarPerfil = lazy(() =>
  import('@/pages/ConfigurarPerfil').then(module => ({
    default: module.default
  }))
);

const Contato = lazy(() =>
  import('@/pages/Contato').then(module => ({
    default: module.default
  }))
);

const Atualizacoes = lazy(() =>
  import('@/pages/Atualizacoes').then(module => ({
    default: module.default
  }))
);

const Carreiras = lazy(() =>
  import('@/pages/Carreiras').then(module => ({
    default: module.default
  }))
);

const Blog = lazy(() =>
  import('@/pages/Blog').then(module => ({
    default: module.default
  }))
);

const BlogArticle = lazy(() =>
  import('@/pages/BlogArticle').then(module => ({
    default: module.default
  }))
);

const PrivacyPolicy = lazy(() =>
  import('@/pages/legal/PrivacyPolicy').then(module => ({
    default: module.default
  }))
);

const TermsOfService = lazy(() =>
  import('@/pages/legal/TermsOfService').then(module => ({
    default: module.default
  }))
);

const CookiePolicy = lazy(() =>
  import('@/pages/legal/CookiePolicy').then(module => ({
    default: module.default
  }))
);

const LGPDPage = lazy(() =>
  import('@/pages/legal/LGPD').then(module => ({
    default: module.default
  }))
);

const CentralAjuda = lazy(() =>
  import('@/pages/CentralAjuda').then(module => ({
    default: module.default
  }))
);

const Documentacao = lazy(() =>
  import('@/pages/Documentacao').then(module => ({
    default: module.default
  }))
);

const StatusPage = lazy(() =>
  import('@/pages/Status').then(module => ({
    default: module.default
  }))
);

const APIPage = lazy(() =>
  import('@/pages/APIPage').then(module => ({
    default: module.default
  }))
);

const AdminDashboard = lazy(() =>
  import('@/pages/AdminDashboard').then(module => ({
    default: module.default
  }))
);

const Despesas = lazy(() =>
  import('@/pages/Despesas').then(module => ({
    default: module.default
  }))
);

const Lixeira = lazy(() =>
  import('@/pages/Lixeira').then(module => ({
    default: module.default
  }))
);

const Notificacoes = lazy(() =>
  import('@/pages/Notificacoes').then(module => ({
    default: module.default
  }))
);

const Preco = lazy(() =>
  import('@/pages/Preco').then(module => ({
    default: module.default
  }))
);

const Checkout = lazy(() =>
  import('@/pages/Checkout').then(module => ({
    default: module.default
  }))
);

const CheckoutSuccess = lazy(() =>
  import('@/pages/CheckoutSuccess').then(module => ({
    default: module.default
  }))
);

const CheckoutCancel = lazy(() =>
  import('@/pages/CheckoutCancel').then(module => ({
    default: module.default
  }))
);


// Módulo de comunidade removido - substituído por compartilhamento social integrado

// React Query configured inline for better module resolution

// Componente memoizado para página protegida
const ProtectedPage = memo(({
  children,
  roles
}: {
  children: ReactNode;
  roles?: UserRole[]
}) => (
  <OptimizedLayout>
    <ProtectedRoute roles={roles}>
      <SafeSuspense>
        {children}
      </SafeSuspense>
    </ProtectedRoute>
  </OptimizedLayout>
));

ProtectedPage.displayName = 'ProtectedPage';

const LegacyAppRedirect = memo(() => {
  const location = useLocation();

  return (
    <Navigate
      to={`/app${location.pathname}${location.search}${location.hash}`}
      replace
    />
  );
});

LegacyAppRedirect.displayName = 'LegacyAppRedirect';

export const PerformanceOptimizedApp = memo(() => (
  <ErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <HelmetProvider>
        <TooltipProvider>
          <ServiceWorkerManager />
          <Toaster />
          <Sonner />
          <SuccessCheck />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>



            <QueryClientProvider client={queryClient}>
              <AffiliateUrlWatcher />
              <AuthWrapper>
                <InteractionTracker />
                <PublicMarketingTracker />
                <OrgProvider>
                  <AuditProvider>
                    <SecurityHeaders />
                    <Routes>
                      {/* Home é a raiz e /home redireciona */}
                      <Route path="/" element={<><PublicThemeEffect /><Index /></>} />
                      <Route path="/home" element={<Navigate to="/" replace />} />
                      {/* Rotas públicas sem layout */}
                      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                      <Route path="/logout" element={<Logout />} />
                      <Route path="/recuperar-senha" element={<PublicRoute><RecuperarSenha /></PublicRoute>} />
                      <Route path="/redefinir-senha" element={<PublicRoute><RedefinirSenha /></PublicRoute>} />
                      <Route path="/criar-conta" element={<PublicRoute><CriarConta /></PublicRoute>} />
                      <Route path="/auth/callback" element={<SafeSuspense><AuthCallback /></SafeSuspense>} />
                      <Route path="/mfa" element={<PublicRoute><MFA /></PublicRoute>} />
                      <Route path="/renovar-sessao" element={<RenovarSessao />} />
                      <Route path="/sobre" element={<><PublicThemeEffect /><SafeSuspense fallback={null}><Sobre /></SafeSuspense></>} />
                      <Route path="/contato" element={<><PublicThemeEffect /><SafeSuspense fallback={null}><Contato /></SafeSuspense></>} />
                      <Route path="/preco" element={<><PublicThemeEffect /><SafeSuspense fallback={null}><Preco /></SafeSuspense></>} />
                      {/* Rotas públicas do rodapé */}
                      <Route path="/atualizacoes" element={<SafeSuspense fallback={null}><Atualizacoes /></SafeSuspense>} />
                      <Route path="/carreiras" element={<SafeSuspense fallback={null}><Carreiras /></SafeSuspense>} />
                      <Route path="/blog" element={<><PublicThemeEffect /><SafeSuspense fallback={null}><Blog /></SafeSuspense></>} />
                      <Route path="/blog/:slug" element={<><PublicThemeEffect /><SafeSuspense fallback={null}><BlogArticle /></SafeSuspense></>} />
                      <Route path="/legal/privacidade" element={<SafeSuspense fallback={null}><PrivacyPolicy /></SafeSuspense>} />
                      <Route path="/legal/termos" element={<SafeSuspense fallback={null}><TermsOfService /></SafeSuspense>} />
                      <Route path="/legal/cookies" element={<SafeSuspense fallback={null}><CookiePolicy /></SafeSuspense>} />
                      <Route path="/legal/lgpd" element={<SafeSuspense fallback={null}><LGPDPage /></SafeSuspense>} />
                      <Route path="/central-ajuda" element={<SafeSuspense fallback={null}><CentralAjuda /></SafeSuspense>} />
                      {/* Portal do Cliente - página pública */}
                      <Route path="/portal/:token" element={<SafeSuspense fallback={null}><PortalClientePublico /></SafeSuspense>} />
                      <Route path="/documentacao" element={<SafeSuspense fallback={null}><Documentacao /></SafeSuspense>} />
                      <Route path="/status" element={<SafeSuspense fallback={null}><StatusPage /></SafeSuspense>} />
                      <Route path="/api" element={<SafeSuspense fallback={null}><APIPage /></SafeSuspense>} />
                      {/* Rotas de Checkout */}
                      <Route path="/checkout" element={<PublicRoute allowAuthenticated><SafeSuspense><Checkout /></SafeSuspense></PublicRoute>} />
                      <Route path="/checkout/success" element={<PublicRoute allowAuthenticated><SafeSuspense><CheckoutSuccess /></SafeSuspense></PublicRoute>} />
                      <Route path="/checkout/cancel" element={<PublicRoute allowAuthenticated><SafeSuspense><CheckoutCancel /></SafeSuspense></PublicRoute>} />
                      {/* Redirecionamentos legados: o produto autenticado vive em /app/... */}
                      <Route path="/dashboard/*" element={<LegacyAppRedirect />} />
                      <Route path="/obras/*" element={<LegacyAppRedirect />} />
                      <Route path="/rdo/*" element={<LegacyAppRedirect />} />
                      <Route path="/atividades/*" element={<LegacyAppRedirect />} />
                      <Route path="/checklist/*" element={<LegacyAppRedirect />} />
                      <Route path="/equipes/*" element={<LegacyAppRedirect />} />
                      <Route path="/colaboradores/*" element={<LegacyAppRedirect />} />
                      <Route path="/equipamentos/*" element={<LegacyAppRedirect />} />
                      <Route path="/mais" element={<LegacyAppRedirect />} />
                      <Route path="/documentos/*" element={<LegacyAppRedirect />} />
                      <Route path="/fornecedores/*" element={<LegacyAppRedirect />} />
                      <Route path="/despesas/*" element={<LegacyAppRedirect />} />
                      <Route path="/lixeira/*" element={<LegacyAppRedirect />} />
                      <Route path="/relatorios/*" element={<LegacyAppRedirect />} />
                      <Route path="/integracoes/*" element={<LegacyAppRedirect />} />
                      <Route path="/configuracoes/*" element={<LegacyAppRedirect />} />
                      <Route path="/perfil" element={<LegacyAppRedirect />} />
                      <Route path="/planos" element={<LegacyAppRedirect />} />
                      <Route path="/notificacoes/*" element={<LegacyAppRedirect />} />
                      <Route path="/feedback" element={<LegacyAppRedirect />} />
                      <Route path="/faq" element={<LegacyAppRedirect />} />
                      <Route path="/seguranca/*" element={<LegacyAppRedirect />} />
                      <Route path="/clientes-portal/*" element={<LegacyAppRedirect />} />
                      <Route path="/fluxo-caixa/*" element={<LegacyAppRedirect />} />
                      <Route path="/ordens-servico/*" element={<LegacyAppRedirect />} />
                      <Route path="/dds/*" element={<LegacyAppRedirect />} />
                      <Route path="/contratos/*" element={<LegacyAppRedirect />} />
                      <Route path="/erp/*" element={<LegacyAppRedirect />} />
                      <Route path="/admin/dashboard" element={<Navigate to="/app/admin/dashboard" replace />} />
                      <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
                      {/* Dashboard protegido */}
                      <Route path="/app/dashboard" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
                      {/* Obras */}
                      <Route path="/app/obras" element={<ProtectedPage><Obras /></ProtectedPage>} />
                      <Route path="/app/obras/:id" element={<ProtectedPage><ObraDetalhes /></ProtectedPage>} />
                      <Route path="/app/obras/:id/editar" element={<ProtectedPage roles={["Presidente", "Administrador", "Gerente"]}><ObraDetalhes /></ProtectedPage>} />
                      {/* RDO */}
                      <Route path="/app/rdo" element={<ProtectedPage><RDO /></ProtectedPage>} />
                      <Route path="/app/rdo/novo" element={<ProtectedPage><RDONovoPage /></ProtectedPage>} />
                      <Route path="/app/rdo/:id/visualizar" element={<ProtectedPage><RDOVisualizar /></ProtectedPage>} />
                      <Route path="/app/rdo/:id/editar" element={<ProtectedPage><RDONovoPage /></ProtectedPage>} />
                      {/* Atividades */}
                      <Route path="/app/atividades" element={<ProtectedPage><Atividades /></ProtectedPage>} />
                      {/* Checklist */}
                      <Route path="/app/checklist" element={<ProtectedPage><Checklist /></ProtectedPage>} />
                      <Route path="/app/checklist/:id" element={<ProtectedPage><ChecklistDetalhes /></ProtectedPage>} />
                      {/* Equipes */}
                      <Route path="/app/equipes" element={<ProtectedPage roles={["Administrador", "Gerente"]}><Equipes /></ProtectedPage>} />
                      <Route path="/app/equipes/novo" element={<ProtectedPage roles={["Administrador", "Gerente"]}><Equipes /></ProtectedPage>} />
                      <Route path="/app/equipes/:id/editar" element={<ProtectedPage roles={["Administrador", "Gerente"]}><Equipes /></ProtectedPage>} />
                      {/* Colaboradores */}
                      <Route path="/app/colaboradores" element={<ProtectedPage roles={["Administrador", "Gerente"]}><Colaboradores /></ProtectedPage>} />
                      <Route path="/app/colaboradores/novo" element={<ProtectedPage roles={["Administrador", "Gerente"]}><Colaboradores /></ProtectedPage>} />
                      <Route path="/app/colaboradores/:id/editar" element={<ProtectedPage roles={["Administrador", "Gerente"]}><Colaboradores /></ProtectedPage>} />
                      {/* Equipamentos */}
                      <Route path="/app/equipamentos" element={<ProtectedPage><Equipamentos /></ProtectedPage>} />
                      {/* Mais - Menu PWA */}
                      <Route path="/app/mais" element={<ProtectedPage><Mais /></ProtectedPage>} />
                      {/* Documentos */}
                      <Route path="/app/documentos" element={<ProtectedPage><Documentos /></ProtectedPage>} />
                      {/* Fornecedores */}
                      <Route path="/app/fornecedores" element={<ProtectedPage roles={["Administrador", "Gerente"]}><Fornecedores /></ProtectedPage>} />
                      {/* Despesas */}
                      <Route path="/app/despesas" element={<ProtectedPage><Despesas /></ProtectedPage>} />
                      {/* Lixeira */}
                      <Route path="/app/lixeira" element={<ProtectedPage roles={["Presidente", "Administrador", "Gerente"]}><Lixeira /></ProtectedPage>} />
                      {/* Relatórios */}
                      <Route path="/app/relatorios" element={<ProtectedPage roles={["Administrador", "Gerente"]}><Relatorios /></ProtectedPage>} />
                      {/* Integrações */}
                      <Route path="/app/integracoes" element={<ProtectedPage roles={["Administrador", "Gerente"]}><Integracoes /></ProtectedPage>} />
                      <Route path="/app/integracoes/*" element={<ProtectedPage roles={["Administrador", "Gerente"]}><Integracoes /></ProtectedPage>} />
                      {/* Configurações */}
                      <Route path="/app/configuracoes" element={<ProtectedPage roles={["Administrador", "Gerente"]}><Configuracoes /></ProtectedPage>} />
                      {/* Portal do Cliente - tela interna */}
                      <Route path="/app/clientes-portal" element={<ProtectedPage roles={["Presidente", "Administrador", "Gerente"]}><ClientesPortal /></ProtectedPage>} />
                      {/* Fluxo de Caixa */}
                      <Route path="/app/fluxo-caixa" element={<ProtectedPage><FluxoCaixa /></ProtectedPage>} />
                      {/* Perfil */}
                      <Route path="/app/perfil" element={<ProtectedPage><Perfil /></ProtectedPage>} />
                      <Route path="/app/planos" element={<ProtectedPage><Planos /></ProtectedPage>} />
                      {/* Notificações */}
                      <Route path="/app/notificacoes" element={<ProtectedPage><Notificacoes /></ProtectedPage>} />
                      {/* Feedback e FAQ */}
                      <Route path="/app/feedback" element={<ProtectedPage><Feedback /></ProtectedPage>} />
                      <Route path="/app/faq" element={<ProtectedPage><FAQ /></ProtectedPage>} />
                      {/* Segurança */}
                      <Route path="/app/seguranca" element={<ProtectedPage roles={["Administrador", "Gerente"]}><Seguranca /></ProtectedPage>} />
                      {/* DDS - Diálogo Diário de Segurança */}
                      <Route path="/app/dds" element={<ProtectedPage><DDS /></ProtectedPage>} />
                      {/* Ordens de Serviço */}
                      <Route path="/app/ordens-servico" element={<ProtectedPage><OrdensServico /></ProtectedPage>} />
                      {/* Contratos e Medições */}
                      <Route path="/app/contratos" element={<ProtectedPage roles={["Presidente", "Administrador", "Gerente"]}><ContratosPage /></ProtectedPage>} />
                      {/* Integração ERP */}
                      <Route path="/app/integracoes/erp" element={<ProtectedPage roles={["Presidente", "Administrador"]}><IntegracaoERPPage /></ProtectedPage>} />
                      {/* Painel Administrativo */}
                      <Route path="/app/admin/dashboard" element={<ProtectedPage><AdminDashboard /></ProtectedPage>} />
                      {/* Perfil Público e Configurações */}
                      <Route path="/perfil/:slug" element={<PerfilPublico />} />
                      <Route path="/app/configurar-perfil" element={<ProtectedPage><ConfigurarPerfil /></ProtectedPage>} />
                      {/* Tracking de cliques de email */}
                      <Route path="/l/:campaignDay" element={<SafeSuspense fallback={null}><EmailLinkTracker /></SafeSuspense>} />
                      {/* 404 */}
                      <Route path="*" element={<SafeSuspense><NotFound /></SafeSuspense>} />
                    </Routes>
                  </AuditProvider>
                </OrgProvider>
              </AuthWrapper>
            </QueryClientProvider>
          </BrowserRouter>
        </TooltipProvider>
      </HelmetProvider>
    </ThemeProvider>
  </ErrorBoundary>
));

PerformanceOptimizedApp.displayName = 'PerformanceOptimizedApp';
