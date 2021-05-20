// 组件的渲染流程
// 1.调用 Vue.component
// 2.内部用的是 Vue.extend 就是产生一个子类继承父类
// 3.创建子类实例时回调用父类的 _init 方法，再$mount即可
// 4.组件的初始化就是 new 这个组件的构造方法并且调用 $mount 方法
// 5.创建虚拟节点，根据标签筛选出组件对应，生成组件的虚拟节点，虚拟节点多了一个componentOptions属性，用来保存组件的构造函数和插槽，组件的属性中多了一个hook属性，并且包含组件的初始化方法
// 6.组件创建真实DOM时先渲染的时父组件，遇到是组件的虚拟节点时，去调用 init 方法，让组件初始化并挂载，组件的 $mount 无参数，会把渲染后的dom放到 vm.$el 上，vnode.componentInstance中，这样渲染时，就获取这个对象的 $el 属性来渲染
import { mergeOptions } from "../util"
export default function initExtend (Vue) {
  let cid = 0
  // 核心就是创造一个子类继承我们父类
  Vue.extend = function(extendOptions) {
    // todo:如果对象相同，应该复用做缓存
    const Super = this // this => Vue
    const Sub = function VueComponent(options) {
      this._init(options)
    }
    Sub.cid = cid++
    // 子类继承父类原型上的方法
    Sub.prototype = Object.create(Super.prototype)
    Sub.prototype.constructor = Sub
    Sub.options = mergeOptions(Super.options, extendOptions)
    Sub.components = Super.components

    // todo:处理其他属性 mixin component ...

    return Sub
  }
}