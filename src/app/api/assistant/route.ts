import { NextResponse } from "next/server";
import { getHubModule } from "@/lib/constants";
import { searchPlatform } from "@/lib/data";

export const runtime = "nodejs";

const guides: Array<[RegExp, string]> = [
  [/发布.*搭子|找搭子.*发布/, "登录后进入“找搭子”，点击“发布搭子需求”，填写类别、时间、地点和期望人数即可。其他同学申请后，你可以在“搭子申请”中同意或拒绝。"],
  [/联系|联系方式/, "为保护隐私，搭子联系方式会在申请通过、组队成功后开放；普通互助在发布者确认响应者后开放。公开页面请不要填写证件号等敏感信息。"],
  [/二手|闲置/, "你可以在“校园互助”选择“二手交易”发布闲置，填写价格、成色和交接地点。建议当面验货后再付款。"],
  [/申请|审核/, "你发出的和收到的搭子申请都在“搭子申请”页面。发布者同意后，系统会生成“我的搭子”记录并发送站内通知。"],
  [/安全|诈骗|转账/, "请优先选择校内公共场所见面，不提前向陌生人转账，不泄露身份证、学生证照片或验证码。遇到异常可在详情页提交举报。"],
];

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { question?: string };
  const question = String(body.question ?? "").trim().slice(0, 300);
  if (!question) return NextResponse.json({ answer: "请告诉我你想找什么，或者描述遇到的问题。", suggestions: [] }, { status: 400 });
  const guide = guides.find(([pattern]) => pattern.test(question))?.[1];
  const keywords = question.replace(/[，。！？、的我想请帮找一下有没有怎么可以]/g, " ").split(/\s+/).filter((item) => item.length >= 2);
  const searchTerm = keywords[0] || question.slice(0, 12);
  const result = searchPlatform(searchTerm);
  const suggestions = [
    ...result.buddies.map((item) => ({ title: item.title, href: `/buddies/${item.id}`, type: `${item.category}搭子` })),
    ...result.hub.map((item) => ({ title: item.title, href: `/campus/${item.id}`, type: getHubModule(item.module).label })),
  ].slice(0, 6);
  let answer = guide || `我在平台中检索了“${searchTerm}”。`;
  if (suggestions.length) answer += ` 找到 ${suggestions.length} 条可能相关的信息，你可以打开下面的卡片进一步查看。`;
  else if (!guide) answer += " 暂时没有直接匹配的公开信息。你可以换一个关键词，或主动发布一条搭子/互助需求。";
  return NextResponse.json({ answer, suggestions });
}
