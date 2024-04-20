import "./index.css"
import {upperFirst} from "lodash-es"
import {Application} from "pixi.js";
import environments from "./ environments.json"
import {Modules} from "./definition/modules";

(async () => {
    const app = new Application();
    const $app = document.querySelector<HTMLElement>("#app");

    if ($app === null)
        return;

    // initialize
    document.title = environments.title;
    await app.init({
        background: "white",
        resizeTo: $app,
    });
    document.querySelector("#app")?.appendChild(app.canvas);

    // bind environments
    app.environments = environments;

    // load modules
    const modules: Record<string, any> = {};
    for (const [path, loader] of Object.entries(import.meta.glob("./modules/*.ts"))) {
        const fileName = (path.split("/").pop() ?? "").split(".")[0];
        modules[fileName] = new ((await loader() as Record<string, any>)[upperFirst(fileName)])(app);
    }
    app.modules = modules as unknown as Modules;

    (await import("./game/core.ts")).default(app);

    // make PixiJS Devtools happy
    // https://chrome.google.com/webstore/detail/aamddddknhcagpehecnhphigffljadon
    // @ts-ignore
    globalThis.__PIXI_APP__ = app;
})();