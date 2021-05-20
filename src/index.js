import { initGlobalApi } from "./global-api/index"
import { initMixin } from "./init"
import { initLifecycleMixin } from "./lifesycle"
import { initStateMixin } from "./state"
import { initRenderMixin } from "./vnode/index"

// 用 Vue 的构造函数， 创建组件
function Vue(options) {
  this._init(options) // 入口，初始化方法
}

// !封装成插件，扩展原型
initMixin(Vue)
// 混合生命周期渲染
initLifecycleMixin(Vue)

initRenderMixin(Vue)

initStateMixin(Vue)

initGlobalApi(Vue)
// 初始化方法
export default Vue