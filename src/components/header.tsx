import Link from "next/link";
import { Bell, Bookmark, Bot, Compass, LayoutDashboard, LogIn, ShieldCheck, UsersRound } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";
import { Avatar } from "./avatar";
import { getUnreadNotificationCount } from "@/lib/data";

export async function Header() {
  const user = await getCurrentUser();
  const unreadCount = user ? getUnreadNotificationCount(user.id) : 0;
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand" aria-label="与你油约首页">
          <span className="brand-mark">油</span>
          <span><strong>与你油约</strong><small>校园搭子互助平台</small></span>
        </Link>
        <nav className="main-nav" aria-label="主导航">
          <Link href="/buddies"><UsersRound size={17} />找搭子</Link>
          <Link href="/campus"><Compass size={17} />校园互助</Link>
          <Link href="/assistant"><Bot size={17} />小油助手</Link>
          {user ? <Link href="/dashboard"><LayoutDashboard size={17} />工作台</Link> : null}
          {user?.role === "ADMIN" ? <Link href="/admin"><ShieldCheck size={17} />管理</Link> : null}
        </nav>
        <div className="header-actions">
          {user ? (
            <>
              <Link href="/favorites" className="notification-link" aria-label="我的收藏"><Bookmark size={19} /></Link>
              <Link href="/notifications" className="notification-link" aria-label={`通知${unreadCount ? `，${unreadCount} 条未读` : ""}`}><Bell size={19} />{unreadCount ? <span>{unreadCount > 9 ? "9+" : unreadCount}</span> : null}</Link>
              <Link href="/profile" className="user-chip"><Avatar name={user.nickname} size="sm" /><span>{user.nickname}</span></Link>
              <form action={logoutAction}><button className="text-button" type="submit">退出</button></form>
            </>
          ) : (
            <>
              <Link href="/login" className="button ghost small"><LogIn size={16} />登录</Link>
              <Link href="/register" className="button primary small">立即加入</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
