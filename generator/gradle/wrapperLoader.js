/**
 * wrapperLoader.js  (versión servidor — Node.js)
 *
 * Lee y escribe al ZIP interno los archivos estáticos del Gradle Wrapper
 * directamente desde el sistema de archivos local del servidor.
 * (En el cliente original se hacía con fetch, aquí usamos fs.)
 *
 * @param {Object} zip - Instancia de JSZip (ZIP interno del mod)
 * @returns {Promise<void>}
 */
import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname    = path.dirname(fileURLToPath(import.meta.url))
const WRAPPER_BASE = path.join(__dirname, '..', '..', 'public', 'gradle-wrapper')

const WRAPPER_FILES = [
  'gradlew',
  'gradlew.bat',
  'gradle/wrapper/gradle-wrapper.jar',
  'gradle/wrapper/gradle-wrapper.properties',
]

export async function writeWrapperFiles(zip) {
  for (const file of WRAPPER_FILES) {
    const fullPath = path.join(WRAPPER_BASE, file)
    if (!fs.existsSync(fullPath)) {
      console.warn(`Gradle Wrapper: archivo no encontrado → ${fullPath}. Omitiendo.`)
      continue
    }
    const buffer = fs.readFileSync(fullPath)
    zip.file(file, buffer, { binary: true })
  }
}
