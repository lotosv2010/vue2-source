// 多对多的关系，一个属性有一个dep用来收集watcher的
// dep 可以存多个 watcher
// 一个 watcher 可以对应多个 dep
let id = 0
class Dep {
  constructor() {
    this.subs = []
    this.id = id++
  }
  depend() {
    // 我们希望 watcher 可以存放 dep
    // this.subs.push(Dep.target)
    // 实现双向记忆，让dep记住watcher的同时，也让watcher记住dep
    Dep.target.addDep(this)
  }
  notify() {
    this.subs.forEach(watcher => watcher.update())
  }
  addSub(watcher) {
    this.subs.push(watcher)
  }
}

Dep.target = null
let stack = []
export function pushTarget(watcher) {
  Dep.target = watcher // 保留watcher
  stack.push(watcher)
} 
export function popTarget() {
  stack.pop()
  Dep.target = stack[stack.length-1] // 保留删除
}
export default Dep