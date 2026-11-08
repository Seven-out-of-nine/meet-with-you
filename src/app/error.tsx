"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <div className="page-shell"><div className="container narrow"><div className="empty-state standalone"><span className="empty-icon">🛠️</span><h1>页面暂时没有加载成功</h1><p>请稍后重试。如果问题持续存在，请联系管理员。</p><button className="button primary" onClick={reset}>重新加载</button></div></div></div>;
}
