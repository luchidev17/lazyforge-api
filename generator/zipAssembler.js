import JSZip from 'jszip'

// ── Path builder ──────────────────────────────────────────────────────────────
import { buildPaths }               from './pathBuilder.js'

// ── Java generators ───────────────────────────────────────────────────────────
import { buildItemDeclarations }    from './java/itemDeclarations.js'
import { buildBlockDeclarations, buildCreativeTab } from './java/blockDeclarations.js'
import { buildEntityTypeDeclarations, writeEntityFiles, writeClientFile } from './java/entityClasses.js'
import { buildMainClassSource }     from './java/mainClassTemplate.js'
import { toJavaClassName }          from './java/javaHelpers.js'

// ── Resource writers ──────────────────────────────────────────────────────────
import { writeItemResources }       from './resources/itemResources.js'
import { writeBlockResources }      from './resources/blockResources.js'
import { addTabTranslation, writeLangFile } from './resources/langBuilder.js'
import { writeWorldGenResources }   from './resources/worldgenBuilder.js'

// ── Gradle writers ────────────────────────────────────────────────────────────
import { writeFabricModJson, writeGradleFiles } from './gradle/gradleFiles.js'
import { writeWrapperFiles }        from './gradle/wrapperLoader.js'

// ── EXE builder ───────────────────────────────────────────────────────────────
import { buildModExe }              from './gradle/exeBuilder.js'

/**
 * Orquesta la generación completa del mod y dispara la descarga
 * como un Self-Extracting EXE (un único archivo .exe).
 *
 * Flujo:
 *   1. Inicialización (ZIP interno, rutas, className)
 *   2. Generación de código Java (declaraciones + clase principal + entidades)
 *   3. Escritura de recursos JSON (ítems, bloques, lang)
 *   4. Archivos de configuración (fabric.mod.json, Gradle)
 *   5. Gradle Wrapper estático (gradlew, gradle-wrapper.jar, etc.)
 *   6. Generación del ZIP interno (en memoria, no se descarga)
 *   7. buildModExe: adjunta el ZIP al exe base → descarga como [ModName].exe
 *
 * @param {Array}  items      - Ítems del mod
 * @param {Object} modConfig  - Configuración del mod ({ id, name, tabIconBase64? })
 * @param {Array}  blocks     - Bloques del mod
 * @returns {Promise<void>}
 */
export async function generateModZip(
  items     = [],
  modConfig = { name: 'Mi Mod Personalizado', id: 'mimod' },
  blocks    = [],
  armors    = [],
) {
  const zip            = new JSZip()
  const modId          = modConfig.id
  const javaClassName  = toJavaClassName(modId)
  const paths          = buildPaths(modId)
  const allItems       = [...items, ...armors]
  const throwableItems = items.filter(i => i.category === 'Arrojadizo')
  const hasThrowable   = throwableItems.length > 0
  const transparentBlocks = blocks.filter(b => b.isTransparent || b.blockShape === 'cross')
  const needClientEntrypoint = hasThrowable || transparentBlocks.length > 0

  // ── 1. Código Java: declaraciones ────────────────────────────────────────────
  const itemDeclarations      = buildItemDeclarations(allItems, modId)
  const blockDeclarations     = buildBlockDeclarations(blocks)
  const entityTypeDeclarations = buildEntityTypeDeclarations(throwableItems)
  const { tabIconDeclaration, creativeTabBlock } = buildCreativeTab(modConfig, blocks, allItems)

  // ── 2. Código Java: clase principal ──────────────────────────────────────────
  const mainClassSource = buildMainClassSource({
    modId,
    items: allItems,
    blocks,
    itemDeclarations,
    blockDeclarations,
    entityTypeDeclarations,
    tabIconDeclaration,
    creativeTabBlock,
  })
  zip.file(`${paths.javaDir}${javaClassName}.java`, mainClassSource)

  // ── 3. Código Java: entidades (throwables) y cliente ─────────────────────────
  writeEntityFiles(zip, throwableItems, modId, javaClassName, paths.javaDir)
  writeClientFile(zip, throwableItems, transparentBlocks, modId, javaClassName, paths.javaDir)

  // ── 4. Recursos JSON ─────────────────────────────────────────────────────────
  const langData = {}
  addTabTranslation(langData, modId, modConfig.name)

  writeItemResources(zip, allItems, modConfig, paths, langData)
  writeBlockResources(zip, blocks, modConfig, paths, langData)
  writeLangFile(zip, langData, paths)
  writeWorldGenResources(zip, blocks, modId)

  // ── 5. Archivos de configuración ─────────────────────────────────────────────
  writeFabricModJson(zip, modConfig, javaClassName, needClientEntrypoint, paths)
  writeGradleFiles(zip, modId, paths)

  // ── 6. Gradle Wrapper estático (gradlew, gradle-wrapper.jar, etc.) ───────────
  await writeWrapperFiles(zip)

  // ── 7. Generar ZIP interno como Buffer (Node.js) ─────────────────────────
  const modZipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

  // ── 8. Construir Self-Extracting EXE ─────────────────────────────────────
  const exeBuffer = await buildModExe(modZipBuffer)

  // ── 9. Envolver el .exe en un ZIP final y retornar como Buffer ────────────
  // JSZip en Node.js necesita 'nodebuffer', no 'blob' (tipo browser)
  const outerZip = new JSZip()
  outerZip.file(`${modConfig.name}.exe`, exeBuffer)
  const outerBuffer = await outerZip.generateAsync({ type: 'nodebuffer' })
  return outerBuffer
}
