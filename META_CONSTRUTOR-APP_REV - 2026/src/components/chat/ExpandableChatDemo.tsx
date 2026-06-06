"use client"

import { FormEvent, useState } from "react"
import { Bot, CornerDownLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat-bubble"
import { ChatInput } from "@/components/ui/chat-input"
import {
  ExpandableChat,
  ExpandableChatHeader,
  ExpandableChatBody,
  ExpandableChatFooter,
} from "@/components/ui/expandable-chat"
import { ChatMessageList } from "@/components/ui/chat-message-list"

type ChatMessage = {
  id: number
  content: string
  sender: "user" | "support"
}

const contactHelp = `Contato e suporte:
- Email: suporte@metaconstrutor.com
- WhatsApp: (75) 9 9220-5734
- Pagina: /contato`

const quickResponses = [
  {
    keys: ["apresenta", "introducao", "visao geral", "inicio", "home"],
    response: "A pagina inicial apresenta o Meta Construtor, os principais recursos e os caminhos para conhecer planos e funcionalidades. Acesse: /",
  },
  {
    keys: ["sobre", "empresa", "equipe", "time", "quem somos", "missao", "valores"],
    response: "A pagina Sobre reune informacoes institucionais, proposta de valor e contexto da empresa. Acesse: /sobre",
  },
  {
    keys: ["plano", "preco", "precos", "valor", "custo", "assinatura", "mensalidade", "pagar"],
    response: "A pagina de precos mostra os planos disponiveis e o caminho de contratacao. Acesse: /preco",
  },
  {
    keys: ["contato", "falar", "telefone", "whatsapp", "email", "e-mail", "suporte", "ajuda"],
    response: contactHelp,
  },
  {
    keys: ["rdo", "diario"],
    response: "RDOs digitais registram atividades, equipe, equipamentos, clima, ocorrencias, fotos e aprovacao. No app autenticado, acesse o modulo RDO.",
  },
  {
    keys: ["checklist", "lista", "verificacao"],
    response: "Checklists permitem acompanhar itens, evidencias, status, responsavel, assinatura e exportacao/envio do checklist.",
  },
  {
    keys: ["integracao", "integracoes", "gmail", "drive", "webhook"],
    response: "Integracoes conectam eventos do app a canais externos quando o conector estiver configurado. Webhooks personalizados seguem bloqueados por decisao de produto ate existir backend dedicado.",
  },
  {
    keys: ["seguranca", "lgpd", "dados", "privacidade"],
    response: "Os fluxos de seguranca usam autenticacao, permissao por perfil e auditoria. Consulte tambem as paginas legais e a area de seguranca no app autenticado.",
  },
  {
    keys: ["teste", "demo", "experimentar", "gratis", "trial"],
    response: "Para experimentar, veja os planos e o checkout em /preco. Para uma demonstracao acompanhada, use os canais da pagina /contato.",
  },
]

const getSupportResponse = (userMessage: string) => {
  const msg = userMessage.toLowerCase()
  const match = quickResponses.find((item) => item.keys.some((key) => msg.includes(key)))
  return match?.response ?? `Nao encontrei um caminho especifico para essa pergunta.\n\n${contactHelp}`
}

export function ExpandableChatDemo() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      content: "Ola. Esta ajuda rapida direciona voce para as principais paginas do Meta Construtor.\n\nPosso ajudar com apresentacao, sobre nos, precos, contato, RDOs, checklists, integracoes e seguranca.",
      sender: "support",
    },
  ])

  const [input, setInput] = useState("")

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const userMessage = input.trim()
    if (!userMessage) return

    setMessages((current) => [
      ...current,
      {
        id: current.length + 1,
        content: userMessage,
        sender: "user",
      },
      {
        id: current.length + 2,
        content: getSupportResponse(userMessage),
        sender: "support",
      },
    ])
    setInput("")
  }

  return (
    <ExpandableChat
      size="lg"
      position="bottom-right"
      icon={<Bot className="h-6 w-6" />}
    >
      <ExpandableChatHeader className="flex-col text-center justify-center">
        <h2 className="text-xl font-semibold">Ajuda Meta Construtor</h2>
        <p className="text-sm text-muted-foreground">
          Encontre rapidamente canais e paginas de suporte
        </p>
      </ExpandableChatHeader>

      <ExpandableChatBody>
        <ChatMessageList>
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              variant={message.sender === "user" ? "sent" : "received"}
            >
              <ChatBubbleAvatar
                className="h-8 w-8 shrink-0"
                fallback={message.sender === "user" ? "US" : "MC"}
              />
              <ChatBubbleMessage
                variant={message.sender === "user" ? "sent" : "received"}
              >
                {message.content}
              </ChatBubbleMessage>
            </ChatBubble>
          ))}
        </ChatMessageList>
      </ExpandableChatBody>

      <ExpandableChatFooter>
        <form
          onSubmit={handleSubmit}
          className="relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring p-1"
        >
          <ChatInput
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Digite sua pergunta..."
            className="min-h-12 resize-none rounded-lg bg-background border-0 p-3 shadow-none focus-visible:ring-0"
          />
          <div className="flex items-center p-3 pt-0 justify-end">
            <Button type="submit" size="sm" className="gap-1.5" disabled={!input.trim()}>
              Enviar
              <CornerDownLeft className="size-3.5" />
            </Button>
          </div>
        </form>
      </ExpandableChatFooter>
    </ExpandableChat>
  )
}
