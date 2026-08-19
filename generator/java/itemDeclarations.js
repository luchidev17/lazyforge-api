import { applyItemFlags, toCamelCase, toUpperSnake, toSoundEnum, toEffectEnum } from './javaHelpers.js'

// ─── Category builders ────────────────────────────────────────────────────────

/**
 * Genera el código Java del item instance para ítems de categoría Comida.
 * @param {Object} item
 * @returns {string}
 */
function buildFoodItemInstance(item) {
  const stack      = item.stackSize || 64
  const nutrition  = item.nutrition  != null ? item.nutrition  : 4
  const saturation = parseFloat(item.saturation != null ? item.saturation : 0.6).toFixed(1)
  const alwaysEdible = item.alwaysEdible ? '.alwaysEdible()' : ''

  let foodBuilder = `new FoodComponent.Builder().nutrition(${nutrition}).saturationModifier(${saturation}f)${alwaysEdible}`

  if (item.effects && item.effects.length > 0) {
    item.effects.forEach(eff => {
      const effectEnum   = toEffectEnum(eff.type)
      const durationTicks = (parseInt(eff.duration) || 10) * 20
      const amplifier    = (parseInt(eff.level) || 1) - 1
      const probability  = (parseFloat(eff.probability) || 100) / 100
      foodBuilder += `.statusEffect(new StatusEffectInstance(${effectEnum}, ${durationTicks}, ${amplifier}), ${probability}f)`
    })
  }

  const itemSettings = applyItemFlags(
    `new Item.Settings().maxCount(${stack}).food(${foodBuilder}.build())`,
    item
  )

  if (item.sound) {
    const soundEnum = toSoundEnum(item.sound)
    return `new Item(${itemSettings}) {
        @Override
        public SoundEvent getEatSound() {
            return ${soundEnum};
        }
    }`
  }

  return `new Item(${itemSettings})`
}

/**
 * Genera el código Java del item instance para ítems de categoría Herramienta/Arma.
 * @param {Object} item
 * @returns {string}
 */
function buildToolItemInstance(item) {
  const materialMap = {
    'Madera':    'WOOD',
    'Piedra':    'STONE',
    'Hierro':    'IRON',
    'Oro':       'GOLD',
    'Diamante':  'DIAMOND',
    'Netherite': 'NETHERITE',
  }
  const mat = materialMap[item.material] || 'IRON'

  const materialDurabilityMap = {
    'Madera':    59,
    'Piedra':    131,
    'Hierro':    250,
    'Oro':       32,
    'Diamante':  1561,
    'Netherite': 2031,
  }
  const defaultDurability = materialDurabilityMap[item.material] || 250
  const durability = (item.durability !== null && item.durability !== undefined)
    ? item.durability
    : defaultDurability

  const toolDefaults = {
    'Espada': { damage: 3.0, speed: 1.6 },
    'Pico':   { damage: 1.0, speed: 1.2 },
    'Hacha':  { damage: 5.0, speed: 1.0 },
    'Pala':   { damage: 1.5, speed: 1.0 },
    'Azada':  { damage: 0.0, speed: 2.0 },
  }
  const defaults = toolDefaults[item.toolType] || { damage: 3.0, speed: 1.6 }

  const damageModifier = (item.attackDamage !== null && item.attackDamage !== undefined)
    ? item.attackDamage
    : defaults.damage
  const attackSpeedVal = (item.attackSpeed !== null && item.attackSpeed !== undefined)
    ? item.attackSpeed
    : defaults.speed
  const speedModifier = attackSpeedVal - 4.0

  const toolTypeClassMap = {
    'Espada': { className: 'SwordItem',   isProtected: false },
    'Pico':   { className: 'PickaxeItem', isProtected: true  },
    'Hacha':  { className: 'AxeItem',     isProtected: true  },
    'Pala':   { className: 'ShovelItem',  isProtected: true  },
    'Azada':  { className: 'HoeItem',     isProtected: true  },
  }
  const typeInfo = toolTypeClassMap[item.toolType] || { className: 'SwordItem', isProtected: false }

  // Yarn 1.21.1: constructores de herramientas toman (ToolMaterial, Item.Settings).
  // Daño/velocidad personalizados se pasan por attributeModifiers().
  const attributeModifiers = `${typeInfo.className}.createAttributeModifiers(ToolMaterials.${mat}, (int)${damageModifier}, ${speedModifier}f)`
  const settings = applyItemFlags(
    `new Item.Settings().maxDamage(${durability}).attributeModifiers(${attributeModifiers})`,
    item
  )

  const hasOnHitEffects  = item.effects       && item.effects.length > 0
  const hasSound         = !!item.sound
  const hasHolderEffects = item.holderEffects  && item.holderEffects.length > 0

  const overrides = []

  // Override postHit — sonido al golpear y/o efectos al impacto
  if (hasOnHitEffects || hasSound) {
    let postHitLines = ''

    if (hasSound) {
      const soundEnum = toSoundEnum(item.sound)
      postHitLines += `\n            attacker.getWorld().playSound(null, attacker.getX(), attacker.getY(), attacker.getZ(), ${soundEnum}, SoundCategory.PLAYERS, 1.0F, 1.0F);`
    }

    if (hasOnHitEffects) {
      const effectLines = item.effects.map(eff => {
        const effectEnum    = toEffectEnum(eff.type)
        const durationTicks = (parseInt(eff.duration) || 10) * 20
        const amplifier     = (parseInt(eff.level) || 1) - 1
        const probability   = (parseFloat(eff.probability) || 100) / 100
        return `\n            if (attacker.getRandom().nextFloat() < ${probability}f) {\n                ((net.minecraft.entity.LivingEntity) target).addStatusEffect(new StatusEffectInstance(${effectEnum}, ${durationTicks}, ${amplifier}));\n            }`
      }).join('\n')
      postHitLines += effectLines
    }

    overrides.push(`
        @Override
        public boolean postHit(ItemStack stack, net.minecraft.entity.LivingEntity target, net.minecraft.entity.LivingEntity attacker) {
            ${postHitLines}
            return super.postHit(stack, target, attacker);
        }`)
  }

  // Override inventoryTick — efectos mientras se sostiene
  if (hasHolderEffects) {
    const holderEffectLines = item.holderEffects.map(eff => {
      const effectEnum    = toEffectEnum(eff.type)
      const durationTicks = (parseInt(eff.duration) || 10) * 20
      const amplifier     = (parseInt(eff.level) || 1) - 1
      return `\n            if (user instanceof net.minecraft.entity.LivingEntity living) {\n                living.addStatusEffect(new StatusEffectInstance(${effectEnum}, ${durationTicks + 10}, ${amplifier}));\n            }`
    }).join('\n')

    overrides.push(`
        @Override
        public void inventoryTick(ItemStack stack, net.minecraft.world.World world, net.minecraft.entity.Entity user, int slot, boolean selected) {
            if (selected && !world.isClient()) {
                ${holderEffectLines}
            }
            super.inventoryTick(stack, world, user, slot, selected);
        }`)
  }

  let overrideBlock = ''
  if (overrides.length > 0) {
    overrideBlock = ` {\n${overrides.join('\n')}\n    }`
  } else {
    overrideBlock = typeInfo.isProtected ? ' {}' : ''
  }

  return `new ${typeInfo.className}(ToolMaterials.${mat}, ${settings})${overrideBlock}`
}

/**
 * Genera el código Java del item instance para ítems Arrojadizos.
 * @param {Object} item
 * @returns {string}
 */
function buildThrowableItemInstance(item) {
  const stack      = item.stackSize || 16
  const throwForce = (parseFloat(item.throwForce) || 1.5).toFixed(1)
  const cooldown   = parseInt(item.cooldownTicks) || 20
  const camelId    = toCamelCase(item.id)

  let throwSoundCode = ''
  if (item.throwSound) {
    const snd = toSoundEnum(item.throwSound)
    throwSoundCode = `world.playSound(null, user.getX(), user.getY(), user.getZ(), ${snd}, SoundCategory.PLAYERS, 0.5F, 0.4F / (world.getRandom().nextFloat() * 0.4F + 0.8F));`
  }

  const cooldownCode = cooldown > 0
    ? `user.getItemCooldownManager().set(stack.getItem(), ${cooldown});`
    : ''

  return `new Item(${applyItemFlags(`new Item.Settings().maxCount(${stack})`, item)}) {
        @Override
        public TypedActionResult<ItemStack> use(World world, PlayerEntity user, Hand hand) {
            ItemStack stack = user.getStackInHand(hand);
            ${throwSoundCode}
            if (!world.isClient()) {
                ${camelId}Entity entity = new ${camelId}Entity(world, user);
                entity.setVelocity(user, user.getPitch(), user.getYaw(), 0.0F, ${throwForce}F, 1.0F);
                world.spawnEntity(entity);
            }
            ${cooldownCode}
            if (!user.getAbilities().creativeMode) {
                stack.decrement(1);
            }
            return TypedActionResult.success(stack, world.isClient());
        }
    }`
}

/**
 * Genera el código Java del item instance para ítems Misceláneos.
 * @param {Object} item
 * @returns {string}
 */
function buildMiscItemInstance(item) {
  const stack = item.stackSize || 64

  if (item.sound) {
    const soundEnum = toSoundEnum(item.sound)
    return `new Item(${applyItemFlags(`new Item.Settings().maxCount(${stack})`, item)}) {
        @Override
        public TypedActionResult<ItemStack> use(World world, PlayerEntity user, Hand hand) {
            if (!world.isClient()) {
                world.playSound(null, user.getX(), user.getY(), user.getZ(), ${soundEnum}, SoundCategory.PLAYERS, 1.0F, 1.0F);
            }
            return TypedActionResult.success(user.getStackInHand(hand));
        }
    }`
  }

  return `new Item(${applyItemFlags(`new Item.Settings().maxCount(${stack})`, item)})`
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Genera el bloque de declaraciones Java para todos los ítems del mod.
 *
 * @param {Array}  items - Array de objetos de ítems
 * @param {string} modId - Identificador del mod
 * @returns {string}     - Líneas Java de registro de ítems concatenadas
 */
export function buildItemDeclarations(items, modId) {
  return items.map(item => {
    const uppercaseId = toUpperSnake(item.id)

    if (item.category === 'Armadura') {
      const slotTypeMap = {
        helmet: 'ArmorItem.Type.HELMET',
        chestplate: 'ArmorItem.Type.CHESTPLATE',
        leggings: 'ArmorItem.Type.LEGGINGS',
        boots: 'ArmorItem.Type.BOOTS',
      }
      const slotType = slotTypeMap[item.slot] || 'ArmorItem.Type.HELMET'
      return `    public static final ArmorMaterial ${uppercaseId}_MATERIAL = new ArmorMaterial(
        java.util.Map.of(
            ArmorItem.Type.HELMET, 3,
            ArmorItem.Type.CHESTPLATE, 8,
            ArmorItem.Type.LEGGINGS, 6,
            ArmorItem.Type.BOOTS, 3
        ),
        15,
        SoundEvents.ITEM_ARMOR_EQUIP_IRON,
        () -> net.minecraft.recipe.Ingredient.ofItems(net.minecraft.item.Items.IRON_INGOT),
        java.util.List.of(new ArmorMaterial.Layer(Identifier.of(MOD_ID, "${item.id}"))),
        0.0F,
        0.0F
    );
    public static final Item ${uppercaseId} = Registry.register(Registries.ITEM, Identifier.of(MOD_ID, "${item.id}"), new ArmorItem(net.minecraft.registry.entry.RegistryEntry.of(${uppercaseId}_MATERIAL), ${slotType}, new Item.Settings()));`
    }

    let itemInstance = ''

    switch (item.category) {
      case 'Comida':
        itemInstance = buildFoodItemInstance(item)
        break
      case 'Herramienta/Arma':
        itemInstance = buildToolItemInstance(item)
        break
      case 'Arrojadizo':
        itemInstance = buildThrowableItemInstance(item)
        break
      default:
        itemInstance = buildMiscItemInstance(item)
    }

    return `    public static final Item ${uppercaseId} = Registry.register(Registries.ITEM, Identifier.of(MOD_ID, "${item.id}"), ${itemInstance});`
  }).join('\n')
}

