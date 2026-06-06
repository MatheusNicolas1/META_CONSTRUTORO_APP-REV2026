import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Search, Mic, MicOff, Building2, FileText, DollarSign, BarChart3, Paperclip, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRequireOrg } from "@/hooks/requireOrg";
import { useAuth } from "@/components/auth/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: Event) => void;
  onend: () => void;
}

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: "obra" | "rdo" | "orcamento" | "relatorio" | "documento";
  link: string;
  date?: string | null;
}

interface GlobalSearchProps {
  className?: string;
  buttonClassName?: string;
  placeholder?: string;
  forceExpanded?: boolean;
}

const getCategoryIcon = (category: SearchResult["category"]) => {
  switch (category) {
    case "obra":
      return <Building2 className="h-4 w-4" />;
    case "rdo":
      return <FileText className="h-4 w-4" />;
    case "orcamento":
      return <DollarSign className="h-4 w-4" />;
    case "relatorio":
      return <BarChart3 className="h-4 w-4" />;
    case "documento":
      return <Paperclip className="h-4 w-4" />;
  }
};

const getCategoryLabel = (category: SearchResult["category"]) => {
  switch (category) {
    case "obra":
      return "Obra";
    case "rdo":
      return "RDO";
    case "orcamento":
      return "Orcamento";
    case "relatorio":
      return "Relatorio";
    case "documento":
      return "Documento";
  }
};

const formatDate = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR");
};

const normalizeTerm = (value: string) => value.replace(/[,%()]/g, " ").replace(/\s+/g, " ").trim();

const quickSearches = ["obras em andamento", "rdo pendente", "documentos", "relatorios", "orcamentos"];
const searchPanelViewportPadding = 16;

export function GlobalSearch({
  className,
  buttonClassName,
  placeholder = "Buscar obras, RDOs, orcamentos...",
  forceExpanded = false,
}: GlobalSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isCompactOpen, setIsCompactOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const isMobile = useIsMobile();
  const { orgId, isLoading: orgLoading } = useRequireOrg();
  const { isAuthenticated } = useAuth();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const recognition = useRef<SpeechRecognition | null>(null);
  const [panelStyle, setPanelStyle] = useState<{ left: number; top: number; width: number } | null>(null);

  const canSearch = !orgLoading && !!orgId && isAuthenticated;
  const showCompactButton = isMobile && !forceExpanded && !isCompactOpen;
  const normalizedSearchTerm = normalizeTerm(searchTerm);
  const showSearchPanel = !showCompactButton && isFocused;

  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = "pt-BR";

      recognition.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchTerm(transcript);
        setIsFocused(true);
        setIsCompactOpen(true);
        setIsListening(false);
      };

      recognition.current.onerror = () => {
        setIsListening(false);
        toast({
          title: "Erro no reconhecimento de voz",
          description: "Nao foi possivel capturar o audio. Tente novamente.",
          variant: "destructive",
        });
      };

      recognition.current.onend = () => setIsListening(false);
    }
  }, []);

  useEffect(() => {
    const focusInlineSearch = () => {
      setIsCompactOpen(true);
      setIsFocused(true);

      const focusInput = () => inputRef.current?.focus({ preventScroll: true });
      focusInput();
      window.requestAnimationFrame(focusInput);
      window.setTimeout(focusInput, 50);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const isSearchShortcut =
        (event.ctrlKey || event.metaKey) &&
        (event.key.toLowerCase() === "k" || event.code === "KeyK");

      if (isSearchShortcut) {
        event.preventDefault();
        focusInlineSearch();
      }

      if (event.key === "Escape") {
        inputRef.current?.blur();
        setIsFocused(false);
        setIsCompactOpen(false);
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!wrapperRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        setIsFocused(false);
        if (!searchTerm.trim()) setIsCompactOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [searchTerm]);

  useEffect(() => {
    if (!showSearchPanel) {
      setPanelStyle(null);
      return;
    }

    const updatePanelPosition = () => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;

      const maxWidth = Math.max(0, window.innerWidth - searchPanelViewportPadding * 2);
      const width = Math.min(rect.width, maxWidth);
      const centeredLeft = rect.left + rect.width / 2 - width / 2;
      const left = Math.min(
        Math.max(centeredLeft, searchPanelViewportPadding),
        window.innerWidth - width - searchPanelViewportPadding
      );

      setPanelStyle({
        left,
        top: rect.bottom,
        width,
      });
    };

    updatePanelPosition();
    const frame = window.requestAnimationFrame(updatePanelPosition);
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [showSearchPanel]);

  useEffect(() => {
    const term = normalizeTerm(searchTerm);
    if (!term || term.length < 2 || !canSearch) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    let ignore = false;
    const timeout = window.setTimeout(async () => {
      setIsSearching(true);
      const pattern = `%${term}%`;

      try {
        const [obrasResponse, documentosResponse, rdosResponse] = await Promise.all([
          supabase
            .from("obras")
            .select("id,nome,cliente,localizacao,status,updated_at,created_at")
            .eq("org_id", orgId)
            .or(`nome.ilike.${pattern},cliente.ilike.${pattern},localizacao.ilike.${pattern}`)
            .order("updated_at", { ascending: false })
            .limit(5),
          (supabase as any)
            .from("documentos")
            .select("id,nome,categoria,descricao,created_at,obra:obras(id,nome)")
            .eq("org_id", orgId)
            .is("deleted_at", null)
            .or(`nome.ilike.${pattern},categoria.ilike.${pattern},descricao.ilike.${pattern}`)
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("rdos")
            .select("id,data,status,periodo,created_at,obras(nome)")
            .eq("org_id", orgId)
            .order("created_at", { ascending: false })
            .limit(12),
        ]);

        if (ignore) return;

        const obraResults: SearchResult[] = (obrasResponse.data || []).map((obra: any) => ({
          id: `obra-${obra.id}`,
          title: obra.nome || "Obra sem nome",
          subtitle: obra.cliente || obra.localizacao || obra.status || "Obra",
          category: "obra",
          link: `/app/obras/${obra.id}`,
          date: obra.updated_at || obra.created_at,
        }));

        const documentoResults: SearchResult[] = (documentosResponse.data || []).map((documento: any) => ({
          id: `documento-${documento.id}`,
          title: documento.nome || "Documento sem nome",
          subtitle: documento.obra?.nome || documento.categoria || documento.descricao || "Documento",
          category: "documento",
          link: documento.obra?.id ? `/app/obras/${documento.obra.id}` : "/app/documentos",
          date: documento.created_at,
        }));

        const normalized = term.toLowerCase();
        const rdoResults: SearchResult[] = (rdosResponse.data || [])
          .filter((rdo: any) => {
            const haystack = ["rdo", rdo.data, rdo.status, rdo.periodo, rdo.obras?.nome, formatDate(rdo.data)]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();
            return haystack.includes(normalized);
          })
          .slice(0, 5)
          .map((rdo: any) => ({
            id: `rdo-${rdo.id}`,
            title: `RDO ${formatDate(rdo.data || rdo.created_at)}`,
            subtitle: rdo.obras?.nome || rdo.status || "RDO",
            category: "rdo",
            link: `/app/rdo/${rdo.id}/visualizar`,
            date: rdo.data || rdo.created_at,
          }));

        setResults([...obraResults, ...rdoResults, ...documentoResults].slice(0, 8));
      } catch (error) {
        console.warn("[GlobalSearch] Erro ao buscar:", error);
        if (!ignore) setResults([]);
      } finally {
        if (!ignore) setIsSearching(false);
      }
    }, 250);

    return () => {
      ignore = true;
      window.clearTimeout(timeout);
    };
  }, [canSearch, orgId, searchTerm]);

  const applySearchTerm = (term: string) => {
    setSearchTerm(term);
    setIsFocused(true);
    setIsCompactOpen(true);
    window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
  };

  const handleVoiceToggle = () => {
    if (!recognition.current) return;

    if (isListening) {
      recognition.current.stop();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    recognition.current.start();
  };

  const activePlaceholder = useMemo(
    () => (canSearch ? placeholder : "Carregando busca da organizacao..."),
    [canSearch, placeholder]
  );

  if (showCompactButton) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          setIsCompactOpen(true);
          window.setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className="h-9 w-9"
        aria-label="Buscar"
      >
        <Search className="h-4 w-4" />
      </Button>
    );
  }

  const searchPanel =
    showSearchPanel && panelStyle
      ? createPortal(
          <div
            ref={panelRef}
            style={{
              left: panelStyle.left,
              top: panelStyle.top,
              width: panelStyle.width,
            }}
            className="fixed z-[9999] overflow-hidden rounded-b-2xl border border-t-0 border-primary/60 bg-popover text-popover-foreground shadow-[0_16px_36px_hsl(var(--primary)/0.12)]"
          >
            <div className="max-h-[min(28rem,calc(100vh-10rem))] overflow-y-auto py-2">
              {normalizedSearchTerm && (
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => applySearchTerm(normalizedSearchTerm)}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-muted/70"
                >
                  <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 truncate text-sm font-medium text-foreground">
                    Busque por <strong>{normalizedSearchTerm}</strong>
                  </span>
                </button>
              )}

              {results.length > 0 ? (
                <div className="border-t border-border/70 py-1">
                  {results.map((result) => (
                    <Link
                      key={result.id}
                      to={result.link}
                      onClick={() => {
                        setIsFocused(false);
                        setSearchTerm("");
                      }}
                      className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-muted/70"
                    >
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        {getCategoryIcon(result.category)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-2">
                          <p className="truncate text-sm font-semibold text-foreground">{result.title}</p>
                          <Badge variant="outline" className="shrink-0 text-[10px]">
                            {getCategoryLabel(result.category)}
                          </Badge>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{result.subtitle}</p>
                        {result.date && <p className="mt-1 text-[11px] text-muted-foreground">{formatDate(result.date)}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : normalizedSearchTerm.length >= 2 && !isSearching ? (
                <div className="border-t border-border/70 px-5 py-8 text-center text-sm text-muted-foreground">
                  Nenhum resultado encontrado para "{searchTerm}".
                </div>
              ) : !normalizedSearchTerm ? (
                <div className="space-y-1">
                  {quickSearches.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => applySearchTerm(suggestion)}
                      className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/70"
                    >
                      <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
                      <span className="truncate text-base font-medium text-foreground">{suggestion}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="border-t border-border/70 px-5 py-8 text-center text-sm text-muted-foreground">
                  Digite ao menos 2 caracteres para buscar obras, RDOs e documentos.
                </div>
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={wrapperRef} className={cn("relative flex min-w-0 w-full flex-1 max-w-[640px]", isFocused && "z-[9999]", className)}>
      <div
        className={cn(
          "flex h-9 min-w-0 w-full items-center border border-input bg-background px-3 text-sm ring-offset-background transition-all duration-200",
          "rounded-md shadow-sm focus-within:border-primary/60 focus-within:shadow-[0_0_0_1px_hsl(var(--primary)/0.18),0_8px_24px_hsl(var(--primary)/0.08)]",
          buttonClassName,
          showSearchPanel && "rounded-b-none border-primary/60 bg-popover shadow-[0_0_0_1px_hsl(var(--primary)/0.18),0_10px_28px_hsl(var(--primary)/0.1)]",
        )}
      >
        <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          onFocus={() => {
            setIsFocused(true);
            setIsCompactOpen(true);
          }}
          placeholder={activePlaceholder}
          disabled={!canSearch}
          className="h-full min-w-0 flex-1 truncate border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          aria-label="Buscar obras, RDOs e documentos"
        />
        <div className="ml-2 flex min-w-0 shrink-0 items-center gap-1">
          {isSearching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSearchTerm("");
                setResults([]);
                inputRef.current?.focus({ preventScroll: true });
              }}
              className="h-7 w-7 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
              type="button"
              aria-label="Limpar busca"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant={isListening ? "destructive" : "ghost"}
            size="icon"
            onClick={handleVoiceToggle}
            className={cn("h-7 w-7 shrink-0", isListening && "animate-pulse")}
            disabled={!recognition.current || !canSearch}
            type="button"
            aria-label={isListening ? "Parar captura de voz" : "Buscar por voz"}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <kbd className="pointer-events-none hidden h-6 min-w-fit select-none items-center whitespace-nowrap rounded-md border bg-muted px-2 font-mono text-[11px] font-medium leading-none text-muted-foreground xl:inline-flex">
            Ctrl K
          </kbd>
        </div>
      </div>

      {searchPanel}
    </div>
  );
}
