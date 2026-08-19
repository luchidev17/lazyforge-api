import { toCamelCase, toUpperSnake, toSoundEnum, toEffectEnum } from './javaHelpers.js'

// ─── EntityType declarations (inline en la clase principal) ───────────────────

/**
 * Genera las declaraciones Java de EntityType para todos los ítems arrojadizos.
 * Estas líneas van dentro del cuerpo de la clase principal del mod.
 *
 * @param {Array} throwableItems - Ítems con category === 'Arrojadizo'
 * @returns {string}
 */
export function buildEntityTypeDeclarations(throwableItems) {
  if (throwableItems.length === 0) return ''

  return throwableItems.map(item => {
    const uppercaseId = toUpperSnake(item.id)
    const camelId     = toCamelCase(item.id)

    return `    public static final EntityType<${camelId}Entity> ${uppercaseId}_ENTITY_TYPE = Registry.register(
        Registries.ENTITY_TYPE,
        Identifier.of(MOD_ID, "${item.id}"),
        EntityType.Builder.<${camelId}Entity>create(${camelId}Entity::new, SpawnGroup.MISC)
            .dimensions(0.25f, 0.25f)
            .build()
    );`
  }).join('\n')
}

// ─── *Entity.java files ───────────────────────────────────────────────────────

/**
 * Genera el contenido completo de una clase Java `*Entity` para un ítem arrojadizo.
 *
 * @param {Object} item          - El ítem arrojadizo
 * @param {string} modId         - Identificador del mod
 * @param {string} javaClassName - Nombre de la clase principal del mod (ej. "MiMod")
 * @returns {string}             - El source Java completo de la entidad
 */
function buildEntityClassSource(item, modId, javaClassName) {
  const camelId     = toCamelCase(item.id)
  const uppercaseId = toUpperSnake(item.id)

  // Sonido al impactar
  const impactSoundLine = item.impactSound
    ? `this.getWorld().playSound(null, this.getX(), this.getY(), this.getZ(), ${toSoundEnum(item.impactSound)}, SoundCategory.NEUTRAL, 1.0F, 1.0F);`
    : ''

  // Efectos aplicados al impactar una entidad
  const effectLines = (item.effects || []).map(eff => {
    const effectEnum    = toEffectEnum(eff.type)
    const durationTicks = (parseInt(eff.duration) || 10) * 20
    const amplifier     = (parseInt(eff.level) || 1) - 1
    const probability   = (parseFloat(eff.probability) || 100) / 100
    return `
                if (entityHit.getEntity() instanceof LivingEntity target && this.getRandom().nextFloat() < ${probability}f) {
                    target.addStatusEffect(new StatusEffectInstance(${effectEnum}, ${durationTicks}, ${amplifier}));
                }`
  }).join('\n')

  const hasEffects = (item.effects || []).length > 0

  // Bloque onCollision: incluye efectos solo si los hay
  const entityHitBlock = hasEffects
    ? `
            if (hitResult.getType() == HitResult.Type.ENTITY) {
                EntityHitResult entityHit = (EntityHitResult) hitResult;
                ${effectLines}
            }`
    : ''

  // Imports opcionales: solo se incluyen si se usan
  // HitResult siempre se necesita porque onCollision(HitResult) siempre lo usa en la firma
  const conditionalImports = [
    'import net.minecraft.util.hit.HitResult;',
    hasEffects              ? 'import net.minecraft.entity.effect.StatusEffectInstance;' : '',
    hasEffects              ? 'import net.minecraft.entity.effect.StatusEffects;'        : '',
    hasEffects              ? 'import net.minecraft.util.hit.EntityHitResult;'           : '',
    (hasEffects || !!impactSoundLine) ? 'import net.minecraft.sound.SoundCategory;'     : '',
    (hasEffects || !!impactSoundLine) ? 'import net.minecraft.sound.SoundEvents;'       : '',
  ].filter(Boolean).join('\n')

  return `package com.${modId};

import net.minecraft.entity.EntityType;
import net.minecraft.entity.LivingEntity;
import net.minecraft.entity.projectile.thrown.ThrownItemEntity;
import net.minecraft.item.Item;
import net.minecraft.world.World;
${conditionalImports ? conditionalImports + '\n' : ''}
public class ${camelId}Entity extends ThrownItemEntity {

    public ${camelId}Entity(EntityType<? extends ThrownItemEntity> type, World world) {
        super(type, world);
    }

    public ${camelId}Entity(World world, LivingEntity owner) {
        super(${javaClassName}.${uppercaseId}_ENTITY_TYPE, owner, world);
    }

    @Override
    protected Item getDefaultItem() {
        return ${javaClassName}.${uppercaseId};
    }

    @Override
    protected void onCollision(HitResult hitResult) {
        super.onCollision(hitResult);
        if (!this.getWorld().isClient()) {
            ${impactSoundLine}${entityHitBlock}
        }
        this.discard();
    }
}
`
}

// ─── *Client.java file ────────────────────────────────────────────────────────

/**
 * Genera el contenido de la clase `*Client.java` que registra los renderers
 * de las entidades arrojadizas en el cliente.
 *
 * @param {Array}  throwableItems - Ítems con category === 'Arrojadizo'
 * @param {string} modId          - Identificador del mod
 * @param {string} javaClassName  - Nombre de la clase principal del mod
 * @returns {string}              - El source Java completo del client initializer
 */
export function writeClientFile(zip, throwableItems, transparentBlocks, modId, javaClassName, javaDir) {
  const imports = [
    'import net.fabricmc.api.ClientModInitializer;',
  ]
  const lines = []

  if (throwableItems.length > 0) {
    imports.push('import net.fabricmc.fabric.api.client.rendering.v1.EntityRendererRegistry;');
    imports.push('import net.minecraft.client.render.entity.FlyingItemEntityRenderer;');
    throwableItems.forEach(item => {
      const uppercaseId = item.id.toUpperCase()
      lines.push(`        EntityRendererRegistry.register(${javaClassName}.${uppercaseId}_ENTITY_TYPE, FlyingItemEntityRenderer::new);`)
    })
  }

  if (transparentBlocks.length > 0) {
    imports.push('import net.fabricmc.fabric.api.blockrenderlayer.v1.BlockRenderLayerMap;');
    imports.push('import net.minecraft.client.render.RenderLayer;');
    transparentBlocks.forEach(block => {
      const uppercaseId = block.id.toUpperCase()
      lines.push(`        BlockRenderLayerMap.INSTANCE.putBlock(${javaClassName}.${uppercaseId}_BLOCK, RenderLayer.getCutout());`)
    })
  }

  if (lines.length === 0) return

  const clientSource = `package com.${modId};

${imports.join('\n')}

public class ${javaClassName}Client implements ClientModInitializer {
    @Override
    public void onInitializeClient() {
${lines.join('\n')}
    }
}
`
  zip.file(`${javaDir}${javaClassName}Client.java`, clientSource)
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Genera todos los archivos Java relacionados con entidades arrojadizas
 * y los añade al ZIP.
 *
 * @param {Object} zip            - Instancia de JSZip
 * @param {Array}  throwableItems - Ítems con category === 'Arrojadizo'
 * @param {string} modId          - Identificador del mod
 * @param {string} javaClassName  - Nombre de la clase principal del mod
 * @param {string} javaDir        - Ruta base de las clases Java dentro del ZIP
 */
export function writeEntityFiles(zip, throwableItems, modId, javaClassName, javaDir) {
  if (throwableItems.length === 0) return

  // Clase *Entity.java por cada ítem arrojadizo
  throwableItems.forEach(item => {
    const camelId   = toCamelCase(item.id)
    const source    = buildEntityClassSource(item, modId, javaClassName)
    zip.file(`${javaDir}${camelId}Entity.java`, source)
  })
}
