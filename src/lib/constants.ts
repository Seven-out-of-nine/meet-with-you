import type { HubModule } from "./types";

export const BUDDY_CATEGORIES = [
  { value: "学习", icon: "📚", description: "自习、课程与技能共学" },
  { value: "备考", icon: "📝", description: "四六级、考研、考公" },
  { value: "运动", icon: "🏃", description: "跑步、球类与健身" },
  { value: "游戏", icon: "🎮", description: "开黑、桌游与电竞" },
  { value: "旅行", icon: "🧭", description: "周边游与假期出行" },
  { value: "干饭", icon: "🍜", description: "食堂、探店与聚餐" },
  { value: "其他", icon: "✨", description: "兴趣活动与校园生活" },
] as const;

export const HUB_MODULES: Array<{ value: HubModule; label: string; icon: string; description: string; action: string }> = [
  { value: "PURCHASE", label: "校园代购", icon: "🛍️", description: "发布代买需求、接单和更新进度", action: "帮 TA 代购" },
  { value: "SECOND_HAND", label: "二手交易", icon: "♻️", description: "发布闲置、筛选并联系卖家", action: "我感兴趣" },
  { value: "ERRAND", label: "跑腿代取", icon: "📦", description: "快递代取、送达与服务评价", action: "接下任务" },
  { value: "RENTAL", label: "物品租借", icon: "🔁", description: "出租、求租与归还管理", action: "申请租借" },
  { value: "COURSE_SWAP", label: "课程互换", icon: "🔄", description: "发布换课需求并寻找匹配", action: "申请换课" },
  { value: "QUESTION", label: "校园问答", icon: "💬", description: "提问、回答与经验共享", action: "我来回答" },
];

export const BUDDY_STATUS_LABELS = { OPEN: "招募中", MATCHED: "已组队", CLOSED: "已关闭" } as const;
export const APPLICATION_STATUS_LABELS = { PENDING: "待审核", ACCEPTED: "已同意", REJECTED: "已拒绝", EXPIRED: "已过期", CLEARED: "已清除" } as const;
export const HUB_STATUS_LABELS = { OPEN: "进行中", IN_PROGRESS: "已接单", COMPLETED: "已完成", CANCELLED: "已取消", CLOSED: "已关闭" } as const;

export function getHubModule(module: string) {
  return HUB_MODULES.find((item) => item.value === module) ?? HUB_MODULES[0];
}

export function getBuddyCategory(category: string) {
  return BUDDY_CATEGORIES.find((item) => item.value === category) ?? BUDDY_CATEGORIES.at(-1)!;
}
