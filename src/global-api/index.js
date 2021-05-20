import { mergeOptions } from '../util'
import initExtend from './extend'
export function initGlobalApi(Vue) {
  // Vue.components Vue.directive
  Vue.options = {}
  Vue.mixin = function(mixin) {
    // 合并对象，我们这里优先考虑生命周期，不考虑其他的合并 data computed watch
    this.options = mergeOptions(this.options, mixin)
    // console.log(this.options)
  }

  Vue.options._base = Vue
  Vue.options.components = {} // 全局组件

  initExtend(Vue)
  
  Vue.component = function (id, definition) {
    // Vue.extend: https://cn.vuejs.org/v2/api/#Vue-extend
    // 默认会以name属性为准
    definition.name = definition.name || id
    // 根据当前组件对象，生成了一个子类构造函数
    // 用的时候 new definition().$mount()
    definition = this.options._base.extend(definition)
    // Vue.component 注册组件等价于 Vue.options.components[id] = definition
    Vue.options.components[id] = definition
  }
}