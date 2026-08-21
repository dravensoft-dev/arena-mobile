import groovy.json.JsonSlurper

pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "arena-mobile"

@Suppress("UNCHECKED_CAST")
val repoConfig = JsonSlurper().parse(file("repo.config.json")) as Map<String, String>

gradle.extra["arenaVersion"] = repoConfig["version"]
    ?: throw GradleException("repo.config.json declares no version, and it is the authority every artifact is stamped from")

include(":compose")
