import { toJavaClassName } from '../java/javaHelpers.js'

/**
 * Genera y escribe al ZIP el archivo `fabric.mod.json`.
 *
 * @param {Object} zip          - Instancia de JSZip
 * @param {Object} modConfig    - Configuración del mod (id, name)
 * @param {string} javaClassName - Nombre de la clase Java principal
 * @param {boolean} hasThrowable - Si el mod tiene ítems arrojadizos (necesita entrypoint client)
 * @param {Object} paths        - Objeto de rutas
 */
export function writeFabricModJson(zip, modConfig, javaClassName, hasThrowable, paths) {
  const modId      = modConfig.id
  const entrypoints = { main: [`com.${modId}.${javaClassName}`] }
  if (hasThrowable) {
    entrypoints.client = [`com.${modId}.${javaClassName}Client`]
  }

  const fabricModJson = {
    schemaVersion: 1,
    id:            modId,
    version:       '1.0.0',
    name:          modConfig.name,
    description:   'Generado con Lazy Forge',
    authors:       ['Lazy Forge User'],
    contact:       {},
    license:       'CC0-1.0',
    environment:   '*',
    entrypoints,
    depends: {
      fabricloader: '>=0.15.11',
      minecraft:    '~1.21.1',
      java:         '>=21',
      'fabric-api': '*',
    },
  }

  zip.file(paths.fabricModJson, JSON.stringify(fabricModJson, null, 2))
}

/**
 * Genera y escribe al ZIP los tres archivos de configuración de Gradle:
 * `gradle.properties`, `build.gradle` y `settings.gradle`.
 *
 * @param {Object} zip       - Instancia de JSZip
 * @param {string} modId     - Identificador del mod
 * @param {Object} paths     - Objeto de rutas
 */
export function writeGradleFiles(zip, modId, paths) {
  // gradle.properties
  zip.file(paths.gradleProperties, `org.gradle.jvmargs=-Xmx2G
minecraft_version=1.21.1
yarn_mappings=1.21.1+build.2
loader_version=0.16.2
fabric_version=0.102.0+1.21.1
mod_version=1.0.0
maven_group=com.${modId}
archives_base_name=${modId}
`)

  // build.gradle
  zip.file(paths.buildGradle, `plugins {
    id 'fabric-loom' version '1.7-SNAPSHOT'
    id 'maven-publish'
}

version = project.mod_version
group = project.maven_group

base {
    archivesName = project.archives_base_name
}

repositories {
    mavenCentral()
}

dependencies {
    minecraft "com.mojang:minecraft:\${project.minecraft_version}"
    mappings "net.fabricmc:yarn:\${project.yarn_mappings}:v2"
    modImplementation "net.fabricmc:fabric-loader:\${project.loader_version}"
    modImplementation "net.fabricmc.fabric-api:fabric-api:\${project.fabric_version}"
}

processResources {
    inputs.property "version", project.version

    filesMatching("fabric.mod.json") {
        expand "version": project.version
    }
}

tasks.withType(JavaCompile).configureEach {
    it.options.release = 21
}

java {
    withSourcesJar()
    sourceCompatibility = JavaVersion.VERSION_21
    targetCompatibility = JavaVersion.VERSION_21
}

jar {
    from("LICENSE") {
        rename { "\${it}_\${project.archivesName.get()}"}
    }
}
`)

  // settings.gradle
  zip.file(paths.settingsGradle, `pluginManagement {
    repositories {
        maven {
            name = 'Fabric'
            url = 'https://maven.fabricmc.net/'
        }
        mavenCentral()
        gradlePluginPortal()
    }
}

rootProject.name = '${modId}'
`)
}
