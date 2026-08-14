import sharp from 'sharp'
import { readdirSync, statSync } from 'fs'
import { join, extname, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..', 'public', 'washpaintingstyle')

function collectFiles(dir, exts = ['.png', '.jpg', '.jpeg', '.webp']) {
  const results = []
  const entries = readdirSync(dir)
  for (const entry of entries) {
    const fullPath = join(dir, entry)
    if (statSync(fullPath).isDirectory()) {
      results.push(...collectFiles(fullPath, exts))
    } else if (exts.includes(extname(fullPath).toLowerCase())) {
      results.push(fullPath)
    }
  }
  return results
}

async function convertToAvif(inputPath) {
  const outputPath = inputPath.replace(/\.(png|jpg|jpeg|webp)$/i, '.avif')
  const ext = extname(inputPath).toLowerCase()
  const opts = ext === '.webp' ? {} : { lossless: false, quality: 60 }

  console.log(`🔄 ${inputPath} → ${outputPath}`)
  await sharp(inputPath).avif(opts).toFile(outputPath)
  console.log(`✅ 完成: ${outputPath}`)
}

async function main() {
  const files = collectFiles(rootDir)
  console.log(`找到 ${files.length} 个文件待转换\n`)
  for (const file of files) {
    await convertToAvif(file)
  }
  console.log(`\n🎉 全部完成，共转换 ${files.length} 个文件`)
}

main().catch(console.error)