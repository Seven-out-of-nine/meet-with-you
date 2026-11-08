import Link from "next/link";

export default function NotFound() {
  return <div className="page-shell"><div className="container narrow"><div className="empty-state standalone"><span className="empty-icon">🧭</span><h1>没有找到这个页面</h1><p>内容可能已被删除、关闭，或者链接写错了。</p><Link className="button primary" href="/">返回首页</Link></div></div></div>;
}
