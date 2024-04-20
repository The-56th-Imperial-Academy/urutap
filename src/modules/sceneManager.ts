import {Application} from "pixi.js";
import {Module} from "../framework/classes/module.ts";
import {Scene} from "../framework/classes/scene.ts";
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
    private registeredScenes: Map<string, Scene> = new Map();
    private currentScene?: Scene;
    private currentSceneAnimationExecutor?: SceneAnimationExecutor;

    // 是否闲置
    get isIdle() {
        return this.currentSceneAnimationExecutor == null;
    }

    // 是否正在切换场景
    get isSwitching() {
        return !this.isIdle;
    }

    constructor(app: Application) {
        super(app);

        app.ticker.add(() => this.onTick());
    }

    private attachScene(scene: Scene) {
        scene.attach(this.app)
        return scene;
    }

    private detachScene(scene: Scene) {
        scene.detach();
        return scene;
    }

    private displayScene(scene: Scene) {
        this.app.stage.addChild(scene);
        scene.onDisplayStatusChange(true);
    }

    private hideScene(scene: Scene) {
        this.app.stage.removeChild(scene);
        scene.onDisplayStatusChange(false);
    }

    registerScene(name: string, scene: Scene): void {
        if (this.registeredScenes.has(name))
            throw new Error(`Cannot register scene ${name}. already registered`);
        this.attachScene(scene);
        scene.onRegistered();
        this.registeredScenes.set(name, scene);
    }

    unregisterScene(name: string): void {
        const scene = this.registeredScenes.get(name);

        this.registeredScenes.delete(name);
        if (!scene)
            return;
        this.detachScene(scene);
        scene.onRegistered();
    }

    switchTo(scene: string, animation?: ISwitchSceneAnimation): void
    switchTo(scene: Scene, animation?: ISwitchSceneAnimation): void
    switchTo(scene: string | Scene, animation: ISwitchSceneAnimation = new ImmediateSwitchSceneAnimation()): void {
        const targetScene = scene instanceof Scene ? scene : this.registeredScenes.get(scene);
        if (targetScene == null)
            throw new Error(`unable switch scene when target is unavailable`);
        if (targetScene.isDetached)
            this.attachScene(targetScene);

        this.displayScene(targetScene);
        this.currentSceneAnimationExecutor = new SceneAnimationExecutor(animation, targetScene, this.currentScene);
    }

    private onTick() {
        if (this.currentSceneAnimationExecutor) {
            if (this.currentSceneAnimationExecutor.onTick() === ActionResult.DONE) {
                if (this.currentScene) {
                    this.hideScene(this.currentScene);
                    if (!this.currentScene.isRegistered)
                        this.detachScene(this.currentScene);
                }
                this.currentScene = this.currentSceneAnimationExecutor.toScene;
                this.currentSceneAnimationExecutor = undefined;
            }
        } else
            this.currentScene?.onTick();
    }
}
