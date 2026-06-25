import copy from "rollup-plugin-copy-watch"

const isProduction = process.env.NODE_ENV === "production"

let modulePath
try {
    const { default: foundryPath } = await import("./foundry-path.js")
    modulePath = foundryPath()
} catch {
    if (!isProduction) {
        console.error(
            "\nfoundry-path.js not found." +
            "\nCopy foundry-path.example.js to foundry-path.js and set your local Foundry data path.\n"
        )
        process.exit(1)
    }
    modulePath = "./dist"
}

const moduleId = "token-action-hud-wfrp4e"

console.log("Bundling " + moduleId + " to " + modulePath)

export default {
    input: `./dist/modules/${moduleId}.mjs`,
    output: {
        file: `${modulePath}/modules/${moduleId}.mjs`,
        format: "es"
    },
    watch: {
        clearScreen: true
    },
    plugins: [
        copy({
            targets: [
                { src: "dist/module.json",   dest: modulePath },
                { src: "dist/languages/*",   dest: `${modulePath}/languages` },
                { src: "dist/styles/*",      dest: `${modulePath}/styles` },
                { src: "dist/templates",     dest: modulePath },
                { src: "dist/assets",        dest: modulePath },
            ],
            watch: isProduction ? false : [
                "dist/module.json",
                "dist/languages/**",
                "dist/styles/**",
                "dist/templates/**",
                "dist/assets/**",
            ]
        })
    ]
}
