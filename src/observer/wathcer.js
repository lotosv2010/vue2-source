import { nextTick } from "../util"
import { popTarget, pushTarget } from "./dep"

let id = 0
class Watcher {
  constructor(vm, exprOrFn, cb, options) {
    this.vm = vm // 实例
    this.exprOrFn = exprOrFn // vm._update(vm._render())
    this.cb = cb
    this.options = options
    this.user = options.user // 用户watcher
    this.lazy = options.lazy // 说明是一个计算属性
    this.dirty = this.lazy // 取值时是否执行用户传递的方法
    this.id = id++ // watcher的唯一标识
    this.deps = [] // watcher记录有多少dep依赖
    this.depsId = new Set()
    if(typeof exprOrFn == 'function') {
      this.getter = exprOrFn
    } else {
      // exprOrFn 可能传递过来的是一个字符串
      // 当去当前实例上取值时，才会触发依赖收集
      this.getter = function() {
        let path = exprOrFn.split('.') // 例如:a.a.a
        let obj = vm
        for(let i = 0; i < path.length; i++) {
          obj = obj[path[i]]
        }
        return obj
      }
    }
    // 默认会调用get方法,进行取值将结果保留下来
    this.value = this.lazy ? void 0 : this.get()
    // console.log(this.value)
  }
  addDep(dep){
    let id = dep.id
    if(!this.depsId.has(id)) {
      this.deps.push(dep)
      this.depsId.add(id)
      dep.addSub(this)
    }
  }
  get() {
    pushTarget(this)
    // 调用 exprOrFn，
    // 渲染页面就要取值，执行了get方法
    let result = this.getter.call(this.vm) 
    popTarget()
    return result
  }
  run() {
    let newValue = this.get() // 渲染watcher
    let oldValue = this.value
    this.value = newValue
    if(this.user) {
      this.cb.call(this.vm, newValue, oldValue)
    }
  }
  update() {
    if(this.lazy) { // 计算属性
      this.dirty = true // 页面重新渲染会获取最新的值
    } else {
      // 重新渲染
      // 这里不要每次都调用get方法，get方法会重新渲染
      queueWatcher(this)
      // this.get()
    }
  }
  evaluate() {
    this.value = this.get()
    // 取过一次之后，就表示成已经取过值了
    this.dirty = false
  }
  depend() {
    // 计算属性watcher 或存储 dep，dep会存储watcher

    // 通过 watcher 找到对应的所有dep，让所有的dep 都记住这个渲染 watcher
    let i = this.deps.length
    while(i--) {
      this.deps[i].depend() // 让dep去存储渲染watcher
    }
  }
}
// 将需要批量更新的watcher存到一个队列中，稍后让watcher执行
let queue = []
let has = {}
let pending = false

function flushSchedulerQueue() {
  queue.forEach(watcher => {
    watcher.run()
    if(!watcher.user) {
      watcher.cb()
    }
  })
  queue = [] // 清空watcher队列为了下次使用
  has = {} // 清空标识id
  pending = false
}

function queueWatcher(watcher) {
  const { id } = watcher
  if(has[id] == null) {
    queue.push(watcher)
    has[id] = true
    //  等待所有同步代码执行完毕后再执行
    // 如果还没有清空队列，就不要在开定时器了
    if(!pending) {
      nextTick(flushSchedulerQueue)
      pending = true
    }
  }
}

export default Watcher

// 0.在数据劫持的时候劫持的时候，定义defineProperty的时候，已经给每个属性增加了一个dep
// 1.首先把这个渲染watcher 放到了Dep.target属性上
// 2.开始渲染，取值的时候会调用get方法，需要让这个属性的dep存储当前的watcher
// 3.页面上所需要的属性都会将这个 watcher 存在自己的dep中
// 4.当属性更新了，就会重新调用渲染逻辑，通知自己存储的watcher来更新