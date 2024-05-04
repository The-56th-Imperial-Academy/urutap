import {debounce} from "lodash-es";
import {Application} from "pixi.js";
import {Module} from "../framework/classes/module.ts";
import {Scene} from "../framework/classes/scene.ts";
import {implementedISceneResized, ISceneResizeData} from "../framework/interfaces/ISceneResize.ts";

export class SceneManager extends Module {
    private root?: string;
    private registeredScenes: Map<string, typeof Scene> = new Map();
    private currentScene?: Scene;
    private cachedSceneSize: ISceneResizeData;

    get sceneSize() {
        return this.cachedSceneSize;
    }

    constructor(app: Application) {
        super(app);

        history.pushState(null, "");
        window.addEventListener("popstate", event => {
            const target = (event.state?.name as string ?? this.root);
            if (target)
                this.switchTo(target, true);
        });

        this.cachedSceneSize = this.calculateSceneResizeData();
        window.addEventListener("resize", debounce(() => {
            this.cachedSceneSize = this.calculateSceneResizeData();
            for (const container of app.stage.children) {
                if (implementedISceneResized(container))
                    container.onSceneResize(this.cachedSceneSize);
            }
        }, 50, {leading: false, trailing: true}));
    }

    private displayScene(scene: Scene, name?: string) {
        this.currentScene = scene;
        this.app.stage.addChild(scene);
        scene.onSwitchIn();
        if (name)
            history.pushState({name}, "");
    }

    private hideScene(scene: Scene) {
        (async () => {
            await scene.onSwitchOut();
            this.app.stage.removeChild(scene);
        })();
    }

    calculateSceneResizeData(): ISceneResizeData {
        const {width, height} = this.app.screen;
        const [centerX, centerY] = [width / 2, height / 2];

        return {width, height, centerX, centerY};
    }

    registerScene(name: string, scene: typeof Scene, isRoot: boolean = false): void {
        if (this.registeredScenes.has(name))
            throw new Error(`Cannot register scene ${name}. already registered`);
        this.registeredScenes.set(name, scene);
        if (isRoot)
            this.root = name;
    }

    unregisterScene(name: string): void {
        this.registeredScenes.delete(name);
    }

    switchTo(scene: string, noHistory: boolean = false): void {
        const targetScene = this.registeredScenes.get(scene);
        if (targetScene == null)
            throw new Error(`can not found scene "${scene}".`);

        if (this.currentScene)
            this.hideScene(this.currentScene);
        this.displayScene(new targetScene(this.app), noHistory ? undefined : scene);
    }
}
