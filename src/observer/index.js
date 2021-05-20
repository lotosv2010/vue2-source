import { arrayMethods } from "./array"
import Dep from "./dep"

class Observer {
  constructor(value) {
    // 给数组或对象添加一个dep
    this.dep = new Dep()
    // 使用defineProperty 重新定义属性
    // 判断一个对象是否被观测过，看他有没有 __ob__ 这个属性
    // 这里不能使用 value.__ob__ = this 这种写法，因为在 observeArray 中会遍历到 __ob__ ，会出现死循环
    Object.defineProperty(value, '__ob__', {
      enumerable: false, // 不可枚举
      configurable: false, // 不可修改
      value: this // this 是 Observer 实例
    })
    if (Array.isArray(value)) {
      // value.__proto__ = arrayMethods // es5写法
      Object.setPrototypeOf(value, arrayMethods) // es6写法
      // 观测数组中对象类型，对象变化也要被劫持
      // 数组中的普通类型是不做观测的
      this.observeArray(value)
    } else {
      this.walk(value)
    }
  }
  observeArray(data) {
    data.forEach(item => {
      observe(item) // 观测数组中的对象类型
    })
  }
  walk(data) {
    let keys = Object.keys(data)
    keys.forEach(key => {
      defineReactive(data, key, data[key])
    })
  }
}

function defineReactive(data, key, value) {
  // 如果值是对象类型递归进行观测
  let childDep = observe(value) // 获取到数组对应的dep

  // 每个属性都有一个dep
  let dep = new Dep()
  // 当页面取值时，说明这个值用来渲染了，将这个watcher和这个属性对应起来
  Object.defineProperty(data, key, {
    get() { // 依赖收集
      if(Dep.target) {
        // 让这个属性记住这个watcher
        dep.depend()
        if(childDep) {
          // 数组存起来了这个渲染watcher
          // 默认给数组或对象增加了一个dep属性，当对数组这个对象取值的时候
          childDep.dep.depend()
        }
      }
      // console.log(dep)
      // console.log(`用户获取了属性为 ${key} ,值为 ${value}`)
      return value
    },
    set(newValue) { // 依赖更新
      // console.log(`用户设置了属性为 ${key} ,值为 ${newValue}`)
      if (newValue === value) return
      // 如果用户将值改为对象则继续监控
      observe(newValue)
      value = newValue
      dep.notify() // 异步更新，防止频繁操作
    }
  })
}

export function observe(data) {
  // data 不能不是对象并且不为 null
  if (typeof data !== 'object' ||data == null) {
    return
  }
  // 防止属性被重复观测
  if (data.__ob__) {
    return data
  }
  return new Observer(data)
}