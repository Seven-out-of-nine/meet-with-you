import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: { default: "与你油约｜校园找搭子与互助平台", template: "%s｜与你油约" },
  description: "发布校园搭子需求、搜索志同道合的伙伴，并完成代购、跑腿、租借、二手和问答等校园互助。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body><Header /><main>{children}</main><Footer /></body>
    </html>
  );
}
