"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  User,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type?: "analysis" | "suggestion" | "warning" | "info";
}

interface AIChatProps {
  portfolioContext?: {
    holdings: Array<{ ticker: string; quantity: number; avgCost: number }>;
    totalValue: number;
    todayReturn: number;
    todayReturnPercent: number;
  };
  className?: string;
}

const SUGGESTED_PROMPTS = [
  {
    icon: TrendingUp,
    label: "포트폴리오 분석",
    prompt: "내 포트폴리오를 분석하고 개선점을 알려줘",
  },
  {
    icon: AlertTriangle,
    label: "리스크 평가",
    prompt: "현재 포트폴리오의 리스크를 평가해줘",
  },
  {
    icon: Lightbulb,
    label: "투자 추천",
    prompt: "현재 시장 상황에서 좋은 투자 기회를 알려줘",
  },
  {
    icon: Sparkles,
    label: "섹터 분석",
    prompt: "내 포트폴리오의 섹터 분산 상태를 분석해줘",
  },
];

export function AIChat({ portfolioContext, className }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "안녕하세요! 저는 AI 투자 비서입니다. 포트폴리오 분석, 투자 조언, 시장 동향 등에 대해 물어보세요. 어떻게 도와드릴까요?",
      timestamp: new Date(),
      type: "info",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    // Build context from portfolio
    let contextPrompt = "";
    if (portfolioContext) {
      contextPrompt = `
현재 사용자의 포트폴리오 정보:
- 총 자산: $${portfolioContext.totalValue.toLocaleString()}
- 오늘 수익: $${portfolioContext.todayReturn.toFixed(2)} (${portfolioContext.todayReturnPercent.toFixed(2)}%)
- 보유 종목: ${portfolioContext.holdings
        .map((h) => `${h.ticker}(${h.quantity}주, 평균단가 $${h.avgCost.toFixed(2)})`)
        .join(", ")}

`;
    }

    const systemPrompt = `당신은 전문 투자 어드바이저 AI입니다. 사용자의 포트폴리오를 분석하고 투자 조언을 제공합니다.
- 항상 한국어로 응답하세요
- 구체적이고 실용적인 조언을 제공하세요
- 리스크에 대해 항상 언급하세요
- 투자 결정은 사용자의 몫임을 강조하세요
- 이모지를 적절히 사용하여 가독성을 높이세요

${contextPrompt}`;

    try {
      // Try Ollama first
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3.2",
          prompt: `${systemPrompt}\n\n사용자: ${userMessage}\n\nAI 어드바이저:`,
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: 1024,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsConnected(true);
        return data.response;
      }
      throw new Error("Ollama not available");
    } catch {
      setIsConnected(false);
      // Fallback responses for demo
      return generateFallbackResponse(userMessage, portfolioContext);
    }
  };

  const generateFallbackResponse = (
    userMessage: string,
    context?: AIChatProps["portfolioContext"]
  ): string => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes("분석") || lowerMessage.includes("포트폴리오")) {
      if (context) {
        return `📊 **포트폴리오 분석 결과**

현재 총 자산: **$${context.totalValue.toLocaleString()}**
오늘 수익: **${context.todayReturn >= 0 ? "+" : ""}$${context.todayReturn.toFixed(2)}** (${context.todayReturnPercent >= 0 ? "+" : ""}${context.todayReturnPercent.toFixed(2)}%)

**보유 종목 분석:**
${context.holdings.map((h) => `• ${h.ticker}: ${h.quantity}주 (평균 $${h.avgCost.toFixed(2)})`).join("\n")}

**권장사항:**
1. 📈 기술주 비중이 높은 편이에요. 섹터 분산을 고려해보세요.
2. 💰 현금 비중도 10-15% 유지하는 것을 권장합니다.
3. ⚠️ 개별 종목이 전체의 20% 이상인 경우 리스크 관리가 필요합니다.

*이 분석은 참고용이며, 투자 결정은 신중히 해주세요.*`;
      }
      return "포트폴리오 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.";
    }

    if (lowerMessage.includes("리스크") || lowerMessage.includes("위험")) {
      return `⚠️ **리스크 평가**

**주요 리스크 요소:**
1. **시장 리스크**: 전반적인 시장 하락 시 영향
2. **집중 리스크**: 특정 섹터/종목 편중
3. **변동성 리스크**: 고변동성 종목 보유 시

**리스크 완화 방법:**
• 섹터 분산 투자
• 정기적인 리밸런싱
• 손절매 라인 설정
• 현금 비중 유지

*투자는 원금 손실의 위험이 있습니다.*`;
    }

    if (lowerMessage.includes("추천") || lowerMessage.includes("기회")) {
      return `💡 **현재 시장에서 주목할 만한 섹터**

1. **AI/반도체**: 지속적인 AI 수요 증가
2. **클린에너지**: 정부 정책 지원
3. **헬스케어**: 방어적 섹터로 안정성

**투자 시 고려사항:**
• 분할 매수 전략 권장
• 단기 변동성에 흔들리지 않기
• 기업의 펀더멘털 확인

⚠️ *특정 종목 추천은 아니며, 직접 리서치 후 투자하세요.*`;
    }

    if (lowerMessage.includes("섹터")) {
      return `🥧 **섹터 분석**

이상적인 섹터 배분 예시:
• 기술주: 25-30%
• 금융주: 15-20%
• 헬스케어: 10-15%
• 소비재: 10-15%
• 에너지: 5-10%
• 기타: 10-15%

**현재 트렌드:**
📈 기술/AI 섹터 강세
📉 부동산 섹터 약세
➡️ 방어주 관심 증가

*개인의 투자 성향에 맞게 조정하세요.*`;
    }

    return `안녕하세요! "${userMessage}"에 대해 답변드리겠습니다.

현재 Ollama 연결이 되지 않아 기본 응답을 제공합니다.

**도움받을 수 있는 주제:**
• "포트폴리오 분석해줘"
• "리스크 평가해줘"
• "투자 추천해줘"
• "섹터 분석해줘"

Ollama 설치 후 더 자세한 분석이 가능합니다.
\`ollama run llama3.2\``;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await generateAIResponse(input);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
        type: input.includes("리스크") || input.includes("위험") ? "warning" : "analysis",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "죄송합니다. 응답을 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
          timestamp: new Date(),
          type: "warning",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "안녕하세요! 저는 AI 투자 비서입니다. 새로운 대화를 시작합니다. 어떻게 도와드릴까요?",
        timestamp: new Date(),
        type: "info",
      },
    ]);
  };

  return (
    <div className={cn("card flex flex-col h-[600px]", className)}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-neon-purple/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-neon-purple" />
          </div>
          <div>
            <h3 className="font-medium">AI 투자 비서</h3>
            <p className="text-xs text-foreground-muted flex items-center gap-1">
              {isConnected ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-green" />
                  Ollama 연결됨
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-yellow" />
                  데모 모드
                </>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="p-1.5 rounded-lg hover:bg-background-tertiary transition-colors"
          title="대화 초기화"
        >
          <RefreshCw className="w-4 h-4 text-foreground-muted" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3",
              message.role === "user" ? "flex-row-reverse" : ""
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                message.role === "user"
                  ? "bg-neon-blue/20"
                  : message.type === "warning"
                  ? "bg-neon-yellow/20"
                  : "bg-neon-purple/20"
              )}
            >
              {message.role === "user" ? (
                <User className="w-4 h-4 text-neon-blue" />
              ) : (
                <Bot
                  className={cn(
                    "w-4 h-4",
                    message.type === "warning" ? "text-neon-yellow" : "text-neon-purple"
                  )}
                />
              )}
            </div>
            <div
              className={cn(
                "max-w-[80%] rounded-lg px-4 py-2",
                message.role === "user"
                  ? "bg-neon-blue/10 text-foreground"
                  : "bg-background-tertiary"
              )}
            >
              <div className="text-sm whitespace-pre-wrap">{message.content}</div>
              <span className="text-[10px] text-foreground-muted mt-1 block">
                {message.timestamp.toLocaleTimeString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-neon-purple/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-neon-purple" />
            </div>
            <div className="bg-background-tertiary rounded-lg px-4 py-2">
              <div className="flex items-center gap-2 text-sm text-foreground-muted">
                <Loader2 className="w-4 h-4 animate-spin" />
                분석 중...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      {messages.length <= 1 && (
        <div className="py-2 border-t border-border">
          <p className="text-xs text-foreground-muted mb-2">추천 질문</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((suggestion) => (
              <button
                key={suggestion.label}
                onClick={() => handleSuggestedPrompt(suggestion.prompt)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full bg-background-tertiary hover:bg-neon-purple/10 transition-colors"
              >
                <suggestion.icon className="w-3 h-3" />
                {suggestion.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="pt-4 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="투자에 대해 물어보세요..."
            className="flex-1 bg-background-tertiary rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neon-purple/50"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-neon-purple text-white rounded-lg hover:bg-neon-purple/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
