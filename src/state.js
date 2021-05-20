import Dep from "./observer/dep"
import { observe } from "./observer/index"
import Watcher from "./observer/wathcer"
import { nextTick, proxy } from "./util"

export function initState(vm) {
  const opts = vm.$options
  if (opts.props) {
    initProps(vm)
  }
  if (opts.methods) {
    initMethods(vm)
  }
  if (opts.data) {
    initData(vm)
  }
  if (opts.computed) {
    initComputed(vm)
  }
  if (opts.watch) {
    initWatch(vm)
  }
}

function initProps (vm) {}
function initMethods (vm) {}
/**
 * 数据初始化
 * @param {vue实例} vm 
 */
function initData(vm) {
  // 保存用户的所有的data
  let data = vm.$options.data
  // _data 作用是为了在vue实例上拿到劫持后的数据对象，_data代理当前函数的返回值
  vm._data = data = typeof data === 'function' ? data.call(vm) : data
  // 设置代理，将_data代理到vm上
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      proxy(vm, '_data', key)
    }
  }
  // 数据的劫持方案，对象 Object.defineProperty，数组 单独处理
  // 让这个对象重新定义 set 和 get
  observe(data)
}
function createComputedGetter(key) {
  // 此方法是包装的方法,每次取值会调用此方法
  return function () {
    // 获取到属性对应的watcher
    const watcher = this._computedWatchers[key]
    // 判断到底要不要执行用户传递的方法
    if(watcher) {
      // 默认肯定是脏的
      if(watcher.dirty) {
        // 执行
        watcher.evaluate() // 对向前watcher 求值
      }
      if(Dep.target) { // 说明还有渲染watcher，也应该一并收集起来
        watcher.depend()
      }
      return watcher.value // 默认返回watcher上存的值
    }
  }
}

function defineComputed(target, key, userDef) {
  const sharedPropertyDefinition = {
    enumerable: true,
    configurable: true,
    get: () => {},
    set: ()=> {}
  }
  if(typeof userDef == 'function') {
    sharedPropertyDefinition.get = createComputedGetter(key)
  } else {
    sharedPropertyDefinition.get = userDef.createComputedGetter(key)
    sharedPropertyDefinition.set = userDef.set
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
}

function initComputed(vm) {
  // 1.需要有watcher
  // 2.需要通过defineProperty
  // 3.dirty
  let computed = vm.$options.computed
  // console.log(computed)
  // 用来存放计算属性的watcher
  const watchers = vm._computedWatchers = {}
  for (const key in computed) {
    const userDef = computed[key]
    const getter = typeof userDef == 'function' ? userDef : userDef.get
    watchers[key] = new Watcher(vm,getter, () => {}, { lazy: true })
    defineComputed(vm, key, userDef)
  }
}

// options用来标识是用户watcher
function createWatcher(vm, exprOrFn, handler, options = {}) {
  if(typeof handler == 'object') {
    options = handler
    handler = handler.handler // 是一个函数
  }
  if(typeof handler == 'string') {
    handler = vm[handler] // 将实例方法作为handler
  }
  return vm.$watch(exprOrFn, handler, options)
}

function initWatch(vm) {
  let watch = vm.$options.watch
  for(let key in watch) {
    // handler 可能是数组、字符串、对象、函数
    const handler = watch[key]
    if(Array.isArray(handler)) { // 数组
      handler.forEach(handle => {
        createWatcher(vm, key, handler)
      })
    } else {
      createWatcher(vm, key, handler) // 字符串、对象、函数
    }
  }
}

export function initStateMixin (Vue) {
  Vue.prototype.$nextTick = function(cb) {
    nextTick(cb)
  }
  Vue.prototype.$watch = function(exprOrFn, cb, options) {
    // console.log(exprOrFn, handler, options)
    // 数据应该依赖这个 watcher，数据变化后应该让这个watcher重新执行
    let watcher = new Watcher(this, exprOrFn, cb, { ...options, user: true})
    if(options.immediate) {
      cb() // 如果是 immediate 回调函数立即执行
    }
  }
}