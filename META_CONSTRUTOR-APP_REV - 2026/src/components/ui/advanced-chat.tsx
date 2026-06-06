"use client";

import { useState, FormEvent } from "react";
import { CornerDownLeft, X, MessageCircle } from "lucide-react";
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
  sender: "user" | "support";
  timestamp: Date;
}

interface AdvancedChatProps {
  onClose: () => void;
}

const getHelpResponse = (userMessage: string): string => {
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes("obra") || lowerMessage.includes("projeto")) {
    return "Para criar uma obra, acesse /app/obras e use Nova Obra. Se voce precisa corrigir uma obra existente, abra a obra e revise os dados cadastrais.";
  }

  if (lowerMessage.includes("rdo") || lowerMessage.includes("relatorio")) {
    return "Os RDOs ficam em /app/rdo. Para gerar PDF ou enviar por e-mail, abra um RDO aprovado em /app/rdo e use as acoes disponiveis na tela.";
  }

  if (lowerMessage.includes("equipe") || lowerMessage.includes("funcionario") || lowerMessage.includes("colaborador")) {
    return "Colaboradores e equipes ficam em /app/equipes. Cadastre membros antes de usa-los em RDOs, atividades e permissoes.";
  }

  if (lowerMessage.includes("senha") || lowerMessage.includes("login") || lowerMessage.includes("acesso")) {
    return "Para trocar senha, acesse Perfil e use Seguranca da Conta. Para recuperar acesso, use /recuperar-senha.";
  }

  if (lowerMessage.includes("plano") || lowerMessage.includes("pagamento") || lowerMessage.includes("assinatura")) {
    return "Planos e cobranca ficam em /app/planos. Novas assinaturas seguem pelo checkout seguro e assinaturas ativas sao gerenciadas pelo portal de cobranca.";
  }

  return "Esta ajuda responde duvidas frequentes do app. Para atendimento especifico, use /contato ou envie sua pergunta com mais contexto.";
};

export function AdvancedChat({ onClose }: AdvancedChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: "Ajuda rapida do Meta Construtor. Digite uma duvida sobre obras, RDO, equipes, acesso ou planos.",
      sender: "support",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const question = input.trim();
    if (!question) return;

    setMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        content: question,
        sender: "user",
        timestamp: new Date(),
      },
      {
        id: prev.length + 2,
        content: getHelpResponse(question),
        sender: "support",
        timestamp: new Date(),
      },
    ]);
    setInput("");
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
              <h3 className="font-semibold text-foreground">Ajuda rapida</h3>
              <p className="text-sm text-muted-foreground">FAQ Meta Construtor</p>
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
                  fallback={message.sender === "user" ? "US" : "FAQ"}
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
              placeholder="Digite sua duvida sobre o sistema..."
              className="min-h-12 resize-none rounded-lg bg-background border-0 p-3 shadow-none focus-visible:ring-0"
            />
            <div className="flex items-center p-3 pt-0 justify-end">
              <Button
                type="submit"
                size="sm"
                className="ml-auto gap-1.5"
                disabled={!input.trim()}
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
