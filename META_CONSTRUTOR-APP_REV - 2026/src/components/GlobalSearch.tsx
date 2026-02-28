// Global declaration for speech recognition
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

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Mic, MicOff, Building2, FileText, DollarSign, BarChart3, Paperclip } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: 'obra' | 'rdo' | 'orcamento' | 'relatorio' | 'documento';
  link: string;
  date?: Date;
}

const searchResults: SearchResult[] = [];

// Busca semântica com palavras relacionadas
const semanticKeywords: { [key: string]: string[] } = {
  'obra': ['projeto', 'construção', 'empreendimento', 'edificação'],
  'rdo': ['relatório', 'diário', 'obra'],
  'orcamento': ['custo', 'valor', 'preço', 'orçamento', 'analítico'],
  'relatorio': ['report', 'relatório', 'análise'],
  'documento': ['arquivo', 'pdf', 'doc', 'anexo'],
  'engenheiro': ['eng', 'responsável', 'técnico'],
  'residencial': ['casa', 'apartamento', 'prédio'],
  'comercial': ['loja', 'escritório', 'centro'],
  'ponte': ['viaduto', 'estrutura']
};

const getCategoryIcon = (category: SearchResult['category']) => {
  switch (category) {
    case 'obra':
      return <Building2 className="h-4 w-4" />;
    case 'rdo':
      return <FileText className="h-4 w-4" />;
    case 'orcamento':
      return <DollarSign className="h-4 w-4" />;
    case 'relatorio':
      return <BarChart3 className="h-4 w-4" />;
    case 'documento':
      return <Paperclip className="h-4 w-4" />;
  }
};

const getCategoryLabel = (category: SearchResult['category']) => {
  switch (category) {
    case 'obra':
      return 'Obra';
    case 'rdo':
      return 'RDO';
    case 'orcamento':
      return 'Orçamento';
    case 'relatorio':
      return 'Relatório';
    case 'documento':
      return 'Documento';
  }
};

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const isMobile = useIsMobile();
  const recognition = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = 'pt-BR';

      recognition.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSearchTerm(transcript);
        handleSearch(transcript);
        setIsListening(false);
      };

      recognition.current.onerror = () => {
        setIsListening(false);
        toast({
          title: "Erro no reconhecimento de voz",
          description: "Não foi possível capturar o áudio. Tente novamente.",
          variant: "destructive"
        });
      };

      recognition.current.onend = () => {
        setIsListening(false);
      };
    }

    // Atalho de teclado Ctrl+K
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        openSearch();
      }
      if (event.key === 'Escape' && isOpen) {
        closeSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSearch = (term: string) => {
    if (term.trim()) {
      const searchTerm = term.toLowerCase();

      // Busca semântica - incluir palavras relacionadas
      const semanticMatches = Object.entries(semanticKeywords).some(([key, synonyms]) => {
        if (searchTerm.includes(key) || synonyms.some(synonym => searchTerm.includes(synonym))) {
          return true;
        }
        return false;
      });

      const filtered = searchResults.filter(result => {
        const titleMatch = result.title.toLowerCase().includes(searchTerm);
        const subtitleMatch = result.subtitle.toLowerCase().includes(searchTerm);

        // Busca por palavras relacionadas
        const semanticMatch = Object.entries(semanticKeywords).some(([key, synonyms]) => {
          const keywordInSearch = searchTerm.includes(key) || synonyms.some(synonym => searchTerm.includes(synonym));
          const keywordInResult = result.title.toLowerCase().includes(key) ||
            result.subtitle.toLowerCase().includes(key) ||
            synonyms.some(synonym =>
              result.title.toLowerCase().includes(synonym) ||
              result.subtitle.toLowerCase().includes(synonym)
            );
          return keywordInSearch && keywordInResult;
        });

        return titleMatch || subtitleMatch || semanticMatch;
      });

      setResults(filtered);
    } else {
      setResults([]);
    }
  };

  const startListening = () => {
    if (recognition.current && !isListening) {
      setIsListening(true);
      recognition.current.start();
    }
  };

  const stopListening = () => {
    if (recognition.current && isListening) {
      recognition.current.stop();
      setIsListening(false);
    }
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const openSearch = () => {
    setIsOpen(true);
    setSearchTerm("");
    setResults([]);
  };

  const closeSearch = () => {
    setIsOpen(false);
    setSearchTerm("");
    setResults([]);
    if (isListening) {
      stopListening();
    }
  };

  return (
    <>
      {isMobile ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={openSearch}
          className="h-8 w-8"
        >
          <Search className="h-4 w-4" />
        </Button>
      ) : (
        <div className="relative flex-1 max-w-lg">
          <Button
            variant="outline"
            onClick={openSearch}
            className="w-full justify-start text-muted-foreground h-9 px-3 hover:bg-muted/50 transition-colors"
          >
            <Search className="mr-2 h-4 w-4" />
            <span className="text-sm">Buscar obras, RDOs, orçamentos...</span>
            <div className="ml-auto flex items-center space-x-1 opacity-60">
              <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 hidden md:inline-flex">
                Ctrl K
              </kbd>
            </div>
          </Button>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={closeSearch}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Busca Global</DialogTitle>
            <div className="sr-only">
              Interface de busca global para obras, RDOs e documentos.
            </div>
          </DialogHeader>

          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Digite para buscar em obras, RDOs, orçamentos..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  handleSearch(e.target.value);
                }}
                className="pl-10"
                autoFocus
              />
            </div>

            <Button
              variant={isListening ? "destructive" : "outline"}
              size="icon"
              onClick={handleVoiceToggle}
              className={isListening ? "animate-pulse" : ""}
              disabled={!recognition.current}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </div>

          {isListening && (
            <div className="text-center py-4">
              <div className="inline-flex items-center space-x-2 text-sm text-muted-foreground">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span>Escutando... Fale agora</span>
              </div>
            </div>
          )}

          <ScrollArea className="h-96">
            {results.length > 0 ? (
              <div className="space-y-2">
                {results.map((result) => (
                  <Link
                    key={result.id}
                    to={result.link}
                    onClick={closeSearch}
                    className="block"
                  >
                    <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex items-center space-x-2 mt-0.5">
                        {getCategoryIcon(result.category)}
                        <Badge variant="outline" className="text-xs">
                          {getCategoryLabel(result.category)}
                        </Badge>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">
                          {result.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {result.subtitle}
                        </p>
                        {result.date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {result.date.toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : searchTerm && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Nenhum resultado encontrado para "{searchTerm}"</p>
              </div>
            )}

            {!searchTerm && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Digite algo para começar a buscar</p>
                <p className="text-xs mt-2">
                  Você pode buscar por obras, RDOs, orçamentos, relatórios e documentos
                </p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}