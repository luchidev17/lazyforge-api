import { toJavaClassName } from './javaHelpers.js'

// ─── Dynamic import resolver ──────────────────────────────────────────────────

/**
 * Determina qué imports extra de Java se necesitan según el contenido del mod.
 *
 * @param {Array} items
 * @param {Array} blocks
 * @returns {string} - Bloque de imports Java listo para insertar
 */
function buildExtraImports(items, blocks) {
    const hasBlocks = blocks.length > 0
    const hasFallingBlocks = blocks.some(b => b.hasGravity)
    const hasSlabs = blocks.some(b => b.blockShape === 'slab')
    const hasPillars = blocks.some(b => b.blockShape === 'pillar')
    const hasStairs = blocks.some(b => b.blockShape === 'stairs')
    const hasThrowable = items.some(i => i.category === 'Arrojadizo')
    const hasToolOrWeapon = items.some(i => i.category === 'Herramienta/Arma')
    const hasFood = items.some(i => i.category === 'Comida')
    const hasArmor = items.some(i => i.category === 'Armadura')
    const hasEnchantedGlow = items.some(i => i.enchantedGlow)
    const hasDamage = blocks.some(b => b.dealsDamage)
    const hasFallModifier = blocks.some(b => b.cancelsFallDamage)
    const hasBounceBlock = blocks.some(b => b.hasBounce)
    const hasFuel = items.some(i => i.isFuel) || blocks.some(b => b.isFuel)
    const hasLoot = items.some(i => i.lootInjection)
    const hasOre = blocks.some(b => b.isOre)

    return [
        hasBlocks ? 'import net.minecraft.block.Block;' : '',
        hasFallingBlocks ? 'import net.minecraft.block.FallingBlock;' : '',
        hasBlocks ? 'import net.minecraft.sound.BlockSoundGroup;' : '',
        hasSlabs ? 'import net.minecraft.block.SlabBlock;' : '',
        hasPillars ? 'import net.minecraft.block.PillarBlock;' : '',
        hasStairs ? 'import net.minecraft.block.StairsBlock;' : '',
        hasBlocks ? 'import net.minecraft.item.BlockItem;' : '',
        hasEnchantedGlow ? 'import net.minecraft.component.DataComponentTypes;' : '',
        hasFood ? 'import net.minecraft.component.type.FoodComponent;' : '',
        hasThrowable ? 'import net.minecraft.entity.EntityType;' : '',
        hasThrowable ? 'import net.minecraft.entity.SpawnGroup;' : '',
        hasToolOrWeapon ? 'import net.minecraft.item.SwordItem;' : '',
        hasToolOrWeapon ? 'import net.minecraft.item.PickaxeItem;' : '',
        hasToolOrWeapon ? 'import net.minecraft.item.AxeItem;' : '',
        hasToolOrWeapon ? 'import net.minecraft.item.ShovelItem;' : '',
        hasToolOrWeapon ? 'import net.minecraft.item.HoeItem;' : '',
        hasToolOrWeapon ? 'import net.minecraft.item.ToolMaterials;' : '',
        hasArmor ? 'import net.minecraft.item.ArmorItem;' : '',
        hasArmor ? 'import net.minecraft.item.ArmorMaterial;' : '',
        hasArmor ? 'import net.minecraft.item.ArmorMaterials;' : '',
        hasDamage ? 'import net.minecraft.entity.Entity;' : '',
        hasDamage ? 'import net.minecraft.block.BlockState;' : '',
        hasDamage ? 'import net.minecraft.util.math.BlockPos;' : '',
        hasDamage ? 'import net.minecraft.util.shape.VoxelShape;' : '',
        hasDamage ? 'import net.minecraft.world.BlockView;' : '',
        hasDamage ? 'import net.minecraft.block.ShapeContext;' : '',
        (hasFallModifier || hasBounceBlock) && !hasDamage ? 'import net.minecraft.entity.Entity;' : '',
        (hasFallModifier || hasBounceBlock) && !hasDamage ? 'import net.minecraft.block.BlockState;' : '',
        (hasFallModifier || hasBounceBlock) && !hasDamage ? 'import net.minecraft.util.math.BlockPos;' : '',
        hasBounceBlock ? 'import net.minecraft.world.World;' : '',
        hasFuel ? 'import net.fabricmc.fabric.api.registry.FuelRegistry;' : '',
        hasLoot ? 'import net.fabricmc.fabric.api.loot.v3.LootTableEvents;\nimport net.minecraft.loot.LootPool;\nimport net.minecraft.loot.entry.ItemEntry;\nimport net.minecraft.loot.provider.number.ConstantLootNumberProvider;\nimport net.minecraft.loot.LootTables;\nimport net.minecraft.loot.condition.RandomChanceLootCondition;' : '',
        hasOre ? 'import net.fabricmc.fabric.api.biome.v1.BiomeModifications;\nimport net.fabricmc.fabric.api.biome.v1.BiomeSelectors;\nimport net.minecraft.world.gen.GenerationStep;\nimport net.minecraft.registry.RegistryKey;\nimport net.minecraft.registry.RegistryKeys;' : '',
    ].filter(Boolean).join('\n')
}

// ─── Custom damage-inflicting block classes ───────────────────────────────────

function buildDamageBlockInnerClasses(blocks) {
    let classesStr = ''
    const hasStandardDamage = blocks.some(b => b.dealsDamage && b.blockShape !== 'slab' && b.blockShape !== 'pillar' && b.blockShape !== 'stairs' && !b.hasGravity)
    const hasFallingDamage = blocks.some(b => b.dealsDamage && b.hasGravity)
    const hasSlabDamage = blocks.some(b => b.dealsDamage && b.blockShape === 'slab')
    const hasPillarDamage = blocks.some(b => b.dealsDamage && b.blockShape === 'pillar')
    const hasStairsDamage = blocks.some(b => b.dealsDamage && b.blockShape === 'stairs')

    const damageCode = `
        @Override
        public void onEntityCollision(BlockState state, World world, BlockPos pos, Entity entity) {
            entity.damage(world.getDamageSources().cactus(), 1.0F);
            super.onEntityCollision(state, world, pos, entity);
        }

        @Override
        public void onSteppedOn(World world, BlockPos pos, BlockState state, Entity entity) {
            entity.damage(world.getDamageSources().cactus(), 1.0F);
            super.onSteppedOn(world, pos, state, entity);
        }
`

    if (hasStandardDamage) {
        classesStr += `
    public static class CustomDamageBlock extends Block {
        public CustomDamageBlock(Settings settings) {
            super(settings);
        }

        @Override
        public VoxelShape getCollisionShape(BlockState state, BlockView world, BlockPos pos, ShapeContext context) {
            return Block.createCuboidShape(1.0, 0.0, 1.0, 15.0, 15.0, 15.0);
        }
        \${damageCode}
    }
`
    }

    if (hasFallingDamage) {
        classesStr += `
    public static class CustomFallingDamageBlock extends FallingBlock {
        public static final com.mojang.serialization.MapCodec<CustomFallingDamageBlock> CODEC = com.mojang.serialization.codecs.RecordCodecBuilder.mapCodec(instance ->
            instance.group(createSettingsCodec()).apply(instance, CustomFallingDamageBlock::new)
        );

        public CustomFallingDamageBlock(Settings settings) {
            super(settings);
        }

        @Override
        protected com.mojang.serialization.MapCodec<? extends FallingBlock> getCodec() {
            return CODEC;
        }

        @Override
        public VoxelShape getCollisionShape(BlockState state, BlockView world, BlockPos pos, ShapeContext context) {
            return Block.createCuboidShape(1.0, 0.0, 1.0, 15.0, 15.0, 15.0);
        }
        \${damageCode}
    }
`
    }

    if (hasSlabDamage) {
        classesStr += `
    public static class CustomDamageSlabBlock extends SlabBlock {
        public CustomDamageSlabBlock(Settings settings) {
            super(settings);
        }
        \${damageCode}
    }
`
    }

    if (hasPillarDamage) {
        classesStr += `
    public static class CustomDamagePillarBlock extends PillarBlock {
        public CustomDamagePillarBlock(Settings settings) {
            super(settings);
        }
        \${damageCode}
    }
`
    }

    if (hasStairsDamage) {
        classesStr += `
    public static class CustomDamageStairsBlock extends StairsBlock {
        public CustomDamageStairsBlock(BlockState baseBlockState, Settings settings) {
            super(baseBlockState, settings);
        }
        \${damageCode}
    }
`
    }

    return classesStr
}

// ─── Custom fall-damage/bounce block classes ──────────────────────────────────

function buildBounceAndFallBlockInnerClasses(blocks) {
    let classesStr = ''

    const hasFallModifier = blocks.some(b => b.cancelsFallDamage)
    const hasBounceBlock = blocks.some(b => b.hasBounce)

    // Lógica de rebote compartida para inyectar
    const bounceLogic = `
        @Override
        public void onLandedUpon(World world, BlockState state, BlockPos pos, Entity entity, float fallDistance) {
            if (entity.bypassesLandingEffects()) {
                super.onLandedUpon(world, state, pos, entity, fallDistance);
            } else {
                entity.handleFallDamage(fallDistance, 0.0F, world.getDamageSources().fall());
                net.minecraft.util.math.Vec3d vel = entity.getVelocity();
                if (vel.y < 0.0D) {
                    entity.setVelocity(vel.x, -vel.y * this.bounceVelocity, vel.z);
                }
            }
        }
  `;

    if (hasFallModifier && hasBounceBlock) {
        classesStr += `
    public static class CustomFallBounceBlock extends Block {
        private final float fallDamageModifier;
        private final float bounceVelocity;

        public CustomFallBounceBlock(float fallDamageModifier, float bounceVelocity, Settings settings) {
            super(settings);
            this.fallDamageModifier = fallDamageModifier;
            this.bounceVelocity = bounceVelocity;
        }

        public float getFallDamageModifier(float fallDistance) {
            return this.fallDamageModifier;
        }
\${bounceLogic}
    }
`
    } else if (hasFallModifier) {
        // (Esta parte queda igual, solo maneja el daño de caída)
        classesStr += `
    public static class CustomFallDamageModifierBlock extends Block {
        private final float fallDamageModifier;

        public CustomFallDamageModifierBlock(float fallDamageModifier, Settings settings) {
            super(settings);
            this.fallDamageModifier = fallDamageModifier;
        }

        public float getFallDamageModifier(float fallDistance) {
            return this.fallDamageModifier;
        }

        @Override
        public void onLandedUpon(World world, BlockState state, BlockPos pos, Entity entity, float fallDistance) {
            entity.handleFallDamage(fallDistance, this.fallDamageModifier, world.getDamageSources().fall());
        }
    }
`
    } else if (hasBounceBlock) {
        classesStr += `
    public static class CustomBounceBlock extends Block {
        private final float bounceVelocity;

        public CustomBounceBlock(float bounceVelocity, Settings settings) {
            super(settings);
            this.bounceVelocity = bounceVelocity;
        }
\${bounceLogic}
    }
`
    }

    return classesStr
}

// ─── CustomFallingBlock inner class ──────────────────────────────────────────

/**
 * Genera la inner class `CustomFallingBlock` que se incluye en la clase principal
 * cuando hay bloques con gravedad.
 * @returns {string}
 */
function buildFallingBlockInnerClass() {
    return `
    public static class CustomFallingBlock extends FallingBlock {
        public static final com.mojang.serialization.MapCodec<CustomFallingBlock> CODEC = com.mojang.serialization.codecs.RecordCodecBuilder.mapCodec(instance ->
            instance.group(createSettingsCodec()).apply(instance, CustomFallingBlock::new)
        );

        public CustomFallingBlock(Settings settings) {
            super(settings);
        }

        @Override
        protected com.mojang.serialization.MapCodec<? extends FallingBlock> getCodec() {
            return CODEC;
        }
    }
`
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Ensambla el contenido completo del archivo Java principal del mod
 * (ej. `MiMod.java`).
 *
 * @param {Object} params
 * @param {string} params.modId                  - ID del mod
 * @param {Array}  params.items                  - Ítems del mod
 * @param {Array}  params.blocks                 - Bloques del mod
 * @param {string} params.itemDeclarations       - Líneas Java de ítems (de itemDeclarations.js)
 * @param {string} params.blockDeclarations      - Líneas Java de bloques (de blockDeclarations.js)
 * @param {string} params.entityTypeDeclarations - Líneas Java de EntityType (de entityClasses.js)
 * @param {string} params.tabIconDeclaration     - Declaración del ícono del tab (de blockDeclarations.js)
 * @param {string} params.creativeTabBlock       - Bloque del tab creativo (de blockDeclarations.js)
 * @returns {string} - El source Java completo listo para escribir en el ZIP
 */
export function buildMainClassSource({
    modId,
    items,
    blocks,
    itemDeclarations,
    blockDeclarations,
    entityTypeDeclarations,
    tabIconDeclaration,
    creativeTabBlock,
}) {
    const javaClassName = toJavaClassName(modId)
    const extraImports = buildExtraImports(items, blocks)
    const hasFallingBlocks = blocks.some(b => b.hasGravity)

    // Generar código de combustibles
    let fuelRegistriesStr = ''
    items.forEach(item => {
        if (item.isFuel && item.burnTime) {
            // burnTime viene en segundos, pero Minecraft usa ticks (20 ticks = 1s)
            fuelRegistriesStr += `        FuelRegistry.INSTANCE.add(${item.id.toUpperCase()}, ${item.burnTime * 20});\n`
        }
    })
    blocks.forEach(block => {
        if (block.isFuel && block.burnTime) {
            fuelRegistriesStr += `        FuelRegistry.INSTANCE.add(${block.id.toUpperCase()}, ${block.burnTime * 20});\n`
        }
    })

    // Generar inyección de botín (Loot Tables)
    let lootRegistriesStr = ''
    const allLootInjectable = [...items].filter(i => i.lootInjection)
    if (allLootInjectable.length > 0) {
        lootRegistriesStr += `        LootTableEvents.MODIFY.register((key, tableBuilder, source, registries) -> {\n`
        
        // Mapear cada cofre a los ítems que se le inyectan
        const chestsMap = {}
        allLootInjectable.forEach(item => {
            const chests = item.lootChests || ['simple_dungeon']
            chests.forEach(chest => {
                // Traducir ids simples de la UI a LootTables de minecraft
                let vanillaKey = ''
                if (chest === 'simple_dungeon') vanillaKey = 'LootTables.SIMPLE_DUNGEON_CHEST'
                else if (chest === 'abandoned_mineshaft') vanillaKey = 'LootTables.ABANDONED_MINESHAFT_CHEST'
                else if (chest === 'village_weaponsmith') vanillaKey = 'LootTables.VILLAGE_WEAPONSMITH_CHEST'
                else if (chest === 'nether_bridge') vanillaKey = 'LootTables.NETHER_BRIDGE_CHEST'
                else if (chest === 'end_city_treasure') vanillaKey = 'LootTables.END_CITY_TREASURE_CHEST'
                
                if (vanillaKey) {
                    if (!chestsMap[vanillaKey]) chestsMap[vanillaKey] = []
                    chestsMap[vanillaKey].push(item)
                }
            })
        })

        Object.entries(chestsMap).forEach(([vanillaKey, lootItems]) => {
            lootRegistriesStr += `            if (${vanillaKey}.equals(key)) {\n`
            lootItems.forEach(item => {
                const weight = item.lootWeight || 15
                const chance = item.lootChance || 0.25
                const varName = item.id.toUpperCase()
                lootRegistriesStr += `                tableBuilder.pool(LootPool.builder()\n`
                lootRegistriesStr += `                    .rolls(ConstantLootNumberProvider.create(1))\n`
                lootRegistriesStr += `                    .conditionally(RandomChanceLootCondition.builder(${chance}F))\n`
                lootRegistriesStr += `                    .with(ItemEntry.builder(${varName}).weight(${weight}))\n`
                lootRegistriesStr += `                );\n`
            })
            lootRegistriesStr += `            }\n`
        })
        lootRegistriesStr += `        });\n`
    }

    // Generar inyección de WorldGen (Biomas)
    let worldgenRegistriesStr = ''
    blocks.forEach(block => {
        if (block.isOre) {
            worldgenRegistriesStr += `        BiomeModifications.addFeature(\n`
            worldgenRegistriesStr += `            BiomeSelectors.foundInOverworld(),\n`
            worldgenRegistriesStr += `            GenerationStep.Feature.UNDERGROUND_ORES,\n`
            worldgenRegistriesStr += `            RegistryKey.of(RegistryKeys.PLACED_FEATURE, Identifier.of(MOD_ID, "${block.id}_ore"))\n`
            worldgenRegistriesStr += `        );\n`
        }
    })

    return `package com.${modId};

import net.fabricmc.api.ModInitializer;
import net.minecraft.entity.effect.StatusEffectInstance;
import net.minecraft.entity.effect.StatusEffects;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.item.Item;
import net.minecraft.item.ItemStack;
import net.minecraft.item.ItemGroup;
import net.minecraft.text.Text;
import net.minecraft.registry.Registry;
import net.minecraft.registry.Registries;
import net.minecraft.sound.SoundCategory;
import net.minecraft.sound.SoundEvent;
import net.minecraft.sound.SoundEvents;
import net.minecraft.util.Hand;
import net.minecraft.util.Identifier;
import net.minecraft.util.TypedActionResult;
import net.minecraft.world.World;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
\${extraImports}

public class \${javaClassName} implements ModInitializer {
    public static final String MOD_ID = "\${modId}";
    public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);
\${entityTypeDeclarations ? '\\n' + entityTypeDeclarations + '\\n' : ''}
\${blockDeclarations ? blockDeclarations + '\\n\\n' : ''}\${itemDeclarations}
\${tabIconDeclaration ? '\\n' + tabIconDeclaration + '\\n' : ''}
\${creativeTabBlock}

\${hasFallingBlocks ? buildFallingBlockInnerClass() : ''}\${buildDamageBlockInnerClasses(blocks)}\${buildBounceAndFallBlockInnerClasses(blocks)}    @Override
    public void onInitialize() {
        LOGGER.info("¡Mod de Minecraft Inicializado por Lazy Forge con \${items.length} ítems y \${blocks.length} bloques!");
\${fuelRegistriesStr}\${lootRegistriesStr}\${worldgenRegistriesStr}    }
}
`
}
