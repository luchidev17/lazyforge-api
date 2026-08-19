import { buildRecipeJson } from '../recipes/recipeBuilder.js'

// ─── Slab resources ───────────────────────────────────────────────────────────

/**
 * Escribe al ZIP todos los archivos de recursos para un bloque de tipo Losa (Slab):
 * texturas top/side, modelos bottom/top/double, blockstate y modelo del item.
 *
 * @param {Object} zip    - Instancia de JSZip
 * @param {Object} block  - El bloque de tipo slab
 * @param {string} modId
 * @param {Object} paths  - Objeto de rutas (resultado de buildPaths)
 */
function writeSlabResources(zip, block, modId, paths) {
  // Texturas
  if (block.slabTopTextureBase64) {
    zip.file(`${paths.texturesBlockDir}${block.id}_top.png`, block.slabTopTextureBase64, { base64: true })
  }
  if (block.slabSideTextureBase64) {
    zip.file(`${paths.texturesBlockDir}${block.id}_side.png`, block.slabSideTextureBase64, { base64: true })
  }

  const topTexture  = `${modId}:block/${block.id}_top`
  const sideTexture = `${modId}:block/${block.id}_side`
  const textures    = { bottom: topTexture, top: topTexture, side: sideTexture }

  // Modelos: bottom, top y double
  zip.file(`${paths.modelsBlockDir}${block.id}.json`, JSON.stringify({
    parent: 'minecraft:block/slab',
    textures,
  }, null, 2))

  zip.file(`${paths.modelsBlockDir}${block.id}_top.json`, JSON.stringify({
    parent: 'minecraft:block/slab_top',
    textures,
  }, null, 2))

  zip.file(`${paths.modelsBlockDir}${block.id}_double.json`, JSON.stringify({
    parent: 'minecraft:block/cube_column',
    textures: { end: topTexture, side: sideTexture },
  }, null, 2))

  // Blockstate
  zip.file(`${paths.blockstatesDir}${block.id}.json`, JSON.stringify({
    variants: {
      'type=bottom': { model: `${modId}:block/${block.id}` },
      'type=top':    { model: `${modId}:block/${block.id}_top` },
      'type=double': { model: `${modId}:block/${block.id}_double` },
    },
  }, null, 2))

  // Modelo del item (BlockItem)
  zip.file(`${paths.modelsItemDir}${block.id}.json`, JSON.stringify({
    parent: `${modId}:block/${block.id}`,
  }, null, 2))
}

// ─── Pillar resources ─────────────────────────────────────────────────────────

/**
 * Escribe al ZIP todos los archivos de recursos para un bloque de tipo Columna/Tronco (Pillar):
 * texturas top/side, modelo, blockstate (con ejes X/Y/Z) y modelo del item.
 *
 * @param {Object} zip    - Instancia de JSZip
 * @param {Object} block  - El bloque de tipo pilar
 * @param {string} modId
 * @param {Object} paths  - Objeto de rutas (resultado de buildPaths)
 */
function writePillarResources(zip, block, modId, paths) {
  // Texturas
  if (block.slabTopTextureBase64) {
    zip.file(`${paths.texturesBlockDir}${block.id}_top.png`, block.slabTopTextureBase64, { base64: true })
  }
  if (block.slabSideTextureBase64) {
    zip.file(`${paths.texturesBlockDir}${block.id}_side.png`, block.slabSideTextureBase64, { base64: true })
  }

  const topTexture  = `${modId}:block/${block.id}_top`
  const sideTexture = `${modId}:block/${block.id}_side`

  // Modelo del bloque
  zip.file(`${paths.modelsBlockDir}${block.id}.json`, JSON.stringify({
    parent: 'minecraft:block/cube_column',
    textures: { end: topTexture, side: sideTexture },
  }, null, 2))

  // Blockstate
  zip.file(`${paths.blockstatesDir}${block.id}.json`, JSON.stringify({
    variants: {
      'axis=y': { model: `${modId}:block/${block.id}` },
      'axis=z': { model: `${modId}:block/${block.id}`, x: 90 },
      'axis=x': { model: `${modId}:block/${block.id}`, x: 90, y: 90 },
    },
  }, null, 2))

  // Modelo del item (BlockItem)
  zip.file(`${paths.modelsItemDir}${block.id}.json`, JSON.stringify({
    parent: `${modId}:block/${block.id}`,
  }, null, 2))
}

// ─── Standard block resources ─────────────────────────────────────────────────


/**
 * Escribe al ZIP todos los archivos de recursos para un bloque estándar:
 * textura, modelo cube_all, blockstate y modelo del item.
 *
 * @param {Object} zip    - Instancia de JSZip
 * @param {Object} block  - El bloque estándar
 * @param {string} modId
 * @param {Object} paths  - Objeto de rutas (resultado de buildPaths)
 */
function writeStandardBlockResources(zip, block, modId, paths) {
  if (block.textureBase64) {
    zip.file(`${paths.texturesBlockDir}${block.id}.png`, block.textureBase64, { base64: true })
  }

  zip.file(`${paths.modelsBlockDir}${block.id}.json`, JSON.stringify({
    parent: 'minecraft:block/cube_all',
    textures: { all: `${modId}:block/${block.id}` },
  }, null, 2))

  zip.file(`${paths.blockstatesDir}${block.id}.json`, JSON.stringify({
    variants: { '': { model: `${modId}:block/${block.id}` } },
  }, null, 2))

  zip.file(`${paths.modelsItemDir}${block.id}.json`, JSON.stringify({
    parent: `${modId}:block/${block.id}`,
  }, null, 2))
}

// ─── Loot table ───────────────────────────────────────────────────────────────

/**
 * Escribe al ZIP la loot table de un bloque (si tiene drops).
 *
 * @param {Object} zip   - Instancia de JSZip
 * @param {Object} block - El bloque
 * @param {string} modId
 * @param {Object} paths - Objeto de rutas
 */
function writeLootTable(zip, block, modId, paths) {
  if (block.dropType === 'nothing') return

  let dropItem = `${modId}:${block.id}`
  if (block.dropType === 'custom' && block.customDrop) {
    dropItem = block.customDrop.startsWith('mod:')
      ? `${modId}:${block.customDrop.substring(4)}`
      : block.customDrop
  }

  const lootTableJson = {
    type: 'minecraft:block',
    pools: [{
      rolls: 1,
      entries: [{ type: 'minecraft:item', name: dropItem }],
    }],
  }
  zip.file(`${paths.lootTableDir}${block.id}.json`, JSON.stringify(lootTableJson, null, 2))
}

// ─── Tool tags ────────────────────────────────────────────────────────────────

/**
 * Escribe al ZIP los archivos de tags de herramientas (pickaxe, axe, shovel)
 * para los bloques que los requieren.
 *
 * @param {Object} zip    - Instancia de JSZip
 * @param {Array}  blocks - Todos los bloques del mod
 * @param {string} modId
 * @param {Object} paths  - Objeto de rutas
 */
function writeToolTags(zip, blocks, modId, paths) {
  const toolMap = {
    pickaxe: paths.tagsPickaxe,
    axe:     paths.tagsAxe,
    shovel:  paths.tagsShovel,
  }

  Object.entries(toolMap).forEach(([tool, tagPath]) => {
    const matchingBlocks = blocks
      .filter(b => b.requiredTool === tool)
      .map(b => `${modId}:${b.id}`)

    if (matchingBlocks.length > 0) {
      zip.file(tagPath, JSON.stringify({ replace: false, values: matchingBlocks }, null, 2))
    }
  })
}

// ─── Stairs resources ─────────────────────────────────────────────────────────

/**
 * Escribe al ZIP todos los archivos de recursos para un bloque de tipo Escalera (Stairs):
 * texturas top/side, modelos (recto, interior, exterior), blockstate y modelo del item.
 *
 * @param {Object} zip    - Instancia de JSZip
 * @param {Object} block  - El bloque de tipo escalera
 * @param {string} modId
 * @param {Object} paths  - Objeto de rutas
 */
function writeStairsResources(zip, block, modId, paths) {
  // Texturas
  if (block.slabTopTextureBase64) {
    zip.file(`${paths.texturesBlockDir}${block.id}_top.png`, block.slabTopTextureBase64, { base64: true })
  }
  if (block.slabSideTextureBase64) {
    zip.file(`${paths.texturesBlockDir}${block.id}_side.png`, block.slabSideTextureBase64, { base64: true })
  }

  const topTexture  = `${modId}:block/${block.id}_top`
  const sideTexture = `${modId}:block/${block.id}_side`
  const textures    = { bottom: topTexture, top: topTexture, side: sideTexture }

  // Modelos del bloque (recto, interior y exterior)
  zip.file(`${paths.modelsBlockDir}${block.id}.json`, JSON.stringify({
    parent: 'minecraft:block/stairs',
    textures,
  }, null, 2))

  zip.file(`${paths.modelsBlockDir}${block.id}_inner.json`, JSON.stringify({
    parent: 'minecraft:block/inner_stairs',
    textures,
  }, null, 2))

  zip.file(`${paths.modelsBlockDir}${block.id}_outer.json`, JSON.stringify({
    parent: 'minecraft:block/outer_stairs',
    textures,
  }, null, 2))

  // Blockstate
  zip.file(`${paths.blockstatesDir}${block.id}.json`, JSON.stringify({
    variants: {
      'facing=east,half=bottom,shape=straight':  { model: `${modId}:block/${block.id}` },
      'facing=west,half=bottom,shape=straight':  { model: `${modId}:block/${block.id}`, y: 180 },
      'facing=south,half=bottom,shape=straight': { model: `${modId}:block/${block.id}`, y: 90 },
      'facing=north,half=bottom,shape=straight': { model: `${modId}:block/${block.id}`, y: 270 },
      'facing=east,half=bottom,shape=inner_left':   { model: `${modId}:block/${block.id}_inner`, y: 270 },
      'facing=east,half=bottom,shape=inner_right':  { model: `${modId}:block/${block.id}_inner` },
      'facing=west,half=bottom,shape=inner_left':   { model: `${modId}:block/${block.id}_inner`, y: 90 },
      'facing=west,half=bottom,shape=inner_right':  { model: `${modId}:block/${block.id}_inner`, y: 180 },
      'facing=south,half=bottom,shape=inner_left':  { model: `${modId}:block/${block.id}_inner`, y: 180 },
      'facing=south,half=bottom,shape=inner_right': { model: `${modId}:block/${block.id}_inner`, y: 270 },
      'facing=north,half=bottom,shape=inner_left':  { model: `${modId}:block/${block.id}_inner` },
      'facing=north,half=bottom,shape=inner_right': { model: `${modId}:block/${block.id}_inner`, y: 90 },
      'facing=east,half=bottom,shape=outer_left':   { model: `${modId}:block/${block.id}_outer`, y: 270 },
      'facing=east,half=bottom,shape=outer_right':  { model: `${modId}:block/${block.id}_outer` },
      'facing=west,half=bottom,shape=outer_left':   { model: `${modId}:block/${block.id}_outer`, y: 90 },
      'facing=west,half=bottom,shape=outer_right':  { model: `${modId}:block/${block.id}_outer`, y: 180 },
      'facing=south,half=bottom,shape=outer_left':  { model: `${modId}:block/${block.id}_outer`, y: 180 },
      'facing=south,half=bottom,shape=outer_right': { model: `${modId}:block/${block.id}_outer`, y: 270 },
      'facing=north,half=bottom,shape=outer_left':  { model: `${modId}:block/${block.id}_outer` },
      'facing=north,half=bottom,shape=outer_right': { model: `${modId}:block/${block.id}_outer`, y: 90 },
      'facing=east,half=top,shape=straight':  { model: `${modId}:block/${block.id}`, x: 180, uvlock: true },
      'facing=west,half=top,shape=straight':  { model: `${modId}:block/${block.id}`, x: 180, y: 180, uvlock: true },
      'facing=south,half=top,shape=straight': { model: `${modId}:block/${block.id}`, x: 180, y: 90, uvlock: true },
      'facing=north,half=top,shape=straight': { model: `${modId}:block/${block.id}`, x: 180, y: 270, uvlock: true },
      'facing=east,half=top,shape=inner_left':   { model: `${modId}:block/${block.id}_inner`, x: 180, y: 90, uvlock: true },
      'facing=east,half=top,shape=inner_right':  { model: `${modId}:block/${block.id}_inner`, x: 180, uvlock: true },
      'facing=west,half=top,shape=inner_left':   { model: `${modId}:block/${block.id}_inner`, x: 180, y: 270, uvlock: true },
      'facing=west,half=top,shape=inner_right':  { model: `${modId}:block/${block.id}_inner`, x: 180, y: 180, uvlock: true },
      'facing=south,half=top,shape=inner_left':  { model: `${modId}:block/${block.id}_inner`, x: 180, y: 180, uvlock: true },
      'facing=south,half=top,shape=inner_right': { model: `${modId}:block/${block.id}_inner`, x: 180, y: 270, uvlock: true },
      'facing=north,half=top,shape=inner_left':  { model: `${modId}:block/${block.id}_inner`, x: 180, uvlock: true },
      'facing=north,half=top,shape=inner_right': { model: `${modId}:block/${block.id}_inner`, x: 180, y: 90, uvlock: true },
      'facing=east,half=top,shape=outer_left':   { model: `${modId}:block/${block.id}_outer`, x: 180, y: 90, uvlock: true },
      'facing=east,half=top,shape=outer_right':  { model: `${modId}:block/${block.id}_outer`, x: 180, uvlock: true },
      'facing=west,half=top,shape=outer_left':   { model: `${modId}:block/${block.id}_outer`, x: 180, y: 270, uvlock: true },
      'facing=west,half=top,shape=outer_right':  { model: `${modId}:block/${block.id}_outer`, x: 180, y: 180, uvlock: true },
      'facing=south,half=top,shape=outer_left':  { model: `${modId}:block/${block.id}_outer`, x: 180, y: 180, uvlock: true },
      'facing=south,half=top,shape=outer_right': { model: `${modId}:block/${block.id}_outer`, x: 180, y: 270, uvlock: true },
      'facing=north,half=top,shape=outer_left':  { model: `${modId}:block/${block.id}_outer`, x: 180, uvlock: true },
      'facing=north,half=top,shape=outer_right': { model: `${modId}:block/${block.id}_outer`, x: 180, y: 90, uvlock: true }
    }
  }, null, 2))

  // Modelo del item (BlockItem)
  zip.file(`${paths.modelsItemDir}${block.id}.json`, JSON.stringify({
    parent: `${modId}:block/${block.id}`,
  }, null, 2))
}

// ─── Six Faces resources ──────────────────────────────────────────────────────

/**
 * Escribe al ZIP todos los archivos de recursos para un bloque con 6 caras distintas:
 * 6 texturas png, modelo del bloque mapeando las 6 caras, blockstate y modelo del item.
 *
 * @param {Object} zip    - Instancia de JSZip
 * @param {Object} block  - El bloque de 6 caras
 * @param {string} modId
 * @param {Object} paths  - Objeto de rutas (resultado de buildPaths)
 */
function writeSixFacesResources(zip, block, modId, paths) {
  if (block.faceUpTextureBase64) {
    zip.file(`${paths.texturesBlockDir}${block.id}_up.png`, block.faceUpTextureBase64, { base64: true })
  }
  if (block.faceDownTextureBase64) {
    zip.file(`${paths.texturesBlockDir}${block.id}_down.png`, block.faceDownTextureBase64, { base64: true })
  }
  if (block.faceNorthTextureBase64) {
    zip.file(`${paths.texturesBlockDir}${block.id}_north.png`, block.faceNorthTextureBase64, { base64: true })
  }
  if (block.faceSouthTextureBase64) {
    zip.file(`${paths.texturesBlockDir}${block.id}_south.png`, block.faceSouthTextureBase64, { base64: true })
  }
  if (block.faceEastTextureBase64) {
    zip.file(`${paths.texturesBlockDir}${block.id}_east.png`, block.faceEastTextureBase64, { base64: true })
  }
  if (block.faceWestTextureBase64) {
    zip.file(`${paths.texturesBlockDir}${block.id}_west.png`, block.faceWestTextureBase64, { base64: true })
  }

  // Modelo del bloque
  zip.file(`${paths.modelsBlockDir}${block.id}.json`, JSON.stringify({
    parent: 'minecraft:block/cube',
    textures: {
      particle: `${modId}:block/${block.id}_north`,
      down:     `${modId}:block/${block.id}_down`,
      up:       `${modId}:block/${block.id}_up`,
      north:    `${modId}:block/${block.id}_north`,
      south:    `${modId}:block/${block.id}_south`,
      west:     `${modId}:block/${block.id}_west`,
      east:     `${modId}:block/${block.id}_east`
    }
  }, null, 2))

  // Blockstate
  zip.file(`${paths.blockstatesDir}${block.id}.json`, JSON.stringify({
    variants: { '': { model: `${modId}:block/${block.id}` } }
  }, null, 2))

  // Modelo del item (BlockItem)
  zip.file(`${paths.modelsItemDir}${block.id}.json`, JSON.stringify({
    parent: `${modId}:block/${block.id}`
  }, null, 2))
}

// ─── Cross (Flower) resources ──────────────────────────────────────────────────

/**
 * Escribe al ZIP todos los archivos de recursos para un bloque de tipo Plano Cruzado (Cross):
 * textura, modelo cross, blockstate y modelo de item como item de inventario 2D.
 *
 * @param {Object} zip    - Instancia de JSZip
 * @param {Object} block  - El bloque de tipo cross
 * @param {string} modId
 * @param {Object} paths  - Objeto de rutas (resultado de buildPaths)
 */
function writeCrossBlockResources(zip, block, modId, paths) {
  if (block.textureBase64) {
    zip.file(`${paths.texturesBlockDir}${block.id}.png`, block.textureBase64, { base64: true })
  }

  // Modelo del bloque (parent: minecraft:block/cross)
  zip.file(`${paths.modelsBlockDir}${block.id}.json`, JSON.stringify({
    parent: 'minecraft:block/cross',
    textures: { cross: `${modId}:block/${block.id}` },
  }, null, 2))

  // Blockstate
  zip.file(`${paths.blockstatesDir}${block.id}.json`, JSON.stringify({
    variants: { '': { model: `${modId}:block/${block.id}` } },
  }, null, 2))

  // Modelo del item (como item plano de inventario)
  zip.file(`${paths.modelsItemDir}${block.id}.json`, JSON.stringify({
    parent: 'minecraft:item/generated',
    textures: { layer0: `${modId}:block/${block.id}` },
  }, null, 2))
}

// ─── Loot table ───────────────────────────────────────────────────────────────

/**
 * Escribe al ZIP todos los archivos de recursos relacionados con bloques:
 * texturas, modelos, blockstates, loot tables, tags de herramientas y recetas.
 *
 * También acumula las translation keys en el objeto `langData` provisto.
 *
 * @param {Object} zip       - Instancia de JSZip
 * @param {Array}  blocks    - Array de bloques del mod
 * @param {Object} modConfig - Configuración del mod
 * @param {Object} paths     - Objeto de rutas (resultado de buildPaths)
 * @param {Object} langData  - Objeto mutable donde se acumulan las translation keys
 */
export function writeBlockResources(zip, blocks, modConfig, paths, langData) {
  const modId = modConfig.id

  blocks.forEach(block => {
    // Recursos del bloque según su forma
    if (block.blockShape === 'slab') {
      writeSlabResources(zip, block, modId, paths)
    } else if (block.blockShape === 'pillar') {
      writePillarResources(zip, block, modId, paths)
    } else if (block.blockShape === 'stairs') {
      writeStairsResources(zip, block, modId, paths)
    } else if (block.blockShape === 'six_faces') {
      writeSixFacesResources(zip, block, modId, paths)
    } else if (block.blockShape === 'cross') {
      writeCrossBlockResources(zip, block, modId, paths)
    } else {
      writeStandardBlockResources(zip, block, modId, paths)
    }

    // Translation key
    langData[`block.${modId}.${block.id}`] = block.name

    // Loot table
    writeLootTable(zip, block, modId, paths)

    // Receta de crafteo (opcional)
    const recipeJson = buildRecipeJson(block.recipe, modId, `${modId}:${block.id}`)
    if (recipeJson) {
      zip.file(`${paths.recipeDir}${block.id}.json`, JSON.stringify(recipeJson, null, 2))
    }
  })

  // Tags de herramientas (se generan en bloque para todos los bloques juntos)
  writeToolTags(zip, blocks, modId, paths)
}
