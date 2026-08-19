/**
 * Centraliza la construcción del archivo de traducción `en_us.json`.
 *
 * El objeto langData se construye de forma incremental por los módulos
 * de recursos (itemResources, blockResources). Este módulo solo se encarga
 * de la translation key del tab creativo y de escribir el archivo final.
 */

/**
 * Añade la translation key del tab creativo al objeto langData.
 *
 * @param {Object} langData  - Objeto mutable de traducciones
 * @param {string} modId     - Identificador del mod
 * @param {string} modName   - Nombre del mod (valor de la traducción)
 */
export function addTabTranslation(langData, modId, modName) {
  langData[`itemGroup.${modId}.item_group`] = modName
}

/**
 * Serializa el objeto langData y lo escribe en el ZIP como `en_us.json`.
 *
 * @param {Object} zip      - Instancia de JSZip
 * @param {Object} langData - Objeto con todas las translation keys acumuladas
 * @param {Object} paths    - Objeto de rutas (resultado de buildPaths)
 */
export function writeLangFile(zip, langData, paths) {
  zip.file(`${paths.langDir}en_us.json`, JSON.stringify(langData, null, 2))
}
