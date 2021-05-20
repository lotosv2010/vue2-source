function updateProperties(vnode, oldProps = {}) {
  let el = vnode.el
  let newProps = vnode.data || {}

  // 1.老的有新的没有，删除
  for (const key in oldProps) {
    if (oldProps.hasOwnProperty(key)) {
      if(!(key in newProps)) {
        el.removeAttribute(key)
      }
    }
  }
  let newStyle = newProps.style || {}
  let oldStyle = oldProps.style || {}
  for (const key in oldStyle) {
    if (oldStyle.hasOwnProperty(key)) {
      if(!(key in newStyle)) {
        el.style[key] = ''
      }
    }
  }
  // 2.新的有，老的没有，添加
  // 3.新的有，老的也有，更新
  for(let key in newProps) {
    if(key === 'style') {
      let styles = newProps[key]
      for(let styleName in styles) {
        el.style[styleName] = styles[styleName]
      }
    } else if(key === 'class') {
      el.className = newProps[key]
    } else {
      el.setAttribute(key, newProps[key])
    }
  }
}

function createComponent(vnode) {
  // 调用hook中的init方法
  let i = vnode.data
  if((i = i.hook) && (i = i.init)) { // i 就是 init 方法
    console.log(vnode)
    i(vnode) // 内部回去 new 这个组件，会将实例挂载到 vnode 上
  }
  if(vnode.componentInstance) {
    return true
  }
}

function createElm(vnode) {
  let {tag, children, key, data, text} = vnode
  if(typeof tag == 'string') {

    // 组件渲染的结果，放到当前组件的实例上 vm.$el
    if(createComponent(vnode)) {
      return vnode.componentInstance.$el // 组件对应的dom元素
    }

    vnode.el = document.createElement(tag) // 渲染父级

    // 渲染属性
    // 只有元素才有属性
    updateProperties(vnode)
    children.forEach(child => {
      vnode.el.appendChild(createElm(child)) // 渲染子级
    })
  } else {
    vnode.el = document.createTextNode(text)
  }
  return vnode.el
}

// oldVNode 就是父级 id = 'app' 的 div
export function patch(oldVNode, vnode) {
  // 如果是组件这个 oldVNode 是个 undefined
  if(!oldVNode) {
    return createElm(vnode) // 这个vnode是组件中的内容
  }
  // 默认初始化时，是直接用虚拟节点创建出真实节点来，替换掉老节点
  // console.log(oldVNode, vnode)
  if(oldVNode.nodeType === 1) {
    // 将虚拟节点转换成真实节点
    let el = createElm(vnode) // 创建真实的DOM
    let parentElm = oldVNode.parentNode // 获取老的app的父级 => body
    parentElm.insertBefore(el, oldVNode.nextSibling) // 当前真实元素插入到app后面
    parentElm.removeChild(oldVNode) // 删除老的节点
    return el
  } else {
    // 更新的时候拿老的虚拟节点和新的虚拟节点做对比，将不同的地方更新真实dom
    // 1.比较两个元素的标签，标签不一样直接替换
    if(oldVNode.tag !== vnode.tag) {
      // 老的dom元素
      return oldVNode.el.parentNode.replaceChild(createElm(vnode), oldVNode.el)
    }
    // 2.标签一样
    // 文本节点的虚拟节点的tag都是undefined
    if(!oldVNode.tag) { // 文本对比
      if(oldVNode.text !== vnode.text) {
        return oldVNode.el.textContent = vnode.text
      }
    }

    // 3.标签一样并且需要开始比对标签的属性和子节点
    let el = vnode.el = oldVNode.el // 标签复用老节点
    // 更新属性，新的虚拟节点的属性和老的比较，去更新节点
    updateProperties(vnode, oldVNode.data)

    // 4.子级比较
    let oldChildren = oldVNode.children || []
    let newChildren = vnode.children || []
    // 4.1 老的有子级，新的没有子级，删除
    // 4.2 老的没有子级，新的有子级，添加
    // 4.3 老的有子级，新的也有子级，更新（diff）
    if(oldChildren.length > 0 && newChildren.length > 0) { // 4.3
      updateChildren(oldChildren, newChildren, el)
    } else if(oldChildren.length > 0) { // 4.1
      el.innerHTML = ''
    } else if(newChildren.length > 0) { // 4.2
      for(let i = 0; i < newChildren.length; i++) {
        let child = newChildren[i]
        el.appendChild(createElm(child))
      }
    }
  }
}

function isSameVnode(oldVnode, newVnode) {
  return (oldVnode.tag == newVnode.tag) && (oldVnode.key == newVnode.key)
}

// 子级间比较
function updateChildren(oldChildren, newChildren, parent) {
  // 开头指针
  let oldStartIndex = 0 // 老的索引
  let oldStartVnode = oldChildren[0] // 老的索引指向的节点
  // 结尾指针
  let oldEndIndex = oldChildren.length - 1
  let oldEndVnode = oldChildren[oldEndIndex]

  let newStartIndex = 0 // 新的索引
  let newStartVnode = newChildren[0] // 新的索引指向的节点
  let newEndIndex = newChildren.length - 1
  let newEndVnode = newChildren[newEndIndex]

  function makeIndexByKey(children) {
    let map = {}
    children.forEach((item, index) => {
      if(item.key) {
        map[item.key] = index
      }
    })
    return map
  }

  let map = makeIndexByKey(oldChildren)

  // 循环老的和新的，那个先结束，循环就停止，将多余的删除或添加进去
  while(oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
    if(!oldStartVnode) { // 说明指针指向了 null 跳过这个次处理
      oldStartVnode = oldChildren[++oldStartIndex]
    } else if(!oldEndVnode) {
      oldEndVnode = oldChildren[--oldEndIndex]
    }
    
    // todo:头与头比较
    if(isSameVnode(oldStartVnode, newStartVnode)) {
      patch(oldStartVnode, newStartVnode) // 递归更新属性和子节点
      // 指针向后移动一个
      oldStartVnode = oldChildren[++oldStartIndex]
      newStartVnode = newChildren[++newStartIndex]
    } else if(isSameVnode(oldEndVnode, newEndVnode)) { // todo:尾与尾比较
      patch(oldEndVnode, newEndVnode)
      oldEndVnode = oldChildren[--oldEndIndex]
      newEndVnode = newChildren[--newEndIndex]
    } else if(isSameVnode(oldStartVnode, newEndVnode)){ // todo:老的头与新的尾比较
      patch(oldStartVnode, newEndVnode)
      // 将当前元素插入到尾部的下一个元素的前面
      parent.insertBefore(oldStartVnode.el, oldEndVnode.el.nextSibling)
      oldStartVnode = oldChildren[++oldStartIndex]
      newEndVnode = newChildren[--newEndIndex]
    } else if(isSameVnode(oldEndVnode, newStartVnode)) { // todo:老的尾与新的头比较
      patch(oldEndIndex, newStartVnode)
      // 将当前元素插入到头部的前一个元素的前面
      parent.insertBefore(oldEndVnode.el, oldStartVnode.el)
      oldEndVnode = oldChildren[--oldEndIndex]
      newStartVnode = newChildren[++newStartIndex]
    } else {
      // 子组件之间没有关系
      // 暴力比对
      // 拿新的开头的虚拟节点的key去老的中找
      let moveIndex = map[newStartVnode.key]
      
      if(moveIndex == undefined) { // 老的中没有，不需要移动说明没有key复用的
        parent.insertBefore(createElm(newStartVnode), oldStartVnode.el)
      } else {
        // 这个老的虚拟节点需要移动
        let moveVNode = oldChildren[moveIndex]
        oldChildren[moveIndex] = null
        parent.insertBefore(moveVNode.el, oldStartVnode.el)
        // 比较属性和子级
        patch(moveVNode, newStartVnode)
      }
      //用新的不停的去老的里面找
      newStartVnode = newChildren[++newStartIndex]
    }
  }
  // 说明新的多了，要添加
  if(newStartIndex <= newEndIndex) {
    for (let i = newStartIndex; i<=newEndIndex; i++) {
      // 将新的多余的插入进去即可
      // parent.appendChild(createElm(newChildren[i]))

      // 向后插入 el = null
      // 向前插入 el = 当前想谁前面插入的元素
      let ele = newChildren[newEndIndex + 1] == null ? null : newChildren[newEndIndex + 1].el
      parent.insertBefore(createElm(newChildren[i]), ele)
    }
  }

  // 说明老的多了，要删除
  // 老的节点还没有处理，说明这些老的节点是不需要的节点
  // 如果这里面有 null 说明，这个节点已经被处理过了，跳过即可
  if(oldStartIndex <= oldEndIndex) {
    for (let i = oldStartIndex; i<=oldEndIndex; i++) {
      let child = oldChildren[i]
      if(child != undefined) {
        parent.removeChild(child.el)
      }
    }
  }
}

// vue渲染流程：
// 初始化数据
// 将模板进行编译
// 生成render函数
// 生成虚拟节点
// 生成真实的DOM
// 页面渲染