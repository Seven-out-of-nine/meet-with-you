import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div><strong>与你油约</strong><p>让每一次校园同行，都有合适的人。</p></div>
        <div className="footer-links"><Link href="/buddies">找搭子</Link><Link href="/campus">校园互助</Link><Link href="/assistant">智能助手</Link></div>
        <small>本项目为校园互助演示系统，请勿公开敏感联系方式。</small>
      </div>
    </footer>
  );
}
