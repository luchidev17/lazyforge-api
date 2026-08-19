/**
 * Construye y retorna un objeto con todas las rutas de carpetas
 * que se usan dentro del ZIP generado para el mod.
 *
 * @param {string} modId - El identificador único del mod (ej. "mimod")
 * @returns {Object} Un objeto con todas las rutas necesarias
 */
export function buildPaths(modId) {
  const assetsBase = `src/main/resources/assets/${modId}`
  const dataBase   = `src/main/resources/data/${modId}`

  return {
    // Java source
    javaDir:          `src/main/java/com/${modId}/`,

    // Asset paths
    modelsItemDir:    `${assetsBase}/models/item/`,
    modelsBlockDir:   `${assetsBase}/models/block/`,
    blockstatesDir:   `${assetsBase}/blockstates/`,
    texturesItemDir:  `${assetsBase}/textures/item/`,
    texturesBlockDir: `${assetsBase}/textures/block/`,
    texturesArmorDir: `${assetsBase}/textures/models/armor/`,
    langDir:          `${assetsBase}/lang/`,

    // Data paths
    recipeDir:        `${dataBase}/recipe/`,
    lootTableDir:     `${dataBase}/loot_table/blocks/`,

    // Minecraft tags (vanilla namespace)
    tagsPickaxe: 'src/main/resources/data/minecraft/tags/block/mineable/pickaxe.json',
    tagsAxe:     'src/main/resources/data/minecraft/tags/block/mineable/axe.json',
    tagsShovel:  'src/main/resources/data/minecraft/tags/block/mineable/shovel.json',

    // Root config files
    fabricModJson:   'src/main/resources/fabric.mod.json',
    gradleProperties: 'gradle.properties',
    buildGradle:      'build.gradle',
    settingsGradle:   'settings.gradle',
  }
}
