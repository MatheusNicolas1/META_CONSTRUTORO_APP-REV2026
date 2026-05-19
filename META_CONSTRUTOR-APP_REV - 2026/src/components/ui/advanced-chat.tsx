"use client";

import { useState, FormEvent } from "react";
import { Paperclip, Mic, CornerDownLeft, X, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat-bubble";
import { ChatMessageList } from "@/components/ui/chat-message-list";
import { ChatInput } from "@/components/ui/chat-input";

interface Message {
  id: number;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

interface AdvancedChatProps {
  onClose: () => void;
}

export function AdvancedChat({ onClose }: AdvancedChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: "Olá! Sou o assistente virtual do MetaConstrutor. Como posso ajudá-lo hoje?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const getAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes("obra") || lowerMessage.includes("projeto")) {
      return "Para criar uma nova obra, acesse a seção 'Obras' no menu lateral e clique em 'Nova Obra'. Preencha todos os dados necessários como nome, endereço e datas. Posso ajudar com algo mais específico sobre gestão de obras?";
    }
    
    if (lowerMessage.includes("rdo") || lowerMessage.includes("relatório")) {
      return "O RDO (Relatório Diário de Obra) é preenchido na seção 'RDO' do menu. Selecione a obra e a data para registrar as atividades do dia. Você pode anexar fotos e documentos. Precisa de ajuda com algum campo específico?";
    }
    
    if (lowerMessage.includes("equipe") || lowerMessage.includes("funcionário")) {
      return "Na seção 'Equipes' você pode gerenciar todos os membros da sua equipe. É possível adicionar novos funcionários, definir funções e acompanhar a produtividade. O que você gostaria de saber sobre gestão de equipes?";
    }
    
    if (lowerMessage.includes("senha") || lowerMessage.includes("login")) {
      return "Para alterar sua senha, vá em 'Configurações' no menu do perfil, depois 'Segurança' e clique em 'Alterar Senha'. Você precisará da senha atual para confirmar a mudança. Posso ajudar com outras questões de segurança?";
    }

    if (lowerMessage.includes("relatório") || lowerMessage.includes("relatorio")) {
      return "O sistema oferece vários tipos de relatórios: progresso de obras, produtividade, custos e análises personalizadas. Todos podem ser exportados em PDF. Qual tipo específico você precisa?";
    }

    return "Entendi sua dúvida. Para questões mais específicas, recomendo consultar nossa seção de FAQ ou entrar em contato com nossa equipe de suporte técnico. Posso ajudar com informações gerais sobre o sistema. O que mais você gostaria de saber?";
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      content: input,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    setTimeout(() => {
      const aiResponse: Message = {
        id: messages.length + 2,
        content: getAIResponse(input),
        sender: "ai",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleAttachFile = () => {
    // Implementar anexo de arquivo
  };

  const handleMicrophoneClick = () => {
    // Implementar gravação de áudio
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl h-[600px] border bg-background rounded-lg flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b bg-muted/50 rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary">
              <MessageCircle className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Assistente Virtual</h3>
              <p className="text-sm text-muted-foreground">Suporte MetaConstrutor</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-hidden">
          <ChatMessageList smooth>
            {messages.map((message) => (
              <ChatBubble
                key={message.id}
                variant={message.sender === "user" ? "sent" : "received"}
              >
                <ChatBubbleAvatar
                  className="h-8 w-8 shrink-0"
                  src={
                    message.sender === "user"
                      ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&q=80&crop=faces&fit=crop"
                      : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&q=80&crop=faces&fit=crop"
                  }
                  fallback={message.sender === "user" ? "US" : "IA"}
                />
                <ChatBubbleMessage
                  variant={message.sender === "user" ? "sent" : "received"}
                >
                  <div className="space-y-1">
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </ChatBubbleMessage>
              </ChatBubble>
            ))}

            {isLoading && (
              <ChatBubble variant="received">
                <ChatBubbleAvatar
                  className="h-8 w-8 shrink-0"
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&q=80&crop=faces&fit=crop"
                  fallback="IA"
                />
                <ChatBubbleMessage isLoading />
              </ChatBubble>
            )}
          </ChatMessageList>
        </div>

        <div className="p-4 border-t bg-muted/25">
          <form
            onSubmit={handleSubmit}
            className="relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring p-1"
          >
            <ChatInput
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua dúvida sobre o sistema..."
              className="min-h-12 resize-none rounded-lg bg-background border-0 p-3 shadow-none focus-visible:ring-0"
            />
            <div className="flex items-center p-3 pt-0 justify-between">
              <div className="flex">
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={handleAttachFile}
                  className="h-8 w-8"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={handleMicrophoneClick}
                  className="h-8 w-8"
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
              <Button 
                type="submit" 
                size="sm" 
                className="ml-auto gap-1.5"
                disabled={!input.trim() || isLoading}
              >
                Enviar
                <CornerDownLeft className="h-3 w-3" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
