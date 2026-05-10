/**
 * OCR 文字识别（mock 版本）
 * 后续替换为真实 OCR 服务调用
 * @param {string[]} imagePaths - 图片临时路径数组
 * @returns {Promise<string>} 识别出的文字
 */
export function ocrRecognize(imagePaths) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`张三 2024/1/15 14:30:22
今天天气真好啊

李四 2024/1/15 14:31:05
是啊，出去走走吧

张三 2024/1/15 14:31:30
好呀，去公园怎么样

李四 2024/1/15 14:32:15
行，下午两点出发

张三 2024/1/15 14:32:45
那我在小区门口等你

李四 2024/1/15 14:33:10
好的，不见不散`)
    }, 1500)
  })
}
