"use client";

import { useState } from "react";
import Link from "next/link";
import { Bot, LoaderCircle, Send, Sparkles } from "lucide-react";

type Result = { answer: string; suggestions: Array<{ title: string; href: string; type: string }> };

export function AssistantChat() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const ask = async (value?: string) => {
    const query = (value ?? question).trim();
    if (!query) return;
    setQuestion(query);
    setLoading(true);
    try {
      const response = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: query }) });
      setResult(await response.json() as Result);
    } finally { setLoading(false); }
  };
  const prompts = ["想找考研搭子", "哪里有跑腿代取", "怎么发布二手物品", "组队后怎么联系对方"];
  return <div className="assistant-shell"><div className="assistant-welcome"><span className="assistant-avatar"><Bot /></span><div><span className="eyebrow"><Sparkles size={14} />基于平台数据的校园助手</span><h1>你好，我是小油。</h1><p>我可以帮你检索搭子和互助信息，也能解释平台操作流程。当前版本使用本地检索，不会把问题发送给第三方模型。</p></div></div><div className="prompt-chips">{prompts.map((prompt) => <button key={prompt} onClick={() => void ask(prompt)}>{prompt}</button>)}</div><form className="assistant-input" onSubmit={(event) => { event.preventDefault(); void ask(); }}><textarea value={question} onChange={(event) => setQuestion(event.target.value)} rows={3} maxLength={300} placeholder="例如：帮我找周末一起打羽毛球的搭子" /><button className="button primary" disabled={loading} type="submit">{loading ? <LoaderCircle className="spin" /> : <Send />}发送</button></form>{result ? <div className="assistant-answer"><div className="answer-head"><span className="assistant-avatar small"><Bot /></span><strong>小油的回答</strong></div><p>{result.answer}</p>{result.suggestions.length ? <div className="suggestion-list">{result.suggestions.map((item) => <Link href={item.href} key={item.href}><span>{item.type}</span><strong>{item.title}</strong></Link>)}</div> : null}</div> : null}</div>;
}
