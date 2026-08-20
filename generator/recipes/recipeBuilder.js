/**
 * recipeBuilder.js
 *
 * Construye el JSON de receta de crafteo (Shaped o Shapeless) para Minecraft 1.21.1.
 *
 * @param {Object|Array} recipe  - Objeto de receta con slots y opciones, o array de 9 slots
 * @param {string}       modId   - ID del mod (ej. 'mimod')
 * @param {string}       resultId - ID del ítem resultado (ej. 'mimod:mi_item')
 * @returns {Object|null} JSON de receta listo para serializar, o null si no hay receta válida
 */
export function buildRecipeJson(recipe, modId, resultId) {
  const slots = recipe ? (Array.isArray(recipe) ? recipe : recipe.slots) : null
  if (!slots || slots.length !== 9) return null

  const isShapeless = recipe.shapeless || recipe.type === 'shapeless'
  const count = (recipe.cantidad != null ? recipe.cantidad : recipe.resultCount) || 1

  if (isShapeless) {
    const ingredients = []
    slots.forEach((slot) => {
      if (slot && typeof slot === 'string' && slot.trim() !== '') {
        const ingredient = slot.trim()
        const finalIngredient = ingredient.startsWith('mod:')
          ? `${modId}:${ingredient.substring(4)}`
          : ingredient
        ingredients.push({ item: finalIngredient })
      }
    })
    if (ingredients.length === 0) return null

    return {
      type: 'minecraft:crafting_shapeless',
      ingredients,
      result: {
        id: resultId,
        count,
      },
    }
  } else {
    const keyMap = {}
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let letterIndex = 0

    // Identificar ingredientes únicos y asignar letras clave
    slots.forEach((slot) => {
      if (slot && typeof slot === 'string' && slot.trim() !== '') {
        const trimmedSlot = slot.trim()
        if (!keyMap[trimmedSlot]) {
          keyMap[trimmedSlot] = alphabet[letterIndex % alphabet.length]
          letterIndex++
        }
      }
    })

    // Construir patrón de 3 filas
    const pattern = []
    for (let i = 0; i < 3; i++) {
      let row = ''
      for (let j = 0; j < 3; j++) {
        const slot = slots[i * 3 + j]
        if (slot && typeof slot === 'string' && slot.trim() !== '') {
          row += keyMap[slot.trim()]
        } else {
          row += ' '
        }
      }
      pattern.push(row)
    }

    // Construir objeto key
    const key = {}
    Object.entries(keyMap).forEach(([ingredient, letter]) => {
      const finalIngredient = ingredient.startsWith('mod:')
        ? `${modId}:${ingredient.substring(4)}`
        : ingredient
      key[letter] = { item: finalIngredient }
    })

    return {
      type: 'minecraft:crafting_shaped',
      pattern,
      key,
      result: {
        id: resultId,
        count,
      },
    }
  }
}
