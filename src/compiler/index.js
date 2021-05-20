import { generate } from './generate'
import { parseHTML } from './parse'

export function compileToFunctions(template) {
  // html模板转换成render函数
  // 1.需要将html代码转化成 ast 语法书，
  // 可以用 ast 树来描述语言本身(描述代码)
  // 虚拟 DOM 是用对象来描述节点的
  let ast = parseHTML(template)
  // 2.优化静态节点
  // 3.通过这棵树，重新的生成代码
  let code = generate(ast)
  // 4.将字符串变成函数
  // 限制取值范围，通过with来进行取值，稍后调用render函数就可以通过改变this让这个函数内部取到结果
  const render = new Function(`with(this) { return ${code}}`)
  return render
}