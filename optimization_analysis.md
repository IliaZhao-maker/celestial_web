# index_moon.html 优化分析文档

> **项目名称**: Celestial Academy - 月食交互式教学系统  
> **文件大小**: ~166KB / ~2785 行  
> **技术栈**: HTML5 + CSS3 + WebGL (WebGL1/WebGL2) + 原生 JavaScript  
> **分析日期**: 2026-06-01

---

## 一、项目概述

这是一个单文件 HTML 应用，提供关于月食（月偏食、半影月食、月全食）的交互式 3D 可视化教学。包含：

| 组件 | 说明 |
|------|------|
| 3D 天体轨道仪 | 使用 WebGL 渲染地球+月球+轨道环，支持拖拽旋转/缩放 |
| 赛博都市场景 | Subpage 0：深度月偏食，WebGL2 程序化城市 + raymarching 月球 |
| 跨海大桥场景 | Subpage 1：半影月食，WebGL1 raymarching 大桥/水面 + raymarching 月球 |
| 血月都市场景 | Subpage 2：月全食，WebGL1 程序化城市(FBO+Bloom) + raymarching 血月 |
| UI 控制面板 | 赛博朋克风面板，含课程选择、进度显示、多语言切换(中/英) |
| 画中画(PiP) | 点击缩略图可将 3D 天体仪缩放到右上角 |

---

## 二、架构问题分析

### 2.1 单文件巨型结构 — 高优先级

**现状**: 所有 CSS (~350行)、HTML (~200行)、JavaScript (~2200行) 全部堆在一个 166KB 的文件中。

**问题**:
- 难以维护和定位代码
- 无法利用浏览器并行加载
- 无法做代码分割和按需加载
- 任何修改都需要操作这个巨型文件

**建议拆分方案**:
```
moon/
├── index.html              # 入口 HTML
├── css/
│   ├── main.css            # 主样式
│   ├── theme-default.css   # 默认蓝黄主题
│   └── theme-core.css      # 血月/绯红主题
├── js/
│   ├── main.js             # 入口 + 动画循环
│   ├── ui.js               # UI 逻辑(菜单/语言/画中画)
│   ├── i18n.js             # 多语言数据
│   ├── webgl/
│   │   ├── orbiter.js      # 3D 天体轨道仪
│   │   ├── utils.js        # WebGL 工具函数
│   │   ├── city-partial.js # 偏食城市 shader
│   │   ├── moon-partial.js # 偏食月球 shader
│   │   ├── bridge.js       # 大桥场景 shader
│   │   ├── moon-penumbral.js # 半影月球 shader
│   │   ├── city-total.js   # 全食城市 shader (含 FBO)
│   │   └── moon-total.js   # 血月 shader
│   └── shaders/            # [可选] 独立 .glsl 文件
└── assets/
    └── fonts/              # 本地字体替代 Google Fonts
```

### 2.2 6 个独立 WebGL 上下文 — 高优先级

**现状**: 同时创建了 6 个 WebGL Canvas 上下文：

| 上下文变量 | Canvas ID | 用途 | WebGL 版本 |
|------------|-----------|------|-----------|
| `glContext` | `glcanvas` | 主 3D 天体仪 | WebGL1 |
| `cityCtx` | `cityCanvas` | 偏食城市背景 | WebGL2 |
| `moonCtx` | `moonCanvas` | 偏食月球 | WebGL2 |
| `bridgeCtx` | `bridgeCanvas` | 半影大桥场景 | WebGL1 |
| `penumbralMoonCtx` | `penumbralMoonCanvas` | 半影月球 | WebGL2 |
| `totalCityCtx` | `totalCityCanvas` | 全食城市 + FBO | WebGL1 |
| `totalMoonCtx` | `totalMoonCanvas` | 血月 | WebGL2 |

**问题**:
- 浏览器对 WebGL 上下文数量有限制（通常 8-16 个），移动端更严格
- 每个上下文独立占用 GPU 内存（纹理、缓冲区、shader 编译）
- 同一帧内切换多个上下文有性能开销
- 部分上下文在不可见时仍在渲染

**建议**:
1. **合并同类型 shader**：偏食月球、半影月球、血月月球共享同一个 canvas，通过 uniform 切换
2. **按需激活上下文**：只对当前可见的场景执行渲染
3. **使用单个主 canvas + 离屏渲染**：将多个场景渲染到同一个 WebGL 上下文的 FBO 中

### 2.3 Shader 代码重复 — 中优先级

**现状**: 月球 shader 的核心逻辑在三个地方高度相似：

- `moonCtx` (偏食月球) — `initMoonShader()` [line 674]
- `penumbralMoonCtx` (半影月球) — `initPenumbralMoon()` [line 1244]
- `totalMoonCtx` (血月) — `initTotalMoonShader()` [line ~1930]

三个函数中 `getBump()`, `worldBump()`, `getNormal()`, `hash33()`, `hash()`, `raymarch()`, `getRayDirection()` 逻辑几乎一样，仅在颜色/光照参数上有区别。

**建议**:
1. 提取公共着色器代码为 `sharedMoonShader` 模板
2. 通过 uniform 参数控制不同场景的颜色调色板
3. 减少 shader 编译次数（目前每次初始化都编译 3 份几乎相同的 shader）

### 2.4 全局变量污染 — 中优先级

**现状**: 大量变量直接定义在全局作用域：
```javascript
let menuVisible = true;
let isThumbnail = false;
let autoMiniTriggered = true;
let currentLang = 'zh';
let c3SubPage = 0;
let camTheta = Math.PI / 4.0, camPhi = Math.PI / 2.6, camRadius = 26.0;
// ... 以及所有 WebGL 上下文变量
```

**建议**:
- 使用 IIFE 或 ES Module 封装各模块
- 将状态集中管理到一个 `AppState` 对象中
- 使用命名空间避免冲突

---

## 三、性能优化

### 3.1 渲染性能

| 问题 | 影响 | 建议 |
|------|------|------|
| 分辨率质量系数 0.8 | 画质下降 | 改为 1.0，使用 `devicePixelRatio` |
| 不可见场景仍在渲染 | GPU 浪费 | 检查 opacity/display 后跳过渲染 |
| FBO 每帧 resize 重建 | 频繁 GC | resize 时判断尺寸是否真的变化 |
| 反复调用 `getElementById` | 微小但可累积 | 缓存 DOM 引用 |
| `requestAnimationFrame` 无条件渲染 | 空闲时浪费电 | 添加可见性/空闲检测暂停渲染 |

**关键渲染循环优化** [line ~2540 `render()`]:
```javascript
// 当前：无条件全帧渲染
// 建议：添加空闲检测
let lastActivity = Date.now();
function render(now) {
    if (Date.now() - lastActivity > 5000) {
        // 5秒无交互，降低帧率
        setTimeout(() => requestAnimationFrame(render), 100);
        return;
    }
    // ... 正常渲染
}
```

### 3.2 CSS 性能

| 问题 | 位置 | 建议 |
|------|------|------|
| 主题切换使用大量覆写规则 | [line 13-36] | 使用 CSS Custom Properties（CSS 变量） |
| `backdrop-filter: blur(10px)` | [line 166] | 在低端设备上很昂贵，考虑降级 |
| `repeating-linear-gradient` + 动画 | [line 166] | 使用 `will-change` 提示浏览器 |
| GPU 加速的 `filter: drop-shadow` | [line 49] | 确保仅在需要时应用 |

**CSS 变量重构建议**:
```css
:root {
    --theme-primary: #ffaa00;
    --theme-bg: #020a14;
    --theme-panel-gradient: linear-gradient(135deg, #2c527a 0%, #ffaa00 100%);
    --theme-text-shadow: none;
}
body.theme-core {
    --theme-primary: #ff2a4b;
    --theme-bg: #0d0214;
    --theme-panel-gradient: linear-gradient(180deg, #ff2a4b 0%, rgba(255, 42, 75, 0.4) 100%);
    --theme-text-shadow: 0 2px 15px rgba(255,42,75,0.6);
}
```
这样可删除 ~80% 的 `.theme-core` 覆盖规则。

### 3.3 Shader 性能

**GLSL 代码中的问题**:

| 问题 | 位置(行) | 影响 |
|------|----------|------|
| `for (int i = 0; i < 200; ++i)` ray march | city shader [line 640] | 每次像素 200 步，高分辨率下很重 |
| 三重嵌套 `for` 循环 (3×3×3) | moon shader crater [line 710] | 每层 27 次迭代 × 4 层 = 108 次/像素 |
| `for (int i=0; i<I_MAX; i++)` (I_MAX=70) | total city [line ~1700] | 建筑遍历每像素最多 70 步 |
| `NUM_AA_SAMPLES = 2` | bridge shader [line ~1203] | 每像素采样 2 次，即双倍计算量 |
| `for (float x=-8.0; x<=8.0; x+=1.0)` bloom | total city bloom [line ~1770] | 17×17=289 次纹理采样/像素 |

**建议**:
1. 使用二分法加速建筑遍历（当前的线性步进在大场景中较慢）
2. 将 crater 生成的三重嵌套改为预计算噪声纹理
3. Bloom 效果可使用降采样分步实现（先 1/4，再 1/16）而非单 pass
4. 对低端设备提供降级 shader（减少步数，简化光照）

### 3.4 资源加载

| 问题 | 建议 |
|------|------|
| Google Fonts 外部加载可能被墙 | 自托管字体文件或提供降级字体 |
| 无加载状态指示 | 添加 loading spinner，在 WebGL 初始化完成后隐藏 |
| 无预加载 | 对关键资源添加 `<link rel="preload">` |

---

## 四、代码质量

### 4.1 错误处理

**当前**: WebGL 上下文获取失败时仅 `return null`，后续代码会静默失败：
```javascript
const gl = canvas.getContext('webgl2');
if (!gl) return null;
```
调用方:
```javascript
const cityCtx = initCityShader(); // 可能为 null
// 后续渲染时:
if (cityCtx) { cityCtx.gl.useProgram(...) } // 安全但缺少用户提示
```

**建议**:
- 添加全局 WebGL 失败降级方案（Canvas 2D 替代或静态图片）
- 向用户显示友好的错误提示
- `window.onerror` 捕获全局错误

### 4.2 重复代码

| 位置 | 内容 | 建议 |
|------|------|------|
| [line 830-1389] | 三个月球 shader 初始化 | 合并为参数化工厂函数 |
| [line 653-660, 812-819, 1226-1238, 1371-1380] | positionBuffer 创建 + 顶点数组 | 提取公共函数 |
| [line ~2000-2650] | render 中三个子场景的动画逻辑 | 提取为 Scene 类 |

### 4.3 硬编码问题

- 所有颜色值散落在 shader 字符串中
- 进度阈值硬编码（如 `0.62`、`0.88` 判定 Course 03 范围）
- 动画时间硬编码为 32 秒周期

**建议**: 集中定义为常量，便于调参。

---

## 五、移动端适配

### 5.1 当前问题

| 问题 | 影响 |
|------|------|
| 桌面端布局（60%/40% 分栏） | 手机上视觉面板太小 |
| `mousedown/mousemove/mouseup` 交互 | 移动端需 `touch` 事件 |
| 字体最小 3px 动态计算 | 小屏幕上可能过大或过小 |
| 底部工具栏固定 32px | 可能与移动端安全区域冲突 |

### 5.2 建议

1. 添加触摸事件支持（`touchstart/touchmove/touchend`）
2. 移动端改为上下布局（视觉面板在上，文字在下）
3. 使用 `env(safe-area-inset-bottom)` 适配刘海屏
4. 移动端降低 shader 复杂度或分辨率

---

## 六、安全与最佳实践

| 问题 | 建议 |
|------|------|
| 内联 `onclick` 事件处理器 | 改用 `addEventListener`，便于 CSP 管理 |
| `alert()` 用于错误提示 | 改用自定义 toast/modal |
| 无 CSP (Content Security Policy) | 添加 CSP 头限制内联脚本和外部资源 |

---

## 七、优化优先级路线图

### 第一阶段：快速收益 🔴
1. **拆分单文件** → CSS / JS / HTML 分离
2. **CSS 变量重构主题切换** → 减少 ~80% 主题覆盖代码
3. **添加移动端响应式布局**

### 第二阶段：性能提升 🟡
4. **合并月球 shader** → 3 个合并为 1 个参数化 shader
5. **不可见场景跳过渲染**
6. **使用 `devicePixelRatio` 优化分辨率**
7. **添加空闲帧率降低**

### 第三阶段：架构升级 🟢
8. **减少 WebGL 上下文数量** → 6 个合并为 2-3 个
9. **提取公共 WebGL 工具模块**
10. **Shader 降采样 bloom**
11. **引入构建工具**（Vite/webpack）进行代码压缩和 tree-shaking

### 第四阶段：体验优化 🔵
12. **添加加载动画**
13. **完善错误降级处理**
14. **本地化字体资源**
15. **添加 Service Worker 实现离线可用**

---

## 八、尺寸估算

| 措施 | 预计减少 |
|------|----------|
| CSS 变量替代主题覆盖 | ~8KB |
| 月球 shader 去重合并 | ~15KB |
| 提取公共 WebGL 工具函数 | ~5KB |
| 代码压缩 (minify) | ~40KB |
| **合计预估** | **原 166KB → ~100KB** |

---

## 九、CORE 章节（Course 04）子页面整合方案

### 9.1 源文件概况

| 文件 | 大小 | 内容 |
|------|------|------|
| CORE_01.html | 45.8KB | 日心视角多维观测站 — WebGL raymarching 地月系统 + PiP 地球观测者视角 |
| CORE_02.html | 62.0KB | 大气折射与血月显影 — 丹戎光度表、火山灰浓度滑块、人眼/物理双模式 |
| CORE_03.html | 71.4KB | 黄白交角演示器 — 轨道面夹角 3D 可视化、交点退行、量角器 SVG |
| CORE_04.html | 61.0KB | 覆绛·轨道律动定格 — 沙罗周期数据面板、WebGL 背景动画、网格卡片布局 |
| **合计** | **~240KB** | |

### 9.2 整合策略：与 Course 03 相同的子页面切换模式

```
Course 04 (CORE, progress=1.0)
├── Subpage 0: CORE_01 → 日心视角多维观测站
├── Subpage 1: CORE_02 → 大气折射与血月显影
├── Subpage 2: CORE_03 → 黄白交角与月食捉迷藏
└── Subpage 3: CORE_04 → 覆绛·轨道律动定格
```

**切换机制**（完全复用 Course 03 的 `switchTopTab` + `c4SubPage` 模式）：
- 新增 state 变量 `c4SubPage` (0-3)
- prev/next 按钮在 `progress >= 0.9` 时切换 `c4SubPage`
- 点击 Course 04 按钮时 `c4SubPage` 重置为 0
- 每个子页面的 WebGL 懒初始化（首次进入时才创建上下文）

### 9.3 技术实施步骤

#### 第一步：HTML 层 — 4 个场景容器

在 `index.html` 中新增 4 个 `#core-subpage-*` 容器，每个容器承载对应 CORE 页面的 DOM 结构：
- `#core-subpage-0` — CORE_01 的 body 内容 (canvas#glcanvas-core, UI面板, 工具栏)
- `#core-subpage-1` — CORE_02 的 body 内容 (canvas#sim-canvas, 滑块面板)
- `#core-subpage-2` — CORE_03 的 body 内容 (canvas#glcanvas-incli, SVG层)
- `#core-subpage-3` — CORE_04 的 body 内容 (canvas#glcanvas-terminal, 卡片网格)

每个容器默认 `opacity: 0; pointer-events: none`，只在 `c4SubPage` 匹配时激活。

**Canvas ID 冲突处理**：各 CORE 页面的 canvas 使用独立 ID（加后缀区分），避免与主页面 canvas 冲突。

#### 第二步：CSS 层 — 样式合并

每个 CORE 页面有独立的内联 `<style>` 块。合并策略：
- 将 4 个文件的 `<style>` 内容追加到 `css/main.css` 末尾
- 每个样式块用作用域选择器包裹（如 `#core-subpage-0 { ... }`）
- 通用的血月主题色（`#ff2a4b`, `#0d0214`, `#ccbbcc` 等）已在 main.css 中定义，无需重复

#### 第三步：JS 层 — 模块化提取

| 提取文件 | 来源 | 职责 |
|----------|------|------|
| `js/core-01.js` | CORE_01.html `<script>` | 日心视角 WebGL + PiP 渲染 + 时间流控制 |
| `js/core-02.js` | CORE_02.html `<script>` | 大气折射模拟 + 丹戎量表 + 双模式切换 |
| `js/core-03.js` | CORE_03.html `<script>` | 黄白交角 3D 可视化 + 量角器 SVG + 轨道按钮 |
| `js/core-04.js` | CORE_04.html `<script>` | 沙罗周期数据面板 + WebGL 背景动画 |

**共用逻辑提取**：4 个 CORE 页面都有相同的 UI 模式（`toggleLanguage`, `toggleMenuDrawer`, `switchTopTab`, i18n 框架），这些与主站 ui.js 重复 → **直接复用主站 ui.js 的函数**，不需要在 CORE 模块中重复定义。

**初始化与销毁**：
- 每个 CORE 模块导出 `init()` 函数，创建 WebGL 上下文和 shader
- 切换子页面时调用当前页面的 `start()` 和前一页面的 `pause()`
- 避免 4 个 WebGL 上下文同时运行

#### 第四步：主循环改造

`main.js` 的 `render()` 函数中新增 CORE 场景判断：
```javascript
let inCore = currentProgress >= 0.88;
let showCore0 = inCore && c4SubPage === 0;
let showCore1 = inCore && c4SubPage === 1;
let showCore2 = inCore && c4SubPage === 2;
let showCore3 = inCore && c4SubPage === 3;
```

#### 第五步：bundle 更新

`tools/build.js` 构建脚本新增 `js/core-01.js` ~ `js/core-04.js` 到 `bundle.js` 中。

### 9.4 预估影响

| 指标 | 当前 | 整合后 |
|------|------|--------|
| index.html | ~10KB | ~15KB（新增4个容器DOM） |
| main.css | ~19KB | ~30KB（追加4个CORE页面的样式） |
| bundle.js | ~143KB | ~380KB（新增4个CORE模块的JS） |
| 总部署大小 | ~173KB | ~425KB |

### 9.5 风险与对策

| 风险 | 对策 |
|------|------|
| bundle 过大导致首次加载慢 | gzip 后约 80-100KB；可考虑按需动态 import |
| 4 个 WebGL 上下文同时持有 | 严格懒初始化，切换时 pause 不可见场景 |
| Canvas ID 命名冲突 | 所有 CORE 内部 canvas 加 `-core` 后缀 |
| onclick 内联事件冲突 | 统一改用主站的事件委托或全局函数 |

---

## 十、当前落地进度与修复计划（2026-06-02）

### 10.1 当前状态

第一轮拆分与整合已经完成到“可构建、可打包、可继续维护”的阶段：

| 项目 | 状态 | 说明 |
|------|------|------|
| 主入口拆分 | 已完成 | `index.html` 已从 `index_moon.html` 拆出入口结构 |
| 主样式拆分 | 已完成 | 主样式与 CORE 样式集中在 `css/main.css` |
| 主逻辑拆分 | 已完成 | `js/i18n.js`、`js/ui.js`、`js/main.js`、shader 模块已拆分 |
| CORE 四页抽取 | 已完成 | `js/core-01.js` ~ `js/core-04.js` 已接入 CORE 子页 |
| Bundle 生成 | 已完成 | `tools/bundle.js` / `tools/build.js` 可生成 `js/bundle.js` |
| 静态校验 | 已完成 | `npm run build`、`node tools/verify.js`、`node --check` 均可通过 |

### 10.2 已发现的优先问题

| 优先级 | 问题 | 影响 |
|--------|------|------|
| P0 | CORE_01 仍查询旧 radio name `tilt` | “快速定位至月食发生点”无法正确切换到理想共面模式 |
| P0 | CORE 子页隐藏后仍继续 RAF 渲染 | 切页后不可见页面继续占用 CPU/GPU |
| P1 | Course 03 启动即创建 6 个 WebGL 上下文 | 首屏 GPU 压力大，移动端风险高 |
| P1 | 构建链路半自动 | 主站可从原始文件重建，CORE 模块更依赖现有抽取产物 |
| P2 | CSS 尚未变量化 | 主题覆盖和 CORE 样式继续膨胀会影响维护 |

### 10.3 本轮执行范围

本轮先做“稳定整合层”，不动 shader 算法和视觉大风格：

1. 新增本地集成检查脚本，锁定 CORE selector 与子页生命周期规则。
2. 修复 CORE_01 的 `core0-tilt` selector 改名遗漏。
3. 为 CORE 子页管理器增加 `start()` / `pause()` 调度。
4. 为 CORE_01 ~ CORE_04 的 RAF 循环增加可暂停机制。
5. 重新生成 `js/bundle.js` 并运行构建、语法、集成检查。

### 10.4 后续路线

| 阶段 | 目标 | 备注 |
|------|------|------|
| 第二轮 | Course 03 懒初始化 | 把主页面 6 个 WebGL 上下文改为按可见子页初始化 |
| 第三轮 | 构建链路整理 | 明确原始文件、抽取脚本、生产文件之间的单向关系 |
| 第四轮 | CSS 变量与响应式 | 统一主题 token，修移动端布局和安全区域 |
| 第五轮 | shader 与 WebGL 深优化 | 月球 shader 合并、Bloom 降采样、低端设备降级 |

### 10.5 本轮完成记录

已完成第一批 P0 修复：

| 项目 | 状态 | 说明 |
|------|------|------|
| CORE_01 selector 修复 | 已完成 | `input[name="tilt"]` 已改为 `input[name="core0-tilt"]` |
| CORE 子页生命周期 | 已完成 | manager 切页时调用当前页 `start()`，离开时调用 `pause()` |
| CORE RAF 暂停 | 已完成 | `core-01` ~ `core-04` 均保存 RAF id 并支持 `cancelAnimationFrame` |
| 集成检查脚本 | 已完成 | 新增 `tools/integration-check.js`，可通过 `npm run check-integration` 执行 |
| Bundle 更新 | 已完成 | 已重新生成 `js/bundle.js`，入口加载产物包含本轮修复 |

### 10.6 Course 03 轻量懒初始化完成记录

第二批 P1 修复已经完成，采用“首次可见时创建，离开后保留上下文”的轻量策略：

| 项目 | 状态 | 说明 |
|------|------|------|
| Course 03 初始化策略 | 已完成 | `MoonApp.init()` 不再启动即创建 6 个 Course 03 WebGL 上下文 |
| 子页按需创建 | 已完成 | 新增 `MoonApp.ensureCourse03Scene(index)`，进入对应子页时才创建上下文 |
| 上下文保留 | 已完成 | 已初始化的 Course 03 子页保留上下文，避免反复编译 shader |
| CORE 切页构建回归 | 已修复 | `tools/build.js` 生成的 `ui.js` 保留 `c4SubPage` 和 CORE 上/下一页逻辑 |
| 构建链路校验 | 已完成 | `tools/integration-check.js` 已覆盖 CORE 生命周期、CORE 切页、Course 03 懒初始化 |

### 10.7 构建链路整理完成记录

第三批维护性修复已经完成，目标是避免后续误改生成文件或误跑早期抽取脚本：

| 项目 | 状态 | 说明 |
|------|------|------|
| 构建说明 | 已完成 | 新增 `BUILD_PIPELINE.md`，明确原始文件、生成文件、手工维护文件 |
| Canonical build | 已完成 | 明确日常入口为 `npm run build` / `tools/build.js` |
| Legacy 脚本标记 | 已完成 | `extract-core*.js`、`merge-core-css.js`、`split_check.js`、`extract_css.js` 已加 legacy 提示 |
| 集成检查扩展 | 已完成 | `tools/integration-check.js` 已检查构建说明与 legacy 标记 |

### 10.8 CORE 控制台统一开关完成记录

本轮点击排查发现：左下角全局“打开/关闭控制台”只控制主页面 `lab-ui-container`，而 CORE_01 ~ CORE_04 各自还有独立控制台容器，进入 CORE 后会出现按钮文案与实际面板不一致的问题。

已完成统一入口修复：

| 项目 | 状态 | 说明 |
|------|------|------|
| 全局控制台可见性 | 已完成 | 新增 `MoonApp.applyConsoleVisibility()`，统一处理主控制台、文字层和 CORE 四个控制台 |
| CORE 页面判断 | 已完成 | 新增 `MoonApp.isCoreActive()`，仅在缩略模式且进度进入 CORE 段时显示 CORE 控制台 |
| 左下角总开关 | 已完成 | `toggleMenuDrawer()` 不再直接操作单个 DOM，而是切换 `menuVisible` 后调用统一入口 |
| CORE 切页同步 | 已完成 | `CoreSubpages.activate()` / `pauseAll()` 会刷新控制台可见性，避免上一页控制台残留 |
| 回归用例 | 已完成 | `tools/integration-check.js` 已模拟点击：主页面开关、CORE_01 开关、CORE_01 -> CORE_04 切换 |
| 真实浏览器验证 | 已完成 | 新增 `tools/real-browser-smoke.js`，使用本机 Chrome headed-no-sandbox 模式真实加载页面并点击验证控制台状态 |

下一步建议进入第四轮：CSS 变量与响应式整理，同时把 CORE 四页内部残留的本地控制台函数逐步降级为私有兼容逻辑，减少后续状态分叉。

---

## 十一、2026-06-03 性能优化轮

### 11.1 当前项目规模

| 指标 | 值 |
|------|-----|
| `index.html` | ~15KB |
| `css/main.css` | ~16KB |
| `js/bundle.js` | 338 KB / 6255 行 |
| 部署总大小 | ~370 KB（3 文件） |
| CORE 模块 (.js) | 4 个：core-01 ~ core-04，已打包进 bundle |
| WebGL 上下文 | 最多 7 个（1 orbiter + 6 Course 03 + 4 CORE 懒初始化） |

### 11.2 卡顿根因定位

经过逐行审计渲染循环，定位到以下导致卡顿的关键问题：

| 编号 | 问题 | 严重度 | 每帧影响 |
|------|------|--------|----------|
| A1 | **orbiter 在 CORE 模式中仍然渲染** | 高 | orbiter shader 每像素 raymarch 80 步 + 行星纹理生成 + 大气散射，完全被 CORE 子页面遮挡却仍在全速运行 |
| A2 | **CORE 模块 RAF 从不停止** | 高 | 4 个 CORE 模块的 `requestAnimationFrame` 全部跑在 `_paused` 无法被控制的状态，激活后永不取消 |
| A3 | **Course 03 DOM 写操作无缓存** | 中 | 每帧对 `lab-ui-container`、`text-svg-layer` 重复设置同样的 `display` 值 |
| A4 | **quality=0.8 降画质** | 低 | Course 03 场景以 80% 分辨率渲染，实际 GPU 节省非常有限 |

### 11.3 本轮已实施优化

| 优化 | 文件 | 改动 | 效果 |
|------|------|------|------|
| **orbiter CORE 跳过** | `js/main.js` | `if (!inCore)` 包裹 orbiter 全渲染管线（viewport/clear/uniforms/drawArrays） | CORE 模式下 orbiter shader 零开销 |
| **CORE RAF 可控** | `core-01~04.js` | 新增 `_mod.suspend()` / `_mod.resume()`，render 函数内 `if (!_paused)` 条件续帧 | 切页时自动暂停不可见模块的 RAF |
| **manager 生命周期** | `core-subpages-manager.js` | `start/pause` → `resume/suspend`，语义明确 | 离开 CORE 时 4 个模块全部暂停 |
| **DOM 写操作缓存** | `js/main.js` | `MoonApp._coreActive` 标志位，只在状态翻转时写 DOM | 减少每帧 2 次 DOM style 赋值 |
| **quality 1.0** | `js/main.js` | quality 因子 0.8 → 1.0 | Course 03 场景清晰度提升 |

### 11.4 渲染管道当前状态

经过本轮优化后，渲染循环路径如下：

```
每帧 render() 调用
├── SVG 弧线文字更新（始终执行，轻量 DOM 操作）
├── if (!inCore) → orbiter 完整渲染（非 CORE 模式：PiP 或全屏轨道仪）
│   ├── clear + 6 个 uniform 赋值 + drawArrays（raymarch shader）
│   └── 输出到 #glcanvas（z-index:1）
├── if (inCourse03) → Course 03 子场景（仅在课程 03 区间渲染）
│   ├── showC3: cityCtx + moonCtx（偏食城市+月球）
│   ├── showPenumbral: bridgeCtx + penumbralMoonCtx（半影大桥+月球）
│   └── showTotal: totalCityCtx(FBO) + totalMoonCtx（全食血月城市+月球）
├── if (inCore) → CORE 子页面管理
│   ├── CoreSubpages.activate(n) → resume 当前模块，suspend 上一个
│   └── 首次进入时隐藏 lab-ui-container + text-svg-layer
└── if (!inCore) → CoreSubpages.pauseAll() → suspend 所有 CORE 模块
```

### 11.5 后续优化建议

| 优先级 | 项 | 预计收益 |
|--------|-----|----------|
| P1 | Course 03 月球 shader 合并（3 个→1 个参数化） | 减少 shader 编译数，bundler 减小 ~15KB |
| P1 | 纹理预计算（orbiter 行星噪声提前 bake 到纹理） | 减少 fragment shader 中 fbm/crater 每像素迭代 |
| P2 | Course 03 scene opacity=0 时同时 `display:none` 其 canvas | 浏览器合成器可完全跳过该层 |
| P2 | 低端设备帧率自适应（检测 FPS < 30 时调低 shader 步数） | 移动端/集成显卡体验改善 |
| P3 | CSS 变量化主题系统 | 移除 ~80% `.theme-core` 覆盖规则，main.css 缩小 ~5KB |
| P3 | Google Fonts 自托管 | 避免被墙导致字体加载失败 |

### 11.6 CORE 子页面遗留问题

| 问题 | 状态 |
|------|------|
| CORE_02 物理直出按钮无视觉反馈 | 已改为直接 DOM 操作，待验证 |
| CORE_03 WebGL alpha+clearColor 修复 | 已完成（alpha:true + clearColor 0,0,0,0） |
| CORE_04 布局与原版不一致 | z-index/layout 修复已完成 |
| CORE 控制台 i18n 独立字典 | 可后续统一到主站 i18n.js |

---

## 十二、2026-06-03 CORE 交互全链路诊断

### 12.1 用户交互完整流程

```
用户打开页面
  └─→ orbiter 全屏渲染（canvas#glcanvas, z-index:1）
      └─→ 点击 Course 按钮 → setProgress(val) 驱动轨道仪推演
          └─→ 到达 Course 04/CORE 段 (progress ≥ 0.88)
              └─→ autoMini 触发，isThumbnail=true，进入 PiP 缩略模式
                  └─→ CoreSubpages.activate(0) 激活 CORE_01
                      ├─→ manager 设 .core-subpage opacity:1, pointer-events:auto
                      ├─→ core-01 模块懒初始化 WebGL
                      └─→ 用户通过 prev/next 切换 c4SubPage 0→1→2→3
```

### 12.2 DOM 层级架构（修复前）

```
<body> (background: #020a14)
  ├── #interaction-layer        z-index: 2  ← 全屏透明层，拦截所有鼠标事件！
  ├── canvas#glcanvas           z-index: 1  ← orbiter 画布
  ├── .core-subpage             z-index: 1  ← CORE页面，被压在下面！
  │   ├── #core2-interaction-layer  z-index: 2 (子级上下文)
  │   ├── #core2-lab-ui            z-index: 10
  │   ├── canvas                   z-index: 1
  │   └── svg#core2-text-svg-layer z-index: 5
  ├── #lab-ui-container         主控制台
  ├── .top-nav-bar              z-index: 50, pointer-events: none
  └── .bottom-tool-bar
```

### 12.3 CORE_03 四个 Bug 的根因

经过逐层排查（GitNexus 1427 symbols, 1635 edges, CLI 日志追踪），定位到所有 4 个问题共享同一个根因：

| Bug | 表象 | 根因 |
|-----|------|------|
| 按钮无法点击 | 点击【假设】【现实】【教会】【退行】无反应 | `#interaction-layer`(z-index:2) 在 `.core-subpage`(z-index:1) **上方**，所有鼠标事件被 orbiter 交互层拦截 |
| 模型无法旋转 | 拖拽无反应 | 同上，`#core2-interaction-layer` 的 mousedown 事件被 orbiter 层拦截 |
| 白道面文字不显示 | 只有黄道面文字可见 | `paint-order: stroke fill` 让 fill 盖住 stroke + CSS fill 与 stroke 同色 → 文字"溶入"背景 |
| 绝对物理基准文字模糊 | | 同上，4px 描边被 fill 覆盖后只剩极细残余 |

### 12.4 修复方案

| 修复 | 改动 | 原理 |
|------|------|------|
| **z-index 层级** | `.core-subpage` z-index: 1 → **3** | 跨过 `#interaction-layer`(z-index:2)，CORE 页面成为事件接收者 |
| **不透明遮盖** | `.core-subpage` 添加 `background: #0d0214` | CORE 页面背景不透明，完全遮盖下层 orbiter 画布 |
| **弧线文字** | 还原 `paint-order: stroke fill` + 深色stroke + 亮色fill | 描边在下方作为轮廓，亮色文字填充在上方 |
| **渲染更新** | `render()` 中添加 `updateTextArc(currentProgress)` | 按钮改变 targetProgress 后弧线路径同步更新 |
| **setProgress 链** | 模块本地 `toggleMenuDrawer` → `MoonApp.toggleMenuDrawer` | 消除对本地 `menuVisible` 变量的依赖 |
| **缩略图** | 删除 ui.js 中重复的 `toggleMini()` 调用 | 避免进入 CORE 时缩略图被意外关闭 |

### 12.5 修复后的 DOM 层级

```
<body>
  ├── .core-subpage             z-index: 3  ← CORE页面，最高层
  │   └── (内部子元素各自 z-index，在容器上下文中)
  ├── #interaction-layer        z-index: 2  ← orbiter 拖拽层，被 CORE 遮盖
  ├── canvas#glcanvas           z-index: 1  ← orbiter 画布，被 CORE 遮盖
  ├── #lab-ui-container         主控制台
  └── .top-nav-bar              z-index: 50, pointer-events: none
```

### 12.6 当前项目规模（更新）

| 指标 | 值 |
|------|-----|
| `index.html` | 15.5 KB |
| `css/main.css` | 16.3 KB |
| `js/bundle.js` | 337.0 KB, 6240 行 |
| 部署总大小 | 369 KB, 3 文件 |
| WebGL 上下文 | 懒初始化：1 orbiter + 按需 Course 03 (≤6) + 按需 CORE (≤4) |

### 12.7 已知遗留问题

| 优先级 | 问题 | 说明 |
|--------|------|------|
| P1 | CORE_02 物理直出按钮无视觉反馈 | setMode 调用正常但按钮 active 切换链需重新验证 |
| P1 | Course 03 6 个 WebGL 上下文同时创建 | 当前为按需懒初始化但未严格限制同时活跃数 |
| P2 | PiP 缩略图与 CORE 模式切换偶发冲突 | toggleMini 被 setProgress 调用时可能先退出再重进 PiP |
| P2 | 月球 shader 三份重复代码 | 偏食/半影/全食月球 shader 核心逻辑高度相似 (~15KB 可合并) |
| P3 | Google Fonts 外部加载 | 国内用户可能加载失败，建议自托管 |
| P3 | 移动端触摸事件缺失 | 仅支持 mouse 事件，移动端需 touch 事件 |

---

## 十三、2026-06-03 架构清理：class-based 显示切换

### 13.1 诊断发现

通过注入诊断日志，发现了一个关键 bug：

```
[MANAGER] container #core-subpage-2 set opacity:1 pointerEvents:auto 
[MANAGER] computed opacity: 0 pointerEvents: auto 
```

管理器设置 `style.opacity = '1'`（inline style），但浏览器 `getComputedStyle` 返回 `0`。

**根因**：`.core-subpage { opacity: 0; transition: opacity 0.4s ease; }` 的 CSS transition 在 inline style 变化时触发过渡动画。在 JavaScript 同步代码块中立即调用 `getComputedStyle` 时，浏览器返回过渡起始值 0 而非目标值 1。

虽然这不应该阻止子元素的 `pointer-events`（子元素各自有 `pointer-events: auto`），但容器本身 100vw×100vh 的透明区域在 z-index 竞争下让 orbiter 的 `#interaction-layer`(z-index:2) 有机会从下方穿透拦截事件。

### 13.2 修复方案：class-based 替代 inline style

| 文件 | 之前 | 之后 |
|------|------|------|
| `css/main.css` | `.core-subpage { opacity: 0; pointer-events: none; }` | 拆分为 `.core-subpage.inactive { opacity: 0; pointer-events: none; }` + `.core-subpage.active { opacity: 1; pointer-events: auto; }` |
| `index.html` | `<div class="core-subpage">` | `<div class="core-subpage inactive">` |
| `core-subpages-manager.js` | `style.opacity = '1'; style.pointerEvents = 'auto'` | `classList.remove('inactive'); classList.add('active')` |

### 13.3 交互流程确认

```
页面加载
  ├─ Course 01/02/03 按钮 → setProgress(val) → 驱动进度 → 自动 PiP
  │   ├─ Course 03: switchTopTab 切换 c3SubPage (0/1/2)
  │   │   └─ ensureCourse03Scene() 按需创建 WebGL 上下文
  │   └─ 上一页/下一页 操作 c3SubPage
  │
  └─ CORE 按钮 → setProgress(1.0) → 驱动进度到 0.88+
      ├─ autoMini: 1200ms 延迟后 toggleMini() → isThumbnail=true
      ├─ render 循环检测 inCore=true → CoreSubpages.activate(0)
      │   └─ 容器 class: inactive→active (opacity:1, pointer-events:auto, z-index:3)
      ├─ orbiter canvas+interaction-layer → display:none (CORE 模式)
      └─ switchTopTab 切换 c4SubPage (0/1/2/3)
          └─ 上一页/下一页 操作 c4SubPage

CORE_03 (subpage 2) 按钮链:
  onclick → CoreSubpages.setProgress(val, btn)
    → modules[2].setProgress(val, btn)
      → 改变 targetProgress → 驱动模型动画
      → 切换 .nav-btn active 状态
```

### 13.4 缩略图问题

缩略图由 `#top-nav-bar.pip-active` 控制。进入 PiP 模式后 `.pip-active` 使导航栏中的按钮可见。当前 autoMini 逻辑在进度到达目标后延迟 1200ms 触发 `toggleMini()`。

缩略图不显示可能原因：
- `applyConsoleVisibility` 中 `lab-ui-container` 被 `ui-hidden` 类隐藏，但这不影响缩略图（在不同容器中）
- orbiter canvas 被 `display:none` 后 PiP 缩略图也随之消失（canvas 是缩略图的渲染源）

**待修复**：CORE 模式下 orbiter canvas `display:none` 会同时隐藏 PiP 缩略图。需要改为仅隐藏全屏 orbiter canvas，保留缩略图渲染路径。
