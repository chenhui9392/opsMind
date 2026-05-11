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
  codeBg: "1E293B", codeText: "E2E8F0", orange: "F59E0B", red: "EF4444", green: "10B981",
};
const FONT = "微软雅黑";
const TOTAL = 22;

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
const imgOrder = "image/jpeg;base64," + fs.readFileSync(path.join(__dirname, "1778290869033.jpg")).toString("base64");
const imgNetwork = "image/jpeg;base64," + fs.readFileSync(path.join(__dirname, "1778290904831.jpg")).toString("base64");
const imgDesktop = "image/png;base64," + fs.readFileSync(path.join(__dirname, "海豚-桌面端.png")).toString("base64");
const imgHinton1 = "image/png;base64," + fs.readFileSync(path.join(__dirname, "海豚-辛顿1.png")).toString("base64");
const imgHinton2 = "image/png;base64," + fs.readFileSync(path.join(__dirname, "海豚-辛顿2.png")).toString("base64");

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
    ["starW", fa.FaStar, "#FFFFFF"], ["brainW", fa.FaBrain, "#FFFFFF"], ["desktopW", fa.FaDesktop, "#FFFFFF"],
    ["balanceW", fa.FaBalanceScale, "#FFFFFF"],
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

  // ===== S2: TOC (精简为4项) =====
  s = pres.addSlide(); s.background = { color: C.lightBg }; addTopBar(s);
  s.addText("分享内容", { x: 0.6, y: 0.3, w: 5, h: 0.6, fontSize: 28, fontFace: FONT, color: C.darkText, bold: true, margin: 0 });
  addAccent(s, 0.6, 0.85, 0.8);
  const toc = [
    { num: "01", title: "A2UI 组件系统", desc: "技术架构、核心模块、渲染机制、应用场景", icon: icons.cubes, color: C.mint },
    { num: "02", title: "传统实现 vs A2UI 方案", desc: "对比分析、效率提升、性能优化", icon: icons.balance, color: C.teal },
    { num: "03", title: "桌面端也是从 0 到 1", desc: "AI 辅助下从零开始完成桌面端开发", icon: icons.desktop, color: C.deepBlue },
    { num: "04", title: "总结与展望", desc: "技术演进与未来思考", icon: icons.star, color: C.navy },
  ];
  toc.forEach((t, i) => {
    const y = 1.2 + i * 0.95;
    addCard(s, 0.6, y, 8.8, 0.8, { accentLeft: t.color });
    addIcon(s, t.icon, 0.9, y + 0.18, 0.4);
    s.addText(t.num, { x: 1.5, y: y + 0.1, w: 0.6, h: 0.3, fontSize: 20, fontFace: FONT, color: t.color, bold: true, margin: 0 });
    s.addText(t.title, { x: 2.2, y: y + 0.1, w: 5, h: 0.3, fontSize: 18, fontFace: FONT, color: C.darkText, bold: true, margin: 0 });
    s.addText(t.desc, { x: 2.2, y: y + 0.43, w: 7, h: 0.25, fontSize: 11, fontFace: FONT, color: C.mutedText, margin: 0 });
  });
  addPageNum(s, 2);

  // ===== S3: Section 01 - A2UI =====
  s = pres.addSlide(); s.background = { color: C.sectionBg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 2.5, w: 0.15, h: 1.2, fill: { color: C.mint } });
  s.addText("01", { x: 0.6, y: 1.5, w: 2, h: 0.7, fontSize: 48, fontFace: FONT, color: C.mint, bold: true, margin: 0, transparency: 30 });
  s.addText("A2UI 组件系统", { x: 1.0, y: 2.5, w: 8, h: 0.7, fontSize: 36, fontFace: FONT, color: C.white, bold: true, margin: 0 });
  s.addText("JSON Schema 驱动的 AI 原生 UI 渲染引擎", { x: 1.0, y: 3.2, w: 8, h: 0.5, fontSize: 18, fontFace: FONT, color: "CADCFC", margin: 0 });
  addIcon(s, icons.cubesW, 8.5, 1.0, 1.0);

  // ===== S4: A2UI 技术架构总览 =====
  s = pres.addSlide(); s.background = { color: C.lightBg }; addTopBar(s);
  s.addText("A2UI 技术架构总览", { x: 0.6, y: 0.3, w: 8, h: 0.6, fontSize: 28, fontFace: FONT, color: C.darkText, bold: true, margin: 0 });
  addAccent(s, 0.6, 0.85, 0.8); addSection(s, "01  A2UI 组件系统");
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
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 3.6, w: 8.8, h: 0.5, fill: { color: C.lightBlue } });
  s.addText("数据流", { x: 0.9, y: 3.65, w: 1.0, h: 0.35, fontSize: 12, fontFace: FONT, color: C.deepBlue, bold: true, margin: 0 });
  const flowSteps = ["JSON Schema", "A2UIRoot", "MessageProcessor", "Renderer", "Vue VNodes"];
  flowSteps.forEach((st, i) => {
    const xp = 1.9 + i * 1.5;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: xp, y: 3.68, w: 1.2, h: 0.3, fill: { color: i === 0 ? C.mint : i === 4 ? C.navy : C.teal }, rectRadius: 0.05 });
    s.addText(st, { x: xp, y: 3.68, w: 1.2, h: 0.3, fontSize: 8, fontFace: FONT, color: C.white, bold: true, align: "center", valign: "middle", margin: 0 });
    if (i < 4) s.addText("→", { x: xp + 1.2, y: 3.68, w: 0.3, h: 0.3, fontSize: 10, fontFace: FONT, color: C.mint, bold: true, align: "center", valign: "middle", margin: 0 });
  });
  addCard(s, 0.6, 4.3, 8.8, 0.85, { accentLeft: C.teal });
  s.addText("组件交互关系", { x: 0.9, y: 4.35, w: 2, h: 0.25, fontSize: 12, fontFace: FONT, color: C.teal, bold: true, margin: 0 });
  s.addText("A2UIRoot 作为核心枢纽：接收外部 JSON 消息 → 通过 MessageProcessor 解析为树形结构 → Renderer 将节点映射为 Vue 组件 → 通过 Context 共享状态 → 通过 Events 向上层反馈用户操作", { x: 0.9, y: 4.65, w: 8.2, h: 0.4, fontSize: 10, fontFace: FONT, color: C.darkText, margin: 0 });
  addPageNum(s, 4);

  // ===== S5: A2UI 核心功能模块详解 =====
  s = pres.addSlide(); s.background = { color: C.lightBg }; addTopBar(s);
  s.addText("A2UI 核心功能模块详解", { x: 0.6, y: 0.3, w: 8, h: 0.6, fontSize: 28, fontFace: FONT, color: C.darkText, bold: true, margin: 0 });
  addAccent(s, 0.6, 0.85, 0.8); addSection(s, "01  A2UI 组件系统");
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
  addPageNum(s, 5);

  // ===== S6: JSON Schema 渲染机制 =====
  s = pres.addSlide(); s.background = { color: C.lightBg }; addTopBar(s);
  s.addText("JSON Schema 驱动的 UI 渲染机制", { x: 0.6, y: 0.3, w: 8, h: 0.6, fontSize: 26, fontFace: FONT, color: C.darkText, bold: true, margin: 0 });
  addAccent(s, 0.6, 0.85, 0.8); addSection(s, "01  A2UI 组件系统");
  addCard(s, 0.6, 1.1, 4.2, 1.5, { accentTop: C.deepBlue });
  s.addText("渲染流程", { x: 0.9, y: 1.2, w: 3.6, h: 0.3, fontSize: 14, fontFace: FONT, color: C.deepBlue, bold: true, margin: 0 });
  const rf = ["珊瑚系统输出 JSON Schema", "A2UIRoot 解析为树形结构", "Renderer 映射 Vue VNodes", "用户交互 → Action 事件"];
  rf.forEach((r, i) => {
    addNumCircle(s, 0.9, 1.6 + i * 0.3, i + 1, C.deepBlue);
    s.addText(r, { x: 1.4, y: 1.58 + i * 0.3, w: 3.2, h: 0.25, fontSize: 10, fontFace: FONT, color: C.darkText, margin: 0 });
  });
  addCard(s, 5.2, 1.1, 4.2, 1.5, { accentTop: C.mint });
  s.addText("组件类型", { x: 5.5, y: 1.2, w: 3.6, h: 0.3, fontSize: 14, fontFace: FONT, color: C.mint, bold: true, margin: 0 });
  const ct = [
    { cat: "布局", items: "Card / Column / Row" },
    { cat: "表单", items: "TextField / SelectField / ChoicePicker" },
    { cat: "操作", items: "Button 触发 action 事件" },
  ];
  ct.forEach((c, i) => {
    s.addShape(pres.shapes.RECTANGLE, { x: 5.5, y: 1.6 + i * 0.3, w: 0.7, h: 0.22, fill: { color: C.mint, transparency: 80 } });
    s.addText(c.cat, { x: 5.5, y: 1.6 + i * 0.3, w: 0.7, h: 0.22, fontSize: 9, fontFace: FONT, color: C.mint, bold: true, align: "center", valign: "middle", margin: 0 });
    s.addText(c.items, { x: 6.3, y: 1.6 + i * 0.3, w: 2.9, h: 0.22, fontSize: 10, fontFace: FONT, color: C.darkText, margin: 0 });
  });
  addCard(s, 0.6, 2.8, 5.0, 2.4, { accentLeft: C.codeBg });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.66, y: 2.8, w: 4.88, h: 0.35, fill: { color: C.codeBg } });
  s.addText("JSON Schema", { x: 0.9, y: 2.82, w: 2, h: 0.3, fontSize: 11, fontFace: FONT, color: C.mint, bold: true, margin: 0 });
  const codeText = [
    "// A2UI 表单 Schema 定义",
    "{",
    '  "type": "Card",',
    '  "props": {',
    '    "title": "运维工单"',
    "  },",
    '  "children": [',
    '    { "type": "TextField",',
    '      "props": {',
    '        "label": "问题描述",',
    '        "field": "desc"',
    "    }},",
    '    { "type": "Button",',
    '      "props": { "label": "提交",',
    '        "action": "submit" }}',
    "  ]",
    "}",
  ].join("\n");
  s.addText(codeText, { x: 0.8, y: 3.2, w: 4.5, h: 1.9, fontSize: 9, fontFace: "Consolas", color: C.codeText, margin: 0, valign: "top" });
  addCard(s, 5.6, 2.8, 3.8, 2.4, { accentLeft: C.mint });
  s.addText("Schema → UI 对应关系", { x: 5.9, y: 2.9, w: 3.2, h: 0.3, fontSize: 12, fontFace: FONT, color: C.mint, bold: true, margin: 0 });
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
    s.addShape(pres.shapes.RECTANGLE, { x: 5.9, y: yp, w: 1.6, h: 0.22, fill: { color: C.lightBlue } });
    s.addText(m.schema, { x: 5.9, y: yp, w: 1.6, h: 0.22, fontSize: 8, fontFace: "Consolas", color: C.deepBlue, margin: 0, valign: "middle" });
    s.addText("→", { x: 7.55, y: yp, w: 0.25, h: 0.22, fontSize: 10, fontFace: FONT, color: C.mint, bold: true, margin: 0, align: "center", valign: "middle" });
    s.addText(m.ui, { x: 7.85, y: yp, w: 1.3, h: 0.22, fontSize: 9, fontFace: FONT, color: C.darkText, margin: 0, valign: "middle" });
  });
  addPageNum(s, 6);

  // ===== S7: A2UI Playground 展示 =====
  s = pres.addSlide(); s.background = { color: C.lightBg }; addTopBar(s);
  s.addText("A2UI Playground 实时预览", { x: 0.6, y: 0.3, w: 8, h: 0.6, fontSize: 28, fontFace: FONT, color: C.darkText, bold: true, margin: 0 });
  addAccent(s, 0.6, 0.85, 0.8); addSection(s, "01  A2UI 组件系统");
  addCard(s, 0.6, 1.1, 5.8, 3.8, {});
  s.addImage({ data: imgPlayground, x: 0.7, y: 1.2, w: 5.6, h: 3.6, sizing: { type: "contain", w: 5.6, h: 3.6 } });
  addCard(s, 6.6, 1.1, 3.2, 3.8, { accentTop: C.mint });
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
  ], { x: 6.9, y: 1.6, w: 2.7, h: 3.1, valign: "top", margin: 0 });
  addPageNum(s, 7);

  // ===== S8: A2UI 应用场景 - 工单提交 + 网络权限申请 =====
  s = pres.addSlide(); s.background = { color: C.lightBg }; addTopBar(s);
  s.addText("A2UI 应用场景：桌面端实践", { x: 0.6, y: 0.3, w: 8, h: 0.6, fontSize: 26, fontFace: FONT, color: C.darkText, bold: true, margin: 0 });
  addAccent(s, 0.6, 0.85, 0.8); addSection(s, "01  A2UI 组件系统");
  // Left: 工单提交
  addCard(s, 0.5, 1.1, 4.4, 4.0, { accentTop: C.mint });
  s.addText("工单提交", { x: 0.8, y: 1.2, w: 3.8, h: 0.35, fontSize: 16, fontFace: FONT, color: C.mint, bold: true, margin: 0 });
  s.addText("AI 识别工单类型后，珊瑚系统输出 JSON Schema，A2UI 实时渲染为工单填写表单，用户在对话中直接提交", { x: 0.8, y: 1.6, w: 3.8, h: 0.6, fontSize: 10, fontFace: FONT, color: C.darkText, margin: 0 });
  s.addImage({ data: imgOrder, x: 0.7, y: 2.3, w: 4.0, h: 2.6, sizing: { type: "contain", w: 4.0, h: 2.6 } });
  // Right: 网络权限申请
  addCard(s, 5.1, 1.1, 4.4, 4.0, { accentTop: C.teal });
  s.addText("网络权限申请", { x: 5.4, y: 1.2, w: 3.8, h: 0.35, fontSize: 16, fontFace: FONT, color: C.teal, bold: true, margin: 0 });
  s.addText("AI 解析权限申请需求，珊瑚系统生成对应 Schema，A2UI 渲染为权限申请表单，包含审批流程", { x: 5.4, y: 1.6, w: 3.8, h: 0.6, fontSize: 10, fontFace: FONT, color: C.darkText, margin: 0 });
  s.addImage({ data: imgNetwork, x: 5.3, y: 2.3, w: 4.0, h: 2.6, sizing: { type: "contain", w: 4.0, h: 2.6 } });
  addPageNum(s, 8);

  // ===== S9: Section 02 - 对比分析 =====
  s = pres.addSlide(); s.background = { color: C.sectionBg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 2.5, w: 0.15, h: 1.2, fill: { color: C.mint } });
  s.addText("02", { x: 0.6, y: 1.5, w: 2, h: 0.7, fontSize: 48, fontFace: FONT, color: C.mint, bold: true, margin: 0, transparency: 30 });
  s.addText("传统实现 vs A2UI 方案", { x: 1.0, y: 2.5, w: 8, h: 0.7, fontSize: 36, fontFace: FONT, color: C.white, bold: true, margin: 0 });
  s.addText("对比分析、效率提升与性能优化", { x: 1.0, y: 3.2, w: 8, h: 0.5, fontSize: 18, fontFace: FONT, color: "CADCFC", margin: 0 });
  addIcon(s, icons.balanceW, 8.5, 1.0, 1.0);

  // ===== S10: 传统实现方式 =====
  s = pres.addSlide(); s.background = { color: C.lightBg }; addTopBar(s);
  s.addText("传统实现方式分析", { x: 0.6, y: 0.3, w: 8, h: 0.6, fontSize: 28, fontFace: FONT, color: C.darkText, bold: true, margin: 0 });
  addAccent(s, 0.6, 0.85, 0.8); addSection(s, "02  传统实现 vs A2UI 方案");
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
  addPageNum(s, 10);

  // ===== S11: A2UI 集成方案 =====
  s = pres.addSlide(); s.background = { color: C.lightBg }; addTopBar(s);
  s.addText("A2UI 集成方案优势", { x: 0.6, y: 0.3, w: 8, h: 0.6, fontSize: 28, fontFace: FONT, color: C.darkText, bold: true, margin: 0 });
  addAccent(s, 0.6, 0.85, 0.8); addSection(s, "02  传统实现 vs A2UI 方案");
  addCard(s, 0.6, 1.1, 4.2, 2.4, { accentTop: C.mint });
  s.addText("架构改进点", { x: 0.9, y: 1.2, w: 3.6, h: 0.3, fontSize: 14, fontFace: FONT, color: C.mint, bold: true, margin: 0 });
  s.addText([
    { text: "JSON Schema 替代 Vue 模板", options: { breakLine: true, fontSize: 10, fontFace: FONT, color: C.darkText, bullet: true, paraSpaceAfter: 3 } },
    { text: "珊瑚系统统一生成 JSON 数据流", options: { breakLine: true, fontSize: 10, fontFace: FONT, color: C.darkText, bullet: true, paraSpaceAfter: 3 } },
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
  addPageNum(s, 11);

  // ===== S12: Section 03 - 桌面端也是从0到1 =====
  s = pres.addSlide(); s.background = { color: C.sectionBg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 2.5, w: 0.15, h: 1.2, fill: { color: C.mint } });
  s.addText("03", { x: 0.6, y: 1.5, w: 2, h: 0.7, fontSize: 48, fontFace: FONT, color: C.mint, bold: true, margin: 0, transparency: 30 });
  s.addText("桌面端也是从 0 到 1", { x: 1.0, y: 2.5, w: 8, h: 0.7, fontSize: 36, fontFace: FONT, color: C.white, bold: true, margin: 0 });
  s.addText("AI 辅助下，从零开始、在不了解相关技术的情况下完成开发", { x: 1.0, y: 3.2, w: 8, h: 0.5, fontSize: 16, fontFace: FONT, color: "CADCFC", margin: 0 });
  addIcon(s, icons.desktopW, 8.5, 1.0, 1.0);

  // ===== S13: 项目背景与架构 =====
  s = pres.addSlide(); s.background = { color: C.lightBg }; addTopBar(s);
  s.addText("项目背景与架构概览", { x: 0.6, y: 0.3, w: 8, h: 0.6, fontSize: 28, fontFace: FONT, color: C.darkText, bold: true, margin: 0 });
  addAccent(s, 0.6, 0.85, 0.8); addSection(s, "03  桌面端也是从 0 到 1");
  addCard(s, 0.6, 1.1, 4.2, 2.2, { accentTop: C.deepBlue });
  s.addText("运维痛点", { x: 0.9, y: 1.2, w: 3.6, h: 0.35, fontSize: 16, fontFace: FONT, color: C.deepBlue, bold: true, margin: 0 });
  s.addText([
    { text: "大量重复性事务消耗运维人力", options: { breakLine: true, fontSize: 11, fontFace: FONT, color: C.darkText, bullet: true, paraSpaceAfter: 4 } },
    { text: "问题排查依赖经验，知识难以沉淀", options: { breakLine: true, fontSize: 11, fontFace: FONT, color: C.darkText, bullet: true, paraSpaceAfter: 4 } },
    { text: "缺乏统一入口，信息孤岛严重", options: { fontSize: 11, fontFace: FONT, color: C.darkText, bullet: true } },
  ], { x: 0.9, y: 1.7, w: 3.7, h: 1.4, valign: "top", margin: 0 });
  addCard(s, 5.2, 1.1, 4.2, 2.2, { accentTop: C.mint });
  s.addText("技术选型", { x: 5.5, y: 1.2, w: 3.6, h: 0.35, fontSize: 16, fontFace: FONT, color: C.mint, bold: true, margin: 0 });
  const techChoices = [
    { tech: "Vue 3 + Vite 6", reason: "响应式框架 + 极速构建" },
    { tech: "Electron 41", reason: "跨平台 + 原生能力" },
    { tech: "A2UI Engine", reason: "动态渲染 + AI 集成" },
    { tech: "Pinia", reason: "轻量级状态管理" },
    { tech: "WebSocket", reason: "实时双向通信" },
  ];
  techChoices.forEach((t, i) => {
    s.addText(t.tech, { x: 5.5, y: 1.65 + i * 0.3, w: 1.8, h: 0.25, fontSize: 10, fontFace: FONT, color: C.mint, bold: true, margin: 0 });
    s.addText(t.reason, { x: 7.3, y: 1.65 + i * 0.3, w: 1.9, h: 0.25, fontSize: 9, fontFace: FONT, color: C.mutedText, margin: 0 });
  });
  // Core features
  addCard(s, 0.6, 3.55, 8.8, 1.3, { accentTop: C.teal });
  s.addText("核心功能", { x: 0.9, y: 3.65, w: 2, h: 0.25, fontSize: 13, fontFace: FONT, color: C.teal, bold: true, margin: 0 });
  const feats = [
    { title: "智能聊天", desc: "AI 实时对话 + A2UI 表单嵌入", color: C.mint },
    { title: "会话管理", desc: "全生命周期管理 + 状态追踪", color: C.teal },
    { title: "悬浮球与托盘", desc: "置顶悬浮球 + 系统托盘集成", color: C.deepBlue },
    { title: "A2UI 动态渲染", desc: "JSON Schema 驱动 + 零代码扩展", color: C.navy },
  ];
  feats.forEach((f, i) => {
    const xp = 0.9 + i * 2.2;
    s.addShape(pres.shapes.RECTANGLE, { x: xp, y: 4.0, w: 2.0, h: 0.65, fill: { color: C.lightMint } });
    s.addText(f.title, { x: xp + 0.1, y: 4.02, w: 1.8, h: 0.28, fontSize: 11, fontFace: FONT, color: f.color, bold: true, margin: 0 });
    s.addText(f.desc, { x: xp + 0.1, y: 4.32, w: 1.8, h: 0.28, fontSize: 9, fontFace: FONT, color: C.mutedText, margin: 0 });
  });
  addPageNum(s, 13);

  // ===== S14: 需求分析与从0到1的历程 =====
  s = pres.addSlide(); s.background = { color: C.lightBg }; addTopBar(s);
  s.addText("从零开始：需求分析与技术探索", { x: 0.6, y: 0.3, w: 8, h: 0.6, fontSize: 26, fontFace: FONT, color: C.darkText, bold: true, margin: 0 });
  addAccent(s, 0.6, 0.85, 0.8); addSection(s, "03  桌面端也是从 0 到 1");
  addCard(s, 0.6, 1.1, 4.2, 2.5, { accentTop: C.deepBlue });
  s.addText("需求分析思考", { x: 0.9, y: 1.2, w: 3.6, h: 0.3, fontSize: 14, fontFace: FONT, color: C.deepBlue, bold: true, margin: 0 });
  s.addText([
    { text: "运维人员需要什么样的 AI 助手？", options: { breakLine: true, fontSize: 11, fontFace: FONT, color: C.deepBlue, bold: true, paraSpaceAfter: 3 } },
    { text: "→ 自然语言交互，降低使用门槛", options: { breakLine: true, fontSize: 10, fontFace: FONT, color: C.darkText, paraSpaceAfter: 3 } },
    { text: "如何让 AI 输出可交互的界面？", options: { breakLine: true, fontSize: 11, fontFace: FONT, color: C.deepBlue, bold: true, paraSpaceAfter: 3 } },
    { text: "→ A2UI 引擎，JSON Schema → UI", options: { breakLine: true, fontSize: 10, fontFace: FONT, color: C.darkText, paraSpaceAfter: 3 } },
    { text: "桌面端还是 Web 端？", options: { breakLine: true, fontSize: 11, fontFace: FONT, color: C.deepBlue, bold: true, paraSpaceAfter: 3 } },
    { text: "→ 桌面端：悬浮球、托盘、原生能力", options: { fontSize: 10, fontFace: FONT, color: C.darkText } },
  ], { x: 0.9, y: 1.6, w: 3.7, h: 1.8, valign: "top", margin: 0 });
  addCard(s, 5.2, 1.1, 4.2, 2.5, { accentTop: C.mint });
  s.addText("AI 辅助从零开始", { x: 5.5, y: 1.2, w: 3.6, h: 0.3, fontSize: 14, fontFace: FONT, color: C.mint, bold: true, margin: 0 });
  s.addText([
    { text: "在不了解 Electron 的情况下：", options: { breakLine: true, fontSize: 11, fontFace: FONT, color: C.mint, bold: true, paraSpaceAfter: 3 } },
    { text: "AI 指导项目初始化和窗口管理", options: { breakLine: true, fontSize: 10, fontFace: FONT, color: C.darkText, bullet: true, paraSpaceAfter: 3 } },
    { text: "AI 生成 IPC 通信和 preload 脚本", options: { breakLine: true, fontSize: 10, fontFace: FONT, color: C.darkText, bullet: true, paraSpaceAfter: 3 } },
    { text: "在不了解 A2UI 的情况下：", options: { breakLine: true, fontSize: 11, fontFace: FONT, color: C.mint, bold: true, paraSpaceAfter: 3 } },
    { text: "AI 辅助集成 A2UI 引擎", options: { breakLine: true, fontSize: 10, fontFace: FONT, color: C.darkText, bullet: true, paraSpaceAfter: 3 } },
    { text: "AI 帮助调试样式隔离和数据绑定", options: { fontSize: 10, fontFace: FONT, color: C.darkText, bullet: true } },
  ], { x: 5.5, y: 1.6, w: 3.7, h: 1.8, valign: "top", margin: 0 });
  // Process flow
  addCard(s, 0.6, 3.8, 8.8, 1.1, {});
  s.addText("从需求到交付的完整流程", { x: 0.9, y: 3.9, w: 4, h: 0.25, fontSize: 13, fontFace: FONT, color: C.darkText, bold: true, margin: 0 });
  const procSteps = ["需求理解", "AI 辅助学习", "架构设计", "原型开发", "迭代优化", "交付上线"];
  procSteps.forEach((p, i) => {
    const xp = 0.9 + i * 1.45;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: xp, y: 4.25, w: 1.2, h: 0.4, fill: { color: i < 2 ? C.mint : i < 4 ? C.teal : C.deepBlue }, rectRadius: 0.05 });
    s.addText(p, { x: xp, y: 4.25, w: 1.2, h: 0.4, fontSize: 9, fontFace: FONT, color: C.white, bold: true, align: "center", valign: "middle", margin: 0 });
    if (i < 5) s.addText("→", { x: xp + 1.2, y: 4.25, w: 0.25, h: 0.4, fontSize: 10, fontFace: FONT, color: C.mint, bold: true, align: "center", valign: "middle", margin: 0 });
  });
  addPageNum(s, 14);

  // ===== S15: 关键技术突破 =====
  s = pres.addSlide(); s.background = { color: C.lightBg }; addTopBar(s);
  s.addText("关键技术突破与经验教训", { x: 0.6, y: 0.3, w: 8, h: 0.6, fontSize: 26, fontFace: FONT, color: C.darkText, bold: true, margin: 0 });
  addAccent(s, 0.6, 0.85, 0.8); addSection(s, "03  桌面端也是从 0 到 1");
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
  addPageNum(s, 15);

  // ===== S16: 开发周期与资源 =====
  s = pres.addSlide(); s.background = { color: C.lightBg }; addTopBar(s);
  s.addText("开发周期与资源投入", { x: 0.6, y: 0.3, w: 8, h: 0.6, fontSize: 28, fontFace: FONT, color: C.darkText, bold: true, margin: 0 });
  addAccent(s, 0.6, 0.85, 0.8); addSection(s, "03  桌面端也是从 0 到 1");
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
  // AI assistance stats
  addCard(s, 5.2, 2.95, 4.2, 2.0, { accentTop: C.teal });
  s.addText("AI 辅助开发成效", { x: 5.5, y: 3.05, w: 3.6, h: 0.3, fontSize: 14, fontFace: FONT, color: C.teal, bold: true, margin: 0 });
  const aiStats = [
    { num: "3-5x", label: "代码生成速度提升" },
    { num: "60%", label: "AI 辅助开发占比" },
    { num: "8周", label: "从零到交付" },
    { num: "1人", label: "完成完整桌面应用" },
  ];
  aiStats.forEach((a, i) => {
    const xp = 5.5 + (i % 2) * 2.0;
    const yp = 3.45 + Math.floor(i / 2) * 0.7;
    s.addText(a.num, { x: xp, y: yp, w: 1.8, h: 0.35, fontSize: 18, fontFace: FONT, color: C.teal, bold: true, margin: 0, align: "center" });
    s.addText(a.label, { x: xp, y: yp + 0.35, w: 1.8, h: 0.25, fontSize: 9, fontFace: FONT, color: C.mutedText, margin: 0, align: "center" });
  });
  addPageNum(s, 16);

  // ===== S17: A2UI 成果展示 =====
  s = pres.addSlide(); s.background = { color: C.lightBg }; addTopBar(s);
  s.addText("A2UI 成果展示", { x: 0.6, y: 0.3, w: 8, h: 0.6, fontSize: 28, fontFace: FONT, color: C.darkText, bold: true, margin: 0 });
  addAccent(s, 0.6, 0.85, 0.8); addSection(s, "03  桌面端也是从 0 到 1");
  // Desktop screenshot
  addCard(s, 0.5, 1.1, 4.4, 3.8, { accentTop: C.mint });
  s.addText("海豚桌面端", { x: 0.8, y: 1.2, w: 3.8, h: 0.3, fontSize: 14, fontFace: FONT, color: C.mint, bold: true, margin: 0 });
  s.addText("A2UI 在桌面端的应用：工单提交 + 网络权限申请", { x: 0.8, y: 1.5, w: 3.8, h: 0.3, fontSize: 10, fontFace: FONT, color: C.mutedText, margin: 0 });
  s.addImage({ data: imgDesktop, x: 0.7, y: 1.9, w: 4.0, h: 2.8, sizing: { type: "contain", w: 4.0, h: 2.8 } });
  // Hinton screenshots
  addCard(s, 5.1, 1.1, 4.4, 1.8, { accentTop: C.teal });
  s.addText("辛顿 · 海豚 Web 端", { x: 5.4, y: 1.2, w: 3.8, h: 0.3, fontSize: 14, fontFace: FONT, color: C.teal, bold: true, margin: 0 });
  s.addImage({ data: imgHinton1, x: 5.3, y: 1.55, w: 2.0, h: 1.2, sizing: { type: "contain", w: 2.0, h: 1.2 } });
  s.addImage({ data: imgHinton2, x: 7.4, y: 1.55, w: 2.0, h: 1.2, sizing: { type: "contain", w: 2.0, h: 1.2 } });
  // Key achievements
  addCard(s, 5.1, 3.1, 4.4, 1.8, { accentTop: C.deepBlue });
  s.addText("A2UI 核心成果", { x: 5.4, y: 3.2, w: 3.8, h: 0.3, fontSize: 14, fontFace: FONT, color: C.deepBlue, bold: true, margin: 0 });
  const achievements = [
    { label: "桌面端 + Web 端双平台 A2UI 集成" },
    { label: "工单提交、网络权限申请场景落地" },
    { label: "珊瑚系统 JSON 数据流 → A2UI 渲染" },
    { label: "从零开始，AI 辅助 8 周完成交付" },
  ];
  achievements.forEach((a, i) => {
    s.addShape(pres.shapes.RECTANGLE, { x: 5.5, y: 3.6 + i * 0.28, w: 0.15, h: 0.15, fill: { color: C.mint } });
    s.addText(a.label, { x: 5.8, y: 3.55 + i * 0.28, w: 3.5, h: 0.25, fontSize: 10, fontFace: FONT, color: C.darkText, margin: 0 });
  });
  addPageNum(s, 17);

  // ===== S18: Section 04 - 总结 =====
  s = pres.addSlide(); s.background = { color: C.sectionBg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 2.5, w: 0.15, h: 1.2, fill: { color: C.mint } });
  s.addText("04", { x: 0.6, y: 1.5, w: 2, h: 0.7, fontSize: 48, fontFace: FONT, color: C.mint, bold: true, margin: 0, transparency: 30 });
  s.addText("总结与展望", { x: 1.0, y: 2.5, w: 8, h: 0.7, fontSize: 36, fontFace: FONT, color: C.white, bold: true, margin: 0 });
  s.addText("技术演进与未来思考", { x: 1.0, y: 3.2, w: 8, h: 0.5, fontSize: 18, fontFace: FONT, color: "CADCFC", margin: 0 });
  addIcon(s, icons.starW, 8.5, 1.0, 1.0);

  // ===== S19: 技术演进与展望 =====
  s = pres.addSlide(); s.background = { color: C.lightBg }; addTopBar(s);
  s.addText("技术演进与未来思考", { x: 0.6, y: 0.3, w: 8, h: 0.6, fontSize: 28, fontFace: FONT, color: C.darkText, bold: true, margin: 0 });
  addAccent(s, 0.6, 0.85, 0.8); addSection(s, "04  总结与展望");
  const outlook = [
    { title: "A2UI 技术演进", color: C.mint, icon: icons.puzzle, items: [
      "AI 原生 UI：AI 直接生成界面，无需人工编码",
      "JSON Schema 成为 AI 应用标准交互方式",
      "组件库持续扩展，覆盖更多业务场景",
    ]},
    { title: "AI 辅助开发", color: C.deepBlue, icon: icons.chart, items: [
      "从代码生成走向架构设计辅助",
      "即使不了解技术也能完成开发",
      "AI 协作能力成为核心竞争力",
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
  addPageNum(s, 19);

  // ===== S20: Thank You =====
  s = pres.addSlide(); s.background = { color: C.navy };
  s.addShape(pres.shapes.RECTANGLE, { x: 4.0, y: 2.8, w: 2.0, h: 0.04, fill: { color: C.mint } });
  s.addText("感谢聆听", { x: 1, y: 1.5, w: 8, h: 1.0, fontSize: 44, fontFace: FONT, color: C.white, bold: true, align: "center", margin: 0 });
  s.addText("Q & A", { x: 1, y: 3.1, w: 8, h: 0.7, fontSize: 28, fontFace: FONT, color: C.mint, bold: true, align: "center", margin: 0 });
  s.addText("AIT Center  |  2026", { x: 1, y: 4.2, w: 8, h: 0.4, fontSize: 12, fontFace: FONT, color: C.mutedText, align: "center", margin: 0 });

  await pres.writeFile({ fileName: "d:\\work\\program\\tineco\\desk\\opsmind\\海豚-技术分享-优化版.pptx" });
  console.log("PPT generated successfully!");
}

main().catch(err => { console.error("Error:", err); process.exit(1); });
