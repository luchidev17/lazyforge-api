/**
 * exeBuilder.js  (versión servidor — Node.js)
 *
 * Construye el ejecutable final del mod como un Self-Extracting EXE.
 * Trabaja exclusivamente con Buffer de Node.js para compatibilidad con JSZip.
 *
 * @param {Buffer|Uint8Array} modZipInput - ZIP con los archivos fuente del mod
 * @returns {Promise<Buffer>} - Buffer del ejecutable final listo para enviar al cliente
 */
import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const EXE_PATH  = path.join(__dirname, '..', '..', 'public', 'gradle-wrapper', 'build_mod.exe')

export async function buildModExe(modZipInput) {
  // ── 1. Leer el exe base desde disco como Buffer ───────────────────────────
  if (!fs.existsSync(EXE_PATH)) {
    throw new Error(`build_mod.exe no encontrado en: ${EXE_PATH}`)
  }

  const exeBuf = fs.readFileSync(EXE_PATH)

  // Verificar cabecera PE (Windows): 'MZ'
  if (exeBuf[0] !== 0x4D || exeBuf[1] !== 0x5A) {
    throw new Error('build_mod.exe no es un ejecutable PE válido (falta cabecera MZ)')
  }

  // ── 2. Normalizar el ZIP a Buffer ─────────────────────────────────────────
  let zipBuf
  if (Buffer.isBuffer(modZipInput)) {
    zipBuf = modZipInput
  } else if (modZipInput instanceof Uint8Array) {
    zipBuf = Buffer.from(modZipInput.buffer, modZipInput.byteOffset, modZipInput.byteLength)
  } else if (modZipInput instanceof ArrayBuffer) {
    zipBuf = Buffer.from(modZipInput)
  } else {
    // Blob u otro tipo con arrayBuffer()
    const ab = await modZipInput.arrayBuffer()
    zipBuf = Buffer.from(ab)
  }

  // ── 3. Construir footer de 16 bytes ──────────────────────────────────────
  // Formato: [LZFG_ZIP — 8 bytes ASCII][zip size — 8 bytes uint64 LE]
  const footerBuf = Buffer.alloc(16)
  footerBuf.write('LZFG_ZIP', 0, 8, 'ascii')
  const zipSize = zipBuf.byteLength
  footerBuf.writeUInt32LE(zipSize & 0xFFFFFFFF, 8)          // low 32 bits
  footerBuf.writeUInt32LE(Math.floor(zipSize / 2 ** 32), 12) // high 32 bits

  // ── 4. Concatenar: [exe][zip][footer] ────────────────────────────────────
  return Buffer.concat([exeBuf, zipBuf, footerBuf])
}
