/**
 * OCR 文字识别
 * 通过 uniCloud 云函数调用百度 OCR API 识别图片文字
 * @param {string[]} imagePaths - 图片临时路径数组（来自 uni.chooseImage）
 * @returns {Promise<string>} 识别出的文字
 */
export async function ocrRecognize(imagePaths) {
  // 1. 将图片转为 base64
  const base64List = await Promise.all(imagePaths.map(pathToBase64))

  // 2. 调用云函数识别
  const res = await uniCloud.callFunction({
    name: 'baidu-ocr',
    data: { images: base64List },
  })

  const result = res.result
  if (result.code !== 200) {
    throw new Error(result.error || 'OCR 识别失败')
  }

  return result.data.text
}

/**
 * 读取图片文件转为 base64 编码（不含 data:image 前缀）
 * @param {string} filePath - 图片路径
 * @returns {Promise<string>}
 */
function pathToBase64(filePath) {
  return new Promise((resolve, reject) => {
    const fs = uni.getFileSystemManager()
    fs.readFile({
      filePath,
      encoding: 'base64',
      success: (res) => resolve(res.data),
      fail: (err) => {
        console.warn('[ocr] FileReader 读取失败，尝试 plus.io 方式:', err.message)
        // fallback: 使用 plus.io 读取（兼容某些 App 环境）
        plusIoRead(filePath).then(resolve).catch(reject)
      },
    })
  })
}

/**
 * 备用读取方案：使用 plus.io.FileReader
 */
function plusIoRead(filePath) {
  return new Promise((resolve, reject) => {
    plus.io.resolveLocalFileSystemURL(
      filePath,
      (entry) => {
        entry.file((file) => {
          const reader = new plus.io.FileReader()
          reader.onloadend = (e) => {
            const base64 = e.target.result.split(',')[1] || ''
            resolve(base64)
          }
          reader.onerror = () => reject(new Error('图片读取失败'))
          reader.readAsDataURL(file)
        })
      },
      () => reject(new Error('无法访问图片文件'))
    )
  })
}
