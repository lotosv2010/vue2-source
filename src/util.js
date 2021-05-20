
export const LIFECYCLE_HOOKS = [
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  'beforeDestroy',
  'destroyed',
  'activated',
  'deactivated',
  'errorCaptured',
  'serverPrefetch'
]
const starts = {}
// starts.data = function (parentVal, childVal) {
//   // 这里应该有合并 data 的策略
//   // return childVal
// }

starts.components = function(parentVal, childVal) {
  // console.log(parentVal, childVal)
  const res = Object.create(parentVal)
  if(childVal) {
    for (const key in childVal) {
      if (childVal.hasOwnProperty(key)) {
        const val = childVal[key];
        res[key] = val
      }
    }
  }
  return res
}

// todo:暂时不去实现
// starts.computed = function() {}
// starts.watch = function() {}

// 生命周期合并
function mergeHook(parentVal, childVal) { 
  if(childVal) {
    if(parentVal) {
      // 父子进行拼接
      return parentVal.concat(childVal)
    } else {
      return [childVal] // 子级需要转化成数组
    }
  } else {
    return parentVal // 不合并采用父级
  }
}

LIFECYCLE_HOOKS.forEach(hook => {
  starts[hook] = mergeHook
})

export function mergeOptions(parent, child) {
  // 遍历父级，可能父级有，子级没有
  const options = {}
  for(let key in parent) { // 父级子级都有在这里处理
    // console.log('1', key)
    mergeField(key)
  }
  // 自己有父级没有在这里处理
  for(let key in child) {
    if(!parent.hasOwnProperty(key)) {
      // console.log('2', key)
      mergeField(key)
    }
  }

  // 合并字段
  function mergeField(key) {
    // 根据 key 不同的策略进行合并
    if(starts[key]) {
      options[key] = starts[key](parent[key], child[key])
    } else {
      // todo: 默认合并
      if(child[key]) {
        options[key] = child[key]
      } else {
        options[key] = parent[key]
      }
    }
  }

  return options
}

export function proxy(vm, data, key) {
  Object.defineProperty(vm, key, { // vm.key
    get() {
      return vm[data][key] // vm._data.key
    },
    set(newValue) { // vm.key
      vm[data][key] = newValue // vm._data_key
    }
  })
}

let callbacks = []
let pending = false
function flushCallback() {
  // 让nextTick中传入的方法一次执行
  while(callbacks.length) {
    let cb = callbacks.pop()
    cb()
  }
  pending = false //  标识已经执行完毕,重置pending
}

let timerFunc

if(Promise) {
  timerFunc = () => {
    Promise.resolve().then(flushCallback) // 异步处理更新
  }
} else if(MutationObserver){ // 可以监控dom变化，监控完毕后是异步更新
  let observe = new MutationObserver(flushCallback)
  let textNode = document.createTextNode(1) // 先创建一个文本节点
  observe.observe(textNode, { characterData: true }) // 观测文本节点中的内容
  timerFunc = () => {
    textNode.textContent = 2 // 修改文本的内容
  }
} else if(setImmediate) {
  timerFunc =() => {
    setImmediate(flushCallback)
  }
} else {
  timerFunc = () => {
    setTimeout(flushCallback)
  }
}

// 因为内部会调用 nextTick，用户也会调用，但是异步只需执行一次
export function nextTick(cb) {
  callbacks.push(cb)
  // vue3 中的nextTick原理就是Promise.then 没有做兼容处理了
  if(!pending) {
    timerFunc()
    pending = true
  }
  // console.log(cb, pending)
}

function makeMap(str) {
  let mapping = {}
  const list = str.split(',')
  for (let i = 0; i < list.length; i++) {
    const tag = list[i];
    mapping[tag] = true
  }
  return (key) => {
    return mapping[key]
  }
}

export const isReservedTag = makeMap(
  `a,div,img,image,text,span,p,button,input,textarea,ul,li,header,footer`
)