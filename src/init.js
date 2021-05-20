import { initState } from "./state"
import { compileToFunctions } from './compiler/index'
import { callHook, mountComponent } from "./lifesycle"
import { mergeOptions } from "./util"

export function initMixin (Vue) {
  Vue.prototype._init = function(options) {
    const vm = this
    // 需要将用户自定义options和全局的options做合并
    // vm.$options = options
    vm.$options = mergeOptions(vm.constructor.options, options)

    // vue里面的核心特性-->响应式数据原理
    // vue是一个怎么的框架 ，不是一个严格的MVVM框架，可以通过$ref操作DOM，不符合MVVM思想
    // MVVM：数据变化视图，视图变化数据会被影响，不能跳过数据去更新视图

    // 初始化状态(将数据做一个初始化的劫持，当我们改变数据时应更新视图)
    // vue组件中有很多状态 data props watch computed

    callHook(vm, 'beforeCreate')
    // !扩展功能在这里完成
    initState(vm) // 初始化状态

    callHook(vm, 'created')

    // !渲染逻辑
    // 如果当前有el属性说明要渲染模板
    if(vm.$options.el) { // 挂载的逻辑
      vm.$mount(vm.$options.el)
    }
    
  }

  Vue.prototype.$mount = function(el) {
    // 挂载操作
    const vm = this
    const options = vm.$options
    el = document.querySelector(el)
    vm.$el = el
    if (!options.render) {
      // 没有render，将template转换
      let template = options.template
      if (!template && el) {
        template = el.outerHTML
      }
      // 将模板编译成render函数
      const render = compileToFunctions(template)
      options.render = render // 最终渲染时都用的是这个render方法
    }

    // 挂载组件
    mountComponent(vm, el)
  }
}