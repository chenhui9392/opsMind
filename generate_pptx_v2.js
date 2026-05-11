const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const C = {
  navy: "1B2A4A", deepBlue: "065A82", teal: "1C7293", mint: "02C39A",
  lightBg: "F0F4F8", white: "FFFFFF", darkText: "1E293B", mutedText: "64748B",
  cardBg: "FFFFFF", lightMint: "E6FAF5", lightBlue: "E0F0FA", sectionBg: "0A1628",
  codeBg: "1E293B", codeText: "E2E8F0", codeKeyword: "7DD3FC",
  codeString: "86EFAC", codeComment: "94A3B8", codeProp: "C4B5FD",
  orange: "F59E0B", red: "EF4444", green: "10B981",
};
const FONT = "微软雅黑";
const TOTAL = 30;

function mkShadow() { return { type: "outer", blur: 6, offset: 2, angle: 135, color: "000000", opacity: 0.1 }; }
function addTopBar(s) { s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.deepBlue } }); }
function addAccent(s, x, y, w) { s.addShape(pres.shapes.RECTANGLE, { x, y, w: w || 1.0, h: 0.04, fill: { color: C.mint } }); }
function addPageNum(s, n) { s.addText(`${n} / ${TOTAL}`, { x: 8.5, y: 5.3, w: 1.2, h: 0.25, fontSize: 8, fontFace: FONT, color: C.mutedText, align: "right", margin: 0 }); }
function addSection(s, t) { s.addText(t, { x: 0.6, y: 5.3, w: 4, h: 0.25, fontSize: 8, fontFace: FONT, color: C.mint, bold: true, margin: 0 }); }
function addCard(s, x, y, w, h, o = {}) {
  s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: o.bg || C.cardBg }, shadow: mkShadow() });
  if (o.accentLeft) s.addShape(pres.shapes.RECTANGLE, { x, y, w: 0.06, h, fill: { color: o.accentLeft } });
  if (o.accentTop) s.addShape(pres.shapes.RECTANGLE, { x, y, w, h: 0.04, fill: { color: o.accentTop } });
}
function addNumCircle(s, x, y, n, c) {
  s.addShape(pres.shapes.OVAL, { x, y, w: 0.38, h: 0.38, fill: { color: c || C.mint } });
  s.addText(String(n), { x, y, w: 0.38, h: 0.38, fontSize: 13, fontFace: FONT, color: C.white, bold: true, align: "center", valign: "middle", margin: 0 });
}
function addIcon(s, data, x, y, sz) { s.addImage({ data, x, y, w: sz || 0.4, h: sz || 0.4 }); }

async function iconToBase64Png(IconComponent, color, size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(IconComponent, { color, size: String(size) }));
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + pngBuffer.toString("base64");
}

const imgPlayground = "image/jpeg;base64," + fs.readFileSync(path.join(__dirname, "1778235157565.jpg")).toString("base64");
const img13 = "image/png;base64," + fs.readFileSync(path.join(__dirname, "pptx_extracted", "ppt", "media", "image19.png")).toString("base64");
const img14a = "image/png;base64," + fs.readFileSync(path.join(__dirname, "pptx_extracted", "ppt", "media", "image20.png")).toString("base64");
const img14b = "image/png;base64," + fs.readFileSync(path.join(__dirname, "pptx_extracted", "ppt", "media", "image21.png")).toString("base64");

async function main() {
  const fa = require("react-icons/fa");
  const icons = {};
  const iconDefs = [
    ["robot", fa.FaRobot, C.mint], ["cubes", fa.FaCubes, C.mint], ["rocket", fa.FaRocket, C.mint],
    ["star", fa.FaStar, C.mint], ["brain", fa.FaBrain, C.deepBlue], ["code", fa.FaCode, C.mint],
    ["desktop", fa.FaDesktop, C.deepBlue], ["lightbulb", fa.FaLightbulb, C.mint], ["shield", fa.FaShieldAlt, C.deepBlue],
    ["cog", fa.FaCog, C.deepBlue], ["globe", fa.FaGlobe, C.teal], ["puzzle", fa.FaPuzzlePiece, C.mint],
    ["exchange", fa.FaExchangeAlt, C.teal], ["eye", fa.FaEye, C.deepBlue], ["check", fa.FaCheck, C.mint],
    ["arrow", fa.FaArrowRight, C.mint], ["users", fa.FaUsers, C.deepBlue], ["magic", fa.FaMagic, C.mint],
    ["database", fa.FaDatabase, C.teal], ["comments", fa.FaComments, C.mint], ["terminal", fa.FaTerminal, C.deepBlue],
    ["chart", fa.FaChartLine, C.deepBlue], ["grad", fa.FaGraduationCap, C.deepBlue], ["project", fa.FaProjectDiagram, C.teal],
    ["window", fa.FaWindowRestore, C.teal], ["bell", fa.FaBell, C.teal], ["sync", fa.FaSync, C.teal],
    ["search", fa.FaSearch, C.deepBlue], ["layer", fa.FaLayerGroup, C.deepBlue], ["tools", fa.FaTools, C.deepBlue],
    ["bolt", fa.FaBolt, C.orange], ["balance", fa.FaBalanceScale, C.teal], ["sitemap", fa.FaSitemap, C.deepBlue],
    ["palette", fa.FaPalette, C.teal], ["book", fa.FaBook, C.deepBlue], ["wrench", fa.FaWrench, C.mint],
    ["robotW", fa.FaRobot, "#FFFFFF"], ["cubesW", fa.FaCubes, "#FFFFFF"], ["rocketW", fa.FaRocket, "#FFFFFF"],
    ["starW", fa.FaStar, "#FFFFFF"], ["brainW", fa.FaBrain, "#FFFFFF"], ["boltW", fa.FaBolt, "#FFFFFF"],
    ["desktopW", fa.FaDesktop, "#FFFFFF"], ["balanceW", fa.FaBalanceScale, "#FFFFFF"],
  ];
  for (const [name, comp, color] of iconDefs) { icons[name] = await iconToBase64Png(comp, color); }

  pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "AIT Center";
  pres.title = "海豚 - 运维智能助手桌面端";

  // ===== S1: Title =====
  let s = pres.addSlide();
  s.background = { color: C.navy };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 2.1, w: 0.15, h: 1.5, fill: { color: C.mint } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 3.85, w: 9.0, h: 0.015, fill: { color: C.teal, transparency: 60 } });
  addIcon(s, icons.robotW, 8.5, 0.4, 0.8);
  s.addText("海豚", { x: 0.5, y: 1.4, w: 9, h: 0.9, fontSize: 44, fontFace: FONT, color: C.white, bold: true, margin: 0 });
  s.addText("运维智能助手桌面端", { x: 0.5, y: 2.2, w: 9, h: 0.6, fontSize: 24, fontFace: FONT, color: C.mint, margin: 0 });
  s.addText("A2UI 驱动的 AI 原生桌面应用开发实践", { x: 0.5, y: 3.0, w: 9, h: 0.5, fontSize: 16, fontFace: FONT, color: "CADCFC", margin: 0 });
  s.addText("AIT 中心技术分享  |  2026", { x: 0.5, y: 4.2, w: 9, h: 0.4, fontSize: 12, fontFace: FONT, color: C.mutedText, margin: 0 });

  // ===== S2: TOC =====
  s = pres.addSlide(); s.background = { color: C.lightBg }; addTopBar(s);
  s.addText("分享内容", { x: 0.6, y: 0.3, w: 5, h: 0.6, fontSize: 28, fontFace: FONT, color: C.darkText, bold: true, margin: 0 });
  addAccent(s, 0.6, 0.85, 0.8);
  const toc = [
    { num: "01", title: "海豚桌面端概述", desc: "项目背景、架构概览、核心功能速览", icon: icons.robot, color: C.deepBlue },
    { num: "02", title: "A2UI 组件系统", desc: "技术架构、核心模块、渲染机制、应用场景", icon: icons.cubes, color: C.mint },
    { num: "03", title: "传统实现 vs A2UI 方案", desc: "对比分析、效率提升、性能优化", icon: icons.balance, color: C.teal },
    { num: "04", title: "AI 技术赋能 A2UI", desc: "智能交互、推荐架构、自动化生成", icon: icons.brain, color: C.deepBlue },
    { num: "05", title: "桌面端 A2UI 从 0 到 1", desc: "需求分析、技术选型、关键突破", icon: icons.desktop, color: C.navy },
    { num: "06", title: "总结与展望", desc: "技术演进与未来思考", icon: icons.star, color: C.deepBlue },
  ];
  toc.forEach((t, i) => {
    const y = 1.1 + i * 0.72;
    addCard(s, 0.6, y, 8.8, 0.62, { accentLeft: t.color });
    addIcon(s, t.icon, 0.9, y + 0.12, 0.35);
    s.addText(t.num, { x: 1.45, y: y + 0.06, w: 0.5, h: 0.25, fontSize: 16, fontFace: FONT, color: t.color, bold: true, margin: 0 });
    s.addText(t.title, { x: 2.0, y: y + 0.06, w: 3.5, h: 0.25, fontSize: 14, fontFace: FONT, color: C.darkText, bold: true, margin: 0 });
    s.addText(t.desc, { x: 2.0, y: y + 0.33, w: 7, h: 0.22, fontSize: 10, fontFace: FONT, color: C.mutedText, margin: 0 });
  });
  addPageNum(s, 2);

  // ===== S3: Section 01 =====
  s = pres.addSlide(); s.background = { color: C.sectionBg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 2.5, w: 0.15, h: 1.2, fill: { color: C.mint } });
  s.addText("01", { x: 0.6, y: 1.5, w: 2, h: 0.7, fontSize: 48, fontFace: FONT, color: C.mint, bold: true, margin: 0, transparency: 30 });
  s.addText("海豚桌面端概述", { x: 1.0, y: 2.5, w: 8, h: 0.7, fontSize: 36, fontFace: FONT, color: C.white, bold: true, margin: 0 });
  s.addText("项目背景、架构概览与核心功能速览", { x: 1.0, y: 3.2, w: 8, h: 0.5, fontSize: 18, fontFace: FONT, color: "CADCFC", margin: 0 });

  // ===== S4: 项目背景与定位 =====
  s = pres.addSlide(); s.background = { color: C.lightBg }; addTopBar(s);
  s.addText("项目背景与定位", { x: 0.6, y: 0.3, w: 8, h: 0.6, fontSize: 28, fontFace: FONT, color: C.darkText, bold: true, margin: 0 });
  addAccent(s, 0.6, 0.85, 0.8); addSection(s, "01  海豚桌面端概述");
  addCard(s, 0.6, 1.1, 4.2, 2.2, { accentTop: C.deepBlue });
  s.addText("运维痛点", { x: 0.9, y: 1.25, w: 3.6, h: 0.35, fontSize: 16, fontFace: FONT, color: C.deepBlue, bold: true, margin: 0 });
  s.addText([
    { text: "大量重复性事务消耗运维人力", options: { breakLine: true, fontSize: 11, fontFace: FONT, color: C.darkText, bullet: true, paraSpaceAfter: 4 } },
    { text: "问题排查依赖经验，知识难以沉淀", options: { breakLine: true, fontSize: 11, fontFace: FONT, color: C.darkText, bullet: true, paraSpaceAfter: 4 } },
    { text: "缺乏统一入口，信息孤岛严重", options: { fontSize: 11, fontFace: FONT, color: C.darkText, bullet: true } },
  ], { x: 0.9, y: 1.7, w: 3.7, h: 1.4, valign: "top", margin: 0 });
  addCard(s, 5.2, 1.1, 4.2, 2.2, { accentTop: C.mint });
  s.addText("海豚定位", { x: 5.5, y: 1.25, w: 3.6, h: 0.35, fontSize: 16, fontFace: FONT, color: C.mint, bold: true, margin: 0 });
  s.addText([
    { text: "面向运维人员的智能桌面助手", options: { breakLine: true, fontSize: 11, fontFace: FONT, color: C.darkText, bullet: true, paraSpaceAfter: 4 } },
    { text: "集成 AI 对话、历史会话、快捷操作", options: { breakLine: true, fontSize: 11, fontFace: FONT, color: C.darkText, bullet: true, paraSpaceAfter: 4 } },
    { text: "A2UI 引擎实现对话即界面", options: { fontSize: 11, fontFace: FONT, color: C.darkText, bullet: true } },
  ], { x: 5.5, y: 1.7, w: 3.7, h: 1.4, valign: "top", margin: 0 });
  addCard(s, 0.6, 3.55, 8.8, 1.3, { accentTop: C.teal });
  s.addText("核心价值", { x: 0.9, y: 3.7, w: 2, h: 0.3, fontSize: 14, fontFace: FONT, color: C.teal, bold: true, margin: 0 });
  const cv = [
    { label: "统一入口", desc: "一个应用覆盖运维全场景" },
    { label: "智能交互", desc: "自然语言驱动，降低使用门槛" },
    { label: "A2UI 赋能", desc: "AI 动态生成界面，零代码扩展" },
    { label: "高效协作", desc: "历史会话全流程线上化" },
  ];
  cv.forEach((v, i) => {
    const xp = 0.9 + i * 2.2;
    s.addShape(pres.shapes.RECTANGLE, { x: xp, y: 4.1, w: 1.9, h: 0.55, fill: { color: C.lightMint } });
    s.addText(v.label, { x: xp + 0.1, y: 4.12, w: 1.7, h: 0.25, fontSize: 12, fontFace: FONT, color: C.teal, bold: true, margin: 0 });
    s.addText(v.desc, { x: xp + 0.1, y: 4.35, w: 1.7, h: 0.25, fontSize: 9, fontFace: FONT, color: C.mutedText, margin: 0 });
  });
  addPageNum(s, 4);

  // ===== S5: 架构概览 =====
  s = pres.addSlide(); s.background = { color: C.lightBg }; addTopBar(s);
  s.addText("整体架构概览", { x: 0.6, y: 0.3, w: 8, h: 0.6, fontSize: 28, fontFace: FONT, color: C.darkText, bold: true, margin: 0 });
  addAccent(s, 0.6, 0.85, 0.8); addSection(s, "01  海豚桌面端概述");
  addCard(s, 0.6, 1.1, 4.2, 1.6, { accentLeft: C.deepBlue });
  s.addText("技术选型", { x: 0.9, y: 1.2, w: 3.6, h: 0.3, fontSize: 15, fontFace: FONT, color: C.deepBlue, bold: true, margin: 0 });
  const ts = [
    { l: "前端框架", v: "Vue 3 + Vite 6" }, { l: "UI 组件库", v: "Element Plus" },
    { l: "桌面端", v: "Electron 41" }, { l: "动态渲染", v: "A2UI Vue Engine" },
  ];
  ts.forEach((t, i) => {
    s.addText(t.l, { x: 0.9, y: 1.6 + i * 0.25, w: 1.2, h: 0.22, fontSize: 10, fontFace: FONT, color: C.mutedText, margin: 0 });
    s.addText(t.v, { x: 2.1, y: 1.6 + i * 0.25, w: 2.5, h: 0.22, fontSize: 11, fontFace: FONT, color: C.deepBlue, bold: true, margin: 0 });
  });
  addCard(s, 5.2, 1.1, 4.2, 1.6, { accentLeft: C.mint });
  s.addText("架构分层", { x: 5.5, y: 1.2, w: 3.6, h: 0.3, fontSize: 15, fontFace: FONT, color: C.mint, bold: true, margin: 0 });
  const layers = [
    { n: "渲染层", d: "Vue 3 + A2UI 动态渲染", c: C.mint },
    { n: "状态层", d: "Pinia 统一状态管理", c: C.teal },
    { n: "服务层", d: "API + WebSocket 实时通信", c: C.deepBlue },
    { n: "进程层", d: "Electron 主进程管理", c: C.navy },
  ];
  layers.forEach((l, i) => {
    s.addShape(pres.shapes.RECTANGLE, { x: 5.5, y: 1.6 + i * 0.25, w: 0.06, h: 0.2, fill: { color: l.c } });
    s.addText(l.n, { x: 5.7, y: 1.58 + i * 0.25, w: 1.0, h: 0.22, fontSize: 10, fontFace: FONT, color: l.c, bold: true, margin: 0 });
    s.addText(l.d, { x: 6.7, y: 1.58 + i * 0.25, w: 2.5, h: 0.22, fontSize: 10, fontFace: FONT, color: C.mutedText, margin: 0 });
  });
  // Core features quick overview
  addCard(s, 0.6, 2.95, 8.8, 2.0, {});
  s.addText("核心功能速览", { x: 0.9, y: 3.05, w: 3, h: 0.3, fontSize: 15, fontFace: FONT, color: C.darkText, bold: true, margin: 0 });
  const feats = [
    { icon: icons.comments, title: "智能聊天", desc: "AI 实时对话\nA2UI 表单嵌入\n虚拟滚动优化", color: C.mint },
    { icon: icons.database, title: "会话管理", desc: "全生命周期管理\n状态实时追踪\n断点续聊", color: C.teal },
    { icon: icons.window, title: "悬浮球与托盘", desc: "置顶悬浮球\n系统托盘集成\n自动更新", color: C.deepBlue },
    { icon: icons.cubes, title: "A2UI 动态渲染", desc: "JSON Schema 驱动\nAI 生成界面\n零代码扩展", color: C.navy },
  ];
  feats.forEach((f, i) => {
    const xp = 0.8 + i * 2.25;
    s.addShape(pres.shapes.RECTANGLE, { x: xp, y: 3.5, w: 2.0, h: 1.25, fill: { color: C.lightBg } });
    addIcon(s, f.icon, xp + 0.15, 3.55, 0.3);
    s.addText(f.title, { x: xp + 0.55, y: 3.55, w: 1.3, h: 0.25, fontSize: 12, fontFace: FONT, color: f.color, bold: true, margin: 0 });
    s.addText(f.desc, { x: xp + 0.15, y: 3.9, w: 1.7, h: 0.75, fontSize: 9, fontFace: FONT, color: C.mutedText, margin: 0 });
  });
  addPageNum(s, 5);

  // ===== S6: Section 02 - A2UI =====
  s = pres.addSlide(); s.background = { color: C.sectionBg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 2.5, w: 0.15, h: 1.2, fill: { color: C.mint } });
  s.addText("02", { x: 0.6, y: 1.5, w: 2, h: 0.7, fontSize: 48, fontFace: FONT, color: C.mint, bold: true, margin: 0, transparency: 30 });
  s.addText("A2UI 组件系统", { x: 1.0, y: 2.5, w: 8, h: 0.7, fontSize: 36, fontFace: FONT, color: C.white, bold: true, margin: 0 });
  s.addText("JSON Schema 驱动的 AI 原生 UI 渲染引擎", { x: 1.0, y: 3.2, w: 8, h: 0.5, fontSize: 18, fontFace: FONT, color: "CADCFC", margin: 0 });
  addIcon(s, icons.cubesW, 8.5, 1.0, 1.0);

  // ===== S7: A2UI 技术架构总览 =====
  s = pres.addSlide(); s.background = { color: C.lightBg }; addTopBar(s);
  s.addText("A2UI 技术架构总览", { x: 0.6, y: 0.3, w: 8, h: 0.6, fontSize: 28, fontFace: FONT, color: C.darkText, bold: true, margin: 0 });
  addAccent(s, 0.6, 0.85, 0.8); addSection(s, "02  A2UI 组件系统");
  // Architecture flow
  const archItems = [
    { name: "应用层", desc: "Vue 应用通过 A2UIRoot\n组件渲染 JSON Schema", color: C.mint, icon: icons.layer },
    { name: "A2UIRoot", desc: "接收 JSON 消息\n管理 State / Context / Events", color: C.teal, icon: icons.sitemap },
    { name: "消息处理器", desc: "处理 JSONL 流\n扁平格式 → 树形结构", color: C.deepBlue, icon: icons.exchange },
    { name: "渲染器", desc: "树形结构 → Vue VNodes\n数据绑定 + 动作执行", color: C.navy, icon: icons.palette },
  ];
  archItems.forEach((a, i) => {
    const xp = 0.5 + i * 2.3;
    addCard(s, xp, 1.1, 2.1, 2.3, { accentTop: a.color });
    addIcon(s, a.icon, xp + 0.15, 1.3, 0.35);
    s.addText(a.name, { x: xp + 0.6, y: 1.3, w: 1.3, h: 0.3, fontSize: 14, fontFace: FONT, color: a.color, bold: true, margin: 0 });
    s.addText(a.desc, { x: xp + 0.15, y: 1.75, w: 1.8, h: 1.0, fontSize: 10, fontFace: FONT, color: C.darkText, margin: 0 });
    if (i < 3) { s.addShape(pres.shapes.RECTANGLE, { x: xp + 2.1, y: 2.1, w: 0.2, h: 0.04, fill: { color: C.mint } }); }
  });
  // Data flow
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 3.6, w: 8.8, h: 0.5, fill: { color: C.lightBlue } });
  s.addText("数据流", { x: 0.9, y: 3.65, w: 1.0, h: 0.35, fontSize: 12, fontFace: FONT, color: C.deepBlue, bold: true, margin: 0 });
  const flowSteps = ["JSON Schema", "A2UIRoot", "MessageProcessor", "Renderer", "Vue VNodes"];
  flowSteps.forEach((st, i) => {
    const xp = 1.9 + i * 1.5;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: xp, y: 3.68, w: 1.2, h: 0.3, fill: { color: i === 0 ? C.mint : i === 4 ? C.navy : C.teal }, rectRadius: 0.05 });
    s.addText(st, { x: xp, y: 3.68, w: 1.2, h: 0.3, fontSize: 8, fontFace: FONT, color: C.white, bold: true, align: "center", valign: "middle", margin: 0 });
    if (i < 4) s.addText("→", { x: xp + 1.2, y: 3.68, w: 0.3, h: 0.3, fontSize: 10, fontFace: FONT, color: C.mint, bold: true, align: "center", valign: "middle", margin: 0 });
  });
  // Component interaction
  addCard(s, 0.6, 4.3, 8.8, 0.9, { accentLeft: C.teal });
  s.addText("组件交互关系", { x: 0.9, y: 4.35, w: 2, h: 0.25, fontSize: 12, fontFace: FONT, color: C.teal, bold: true, margin: 0 });
  s.addText("A2UIRoot 作为核心枢纽：接收外部 JSON 消息 → 通过 MessageProcessor 解析为树形结构 → Renderer 将节点映射为 Vue 组件 → 通过 Context 共享状态 → 通过 Events 向上层反馈用户操作", { x: 0.9, y: 4.65, w: 8.2, h: 0.45, fontSize: 10, fontFace: FONT, color: C.darkText, margin: 0 });
  addPageNum(s, 7);

  // ===== S8: A2UI 核心功能模块详解 =====
  s = pres.addSlide(); s.background = { color: C.lightBg }; addTopBar(s);
  s.addText("A2UI 核心功能模块详解", { x: 0.6, y: 0.3, w: 8, h: 0.6, fontSize: 28, fontFace: FONT, color: C.darkText, bold: true, margin: 0 });
  addAccent(s, 0.6, 0.85, 0.8); addSection(s, "02  A2UI 组件系统");
  const modules = [
    { name: "Schema 解析引擎", desc: "JSONL 流式解析\n扁平→树形结构转换\n增量更新支持", metric: "解析延迟 < 5ms", color: C.mint, icon: icons.code },
    { name: "动态渲染器", desc: "Schema → Vue VNodes\n组件按需加载\n热更新无需刷新", metric: "首屏渲染 < 50ms", color: C.teal, icon: icons.palette },
    { name: "状态管理器", desc: "Context 共享机制\n双向数据绑定\n表单数据自动提取", metric: "状态同步 < 10ms", color: C.deepBlue, icon: icons.database },
    { name: "事件系统", desc: "Action 事件分发\n跨组件通信\n异步操作支持", metric: "事件响应 < 3ms", color: C.navy, icon: icons.bolt },
    { name: "组件库", desc: "布局: Card/Row/Column\n表单: TextField/Select\n操作: Button/Link", metric: "30+ 基础组件", color: C.mint, icon: icons.puzzle },
    { name: "Playground", desc: "实时 Schema 编辑\n所见即所得预览\n调试工具集成", metric: "在线即用", color: C.teal, icon: icons.eye },
  ];
  modules.forEach((m, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const xp = 0.5 + col * 3.0, yp = 1.1 + row * 2.15;
    addCard(s, xp, yp, 2.7, 1.95, { accentTop: m.color });
    addIcon(s, m.icon, xp + 0.15, yp + 0.15, 0.3);
    s.addText(m.name, { x: xp + 0.55, y: yp + 0.15, w: 1.9, h: 0.25, fontSize: 13, fontFace: FONT, color: m.color, bold: true, margin: 0 });
    s.addText(m.desc, { x: xp + 0.15, y: yp + 0.5, w: 2.4, h: 0.85, fontSize: 10, fontFace: FONT, color: C.darkText, margin: 0 });
    s.addShape(pres.shapes.RECTANGLE, { x: xp + 0.15, y: yp + 1.45, w: 2.4, h: 0.35, fill: { color: C.lightMint } });
    s.addText(m.metric, { x: xp + 0.15, y: yp + 1.45, w: 2.4, h: 0.35, fontSize: 10, fontFace: FONT, color: C.mint, bold: true, align: "center", valign: "middle", margin: 0 });
  });
  addPageNum(s, 8);

  // ===== S9: JSON Schema 渲染机制 (优化版) =====
  s = pres.addSlide(); s.background = { color: C.lightBg }; addTopBar(s);
  s.addText("JSON Schema 驱动的 UI 渲染机制", { x: 0.6, y: 0.3, w: 8, h: 0.6, fontSize: 26, fontFace: FONT, color: C.darkText, bold: true, margin: 0 });
  addAccent(s, 0.6, 0.85, 0.8); addSection(s, "02  A2UI 组件系统");
  // Left: Render flow
  addCard(s, 0.6, 1.1, 4.2, 1.5, { accentTop: C.deepBlue });
  s.addText("渲染流程", { x: 0.9, y: 1.2, w: 3.6, h: 0.3, fontSize: 14, fontFace: FONT, color: C.deepBlue, bold: true, margin: 0 });
  const rf = ["AI 输出 JSON Schema", "A2UIRoot 解析为树形结构", "Renderer 映射 Vue VNodes", "用户交互 → Action 事件"];
  rf.forEach((r, i) => {
    addNumCircle(s, 0.9, 1.6 + i * 0.3, i + 1, C.deepBlue);
    s.addText(r, { x: 1.4, y: 1.58 + i * 0.3, w: 3.2, h: 0.25, fontSize: 10, fontFace: FONT, color: C.darkText, margin: 0 });
  });
  // Right: Component types
  addCard(s, 5.2, 1.1, 4.2, 1.5, { accentTop: C.mint });
  s.addText("组件类型", { x: 5.5, y: 1.2, w: 3.6, h: 0.3, fontSize: 14, fontFace: FONT, color: C.mint, bold: true, margin: 0 });
  const ct = [
    { cat: "布局", items: "Card / Column / Row" },
    { cat: "表单", items: "TextField / SelectField / ChoicePicker / DateTimeInput" },
    { cat: "操作", items: "Button 触发 action 事件" },
  ];
  ct.forEach((c, i) => {
    s.addShape(pres.shapes.RECTANGLE, { x: 5.5, y: 1.6 + i * 0.3, w: 0.7, h: 0.22, fill: { color: C.mint, transparency: 80 } });
    s.addText(c.cat, { x: 5.5, y: 1.6 + i * 0.3, w: 0.7, h: 0.22, fontSize: 9, fontFace: FONT, color: C.mint, bold: true, align: "center", valign: "middle", margin: 0 });
    s.addText(c.items, { x: 6.3, y: 1.6 + i * 0.3, w: 2.9, h: 0.22, fontSize: 10, fontFace: FONT, color: C.darkText, margin: 0 });
  });
  // Bottom: JSON Schema code (optimized with syntax highlighting)
  addCard(s, 0.6, 2.8, 5.0, 2.4, { accentLeft: C.codeBg });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.66, y: 2.8, w: 4.88, h: 0.35, fill: { color: C.codeBg } });
  s.addText("JSON Schema", { x: 0.9, y: 2.82, w: 2, h: 0.3, fontSize: 11, fontFace: FONT, color: C.mint, bold: true, margin: 0 });
  const codeLines = [
    { text: "// A2UI 表单 Schema 定义", color: C.codeComment },
    { text: "{", color: C.codeText },
    { text: '  "type": "Card",', color: C.codeText, kw: [{ w: "type", c: C.codeKeyword }] },
    { text: '  "props": {', color: C.codeText },
    { text: '    "title": "运维工单"', color: C.codeText, str: true },
    { text: "  },", color: C.codeText },
    { text: '  "children": [', color: C.codeText },
    { text: '    { "type": "TextField",', color: C.codeText },
    { text: '      "props": {', color: C.codeText },
    { text: '        "label": "问题描述",', color: C.codeString, str: true },
    { text: '        "field": "desc"', color: C.codeString, str: true },
    { text: "    }},", color: C.codeText },
    { text: '    { "type": "Button",', color: C.codeText },
    { text: '      "props": { "label": "提交",', color: C.codeString, str: true },
    { text: '        "action": "submit" }}', color: C.codeString, str: true },
    { text: "  ]", color: C.codeText },
    { text: "}", color: C.codeText },
  ];
  const codeText = codeLines.map(l => l.text).join("\n");
  s.addText(codeText, { x: 0.8, y: 3.2, w: 4.5, h: 1.9, fontSize: 9, fontFace: "Consolas", color: C.codeText, margin: 0, valign: "top" });
  // Right: Schema→UI mapping
  addCard(s, 5.6, 2.8, 3.8, 2.4, { accentLeft: C.mint });
  s.addText("Schema → UI 对应关系", { x: 6.1, y: 2.9, w: 3.4, h: 0.3, fontSize: 12, fontFace: FONT, color: C.mint, bold: true, margin: 0 });
  const mappings = [
    { schema: '"type": "Card"', ui: "卡片容器组件", color: C.mint },
    { schema: '"type": "TextField"', ui: "文本输入框", color: C.teal },
    { schema: '"type": "Button"', ui: "操作按钮", color: C.deepBlue },
    { schema: '"props.title"', ui: "卡片标题栏", color: C.mint },
    { schema: '"props.field"', ui: "数据绑定字段", color: C.teal },
    { schema: '"props.action"', ui: "点击事件处理", color: C.deepBlue },
  ];
  mappings.forEach((m, i) => {
    const yp = 3.3 + i * 0.3;
    s.addShape(pres.shapes.RECTANGLE, { x: 6.1, y: yp, w: 1.6, h: 0.22, fill: { color: C.lightBlue } });
    s.addText(m.schema, { x: 6.1, y: yp, w: 1.6, h: 0.22, fontSize: 8, fontFace: "Consolas", color: C.deepBlue, margin: 0, valign: "middle" });
    s.addText("→", { x: 7.75, y: yp, w: 0.25, h: 0.22, fontSize: 10, fontFace: FONT, color: C.mint, bold: true, margin: 0, align: "center", valign: "middle" });
    s.addText(m.ui, { x: 8.05, y: yp, w: 1.5, h: 0.22, fontSize: 9, fontFace: FONT, color: C.darkText, margin: 0, valign: "middle" });
  });
  addPageNum(s, 9);

  // ===== S10: A2UI Playground 展示 =====
  s = pres.addSlide(); s.background = { color: C.lightBg }; addTopBar(s);
  s.addText("A2UI Playground 实时预览", { x: 0.6, y: 0.3, w: 8, h: 0.6, fontSize: 28, fontFace: FONT, color: C.darkText, bold: true, margin: 0 });
  addAccent(s, 0.6, 0.85, 0.8); addSection(s, "02  A2UI 组件系统");
  // Image
  addCard(s, 0.6, 1.1, 5.8, 3.6, {});
  s.addImage({ data: imgPlayground, x: 0.7, y: 1.2, w: 5.6, h: 3.4, sizing: { type: "contain", w: 5.6, h: 3.4 } });
  // Description
  addCard(s, 6.6, 1.1, 3.2, 3.6, { accentTop: C.mint });
  s.addText("功能说明", { x: 6.9, y: 1.25, w: 2.6, h: 0.3, fontSize: 14, fontFace: FONT, color: C.mint, bold: true, margin: 0 });
  s.addText([
    { text: "功能名称", options: { bold: true, fontSize: 11, fontFace: FONT, color: C.deepBlue, breakLine: true } },
    { text: "A2UI 交互式 Playground", options: { fontSize: 10, fontFace: FONT, color: C.darkText, breakLine: true, paraSpaceAfter: 6 } },
    { text: "操作流程", options: { bold: true, fontSize: 11, fontFace: FONT, color: C.deepBlue, breakLine: true } },
    { text: "1. 在左侧编辑 JSON Schema", options: { fontSize: 10, fontFace: FONT, color: C.darkText, breakLine: true } },
    { text: "2. 右侧实时预览渲染结果", options: { fontSize: 10, fontFace: FONT, color: C.darkText, breakLine: true } },
    { text: "3. 修改即时生效，所见即所得", options: { fontSize: 10, fontFace: FONT, color: C.darkText, breakLine: true, paraSpaceAfter: 6 } },
    { text: "核心技术点", options: { bold: true, fontSize: 11, fontFace: FONT, color: C.deepBlue, breakLine: true } },
    { text: "JSON Schema 实时解析", options: { fontSize: 10, fontFace: FONT, color: C.darkText, breakLine: true, bullet: true } },
    { text: "Vue 组件动态挂载", options: { fontSize: 10, fontFace: FONT, color: C.darkText, breakLine: true, bullet: true } },
    { text: "增量更新渲染引擎", options: { fontSize: 10, fontFace: FONT, color: C.darkText, breakLine: true, bullet: true, paraSpaceAfter: 6 } },
    { text: "应用场景", options: { bold: true, fontSize: 11, fontFace: FONT, color: C.deepBlue, breakLine: true } },
    { text: "开发调试、Schema 验证、组件测试", options: { fontSize: 10, fontFace: FONT, color: C.darkText } },
  ], { x: 6.9, y: 1.6, w: 2.7, h: 2.9, valign: "top", margin: 0 });
  addPageNum(s, 10);

  // ===== S11: A2UI 应用场景案例 =====
  s = pres.addSlide(); s.background = { color: C.lightBg }; addTopBar(s);
  s.addText("A2UI 应用场景案例", { x: 0.6, y: 0.3, w: 8, h: 0.6, fontSize: 28, fontFace: FONT, color: C.darkText, bold: true, margin: 0 });
  addAccent(s, 0.6, 0.85, 0.8); addSection(s, "02  A2UI 组件系统");
  const cases = [
    {
      title: "运维工单处理", color: C.mint, icon: icons.wrench,
      desc: "AI 识别工单类型后，通过珊瑚流输出 JSON Schema，A2UI 实时渲染为工单填写表单",
      data: [
        { label: "表单生成时间", value: "< 1s" },
        { label: "开发效率提升", value: "70%" },
        { label: "用户操作步骤", value: "减少 60%" },
      ],
    },
    {
      title: "故障诊断引导", color: C.teal, icon: icons.search,
      desc: "AI 根据故障现象动态生成诊断步骤表单，引导运维人员逐步排查",
      data: [
        { label: "诊断效率提升", value: "3x" },
        { label: "首次解决率", value: "85%" },
        { label: "平均处理时间", value: "降低 45%" },
      ],
    },
    {
      title: "资源审批流程", color: C.deepBlue, icon: icons.check,
      desc: "AI 解析审批需求，动态生成多级审批表单，支持条件分支和联动",
      data: [
        { label: "审批周期缩短", value: "50%" },
        { label: "表单开发成本", value: "降低 80%" },
        { label: "流程配置灵活度", value: "提升 5x" },
      ],
    },
  ];
  cases.forEach((c, i) => {
    const xp = 0.5 + i * 3.0;
    addCard(s, xp, 1.1, 2.7, 3.9, { accentTop: c.color });
    addIcon(s, c.icon, xp + 0.15, 1.3, 0.35);
    s.addText(c.title, { x: xp + 0.6, y: 1.3, w: 1.9, h: 0.3, fontSize: 15, fontFace: FONT, color: c.color, bold: true, margin: 0 });
    s.addText(c.desc, { x: xp + 0.15, y: 1.75, w: 2.4, h: 1.0, fontSize: 10, fontFace: FONT, color: C.darkText, margin: 0 });
    c.data.forEach((d, j) => {
      const yp = 2.9 + j * 0.6;
      s.addShape(pres.shapes.RECTANGLE, { x: xp + 0.15, y: yp, w: 2.4, h: 0.48, fill: { color: C.lightMint } });
      s.addText(d.value, { x: xp + 0.25, y: yp + 0.02, w: 2.2, h: 0.25, fontSize: 18, fontFace: FONT, color: c.color, bold: true, margin: 0, align: "center" });
      s.addText(d.label, { x: xp + 0.25, y: yp + 0.26, w: 2.2, h: 0.2, fontSize: 9, fontFace: FONT, color: C.mutedText, margin: 0, align: "center" });
    });
  });
  addPageNum(s, 11);

  // ===== S12: Section 03 - 对比分析 =====
  s = pres.addSlide(); s.background = { color: C.sectionBg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 2.5, w: 0.15, h: 1.2, fill: { color: C.mint } });
  s.addText("03", { x: 0.6, y: 1.5, w: 2, h: 0.7, fontSize: 48, fontFace: FONT, color: C.mint, bold: true, margin: 0, transparency: 30 });
  s.addText("传统实现 vs A2UI 方案", { x: 1.0, y: 2.5, w: 8, h: 0.7, fontSize: 36, fontFace: FONT, color: C.white, bold: true, margin: 0 });
  s.addText("对比分析、效率提升与性能优化", { x: 1.0, y: 3.2, w: 8, h: 0.5, fontSize: 18, fontFace: FONT, color: "CADCFC", margin: 0 });
  addIcon(s, icons.balanceW, 8.5, 1.0, 1.0);

  // ===== S13: 传统实现方式 =====
  s = pres.addSlide(); s.background = { color: C.lightBg }; addTopBar(s);
  s.addText("传统实现方式分析", { x: 0.6, y: 0.3, w: 8, h: 0.6, fontSize: 28, fontFace: FONT, color: C.darkText, bold: true, margin: 0 });
  addAccent(s, 0.6, 0.85, 0.8); addSection(s, "03  传统实现 vs A2UI 方案");
  addCard(s, 0.6, 1.1, 4.2, 2.4, { accentTop: C.red });
  s.addText("完整技术流程", { x: 0.9, y: 1.2, w: 3.6, h: 0.3, fontSize: 14, fontFace: FONT, color: C.red, bold: true, margin: 0 });
  s.addText([
    { text: "1. 产品出需求文档 → 设计出交互稿", options: { breakLine: true, fontSize: 10, fontFace: FONT, color: C.darkText, paraSpaceAfter: 3 } },
    { text: "2. 前端编写 Vue 模板 + 样式 + 逻辑", options: { breakLine: true, fontSize: 10, fontFace: FONT, color: C.darkText, paraSpaceAfter: 3 } },
    { text: "3. 后端开发接口 + 数据模型", options: { breakLine: true, fontSize: 10, fontFace: FONT, color: C.darkText, paraSpaceAfter: 3 } },
    { text: "4. 前后端联调 + 测试 + 修复", options: { breakLine: true, fontSize: 10, fontFace: FONT, color: C.darkText, paraSpaceAfter: 3 } },
    { text: "5. 部署上线 + 验证", options: { fontSize: 10, fontFace: FONT, color: C.darkText } },
  ], { x: 0.9, y: 1.6, w: 3.7, h: 1.7, valign: "top", margin: 0 });
  addCard(s, 5.2, 1.1, 4.2, 2.4, { accentTop: C.orange });
  s.addText("技术栈与成本", { x: 5.5, y: 1.2, w: 3.6, h: 0.3, fontSize: 14, fontFace: FONT, color: C.orange, bold: true, margin: 0 });
  const tradCost = [
    { l: "技术栈", v: "Vue + Element Plus + API" },
    { l: "开发周期", v: "2-4 周/功能" },
    { l: "维护成本", v: "高（硬编码表单）" },
    { l: "技术难点", v: "动态表单、状态管理" },
  ];
  tradCost.forEach((t, i) => {
    s.addText(t.l, { x: 5.5, y: 1.6 + i * 0.4, w: 1.3, h: 0.3, fontSize: 10, fontFace: FONT, color: C.orange, bold: true, margin: 0 });
    s.addText(t.v, { x: 6.8, y: 1.6 + i * 0.4, w: 2.3, h: 0.3, fontSize: 10, fontFace: FONT, color: C.darkText, margin: 0 });
  });
  // Pain points
  addCard(s, 0.6, 3.7, 8.8, 1.2, { accentLeft: C.red });
  s.addText("核心痛点", { x: 0.9, y: 3.8, w: 2, h: 0.3, fontSize: 14, fontFace: FONT, color: C.red, bold: true, margin: 0 });
  const pains = [
    { label: "表单硬编码", desc: "每个业务场景需单独开发表单组件" },
    { label: "迭代缓慢", desc: "需求变更需修改代码、重新打包部署" },
    { label: "维护困难", desc: "表单逻辑分散，难以统一管理" },
    { label: "AI 难集成", desc: "静态界面无法承载 AI 动态输出" },
  ];
  pains.forEach((p, i) => {
    const xp = 0.9 + i * 2.2;
    s.addText(p.label, { x: xp, y: 4.15, w: 2.0, h: 0.22, fontSize: 11, fontFace: FONT, color: C.red, bold: true, margin: 0 });
    s.addText(p.desc, { x: xp, y: 4.4, w: 2.0, h: 0.35, fontSize: 9, fontFace: FONT, color: C.mutedText, margin: 0 });
  });
  addPageNum(s, 13);

  // ===== S14: A2UI 集成方案 =====
  s = pres.addSlide(); s.background = { color: C.lightBg }; addTopBar(s);
  s.addText("A2UI 集成方案优势", { x: 0.6, y: 0.3, w: 8, h: 0.6, fontSize: 28, fontFace: FONT, color: C.darkText, bold: true, margin: 0 });
  addAccent(s, 0.6, 0.85, 0.8); addSection(s, "03  传统实现 vs A2UI 方案");
  addCard(s, 0.6, 1.1, 4.2, 2.4, { accentTop: C.mint });
  s.addText("架构改进点", { x: 0.9, y: 1.2, w: 3.6, h: 0.3, fontSize: 14, fontFace: FONT, color: C.mint, bold: true, margin: 0 });
  s.addText([
    { text: "JSON Schema 替代 Vue 模板", options: { breakLine: true, fontSize: 10, fontFace: FONT, color: C.darkText, bullet: true, paraSpaceAfter: 3 } },
    { text: "AI 直接生成界面定义", options: { breakLine: true, fontSize: 10, fontFace: FONT, color: C.darkText, bullet: true, paraSpaceAfter: 3 } },
    { text: "运行时动态渲染，无需打包", options: { breakLine: true, fontSize: 10, fontFace: FONT, color: C.darkText, bullet: true, paraSpaceAfter: 3 } },
    { text: "统一 Schema 标准，集中管理", options: { breakLine: true, fontSize: 10, fontFace: FONT, color: C.darkText, bullet: true, paraSpaceAfter: 3 } },
    { text: "对话即界面，界面即对话", options: { fontSize: 10, fontFace: FONT, color: C.darkText, bullet: true } },
  ], { x: 0.9, y: 1.6, w: 3.7, h: 1.7, valign: "top", margin: 0 });
  addCard(s, 5.2, 1.1, 4.2, 2.4, { accentTop: C.green });
  s.addText("量化提升", { x: 5.5, y: 1.2, w: 3.6, h: 0.3, fontSize: 14, fontFace: FONT, color: C.green, bold: true, margin: 0 });
  const improvements = [
    { l: "开发效率", v: "提升 70%", hl: true },
    { l: "表单开发周期", v: "2-4周 → 1-3天" },
    { l: "首屏渲染", v: "< 50ms" },
    { l: "用户体验", v: "对话式交互" },
  ];
  improvements.forEach((im, i) => {
    const yp = 1.6 + i * 0.45;
    s.addShape(pres.shapes.RECTANGLE, { x: 5.5, y: yp, w: 3.7, h: 0.35, fill: { color: im.hl ? C.lightMint : C.lightBg } });
    s.addText(im.l, { x: 5.6, y: yp, w: 1.5, h: 0.35, fontSize: 10, fontFace: FONT, color: C.mint, bold: true, margin: 0, valign: "middle" });
    s.addText(im.v, { x: 7.1, y: yp, w: 2.0, h: 0.35, fontSize: 11, fontFace: FONT, color: C.darkText, bold: true, margin: 0, valign: "middle" });
  });
  // Comparison table
  addCard(s, 0.6, 3.7, 8.8, 1.3, {});
  s.addText("对比总结", { x: 0.9, y: 3.8, w: 2, h: 0.25, fontSize: 13, fontFace: FONT, color: C.darkText, bold: true, margin: 0 });
  const compTable = [
    ["维度", "传统实现", "A2UI 方案"],
    ["开发方式", "Vue 模板硬编码", "JSON Schema 动态定义"],
    ["开发周期", "2-4 周/功能", "1-3 天/功能"],
    ["AI 集成", "需额外开发", "原生支持"],
    ["维护成本", "高（分散管理）", "低（统一 Schema）"],
  ];
  compTable.forEach((row, ri) => {
    row.forEach((cell, ci) => {
      const xp = 0.9 + ci * 2.8;
      const yp = 4.1 + ri * 0.17;
      s.addText(cell, { x: xp, y: yp, w: 2.6, h: 0.16, fontSize: ri === 0 ? 9 : 8, fontFace: FONT, color: ri === 0 ? C.mint : ci === 2 ? C.mint : C.darkText, bold: ri === 0, margin: 0 });
    });
  });
  addPageNum(s, 14);

  // ===== S15: Section 04 - AI 赋能 =====
  s = pres.addSlide(); s.background = { color: C.sectionBg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 2.5, w: 0.15, h: 1.2, fill: { color: C.mint } });
  s.addText("04", { x: 0.6, y: 1.5, w: 2, h: 0.7, fontSize: 48, fontFace: FONT, color: C.mint, bold: true, margin: 0, transparency: 30 });
  s.addText("AI 技术赋能 A2UI", { x: 1.0, y: 2.5, w: 8, h: 0.7, fontSize: 36, fontFace: FONT, color: C.white, bold: true, margin: 0 });
  s.addText("智能交互、推荐架构与自动化生成", { x: 1.0, y: 3.2, w: 8, h: 0.5, fontSize: 18, fontFace: FONT, color: "CADCFC", margin: 0 });
  addIcon(s, icons.brainW, 8.5, 1.0, 1.0);

  // ===== S16: AI 驱动 UI 交互优化 =====
  s = pres.addSlide(); s.background = { color: C.lightBg }; addTopBar(s);
  s.addText("AI 驱动 UI 交互优化", { x: 0.6, y: 0.3, w: 8, h: 0.6, fontSize: 28, fontFace: FONT, color: C.darkText, bold: true, margin: 0 });
  addAccent(s, 0.6, 0.85, 0.8); addSection(s, "04  AI 技术赋能 A2UI");
  addCard(s, 0.6, 1.1, 4.2, 2.3, { accentTop: C.deepBlue });
  s.addText("应用机制", { x: 0.9, y: 1.2, w: 3.6, h: 0.3, fontSize: 14, fontFace: FONT, color: C.deepBlue, bold: true, margin: 0 });
  s.addText([
    { text: "意图识别：NLU 解析用户自然语言输入", options: { breakLine: true, fontSize: 10, fontFace: FONT, color: C.darkText, bullet: true, paraSpaceAfter: 4 } },
    { text: "Schema 生成：LLM 根据意图输出 JSON Schema", options: { breakLine: true, fontSize: 10, fontFace: FONT, color: C.darkText, bullet: true, paraSpaceAfter: 4 } },
    { text: "实时渲染：A2UI 引擎即时渲染交互界面", options: { breakLine: true, fontSize: 10, fontFace: FONT, color: C.darkText, bullet: true, paraSpaceAfter: 4 } },
    { text: "反馈闭环：用户操作 → 事件 → AI 迭代优化", options: { fontSize: 10, fontFace: FONT, color: C.darkText, bullet: true } },
  ], { x: 0.9, y: 1.6, w: 3.7, h: 1.6, valign: "top", margin: 0 });
  addCard(s, 5.2, 1.1, 4.2, 2.3, { accentTop: C.mint });
  s.addText("算法原理", { x: 5.5, y: 1.2, w: 3.6, h: 0.3, fontSize: 14, fontFace: FONT, color: C.mint, bold: true, margin: 0 });
  s.addText([
    { text: "Prompt Engineering 精准描述 UI 需求", options: { breakLine: true, fontSize: 10, fontFace: FONT, color: C.darkText, bullet: true, paraSpaceAfter: 4 } },
    { text: "Function Calling 约束 Schema 输出格式", options: { breakLine: true, fontSize: 10, fontFace: FONT, color: C.darkText, bullet: true, paraSpaceAfter: 4 } },
    { text: "JSONL 流式传输实现渐进式渲染", options: { breakLine: true, fontSize: 10, fontFace: FONT, color: C.darkText, bullet: true, paraSpaceAfter: 4 } },
    { text: "Schema 校验 + 兜底策略保障稳定性", options: { fontSize: 10, fontFace: FONT, color: C.darkText, bullet: true } },
  ], { x: 5.5, y: 1.6, w: 3.7, h: 1.6, valign: "top", margin: 0 });
  // Performance metrics
  addCard(s, 0.6, 3.6, 8.8, 1.3, {});
  s.addText("性能指标", { x: 0.9, y: 3.7, w: 2, h: 0.25, fontSize: 13, fontFace: FONT, color: C.darkText, bold: true, margin: 0 });
  const perfMetrics = [
    { num: "< 2s", label: "AI Schema 生成" },
    { num: "< 50ms", label: "A2UI 首屏渲染" },
    { num: "95%", label: "Schema 合法率" },
    { num: "3-5x", label: "交互效率提升" },
  ];
  perfMetrics.forEach((m, i) => {
    const xp = 0.9 + i * 2.2;
    s.addText(m.num, { x: xp, y: 4.0, w: 1.8, h: 0.4, fontSize: 20, fontFace: FONT, color: C.deepBlue, bold: true, margin: 0, align: "center" });
    s.addText(m.label, { x: xp, y: 4.4, w: 1.8, h: 0.25, fontSize: 9, fontFace: FONT, color: C.mutedText, margin: 0, align: "center" });
  });
  addPageNum(s, 16);

  // ===== S17: 智能推荐与自动化生成 =====
  s = pres.addSlide(); s.background = { color: C.lightBg }; addTopBar(s);
  s.addText("智能推荐与 UI 自动化生成", { x: 0.6, y: 0.3, w: 8, h: 0.6, fontSize: 26, fontFace: FONT, color: C.darkText, bold: true, margin: 0 });
  addAccent(s, 0.6, 0.85, 0.8); addSection(s, "04  AI 技术赋能 A2UI");
  // Left: Recommendation architecture
  addCard(s, 0.6, 1.1, 4.2, 2.3, { accentTop: C.deepBlue });
  s.addText("智能推荐架构", { x: 0.9, y: 1.2, w: 3.6, h: 0.3, fontSize: 14, fontFace: FONT, color: C.deepBlue, bold: true, margin: 0 });
  const recSteps = [
    { n: "数据收集", d: "用户行为埋点 + 会话记录" },
    { n: "模型训练", d: "基于历史数据训练推荐模型" },
    { n: "推荐策略", d: "场景识别 → Schema 模板匹配" },
    { n: "个性化输出", d: "动态调整表单字段和布局" },
  ];
  recSteps.forEach((r, i) => {
    addNumCircle(s, 0.9, 1.6 + i * 0.4, i + 1, C.deepBlue);
    s.addText(r.n, { x: 1.4, y: 1.58 + i * 0.4, w: 1.2, h: 0.25, fontSize: 10, fontFace: FONT, color: C.deepBlue, bold: true, margin: 0 });
    s.addText(r.d, { x: 2.6, y: 1.58 + i * 0.4, w: 2.0, h: 0.25, fontSize: 9, fontFace: FONT, color: C.mutedText, margin: 0 });
  });
  // Right: Auto generation cases
  addCard(s, 5.2, 1.1, 4.2, 2.3, { accentTop: C.mint });
  s.addText("UI 自动化生成案例", { x: 5.5, y: 1.2, w: 3.6, h: 0.3, fontSize: 14, fontFace: FONT, color: C.mint, bold: true, margin: 0 });
  // Case 1
  s.addShape(pres.shapes.RECTANGLE, { x: 5.5, y: 1.6, w: 3.7, h: 0.75, fill: { color: C.lightMint } });
  s.addText("案例1：服务器巡检表单", { x: 5.7, y: 1.62, w: 3.3, h: 0.22, fontSize: 10, fontFace: FONT, color: C.mint, bold: true, margin: 0 });
  s.addText("AI 输入: \"生成服务器巡检表单\"\n→ 自动生成: 12 字段巡检表 + 提交按钮\n→ 效果: 开发时间从 3 天缩短至 10 分钟", { x: 5.7, y: 1.85, w: 3.3, h: 0.45, fontSize: 9, fontFace: FONT, color: C.darkText, margin: 0 });
  // Case 2
  s.addShape(pres.shapes.RECTANGLE, { x: 5.5, y: 2.45, w: 3.7, h: 0.75, fill: { color: C.lightBlue } });
  s.addText("案例2：告警处理工单", { x: 5.7, y: 2.47, w: 3.3, h: 0.22, fontSize: 10, fontFace: FONT, color: C.deepBlue, bold: true, margin: 0 });
  s.addText("AI 输入: \"创建告警处理工单\"\n→ 自动生成: 告警详情 + 处理步骤 + 闭环表单\n→ 效果: 零代码完成，AI 识别告警类型自动适配", { x: 5.7, y: 2.7, w: 3.3, h: 0.45, fontSize: 9, fontFace: FONT, color: C.darkText, margin: 0 });
  // Business value
  addCard(s, 0.6, 3.6, 8.8, 1.3, {});
  s.addText("AI 赋能业务价值", { x: 0.9, y: 3.7, w: 3, h: 0.25, fontSize: 13, fontFace: FONT, color: C.darkText, bold: true, margin: 0 });
  const bizVal = [
    { num: "80%", label: "表单开发成本降低" },
    { num: "10x", label: "界面交付速度提升" },
    { num: "95%", label: "AI Schema 合法率" },
    { num: "60%", label: "用户操作步骤减少" },
  ];
  bizVal.forEach((b, i) => {
    const xp = 0.9 + i * 2.2;
    s.addText(b.num, { x: xp, y: 4.0, w: 1.8, h: 0.4, fontSize: 20, fontFace: FONT, color: C.mint, bold: true, margin: 0, align: "center" });
    s.addText(b.label, { x: xp, y: 4.4, w: 1.8, h: 0.25, fontSize: 9, fontFace: FONT, color: C.mutedText, margin: 0, align: "center" });
  });
  addPageNum(s, 17);

  // ===== S18: Section 05 - 桌面端 A2UI 从 0 到 1 =====
  s = pres.addSlide(); s.background = { color: C.sectionBg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 2.5, w: 0.15, h: 1.2, fill: { color: C.mint } });
  s.addText("05", { x: 0.6, y: 1.5, w: 2, h: 0.7, fontSize: 48, fontFace: FONT, color: C.mint, bold: true, margin: 0, transparency: 30 });
  s.addText("桌面端 A2UI 从 0 到 1", { x: 1.0, y: 2.5, w: 8, h: 0.7, fontSize: 36, fontFace: FONT, color: C.white, bold: true, margin: 0 });
  s.addText("需求分析、技术选型、关键突破与成果", { x: 1.0, y: 3.2, w: 8, h: 0.5, fontSize: 18, fontFace: FONT, color: "CADCFC", margin: 0 });
  addIcon(s, icons.desktopW, 8.5, 1.0, 1.0);

  // ===== S19: 需求分析与技术选型 =====
  s = pres.addSlide(); s.background = { color: C.lightBg }; addTopBar(s);
  s.addText("需求分析与技术选型", { x: 0.6, y: 0.3, w: 8, h: 0.6, fontSize: 28, fontFace: FONT, color: C.darkText, bold: true, margin: 0 });
  addAccent(s, 0.6, 0.85, 0.8); addSection(s, "05  桌面端 A2UI 从 0 到 1");
  addCard(s, 0.6, 1.1, 4.2, 2.4, { accentTop: C.deepBlue });
  s.addText("需求分析思考", { x: 0.9, y: 1.2, w: 3.6, h: 0.3, fontSize: 14, fontFace: FONT, color: C.deepBlue, bold: true, margin: 0 });
  s.addText([
    { text: "运维人员需要什么样的 AI 助手？", options: { breakLine: true, fontSize: 11, fontFace: FONT, color: C.deepBlue, bold: true, paraSpaceAfter: 3 } },
    { text: "→ 自然语言交互，降低使用门槛", options: { breakLine: true, fontSize: 10, fontFace: FONT, color: C.darkText, paraSpaceAfter: 3 } },
    { text: "如何让 AI 输出可交互的界面？", options: { breakLine: true, fontSize: 11, fontFace: FONT, color: C.deepBlue, bold: true, paraSpaceAfter: 3 } },
    { text: "→ A2UI 引擎，JSON Schema → UI", options: { breakLine: true, fontSize: 10, fontFace: FONT, color: C.darkText, paraSpaceAfter: 3 } },
    { text: "桌面端还是 Web 端？", options: { breakLine: true, fontSize: 11, fontFace: FONT, color: C.deepBlue, bold: true, paraSpaceAfter: 3 } },
    { text: "→ 桌面端：悬浮球、托盘、原生能力", options: { fontSize: 10, fontFace: FONT, color: C.darkText } },
  ], { x: 0.9, y: 1.6, w: 3.7, h: 1.7, valign: "top", margin: 0 });
  addCard(s, 5.2, 1.1, 4.2, 2.4, { accentTop: C.mint });
  s.addText("技术选型依据", { x: 5.5, y: 1.2, w: 3.6, h: 0.3, fontSize: 14, fontFace: FONT, color: C.mint, bold: true, margin: 0 });
  const techChoices = [
    { tech: "Vue 3 + Vite 6", reason: "响应式框架 + 极速构建" },
    { tech: "Electron 41", reason: "跨平台 + 原生能力" },
    { tech: "A2UI Engine", reason: "动态渲染 + AI 集成" },
    { tech: "Pinia", reason: "轻量级状态管理" },
    { tech: "WebSocket", reason: "实时双向通信" },
  ];
  techChoices.forEach((t, i) => {
    s.addText(t.tech, { x: 5.5, y: 1.6 + i * 0.35, w: 1.8, h: 0.28, fontSize: 11, fontFace: FONT, color: C.mint, bold: true, margin: 0 });
    s.addText(t.reason, { x: 7.3, y: 1.6 + i * 0.35, w: 1.9, h: 0.28, fontSize: 10, fontFace: FONT, color: C.mutedText, margin: 0 });
  });
  // Process flow
  addCard(s, 0.6, 3.7, 8.8, 1.2, {});
  s.addText("从需求到方案的完整流程", { x: 0.9, y: 3.8, w: 4, h: 0.25, fontSize: 13, fontFace: FONT, color: C.darkText, bold: true, margin: 0 });
  const procSteps = ["需求理解", "架构设计", "技术选型", "原型开发", "迭代优化", "交付上线"];
  procSteps.forEach((p, i) => {
    const xp = 0.9 + i * 1.45;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: xp, y: 4.15, w: 1.2, h: 0.4, fill: { color: i < 3 ? C.mint : i < 5 ? C.teal : C.deepBlue }, rectRadius: 0.05 });
    s.addText(p, { x: xp, y: 4.15, w: 1.2, h: 0.4, fontSize: 9, fontFace: FONT, color: C.white, bold: true, align: "center", valign: "middle", margin: 0 });
    if (i < 5) s.addText("→", { x: xp + 1.2, y: 4.15, w: 0.25, h: 0.4, fontSize: 10, fontFace: FONT, color: C.mint, bold: true, align: "center", valign: "middle", margin: 0 });
  });
  addPageNum(s, 19);

  // ===== S20: 关键技术突破 =====
  s = pres.addSlide(); s.background = { color: C.lightBg }; addTopBar(s);
  s.addText("关键技术突破与经验教训", { x: 0.6, y: 0.3, w: 8, h: 0.6, fontSize: 26, fontFace: FONT, color: C.darkText, bold: true, margin: 0 });
  addAccent(s, 0.6, 0.85, 0.8); addSection(s, "05  桌面端 A2UI 从 0 到 1");
  const breakthroughs = [
    { num: "01", title: "A2UI 样式隔离", desc: "难点：A2UI 组件样式被全局覆盖\n方案：::v-deep 精确覆盖 + A2UIForm 统一管理", color: C.mint },
    { num: "02", title: "悬浮球窗口管理", desc: "难点：多窗口协调、置顶、拖拽\n方案：独立 BrowserWindow + IPC + 持久化位置", color: C.teal },
    { num: "03", title: "消息数据解析", desc: "难点：后端多种消息格式\n方案：统一 parseMessageContent 混合解析", color: C.deepBlue },
    { num: "04", title: "跨进程通信安全", desc: "难点：Electron 安全策略限制\n方案：preload 白名单 + contextIsolation", color: C.navy },
  ];
  breakthroughs.forEach((b, i) => {
    const yp = 1.1 + i * 0.95;
    addCard(s, 0.6, yp, 8.8, 0.82, { accentLeft: b.color });
    addNumCircle(s, 0.9, yp + 0.2, b.num, b.color);
    s.addText(b.title, { x: 1.5, y: yp + 0.05, w: 7.5, h: 0.28, fontSize: 14, fontFace: FONT, color: C.darkText, bold: true, margin: 0 });
    s.addText(b.desc, { x: 1.5, y: yp + 0.35, w: 7.5, h: 0.42, fontSize: 10, fontFace: FONT, color: C.mutedText, margin: 0 });
  });
  addPageNum(s, 20);

  // ===== S21: 开发周期与成果 =====
  s = pres.addSlide(); s.background = { color: C.lightBg }; addTopBar(s);
  s.addText("开发周期与成果展示", { x: 0.6, y: 0.3, w: 8, h: 0.6, fontSize: 28, fontFace: FONT, color: C.darkText, bold: true, margin: 0 });
  addAccent(s, 0.6, 0.85, 0.8); addSection(s, "05  桌面端 A2UI 从 0 到 1");
  // Timeline
  addCard(s, 0.6, 1.1, 8.8, 1.6, { accentTop: C.deepBlue });
  s.addText("开发周期", { x: 0.9, y: 1.2, w: 3, h: 0.3, fontSize: 14, fontFace: FONT, color: C.deepBlue, bold: true, margin: 0 });
  const timeline = [
    { phase: "第1-2周", task: "架构设计 + A2UI 集成", color: C.mint },
    { phase: "第3-4周", task: "核心功能开发", color: C.teal },
    { phase: "第5-6周", task: "桌面端适配 + 优化", color: C.deepBlue },
    { phase: "第7-8周", task: "测试 + 部署上线", color: C.navy },
  ];
  timeline.forEach((t, i) => {
    const xp = 0.9 + i * 2.15;
    s.addShape(pres.shapes.RECTANGLE, { x: xp, y: 1.6, w: 1.95, h: 0.8, fill: { color: t.color, transparency: 90 } });
    s.addShape(pres.shapes.RECTANGLE, { x: xp, y: 1.6, w: 0.06, h: 0.8, fill: { color: t.color } });
    s.addText(t.phase, { x: xp + 0.15, y: 1.62, w: 1.7, h: 0.25, fontSize: 11, fontFace: FONT, color: t.color, bold: true, margin: 0 });
    s.addText(t.task, { x: xp + 0.15, y: 1.9, w: 1.7, h: 0.4, fontSize: 10, fontFace: FONT, color: C.darkText, margin: 0 });
  });
  // Resource & results
  addCard(s, 0.6, 2.95, 4.2, 2.0, { accentTop: C.mint });
  s.addText("资源投入", { x: 0.9, y: 3.05, w: 3.6, h: 0.3, fontSize: 14, fontFace: FONT, color: C.mint, bold: true, margin: 0 });
  const resources = [
    { l: "开发团队", v: "1 人（AI 辅助）" },
    { l: "开发周期", v: "8 周" },
    { l: "AI 辅助占比", v: "约 60%" },
    { l: "代码行数", v: "~15,000 行" },
  ];
  resources.forEach((r, i) => {
    s.addText(r.l, { x: 0.9, y: 3.45 + i * 0.3, w: 1.5, h: 0.25, fontSize: 10, fontFace: FONT, color: C.mint, bold: true, margin: 0 });
    s.addText(r.v, { x: 2.4, y: 3.45 + i * 0.3, w: 2.2, h: 0.25, fontSize: 10, fontFace: FONT, color: C.darkText, margin: 0 });
  });
  // Screenshots
  addCard(s, 5.2, 2.95, 4.2, 2.0, { accentTop: C.teal });
  s.addText("成果展示", { x: 5.5, y: 3.05, w: 3.6, h: 0.3, fontSize: 14, fontFace: FONT, color: C.teal, bold: true, margin: 0 });
  s.addImage({ data: img13, x: 5.4, y: 3.4, w: 1.9, h: 1.4, sizing: { type: "contain", w: 1.9, h: 1.4 } });
  s.addImage({ data: img14a, x: 7.4, y: 3.4, w: 1.9, h: 1.4, sizing: { type: "contain", w: 1.9, h: 1.4 } });
  addPageNum(s, 21);

  // ===== S22: Section 06 - 总结 =====
  s = pres.addSlide(); s.background = { color: C.sectionBg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 2.5, w: 0.15, h: 1.2, fill: { color: C.mint } });
  s.addText("06", { x: 0.6, y: 1.5, w: 2, h: 0.7, fontSize: 48, fontFace: FONT, color: C.mint, bold: true, margin: 0, transparency: 30 });
  s.addText("总结与展望", { x: 1.0, y: 2.5, w: 8, h: 0.7, fontSize: 36, fontFace: FONT, color: C.white, bold: true, margin: 0 });
  s.addText("技术演进与未来思考", { x: 1.0, y: 3.2, w: 8, h: 0.5, fontSize: 18, fontFace: FONT, color: "CADCFC", margin: 0 });
  addIcon(s, icons.starW, 8.5, 1.0, 1.0);

  // ===== S23: 技术演进与展望 =====
  s = pres.addSlide(); s.background = { color: C.lightBg }; addTopBar(s);
  s.addText("技术演进与未来思考", { x: 0.6, y: 0.3, w: 8, h: 0.6, fontSize: 28, fontFace: FONT, color: C.darkText, bold: true, margin: 0 });
  addAccent(s, 0.6, 0.85, 0.8); addSection(s, "06  总结与展望");
  const outlook = [
    { title: "A2UI 技术演进", color: C.mint, icon: icons.puzzle, items: [
      "AI 原生 UI：AI 直接生成界面，无需人工编码",
      "JSON Schema 成为 AI 应用标准交互方式",
      "组件库持续扩展，覆盖更多业务场景",
    ]},
    { title: "AI 发展方向", color: C.deepBlue, icon: icons.chart, items: [
      "从代码生成走向架构设计辅助",
      "本地大模型 + 云端协同",
      "AI 助手成为操作系统标准配置",
    ]},
    { title: "个人成长", color: C.teal, icon: icons.grad, items: [
      "从代码实现者向架构设计者转变",
      "提升 AI 协作能力，成为超级个体",
      "持续学习，保持行业敏感度",
    ]},
  ];
  outlook.forEach((o, i) => {
    const xp = 0.5 + i * 3.0;
    addCard(s, xp, 1.1, 2.7, 3.7, { accentTop: o.color });
    addIcon(s, o.icon, xp + 0.15, 1.3, 0.35);
    s.addText(o.title, { x: xp + 0.6, y: 1.3, w: 1.9, h: 0.3, fontSize: 14, fontFace: FONT, color: o.color, bold: true, margin: 0 });
    const textItems = o.items.map((it, idx) => ({
      text: it, options: { breakLine: idx < o.items.length - 1, fontSize: 11, fontFace: FONT, color: C.darkText, bullet: true, paraSpaceAfter: 6 }
    }));
    s.addText(textItems, { x: xp + 0.15, y: 1.8, w: 2.4, h: 2.5, valign: "top", margin: 0 });
  });
  addPageNum(s, 23);

  // ===== S24: Thank You =====
  s = pres.addSlide(); s.background = { color: C.navy };
  s.addShape(pres.shapes.RECTANGLE, { x: 4.0, y: 2.8, w: 2.0, h: 0.04, fill: { color: C.mint } });
  s.addText("感谢聆听", { x: 1, y: 1.5, w: 8, h: 1.0, fontSize: 44, fontFace: FONT, color: C.white, bold: true, align: "center", margin: 0 });
  s.addText("Q & A", { x: 1, y: 3.1, w: 8, h: 0.7, fontSize: 28, fontFace: FONT, color: C.mint, bold: true, align: "center", margin: 0 });
  s.addText("AIT Center  |  2026", { x: 1, y: 4.2, w: 8, h: 0.4, fontSize: 12, fontFace: FONT, color: C.mutedText, align: "center", margin: 0 });

  const outputPath = path.join(__dirname, "海豚-技术分享-优化版.pptx");
  await pres.writeFile({ fileName: "d:\\work\\program\\tineco\\desk\\opsmind\\海豚-技术分享-优化版.pptx" });
  console.log("PPT generated: " + outputPath);
}

main().catch(err => { console.error("Error:", err); process.exit(1); });
