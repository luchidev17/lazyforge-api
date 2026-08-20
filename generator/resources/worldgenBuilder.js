/**
 * worldgenBuilder.js
 *
 * Genera archivos JSON de Datapack de Minecraft para generación de minerales (WorldGen).
 * Soporta reemplazo en piedra normal (stone_ore_replaceables) y pizarra profunda (deepslate_ore_replaceables).
 */

/**
 * Escribe las configuraciones de WorldGen (Configured y Placed Features) en el ZIP del mod.
 *
 * @param {Object} zip
 * @param {Array}  blocks
 * @param {string} modId
 */
export function writeWorldGenResources(zip, blocks = [], modId) {
  blocks.forEach(block => {
    if (!block.isOre) return

    const blockId      = block.id
    const veinSize     = block.veinSize || 8
    const veinsChunk   = block.veinsPerChunk || 8
    const minY         = block.minHeight ?? -64
    const maxY         = block.maxHeight ?? 30
    const targetTag    = block.oreType === 'deepslate' 
      ? 'minecraft:deepslate_ore_replaceables' 
      : 'minecraft:stone_ore_replaceables'

    // 1. Configured Feature JSON
    // Define qué bloque reemplaza a qué bloque y el tamaño de la veta.
    const configuredFeatureJson = {
      type: 'minecraft:ore',
      config: {
        size: veinSize,
        discard_chance_on_air_exposure: 0.0,
        targets: [
          {
            target: {
              predicate_type: 'minecraft:tag_match',
              tag: targetTag,
            },
            state: {
              Name: `${modId}:${blockId}`,
            },
          },
        ],
      },
    }

    // 2. Placed Feature JSON
    // Define dónde y con qué frecuencia aparece el mineral.
    const placedFeatureJson = {
      feature: `${modId}:${blockId}_ore`,
      placement: [
        {
          type: 'minecraft:count',
          count: veinsChunk,
        },
        {
          type: 'minecraft:in_square',
        },
        {
          type: 'minecraft:height_range',
          height: {
            type: 'minecraft:uniform',
            min_inclusive: {
              absolute: minY,
            },
            max_inclusive: {
              absolute: maxY,
            },
          },
        },
        {
          type: 'minecraft:biome',
        },
      ],
    }

    // Escribir los archivos en el ZIP del datapack con la ruta de recursos de Fabric
    const configuredPath = `src/main/resources/data/${modId}/worldgen/configured_feature/${blockId}_ore.json`
    const placedPath     = `src/main/resources/data/${modId}/worldgen/placed_feature/${blockId}_ore.json`

    zip.file(configuredPath, JSON.stringify(configuredFeatureJson, null, 2))
    zip.file(placedPath, JSON.stringify(placedFeatureJson, null, 2))
  })
}
