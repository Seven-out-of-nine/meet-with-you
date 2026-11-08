import { getDb, queryOne, run, transaction } from "../src/lib/db";
import { hashPassword } from "../src/lib/password";

const reset = process.argv.includes("--reset");
const db = getDb();

if (reset) {
  db.exec(`
    DELETE FROM content_reports;
    DELETE FROM hub_responses;
    DELETE FROM hub_posts;
    DELETE FROM notifications;
    DELETE FROM buddy_messages;
    DELETE FROM buddy_favorites;
    DELETE FROM buddy_comments;
    DELETE FROM buddy_matches;
    DELETE FROM buddy_applications;
    DELETE FROM buddy_posts;
    DELETE FROM sessions;
    DELETE FROM users;
  `);
}

const existing = queryOne<{ count: number }>("SELECT COUNT(*) AS count FROM users")?.count ?? 0;

if (!existing) {
  transaction(() => {
    const users = [
      ["13900000000", process.env.SEED_ADMIN_PASSWORD || "admin123456", "小油管理员", "平台运营", "ADMIN", "", "", ""] as const,
      ["13800000001", "student123", "林小满", "2024级", "USER", "计算机科学与技术", "东校区", "羽毛球,考研,摄影"] as const,
      ["13800000002", "student123", "陈一川", "2023级", "USER", "新闻传播", "本部", "桌游,旅行,剪辑"] as const,
      ["13800000003", "student123", "周可乐", "2025级", "USER", "经济学", "东校区", "跑步,英语,探店"] as const,
      ["13800000004", "student123", "许知秋", "2024级", "USER", "外国语学院", "本部", "六级,自习,羽毛球"] as const,
    ];
    for (const [phone, password, nickname, grade, role, major, campus, interests] of users) {
      run(
        `INSERT INTO users (phone, password_hash, nickname, grade, role, major, campus, interests, bio, contact)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [phone, hashPassword(password), nickname, grade, role, major, campus, interests, `${nickname}，希望认识认真又有趣的校园伙伴。`, `微信：${nickname}`],
      );
    }

    const lin = queryOne<{ id: number }>("SELECT id FROM users WHERE phone = '13800000001'")!.id;
    const chen = queryOne<{ id: number }>("SELECT id FROM users WHERE phone = '13800000002'")!.id;
    const zhou = queryOne<{ id: number }>("SELECT id FROM users WHERE phone = '13800000003'")!.id;
    const xu = queryOne<{ id: number }>("SELECT id FROM users WHERE phone = '13800000004'")!.id;

    const buddySeeds = [
      [lin, "周末图书馆考研数学打卡", "备考", "准备数一，希望找一到两位作息稳定的同学。周六上午复盘错题，下午各自刷题，晚上互相汇报进度。", 2, "东区图书馆 3F", "每周六 09:00-20:00", "考研,数学,打卡", "datetime('now','-2 day')"],
      [zhou, "晚饭后一起跑 5 公里", "运动", "新手友好，目标是每周稳定跑三次，不追求配速。希望互相提醒、热身拉伸，雨天改为室内体能。", 3, "东校区操场", "周一、三、五 20:00", "跑步,新手,夜跑", "datetime('now','-1 day')"],
      [chen, "周六去老城区拍照探店", "旅行", "想拍一组城市街景，路线已经做好。喜欢摄影或愿意出镜都可以，午饭一起探一家小馆子。", 2, "学校南门集合", "本周六 10:00", "摄影,Citywalk,探店", "datetime('now','-8 hour')"],
      [xu, "六级听力晨间 30 分钟", "学习", "每天早上一起做一套短听力，在线打卡即可。周末集中整理生词和错题，适合想把学习节奏稳定下来的同学。", 4, "线上 + 图书馆", "工作日 07:30", "六级,英语,晨间", "datetime('now','-3 hour')"],
      [chen, "周五晚桌游局还差两人", "游戏", "阿瓦隆和璀璨宝石为主，新手会教。文明游戏，不临时鸽，结束后一起收拾场地。", 2, "大学生活动中心", "周五 19:00", "桌游,阿瓦隆,新手", "datetime('now','-50 minute')"],
    ];
    for (const seed of buddySeeds) {
      const [userId, title, category, description, count, location, time, tags, createdExpr] = seed;
      db.prepare(`INSERT INTO buddy_posts (user_id, title, category, description, expected_count, location, activity_time, contact, tags, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, (SELECT contact FROM users WHERE id = ?), ?, ${createdExpr})`).run(userId, title, category, description, count, location, time, userId, tags);
    }
    const firstPost = queryOne<{ id: number }>("SELECT id FROM buddy_posts WHERE user_id = ? ORDER BY id LIMIT 1", [lin])!.id;
    run("INSERT INTO buddy_applications (post_id, applicant_id, message) VALUES (?, ?, ?)", [firstPost, xu, "我也在准备数一，最近做到高数强化，周六时间稳定，希望一起坚持。"]);
    run("INSERT INTO buddy_comments (post_id, user_id, content) VALUES (?, ?, ?)", [firstPost, chen, "请问需要带电脑吗，还是主要用纸质资料？"]);
    run("INSERT INTO notifications (user_id, type, title, content, href) VALUES (?, 'BUDDY_APPLICATION', '收到新的搭子申请', '许知秋申请加入你的考研数学计划', '/applications')", [lin]);

    const runningPost = queryOne<{ id: number }>("SELECT id FROM buddy_posts WHERE user_id = ? AND category = '运动' LIMIT 1", [zhou])!.id;
    run("INSERT INTO buddy_applications (post_id, applicant_id, message, status, decided_at) VALUES (?, ?, ?, 'ACCEPTED', CURRENT_TIMESTAMP)", [runningPost, lin, "我也想养成稳定夜跑习惯，可以一起热身打卡。"]);
    const match = run("INSERT INTO buddy_matches (post_id, owner_id, partner_id, category) VALUES (?, ?, ?, '运动')", [runningPost, zhou, lin]);
    run("INSERT INTO buddy_messages (match_id, sender_id, content, created_at) VALUES (?, ?, ?, datetime('now','-35 minute'))", [match.lastInsertRowid, zhou, "明晚八点操场东门见怎么样？我会穿蓝色运动外套。"]);
    run("INSERT INTO buddy_messages (match_id, sender_id, content, is_read, created_at) VALUES (?, ?, ?, 1, datetime('now','-30 minute'))", [match.lastInsertRowid, lin, "可以，我提前十分钟到，先一起热身。"]);
    const photoPost = queryOne<{ id: number }>("SELECT id FROM buddy_posts WHERE user_id = ? AND category = '旅行' LIMIT 1", [chen])!.id;
    run("INSERT INTO buddy_favorites (user_id, post_id) VALUES (?, ?)", [lin, photoPost]);
    run("INSERT INTO notifications (user_id, type, title, content, href) VALUES (?, 'BUDDY_MESSAGE', '搭子发来新消息', '周可乐在夜跑计划中给你留言', ?)", [lin, `/matches/${match.lastInsertRowid}`]);

    const hubSeeds = [
      [zhou, "ERRAND", "今晚帮忙代取一个快递", "中通小件，取件码会在确认后发送。希望晚九点前送到 7 号宿舍楼下。", 8, "东区菜鸟驿站", "{}", "datetime('now','-40 minute')"],
      [chen, "SECOND_HAND", "九成新机械键盘，带原盒", "茶轴 87 键，使用不到三个月，无磕碰。支持校内当面试用，满意再付款。", 159, "本部食堂一楼", "{\"itemType\":\"数码设备\"}", "datetime('now','-5 hour')"],
      [xu, "QUESTION", "图书馆研讨室怎么预约？", "想和小组做课程展示，四个人使用。请问在哪里预约、能提前几天？", null, "东区图书馆", "{}", "datetime('now','-1 day')"],
      [lin, "RENTAL", "求租一台拍立得两天", "社团活动拍照使用，周五下午取、周日归还，会妥善保管，可以提供押金。", 30, "东校区", "{\"itemType\":\"摄影设备\",\"expectedTime\":\"本周五至周日\"}", "datetime('now','-10 hour')"],
      [zhou, "PURCHASE", "帮带一杯校外咖啡", "冰美式不加糖，下午两点前送到实验楼大厅。预算包含跑腿费。", 18, "实验楼 A 座", "{\"expectedTime\":\"今天 14:00 前\"}", "datetime('now','-25 minute')"],
      [chen, "COURSE_SWAP", "想把周三大学体育换到周五", "两节课为同一教师同一项目，希望与时间冲突的同学互换，确认后一起联系教务老师。", null, "本部", "{\"courseOut\":\"周三 5-6 节 羽毛球\",\"courseIn\":\"周五 3-4 节 羽毛球\"}", "datetime('now','-6 hour')"],
    ];
    for (const seed of hubSeeds) {
      const [userId, module, title, description, price, location, metadata, createdExpr] = seed;
      db.prepare(`INSERT INTO hub_posts (user_id, module, title, description, price, location, contact, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, (SELECT contact FROM users WHERE id = ?), ?, ${createdExpr})`).run(userId, module, title, description, price, location, userId, metadata);
    }
    const question = queryOne<{ id: number }>("SELECT id FROM hub_posts WHERE module = 'QUESTION' LIMIT 1")!.id;
    run("INSERT INTO hub_responses (post_id, user_id, content, status) VALUES (?, ?, ?, 'ACCEPTED')", [question, lin, "在学校公众号的“智慧图书馆”里预约，可提前 3 天。四人间通常需要至少三人签到，迟到 15 分钟会释放。"]);
  });
  console.log("Seeded demo users, buddy posts, applications, notifications and campus help posts.");
} else {
  console.log("Database already contains users; seed skipped. Run pnpm db:reset to recreate demo data.");
}
