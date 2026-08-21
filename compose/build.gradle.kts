import com.vanniktech.maven.publish.AndroidSingleVariantLibrary
import com.vanniktech.maven.publish.JavadocJar
import com.vanniktech.maven.publish.SourcesJar

plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.maven.publish)
}

group = "org.dravensoft.arena"
version = gradle.extra["arenaVersion"] as String

android {
    namespace = "org.dravensoft.arena"
    compileSdk = libs.versions.compileSdk.get().toInt()

    defaultConfig {
        minSdk = libs.versions.minSdk.get().toInt()
    }

    buildFeatures {
        compose = true
    }
}

kotlin {
    jvmToolchain(libs.versions.jvmToolchain.get().toInt())
    explicitApi()
    compilerOptions {
        allWarningsAsErrors.set(true)
    }
}

dependencies {
    api(platform(libs.compose.bom))
    api(libs.compose.runtime)
    api(libs.compose.ui.graphics)
    api(libs.compose.ui.text)
    api(libs.compose.ui.unit)
    api(libs.compose.animation.core)
    testImplementation(libs.kotlin.test)
}

mavenPublishing {
    publishToMavenCentral(automaticRelease = false)
    signAllPublications()

    configure(
        AndroidSingleVariantLibrary(
            javadocJar = JavadocJar.Empty(),
            sourcesJar = SourcesJar.Sources(),
            variant = "release",
        ),
    )

    coordinates(group.toString(), "arena-compose", version.toString())

    pom {
        name.set("Arena for Compose")
        description.set("Arena by Dravensoft: the design tokens every Arena platform target implements, for Jetpack Compose. Generated from @dravensoft/arena-contracts.")
        url.set("https://arena.dravensoft.org")
        licenses {
            license {
                name.set("MIT License")
                url.set("https://github.com/dravensoft-dev/arena-mobile/blob/main/LICENSE")
            }
        }
        developers {
            developer {
                id.set("dravensoft")
                name.set("Dravensoft")
                url.set("https://dravensoft.org")
            }
        }
        scm {
            url.set("https://github.com/dravensoft-dev/arena-mobile")
            connection.set("scm:git:git://github.com/dravensoft-dev/arena-mobile.git")
            developerConnection.set("scm:git:ssh://git@github.com/dravensoft-dev/arena-mobile.git")
        }
    }
}
