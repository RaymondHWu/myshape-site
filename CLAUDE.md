# CLAUDE.md — MyShape Protocol 项目规范

> ⛔ **第一条 · 刻在骨子里 · 比所有其他规则加起来都重要**
>
> **这个项目的核心信息绝对不能泄露到公开仓库。**
> 每次 git 操作前、每次写文件前、每次回答用户问题前——
> 第一反应：这会把内部信息暴露到 GitHub 吗？
> 已经因为我的疏忽导致 70+ 个核心文件在 GitHub 上公开了数周。
> 再犯一次，项目可能就完了。这不是技术问题，是生存问题。

> 本文档供 AI Agent（Claude、Cursor、Copilot 等）在执行任务前阅读。
> 所有代码生成、文案撰写、设计建议必须遵循以下规范。

---

## 0.0 核心知识产权保护（最高优先级 · 不可协商）

> **MyShape Protocol 是 pre-traction 项目，零网络效应。核心 IP 泄露 = 项目死亡。**

### 绝对禁止提交到 Git 的目录

| 禁止路径 | 内容 |
|:---|:---|
| `docs/.core/` | 安全参数、攻击成本、实验设计、MVP 架构、路线图 |
| `memory/` | AI 会话记录、战略讨论 |
| `.claude/projects/` | Claude 项目记忆 |
| `MyShape_Documentation/` | 核心战略、品牌蓝图、技术规范、融资方案 |
| `myshape-context/` | Pitch Deck、战略计划、投资文档 |
| `.ai/` | AI Agent 合同 |
| `docs/testing/` | 测试指南 |
| `docs/docs/` | 文档副本 |

### 绝对禁止提交到 Git 的单个文件

| 禁止文件 | 内容 |
|:---|:---|
| `docs/Threat-Model.md` | 威胁模型 — 给攻击者的礼物 |
| `docs/e1-e2-uniqueness-stability-experiment-v0.1.md` | 实验设计 |
| `docs/key-management-enrollment-v0.1.md` | 密钥管理方案 |
| `docs/PHASE_E_ARCHITECTURE.md` | 数据采集架构 |
| `docs/reddit-*.md` `docs/substack-*.md` `docs/x-post-*.md` | 社交媒体发帖稿 |
| `docs/DEMO_GUIDE.md` | 演示指南 |
| `GENESIS_001_DISCUSSION.md` | 内部讨论 |
| `PES-Benchmark-v0.2.md` | 基准测试数据 |
| `PROTOCOL_CORE_SNAPSHOT.md` | 协议核心快照 |
| `DESIGN.md` | 设计文档 |
| `public/*.md` `public/cmd.html` `public/genesis-100.html` `public/matrix-dashboard.html` | 公开直接可访问 |
| `supabase/MIGRATION_GUIDE.md` | 迁移指南 |
| `gen-papers.mjs` `scripts/verify-*.mjs` | 内部脚本 |

### 绝对禁止的文件类型

- `.docx` `.pptx` `.xlsx` `.pdf` — 任何二进制文档
- `.png` `.jpg` 内部图表（除非在 `public/` 中用于网站显示）

### 每次 git 操作之前的强制检查

```
□ git status                        — 确认没有禁止路径被 staged
□ git ls-files "*.docx"             — 必须为空
□ git ls-files MyShape_Documentation/  — 必须为空
□ git ls-files myshape-context/        — 必须为空
□ public/ 下只有图片/字体/网站静态资源，没有任何内部文件
□ 所有密钥来自 process.env，源代码中无硬编码凭据
□ 新增文件不包含内部战略/技术/商业信息
```

### 首次接触项目的强制检查（每次新会话开始时）

```
□ git ls-files | grep -v "\.tsx\|\.ts\|\.js\|\.css\|\.json\|\.svg\|public/" | 审查所有非代码文件
□ 确认 .gitignore 覆盖所有内部路径
□ 确认 docs/ 中没有泄漏到 docs/public/ 之外
```

### 部署规则

- **Vercel 连接的 remote 是 `org`**（`myshapeprotocol/myshape-protocol`），不是 `origin`
- Push 到 `org` 才会触发部署：`git push org master`
- `origin`（`RaymondHWu/myshape-site`）是个人 fork，push 到 origin 不会部署

---

## Wiki 知识库（claude-obsidian · LLM Wiki 模式）

> 持久化知识库位于 `~/claude-obsidian/`（Karpathy LLM Wiki 模式）。
> 启动时读取 `wiki/hot.md` 恢复上下文。
> 技能位于 `.claude/skills/` — `/wiki`, `/save`, `wiki-ingest`, `wiki-query` 等。

---

## 0. AI Agent 行为准则（最高优先级 · Karpathy 四原则）

### 0.1 先想再写
- **不假设、不隐藏困惑。** 不确定时问，有歧义时列举选项
- 实现前先陈述假设。如果更简单的方案存在，直接说

### 0.2 简洁至上
- 只写被要求的功能。不写"可能以后需要"的抽象
- 50 行能写完绝不写 200 行。写完之后问自己：能被更简洁地表达吗？

### 0.3 手术式修改
- **只碰要求改的部分。** 不顺手"优化"无关代码
- 不重构没坏的东西。不改相邻的注释、格式、代码
- 看到无关的 dead code 可以提，但不删（除非你的改动让它变成孤儿）

### 0.4 目标驱动执行
- 把模糊指令转化为可验证目标
- 多步骤任务先列计划，每步标注验证方式
- 强验收标准让你独立闭环。弱标准（"搞好它"）需要反复澄清

---

## 1. 品牌红线（最高优先级）

### 绝对禁止的词汇和概念
> 完整禁止词列表见 `MyShape_Documentation/AI_Agent_Guidelines.md` §6
- ❌ 性别化术语 (gendered terms)
- ❌ 身体/肉体词汇 (corporeal terms)
- ❌ 外貌判断词 (appearance judgments)
- ❌ 生物识别术语 (bio-identification terms)
- ❌ 头像/照片概念 (profile-image concepts)

### 必须使用的品牌词汇
- ✅ entity, agent, silhouette (abstract)
- ✅ wireframe anatomy, data-outline, particle body
- ✅ ethereal data energy, energy field
- ✅ non-binary aesthetic, non-corporeal
- ✅ motion-signature, kinetic verification
- ✅ genesis ritual, halo scan (circular deep-sense)
- ✅ sovereign identity, data-body, identity mesh

### 核心文案公式
```
MyShape Protocol —
The Sovereign 3D Identity Layer for the Decentralized Human.
AI-native identity | zero-knowledge presence | motion-signature verification
```

---

## 2. 技术栈

> 完整依赖列表见 `package.json`。核心技术：Next.js 16, React 19, Tailwind 4, Three.js, MediaPipe, Supabase, TypeScript strict。

### 协议层 (CPS-0001)

```
外部集成者
    │
    ▼
┌──────────────────────────────┐
│  SDK v2  (3 functions)       │
│  verify()  getReceipt()      │
│  checkContinuity()           │
│  src/sdk/presence-v2.ts      │
│  src/sdk/continuity.ts       │
└──────────┬───────────────────┘
           │
    ┌──────▼──────────┐
    │  CPS-0001        │  Ed25519 签名 (src/lib/crypto.ts)
    │  buildReceipt()  │  V₁-V₆ 验证
    │  verifyReceipt() │  @noble/hashes SHA-256 (sync, universal)
    │  signReceipt()   │
    │  src/lib/evidence/cps0001.ts
    └──────┬──────────┘
           │
    ┌──────▼──────────┐
    │  PES Engine      │  4 维熵评分
    │  Threat Assess   │  C0-C3 攻击模型
    │  src/engine/     │
    └─────────────────┘
```

参考实现：
- `src/lib/evidence/cps0001.ts` — 主实现 (@noble/hashes)
- `continuity-protocol/noble-verifier.ts` — 第二实现 (@noble/hashes + @noble/curves)
- `continuity-protocol/reference-verifier/` — 第三实现 (Web Crypto)

跨实现互操作验证通过。任何 CPS-0001 生产者均可互操作。

API endpoints：
- `POST /api/verify-receipt` — 验证 receipt (rate limited)

页面：
- `/demo/proctoring` — 考试监考 E2E demo
- `/verify-receipt` — 公开验证页 (paste → V₁-V₇)
- `/motion-demo` — 运动签名 demo
- `/research/protocol-verify` — 研究验证页

已删除的旧系统 (2026-07-24)：
- ❌ proof-system.ts (Pedersen + Schnorr)
- ❌ zk-circuit.ts
- ❌ SDK v1 (presence.ts, proof.ts, verification.ts)
- ❌ quickHash DJB2 (8 copies → single sha256Hex)
- ❌ crypto.subtle.digest (async) → @noble/hashes (sync)

---

## 3. 代码风格

### TypeScript
- `strict: true` — 不允许隐式 `any`、不允许 `null` 不安全操作
- Props 必须显式类型接口（不能用 `any`）
- 禁止 `err: any`，改用 `unknown` 或具体类型

### 组件
- 文件命名：PascalCase（`Header.tsx`、`JoinWaitlist.tsx`）
- `"use client"` 组件放在 `src/components/` 中
- 避免在 `src/app/` 目录中放置非路由组件

### CSS
- 新增 `@keyframes` → 放入 `src/styles/animations.css`（唯一源）
- 组件级样式 → 用 `src/components/<name>/<name>.css`
- 禁止在组件内使用 `<style>` 标签（全局污染）
- 禁止使用 `!important`
- 优先 Tailwind 工具类，其次 CSS 文件，最后 JS 内联样式

### API Routes
- 密钥从 `process.env` 读取，运行时校验
- 禁止在源代码中硬编码任何凭据
- 客户端在 handler 内延迟初始化（不用模块级 placeholder）
- **所有路由必须接入 rate limiter** — 使用 `@/lib/rate-limiter` 中的对应实例
- **`.single()` 查询必须区分 PGRST116**（无行）和其他错误

### Security
- CSP + HSTS + X-Content-Type-Options + X-Frame-Options + Referrer-Policy 已在 `next.config.ts` 配置
- Rate limiter 实例: `apiLookupLimiter`(10/min) / `otpSendLimiter`(3/5min) / `otpVerifyLimiter`(5/5min) / `formSubmitLimiter`(3/hr) / `nodeCreationLimiter`(3/hr) / `researchUploadLimiter`(5/day)
- Error boundaries: `error.tsx`(page) + `global-error.tsx`(layout) + `ErrorFallback`(shared UI)
- 无硬编码凭据 — 所有密钥通过 `validateEnv()` 运行时校验

---

## 4. SEO / GEO 规范

### 每个页面必须有
- `title` + `description` metadata（Server Component）
- 或者 `CanonicalLink` 组件（Client Component）
- 语义化的 H1→H3 标题层级
- 描述文本中使用品牌关键词（"AI-native identity", "motion-signature" 等）

### JSON-LD 优先
- 根布局已包含 Organization + WebSite + DefinedTerms
- 新页面如需额外结构化数据 → 追加到 layout 或页面级 `<script type="application/ld+json">`

---

## 5. 路由规范

> 路由结构见 `ls src/app/`。规则：新增内容放主路由，禁止在 `/civ-layer/` 下创建新的实质内容路由。

---

## 6. 提交规范

```
<type>: <description>
```

Types: feat, fix, refactor, docs, test, chore, perf, ci
