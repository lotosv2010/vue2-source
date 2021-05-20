import { isReservedTag } from "../util"

// 创建虚拟DOM
function vnode(tag, data, key, children, text, componentOptions) {
  return {
    tag,
    data,
    key,
    children,
    text,
    componentOptions // 组件的虚拟节点多了这个属性，用来保存组件的构造函数和插槽
  }
}

function createComponent(vm, tag, data, key, children, Ctor) {
  // Ctor 有可能是对象，也有可能是构造函数
  const baseCtor = vm.$options._base // Vue
  if(typeof Ctor == 'object') {
    Ctor = baseCtor.extend(Ctor)
  }
  // 给组件增加生命周期
  data.hook = {
    // 稍后初始化组件时，会调用此init方法
    init(vnode) {
      let child = vnode.componentInstance = new Ctor({})
      child.$mount() // 组件的 $mount 是不传递参数的
      // vnode.componentInstance.$el 指的是当前组件的真实dom
    }
  }
  return vnode(`vue-component-${Ctor.cid}-${tag}`, data, key, undefined, undefined, {Ctor, children})
}

// _c('div', {}, -v(), _c)
function createElement(vm, tag, data = {}, ...children) {
  // 如果是组件，产生虚拟节点时需要把组件的构造函数传入
  // new Ctor().$mount
  // 根据tag判断是不是组件
  
  if(isReservedTag(tag)) { // 原生标签
    return vnode(tag, data, data.key, children)
  } else { // 组件
    let Ctor = vm.$options.components[tag]
    // 创建组件的虚拟节点
    // children 组件的插槽
    return createComponent(vm, tag, data, data.key, children, Ctor)
  }
}
function createTextVnode(text) {
  return vnode(undefined, undefined, undefined, undefined, text)
}

export function initRenderMixin(Vue) {
  // 创建元素(虚拟dom)
  Vue.prototype._c = function() {
    return createElement(this, ...arguments)
  }
  // stringify
  Vue.prototype._s = function(val) {
    return val == null ? '' :
      typeof val == 'object' ?
        JSON.stringify(val) :
        val
  }
  // 创建文本元素(虚拟dom)
  Vue.prototype._v = function(text) {
    return createTextVnode(text)
  }
  Vue.prototype._render = function() {
    const vm = this
    const render = vm.$options.render
    let vnode = render.call(vm)
    // console.log(vnode)
    return vnode
  }
}