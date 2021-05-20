import Watcher from "./observer/wathcer"
import { patch } from "./vnode/patch"

export function initLifecycleMixin(Vue) {
  Vue.prototype._update = function(vnode) {
    const vm = this
    const preVnode = vm._vnode
    // 这需要区分一下，到底是首次渲染还是更新
    if(!preVnode) { // 如果上一次的 vnode 不存在
      // 用新的元素替换老的
      // console.log(vnode)
      vm.$el = patch(vm.$el, vnode)
    } else {
      // 拿上一次的vnode和本次的做对比，diff算法
      vm.$el = patch(preVnode, vnode)
    }
    vm._vnode = vnode // 保存上一次的 vnode
  }
}

export function mountComponent(vm, el) {
  vm.$el = el
  // 调用 render 方法去渲染 el 属性
  // 先调用render方法创建虚拟节点，在将虚拟节点渲染到页面上
  callHook(vm, 'beforeMount')

  let updateComponent = () => {
    vm._update(vm._render())
  }

  // 目前 watcher 是用来渲染的，目前没有任何功能
  // 初始化就会创建watcher
  new Watcher(vm, updateComponent, () => {
    callHook(vm, 'updated')
  }, true)
  callHook(vm, 'mounted')
}

export function callHook(vm, hook) {
  const handlers = vm.$options[hook]
  if(handlers) {
    for (let i = 0; i < handlers.length; i++) {
      const handler = handlers[i];
      handler.call(vm) // 更改生命周期上的this
    }
  }
}