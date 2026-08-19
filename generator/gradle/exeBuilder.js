/**
 * exeBuilder.js  (versión servidor — Node.js)
 *
 * Construye el ejecutable final del mod como un Self-Extracting EXE:
 *
 *   1. Lee el exe base (build_mod.exe) desde el sistema de archivos local
 *   2. Toma el ZIP con los archivos del mod (generado en memoria)
 *   3. Adjunta el ZIP al final del binario con la firma de 16 bytes:
 *        [zip data][LZFG_ZIP — 8 bytes][zip size — 8 bytes little-endian]
 *   4. Retorna el Blob del exe resultante
 *
 * @param {Blob|ArrayBuffer} modZipBlob - ZIP con los archivos fuente del mod
 * @returns {Promise<Blob>} - Blob del ejecutable final listo para enviar al cliente
 */
import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const EXE_PATH  = path.join(__dirname, '..', '..', 'public', 'gradle-wrapper', 'build_mod.exe')

export async function buildModExe(modZipBlob) {
  // ── 1. Leer el exe base desde disco ──────────────────────────────────────
  if (!fs.existsSync(EXE_PATH)) {
    throw new Error(`build_mod.exe no encontrado en: ${EXE_PATH}`)
  }

  const nodeBuffer = fs.readFileSync(EXE_PATH)
  const exeBuffer  = nodeBuffer.buffer.slice(
    nodeBuffer.byteOffset,
    nodeBuffer.byteOffset + nodeBuffer.byteLength,
  )

  // Verificar cabecera PE (Windows): 'MZ'
  const header = new Uint8Array(exeBuffer.slice(0, 2))
  if (header[0] !== 0x4D || header[1] !== 0x5A) {
    throw new Error('build_mod.exe no es un ejecutable PE válido (falta cabecera MZ)')
  }

  // ── 2. Obtener los bytes del ZIP del mod ─────────────────────────────────
  const zipBuffer = modZipBlob instanceof ArrayBuffer
    ? modZipBlob
    : await modZipBlob.arrayBuffer()

  // ── 3. Construir la firma de 16 bytes ────────────────────────────────────
  // Formato: [LZFG_ZIP — 8 bytes ASCII][zip size — 8 bytes uint64 LE]
  const MAGIC      = new TextEncoder().encode('LZFG_ZIP') // 8 bytes
  const footer     = new ArrayBuffer(16)
  const footerView = new DataView(footer)

  new Uint8Array(footer).set(MAGIC, 0)

  const zipSize = zipBuffer.byteLength
  footerView.setUint32(8,  zipSize & 0xFFFFFFFF,        true) // low 32 bits
  footerView.setUint32(12, Math.floor(zipSize / 2**32), true) // high 32 bits

  // ── 4. Concatenar: [exe][zip][footer] ────────────────────────────────────
  const finalBlob = new Blob([exeBuffer, zipBuffer, footer], {
    type: 'application/octet-stream',
  })

  return finalBlob
}
