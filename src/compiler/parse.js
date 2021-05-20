// 匹配属性
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/
// 标签名
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`
const qnameCapture = `((?:${ncname}\\:)?${ncname})`
// 标签开头的正则，捕获的内容是标签名
const startTagOpen = new RegExp(`^<${qnameCapture}`)
// 匹配标签结束的
const startTagClose = /^\s*(\/?)>/
// 匹配标签结尾的
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`)
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g


export function parseHTML(html) {
  function createASTElement(tagName, attrs) {
    return {
      tag: tagName, // 标签名
      type: 1, // 元素类型
      children: [], // 孩子列表
      attrs, // 属性集合
      parent: null // 父元素
    }
  }

  let root
  let currentParent
  let stack = [] // 用于校验标签的合法性
  
  function start(tagName, attrs) {
    let element = createASTElement(tagName, attrs)
    if(!root) {
      root = element
    }
    currentParent = element // 当前解析的标签保存起来
    stack.push(element)
  }

  // 在结尾标签处，创建父子关系
  function end(tagName) {
    let element = stack.pop() // 取出栈中的最后一个
    currentParent = stack[stack.length - 1] // 取出一个标签后，修改父级的标签
    if(currentParent) { // 在闭合时可以知道这个标签的父亲是谁
      element.parent = currentParent
      currentParent.children.push(element)
    }
  }
  function chars(text) {
    text = text.replace(/\s/g, '')
    if(text) {
      currentParent.children.push({
        type: 3,
        text
      })
    }
  }

  while(html) { // 只要 html 字符串不为空，就一直解析
    let textEnd = html.indexOf('<')
    if(textEnd == 0) {
      // 肯定是标签 
      // 处理开始标签
      const startTagMatch = parseStartTag() // 开始标签匹配的结果
      if(startTagMatch) {
        start(startTagMatch.tagName, startTagMatch.attrs)
        continue
      }
      // 处理结束标签
      const endTagMatch = html.match(endTag)
      if(endTagMatch) { // 结束标签
        advance(endTagMatch[0].length)
        end(endTagMatch[1])
        continue
      }
    }
    // 处理文本
    let text
    if(textEnd > 0 ) { // 是文本
      text = html.substring(0, textEnd)
    }
    if(text) { // 处理文本
      advance(text.length)
      chars(text)
    }
  }
  // 将字符串进行截取操作，再更新html内容
  function advance(n) {
    html = html.substring(n)
  }
  function parseStartTag() {
    const start = html.match(startTagOpen) // 匹配开头标签名
    if(start) {
      const match = {
        tagName: start[1], // 标签名
        attrs: [] // 属性
      }
      advance(start[0].length)
      // 如果是闭合标签，说明没有属性
      let end
      let attr
      // 不是结尾标签，又能匹配到属性
      while(!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
        match.attrs.push({
          name: attr[1],
          value: attr[3] || attr[4] || attr[5]
        })
        advance(attr[0].length)
      }
      if(end) {
        advance(end[0].length)
        return match
      }
    }
  }
  return root
}