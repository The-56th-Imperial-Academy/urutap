import {Application} from "pixi.js";
import {Module} from "../framework/classes/module.ts";
import {Scene} from "../framework/classes/scene.ts";

export class SceneManager extends Module {
    private registeredScenes: Map<string, typeof Scene> = new Map();
    private currentScene?: Scene;

    constructor(app: Application) {
        super(app);
    }

    private displayScene(scene: Scene) {
        this.currentScene = scene;
        this.app.stage.addChild(scene);
        scene.onSwitchIn();
    }

    private hideScene(scene: Scene) {
        (async () => {
            await scene.onSwitchOut();
            this.app.stage.removeChild(scene);
        })();
    }

    registerScene(name: string, scene: typeof Scene): void {
        if (this.registeredScenes.has(name))
            throw new Error(`Cannot register scene ${name}. already registered`);
        this.registeredScenes.set(name, scene);
    }

    unregisterScene(name: string): void {
        this.registeredScenes.delete(name);
    }

    switchTo(scene: string): void
    switchTo(scene: typeof Scene): void
    switchTo(scene: string | typeof Scene): void {
        const targetScene = typeof scene === "string" ? this.registeredScenes.get(scene) : scene;
        if (targetScene == null)
            throw new Error(`unable switch scene when target is unavailable`);

        if (this.currentScene)
            this.hideScene(this.currentScene);
        this.displayScene(new targetScene(this.app));
    }
}
