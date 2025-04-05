import fs from 'node:fs'
import { join } from 'pathe'

export async function getFilesInDirectory(dir: string) {
  const files = await fs.promises.readdir(dir)
  const filePaths = []

  for (const file of files) {
    const fullPath = join(dir, file)
    const stat = await fs.promises.stat(fullPath)

    if (stat.isFile()) {
      filePaths.push(fullPath)
    }
  }

  return filePaths
}
