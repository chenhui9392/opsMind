---
trigger: always_on
---
## 一、核心开发原则

1. **基础原则**
   - 遵循 **SOLID**（单一职责、开闭、里氏替换、接口隔离、依赖倒置）、**DRY**（避免重复）、**KISS**（简洁至上）原则
   - 遵循 **OWASP 安全最佳实践**（如输入验证、SQL注入防护、XSS防护等）
   - 采用 **分层架构设计**，确保职责分离
   - 遵循 **Flux/Redux 单向数据** 原则（状态管理场景）
2. **技术栈规范**
   - **基础环境**：
   - 使用 **TypeScript** 作为主要开发语言；
   - 采用 **ES6+** 语法标准；
   - 使用 **Webpack/Vite** 作为构建工具；
   - 使用 **npm/yarn/pnpm** 管理依赖
   - **框架与库**：
     - **React**：使用 Hooks + Class Components（根据需求选择）
     - **Vue**：使用 Vue 3 + Composition API
     - **Angular**：遵循官方推荐的组件化架构
     - 状态管理：**Redux Toolkit** 或 **Vuex**
     - API 调用：**Axios** 或 **Fetch API**
     - UI 组件库：**Ant Design** / **Material-UI** 等
     - 测试工具：**Jest** + **React Testing Library** / **Vue Test Utils**
     - 代码规范工具：**ESLint** + **Prettier**
3. **最佳实践**：
   - **YAGNI 原则**：避免过度设计未明确需求的功能
   - **渐进式开发**：从小功能开始迭代，逐步完善
   - **文档先行**：在开发前编写 API 文档和组件说明

---

## 二、代码风格规范

1. **命名规范**：
   - **项目文件名**：全部采用小写方式， 以短横线分隔。例：my-project-name
   - **目录名**：
     - 参照项目命名规则， 以短横线分隔；
     - 有复数结构时，要采用复数命名法。例：docs、assets、components、utils、pages。
   - **图像文件名**：小写 + 短横线分隔，目录复数命名（如 components）
   - **单文件**：用小驼峰的形式表现
   - **组件命名**：
     - 组件类 / 接口名：采用 PascalCase（如 UserProfileCard）
     - 复杂组件拆分后的文件夹：以 kebab-case 形式命名
   - **函数 / 方法名、变量名（全局 / 局部）、参数名**： 统一采用 lowerCamelCase 风格，例：handleUserLogin、getApiData ()
   - **常量**： 采用 UPPER_SNAKE_CASE 风格，例：MAX_RETRY_TIMES、USER_STATUS_ACTIVE
   - **枚举名**：采用 UpperCamelCase 风格，枚举值采用 UPPER_SNAKE_CASE，例：UserStatusEnum（包含 USER_STATUS_NORMAL、USER_STATUS_DISABLED）
   - **禁止魔法值**： 所有未定义的数值、字符串字面量（如接口状态码、固定阈值、接口地址片段等）必须提取为常量或枚举
2. **注释规范**：
   - 使用JSDoc风格的注释为函数和类提供文档。
   - 复杂逻辑加必要注释，禁用无用注释
   - **组件级注释**：所有组件需添加注释说明组件用途
   - **方法级注释**：复杂业务方法需强制添加 JSDoc 注释，包含：
     - 方法功能描述
     - `@param` 参数说明
     - `@return` 返回值说明
     - `@throws` 异常说明（如有）
3. **代码格式化**：
   - 每行代码长度不超过80-100个字符
   - 依赖 **ESLint+Prettier** 自动格式化，禁用手动调整缩进 / 格式。
   - 单个函数 / 方法有效代码≤80 行

## 三、安全与性能规范

1. **安全性**：
   - 不暴露敏感信息，使用 HTTPS，定期更新依赖修复漏洞
   - 遵循 OWASP 输入验证，过滤 / 转义动态内容，禁止直接拼接至 eval/innerHTML 等
   - 校验所有输入源（表单、URL 参数、后端返回），防止 XSS / 注入攻击
   - 对用户输入进行 **XSS 过滤**（如使用 DOMPurify）
   - 避免直接拼接 SQL 字符串（后端需处理）
   - 使用 **Helmet** 设置安全 HTTP 头
   - 对敏感数据（如密码）进行加密传输和存储（如 JWT）
2. **性能**：
   - 优化DOM操作，减少重绘和重排。
   - 使用浏览器缓存策略来提高加载速度。
   - 避免在循环（如 for/forEach）中发起高频接口请求，优先采用批量请求、数据预加载或批量处理策略
   - 优化状态管理，避免频繁更新全局状态导致重复渲染
   - 非首屏资源（图片 / 静态资源）懒加载
   - 使用 React.memo 或 PureComponent 避免不必要的渲染
   - 对大数据列表使用 Virtualized Scrolling（如 react-virtualized）
   - 使用 Webpack Bundle Analyzer 优化打包体积
   - 避免在渲染函数中执行复杂计算，使用 useMemo（React）或 computed（Vue）缓存计算结果
3. **输入校验**：
   - 校验前端接收的所有数据（类型 / 格式），覆盖空值、超长字符等边界场景
   - 校验逻辑封装为独立工具函数，统一复用

---

## 四、扩展性设计规范

1. **组件化设计**：
   - 基于 React/Vue 实现组件化，组件独立、可测试、**Single Responsibility Principle**(单一职责)
   - 组件拆分为 **View Components**（UI 层）和 **Container Components**（逻辑层）
   - 组件之间通过props进行通信
   - **Props & State**：
     - 使用 **TypeScript 接口**明确定义 Props 类型
     - 避免直接修改 Props，应通过 useState 或状态管理工具更新数据
     - 使用**受控组件**（Controlled Components）管理表单输入
     - 避免在组件外直接操作 DOM，使用 useRef 或事件委托
   - **生命周期与副作用**：
     - **React**：使用 useEffect 处理副作用，明确依赖项
     - **Vue**：使用 onMounted、onUnmounted 等 Composition API
2. **状态管理规范**：
   - **Redux/Vuex**
     - Action Creators 必须返回 type 和 payload
     - Reducer 必须是**纯函数**，无副作用
     - 使用 **Immutable.js** 或 **immer** 确保状态不可变
     - 避免直接操作状态，通过 dispatch 触发更新
   - **Context API（React）**
     - 使用 React Context API 时，避免过度嵌套
     - Context Provider 应尽量靠近组件层级顶部
     - 使用 useContext 时提供默认值
3. **API 调用规范**：
   - **服务层封装**
     - API 调用必须封装在 **Service** 层（如 api/userService.ts）
     - 使用 **Axios** 创建全局实例，配置统一拦截器
     - 错误处理应统一在拦截器中捕获并抛出自定义错误
     - 使用 **TypeScript** 接口定义请求 / 响应数据结构（如 UserResponse）
   - **请求配置**
     - 设置超时时间（默认 10s）
     - 使用 **HTTP Status Code** 判断成功 / 失败
     - 避免在组件中直接调用 API，应通过 Service 层注入
4. **数据模型规范**：
   - **类型定义**
     - 使用 **TypeScript 接口 / 类型别名**定义数据结构
     - 避免使用 any 类型，强制类型推断
     - 对复杂对象使用 **Intersection Types** 或 **Union Types**
   - **数据转换**
     - 使用 **DTO（Data Transfer Object）转换** API 响应
     - 对数据进行**纯函数式转换**（如 mapApiResponseToUserModel）
     - 使用 **Lodash** 或 **Ramda** 进行数据处理
5. **测试规范**：
   - **单元测试**
     - 每个组件 / 服务必须有 **Jest 单元**测试
     - 测试覆盖率要求 ≥ 80%
     - 使用 **Mock Service Worker** 模拟 API 响应
     - 对异步操作使用 async/await 或 waitFor 断言
   - **端到端测试**
     - 使用 Cypress 或 Playwright 进行 E2E 测试
     - 测试关键用户流程（如注册、支付）
     - 使用 Page Object Pattern 管理测试代码
6. **模块化**：
   - 使用 ES6 模块，避免全局变量，复用模块作用域。
   - 设计 API 时考虑未来的扩展性，避免破坏性更改
   - 全局状态按业务拆分，状态操作统一暴露
   - 埋点封装为独立模块，统一管理上报接口
