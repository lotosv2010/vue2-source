// 拿到数组原型上的方法
let oldArrayProtoMethods = Array.prototype

// 继承数组的方法，即arrayMethods.__proto__ = oldArrayProtoMethods
export let arrayMethods = Object.create(oldArrayProtoMethods)

// 这7个方法会改变数组的状态，所以重写这写方法
let methods = [
  'push',
  'pop',
  'shift',
  'unshift',
  'reverse',
  'sort',
  'splice'
]

methods.forEach(method => {
  arrayMethods[method] = function(...args) {
    // 当调用数组我们劫持后的这个方法页面应该更新
    // 我要知道数组对应那个dep
    // console.log(`${method} 方法被调用了`)
    // this就是当前的数组，即Observer中的value
    const result = oldArrayProtoMethods[method].apply(this, arguments)
    let inserted;
    const ob = this.__ob__
    switch (method) {
      case 'push':
      case 'unshift':
        // 这两个方法都是新增数组选项，新增的内容可能是对象类型，应该再次进行劫持
        inserted = args
        break;
      case 'splice':
         inserted = args.slice(2)
        break;
      default:
        break;
    }
    if (inserted) { 
      // 如果存在新增选项
      // 则调用自身属性 __ob__ 中的observeArray方法进行数据劫持
      ob.observeArray(inserted)
    }
    // 通知数组更新
    ob.dep.notify()

    return result
  }
})