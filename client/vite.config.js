"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vite_1 = require("vite");
var plugin_react_1 = require("@vitejs/plugin-react");
var vite_plugin_svgr_1 = require("vite-plugin-svgr");
var path_1 = require("path");
exports.default = (0, vite_1.defineConfig)({
    base: '/dash/',
    plugins: [(0, plugin_react_1.default)(), (0, vite_plugin_svgr_1.default)()],
    resolve: {
        alias: {
            '@': path_1.default.resolve(__dirname, './src'),
        },
    },
});
