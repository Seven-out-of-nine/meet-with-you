import { AssistantChat } from "@/components/assistant-chat";

export const metadata = { title: "小油助手" };

export default function AssistantPage() {
  return <div className="page-shell assistant-page"><div className="container narrow"><AssistantChat /></div></div>;
}
