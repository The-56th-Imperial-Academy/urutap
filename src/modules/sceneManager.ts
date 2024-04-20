import {Application} from "pixi.js";
import {Module} from "../framework/classes/module.ts";
import {Scene} from "../framework/classes/scene.ts";
import {ActionResponse} from "../framework/enums/ActionResponse.ts";
import {ActionResult} from "../framework/enums/ActionResult.ts";
import {IAnimation} from "../framework/interfaces/IAnimation.ts";

export interface ISwitchSceneAnimation {
    fromScene?: Scene;
    toScene?: Scene;
    outAnimation?: IAnimation;
    inAnimation?: IAnimation;

    bind(toScene: Scene, fromScene?: Scene): void

    onTick(): ActionResult | undefined
}

export class ImmediateSwitchSceneAnimation implements ISwitchSceneAnimation {
    fromScene?: Scene;
    toScene?: Scene;

    bind(toScene: Scene, fromScene?: Scene): void {
        this.fromScene = fromScene;
        this.toScene = toScene;
    }

    onTick(): ActionResult | undefined {
        return ActionResult.DONE;
    }
}

class SceneAnimationExecutor {
    animation: ISwitchSceneAnimation;
    fromScene?: Scene;
    toScene: Scene;

    constructor(animation: ISwitchSceneAnimation, toScene: Scene, fromScene?: Scene) {
        this.animation = animation;
        this.fromScene = fromScene;
        this.toScene = toScene;

        this.animation.bind(toScene, fromScene);
    }

    onTick() {
        this.fromScene?.onTick();
        this.toScene?.onTick();
        return this.animation.onTick();
    }
}

export class SceneManager extends Module {
    registeredScenes: Map<string, Scene> = new Map();
    currentScene?: Scene;
    currentSceneAnimationExecutor?: SceneAnimationExecutor;

    constructor(app: Application) {
        super(app);

        app.ticker.add(() => this.onTick());
    }

    registerScene(name: string, scene: Scene): void {
        if (this.registeredScenes.has(name))
            throw new Error(`Cannot register scene ${name}. already registered`);
        this.registeredScenes.set(name, scene);
    }

    unregisterScene(name: string): void {
        this.registeredScenes.delete(name);
    }

    switchTo(scene: string, animation?: ISwitchSceneAnimation): void
    switchTo(scene: Scene, animation?: ISwitchSceneAnimation): void
    switchTo(scene: string | Scene, animation: ISwitchSceneAnimation = new ImmediateSwitchSceneAnimation()): void {
        const targetScene = scene instanceof Scene ? scene : this.registeredScenes.get(scene);
        if (targetScene == null)
            throw new Error(`unable switch scene when target is unavailable`);

        if (this.currentScene?.onBeforeOut() === ActionResponse.DENY || targetScene?.onBeforeIn() === ActionResponse.DENY)
            return;
        this.currentSceneAnimationExecutor = new SceneAnimationExecutor(animation, targetScene, this.currentScene);
    }

    onTick() {
        if (this.currentSceneAnimationExecutor) {
            if (this.currentSceneAnimationExecutor.onTick() === ActionResult.DONE) {
                if (this.currentScene)
                    this.app.stage.removeChild(this.currentScene);
                this.currentScene = this.currentSceneAnimationExecutor.toScene;
                this.app.stage.addChild(this.currentScene);
                this.currentSceneAnimationExecutor = undefined;
            }
        } else
            this.currentScene?.onTick();
    }
}
