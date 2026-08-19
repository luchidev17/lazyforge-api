import { buildRecipeJson } from '../recipes/recipeBuilder.js'

/**
 * Escribe al ZIP todos los archivos de recursos relacionados con ítems:
 * - Textura PNG
 * - Modelo JSON (item/generated o item/handheld)
 * - Receta de crafteo (si existe)
 * - Icono del tab creativo personalizado (si existe)
 *
 * También acumula las translation keys en el objeto `langData` provisto.
 *
 * @param {Object} zip       - Instancia de JSZip
 * @param {Array}  items     - Array de ítems del mod
 * @param {Object} modConfig - Configuración del mod (id, name, tabIconBase64)
 * @param {Object} paths     - Objeto de rutas (resultado de buildPaths)
 * @param {Object} langData  - Objeto mutable donde se acumulan las translation keys
 */
export function writeItemResources(zip, items, modConfig, paths, langData) {
  const modId = modConfig.id

  items.forEach(item => {
    // Textura PNG
    if (item.textureBase64) {
      zip.file(`${paths.texturesItemDir}${item.id}.png`, item.textureBase64, { base64: true })
    }

    // Textura del Modelo 3D de la Armadura (layer_1/layer_2) en el juego
    if (item.category === 'Armadura' && item.layerTextureBase64) {
      const layerSuffix = item.slot === 'leggings' ? 'layer_2' : 'layer_1'
      // Minecraft busca la textura en textures/models/armor/[id]_layer_1.png o [id]_layer_2.png
      zip.file(`${paths.texturesArmorDir}${item.id}_${layerSuffix}.png`, item.layerTextureBase64, { base64: true })
    }

    // Modelo JSON
    const isHandheld = item.category === 'Herramienta/Arma'
    const modelJson = {
      parent: isHandheld ? 'item/handheld' : 'item/generated',
      textures: {
        layer0: `${modId}:item/${item.id}`,
      },
    }
    zip.file(`${paths.modelsItemDir}${item.id}.json`, JSON.stringify(modelJson, null, 2))

    // Translation key
    langData[`item.${modId}.${item.id}`] = item.name

    // Receta de crafteo (opcional)
    const recipeJson = buildRecipeJson(item.recipe, modId, `${modId}:${item.id}`)
    if (recipeJson) {
      zip.file(`${paths.recipeDir}${item.id}.json`, JSON.stringify(recipeJson, null, 2))
    }
  })

  // Icono del tab creativo personalizado (opcional)
  if (modConfig.tabIconBase64) {
    zip.file(`${paths.texturesItemDir}tab_icon_item.png`, modConfig.tabIconBase64, { base64: true })
    zip.file(`${paths.modelsItemDir}tab_icon_item.json`, JSON.stringify({
      parent: 'item/generated',
      textures: {
        layer0: `${modId}:item/tab_icon_item`,
      },
    }, null, 2))
    langData[`item.${modId}.tab_icon_item`] = 'Icono del Mod'
  }
}
