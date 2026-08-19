import { buildBlockSettings, toUpperSnake } from './javaHelpers.js'

// ─── Private helpers ──────────────────────────────────────────────────────────

/**
 * Determina qué instancia de Block crear según la forma y las propiedades del bloque.
 * @param {Object} block
 * @param {string} settings - La expresión Block.Settings ya construida
 * @returns {string}
 */
function buildBlockInstance(block, settings) {
  if (block.blockShape === 'slab') {
    return block.dealsDamage ? `new CustomDamageSlabBlock(${settings})` : `new SlabBlock(${settings})`
  }
  if (block.blockShape === 'pillar') {
    return block.dealsDamage ? `new CustomDamagePillarBlock(${settings})` : `new PillarBlock(${settings})`
  }
  if (block.blockShape === 'stairs') {
    return block.dealsDamage 
      ? `new CustomDamageStairsBlock(net.minecraft.block.Blocks.STONE.getDefaultState(), ${settings})` 
      : `new StairsBlock(net.minecraft.block.Blocks.STONE.getDefaultState(), ${settings})`
  }
  if (block.hasGravity) {
    return block.dealsDamage ? `new CustomFallingDamageBlock(${settings})` : `new CustomFallingBlock(${settings})`
  }
  if (block.cancelsFallDamage && block.hasBounce) {
    return `new CustomFallBounceBlock(${block.fallDamageModifier}F, ${block.bounceVelocity}F, ${settings})`
  }
  if (block.cancelsFallDamage) {
    return `new CustomFallDamageModifierBlock(${block.fallDamageModifier}F, ${settings})`
  }
  if (block.hasBounce) {
    return `new CustomBounceBlock(${block.bounceVelocity}F, ${settings})`
  }
  return block.dealsDamage ? `new CustomDamageBlock(${settings})` : `new Block(${settings})`
}


// ─── Creative tab ─────────────────────────────────────────────────────────────

/**
 * Genera la declaración Java del ícono del tab creativo personalizado,
 * cuando el usuario sube una imagen propia como icono del tab.
 * @returns {string}
 */
function buildTabIconDeclaration() {
  return `    public static final Item TAB_ICON_ITEM = Registry.register(
        Registries.ITEM,
        Identifier.of(MOD_ID, "tab_icon_item"),
        new Item(new Item.Settings())
    );`
}

/**
 * Determina el ícono del tab creativo basado en la configuración del mod.
 * @param {Object}  modConfig
 * @param {Array}   blocks
 * @param {Array}   items
 * @returns {string} - La expresión Java del ícono
 */
function resolveTabIcon(modConfig, blocks, items) {
  if (modConfig.tabIconBase64) return 'TAB_ICON_ITEM'
  if (blocks.length > 0) return `${toUpperSnake(blocks[0].id)}_BLOCK_ITEM`
  if (items.length  > 0) return `${toUpperSnake(items[0].id)}`
  return 'net.minecraft.item.Items.DIAMOND'
}

/**
 * Genera el bloque Java completo del tab creativo personalizado.
 * @param {Object} modConfig
 * @param {Array}  blocks
 * @param {Array}  items
 * @returns {string}
 */
function buildCreativeTabBlock(modConfig, blocks, items) {
  const iconItem = resolveTabIcon(modConfig, blocks, items)
  const entriesCode = [
    ...blocks.map(b => `entries.add(${toUpperSnake(b.id)}_BLOCK_ITEM);`),
    ...items.map(i  => `entries.add(${toUpperSnake(i.id)});`),
  ].join('\n                ')

  return `    public static final net.minecraft.registry.RegistryKey<ItemGroup> CUSTOM_ITEM_GROUP_KEY = net.minecraft.registry.RegistryKey.of(
        Registries.ITEM_GROUP.getKey(),
        Identifier.of(MOD_ID, "item_group")
    );
    public static final ItemGroup CUSTOM_ITEM_GROUP = Registry.register(
        Registries.ITEM_GROUP,
        Identifier.of(MOD_ID, "item_group"),
        net.fabricmc.fabric.api.itemgroup.v1.FabricItemGroup.builder()
            .icon(() -> new net.minecraft.item.ItemStack(${iconItem}))
            .displayName(Text.translatable("itemGroup." + MOD_ID + ".item_group"))
            .entries((displayContext, entries) -> {
                ${entriesCode || '// sin items'}
            })
            .build()
    );`
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Genera el bloque de declaraciones Java para todos los bloques del mod.
 *
 * @param {Array}  blocks - Array de objetos de bloques
 * @returns {string}      - Líneas Java de registro de bloques concatenadas
 */
export function buildBlockDeclarations(blocks) {
  return blocks.map(block => {
    const uppercaseId = toUpperSnake(block.id)
    const settings    = buildBlockSettings(block)
    const instance    = buildBlockInstance(block, settings)

    return `    public static final Block ${uppercaseId}_BLOCK = Registry.register(
        Registries.BLOCK,
        Identifier.of(MOD_ID, "${block.id}"),
        ${instance}
    );
    public static final Item ${uppercaseId}_BLOCK_ITEM = Registry.register(
        Registries.ITEM,
        Identifier.of(MOD_ID, "${block.id}"),
        new BlockItem(${uppercaseId}_BLOCK, new Item.Settings())
    );`
  }).join('\n\n')
}

/**
 * Genera el bloque Java de declaración del tab creativo personalizado.
 * Incluye el ícono del tab si hay una imagen personalizada.
 *
 * @param {Object} modConfig
 * @param {Array}  blocks
 * @param {Array}  items
 * @returns {{ tabIconDeclaration: string, creativeTabBlock: string }}
 */
export function buildCreativeTab(modConfig, blocks, items) {
  const tabIconDeclaration = modConfig.tabIconBase64 ? buildTabIconDeclaration() : ''
  const creativeTabBlock   = buildCreativeTabBlock(modConfig, blocks, items)
  return { tabIconDeclaration, creativeTabBlock }
}
