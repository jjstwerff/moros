import js from "@eslint/js";

const browserGlobals = {
    document: "readonly",
    window: "readonly",
    localStorage: "readonly",
    alert: "readonly",
    confirm: "readonly",
    prompt: "readonly",
    URL: "readonly",
    FileReader: "readonly",
    Blob: "readonly",
    setTimeout: "readonly",
    console: "readonly",
};

export default [
    js.configs.recommended,
    {
        files: ["html/**/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: browserGlobals,
        }
    },
    {
        files: ["test/**/*.js"],
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: "commonjs",
            globals: {
                require: "readonly",
                describe: "readonly",
                it: "readonly",
                before: "readonly",
                beforeEach: "readonly",
                after: "readonly",
                afterEach: "readonly",
            }
        }
    }
];
