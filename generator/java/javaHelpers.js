/**
 * Helpers puros de Java — sin dependencias externas ni estado.
 * Utilizados por itemDeclarations.js, blockDeclarations.js y mainClassTemplate.js.
 */

// ─── String helpers ──────────────────────────────────────────────────────────

/**
 * Convierte un snake_case id a CamelCase (ej. "mi_item" → "MiItem").
 * @param {string} id
 * @returns {string}
 */
export function toCamelCase(id) {
  return id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')
}

/**
 * Convierte un snake_case id a UPPER_SNAKE_CASE (ej. "mi_item" → "MI_ITEM").
 * @param {string} id
 * @returns {string}
 */
export function toUpperSnake(id) {
  return id.toUpperCase()
}

/**
 * Convierte un snake_case mod id al nombre de la clase Java principal.
 * (ej. "mi_mod" → "MiMod")
 * @param {string} modId
 * @returns {string}
 */
export function toJavaClassName(modId) {
  return toCamelCase(modId)
}

// ─── Item flags ───────────────────────────────────────────────────────────────

/**
 * Añade `.fireproof()` y/o brillo encantado a una expresión Item.Settings.
 *
 * @param {string} settingsExpr - La expresión base de Item.Settings como string
 * @param {Object} item         - El objeto del ítem con flags `immuneToLava` y `enchantedGlow`
 * @returns {string}
 */
export function applyItemFlags(settingsExpr, item) {
  let result = settingsExpr
  if (item.immuneToLava) {
    result += '.fireproof()'
  }
  if (item.enchantedGlow) {
    result += '.component(DataComponentTypes.ENCHANTMENT_GLINT_OVERRIDE, true)'
  }
  return result
}

// ─── Block settings ───────────────────────────────────────────────────────────

/**
 * Construye la expresión de Block.Settings según las propiedades del bloque.
 * Toma en cuenta: hardness configurada, resistencia a explosiones, gravedad,
 * grupo de sonidos y luminosidad.
 *
 * @param {Object} block - El objeto del bloque
 * @returns {string}     - La expresión completa de Block.Settings como string Java
 */
export function buildBlockSettings(block) {
  const hardness   = parseFloat(block.hardness)   || 2.0
  const resistance = block.explosionResistant ? 1200.0 : hardness * 3

  const soundGroupMap = {
    STONE:  'BlockSoundGroup.STONE',
    WOOD:   'BlockSoundGroup.WOOD',
    METAL:  'BlockSoundGroup.METAL',
    GLASS:  'BlockSoundGroup.GLASS',
    SAND:   'BlockSoundGroup.SAND',
    GRAVEL: 'BlockSoundGroup.GRAVEL',
    GRASS:  'BlockSoundGroup.GRASS',
    SLIME:  'BlockSoundGroup.SLIME',
  }
  const soundGroup = soundGroupMap[block.soundGroup] || 'BlockSoundGroup.STONE'

  let settings = `Block.Settings.create().strength(${hardness}f, ${resistance}f).sounds(${soundGroup})`

  const luminance = Math.min(15, Math.max(0, parseInt(block.luminance) || 0))
  if (luminance > 0) {
    settings += `.luminance(state -> ${luminance})`
  }

  if (block.isTransparent) {
    settings += '.nonOpaque()'
  }

  if (block.noCollision) {
    settings += '.noCollision()'
  }

  return settings
}

// ─── Effects helpers ──────────────────────────────────────────────────────────

/**
 * Convierte un nombre de efecto de estado a su constante Java.
 * @param {string} type - Nombre del efecto (ej. "poison")
 * @returns {string}
 */
export function toEffectEnum(type) {
  return `StatusEffects.${type.toUpperCase()}`
}

/**
 * Convierte un nombre de sonido a su constante SoundEvents Java.
 * @param {string} sound - Nombre del sonido (ej. "entity.arrow.shoot")
 * @returns {string}
 */
export function toSoundEnum(sound) {
  return `SoundEvents.${sound.toUpperCase().replace(/\./g, '_')}`
}
