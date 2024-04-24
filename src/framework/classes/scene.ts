import {Application, Container} from "pixi.js";
import {ISceneResize, ISceneResizeData} from "../interfaces/ISceneResize.ts";

export class Scene extends Container implements ISceneResize {
    protected app: Application;
    protected sceneResizeCallbacks: ((data: ISceneResizeData) => void)[] = [];

    constructor(app: Application) {
        super();
        this.app = app;
    }

    initializeComplete() {
        this.onSceneResize(this.app.modules.sceneManager.sceneSize);
    }

    async onSwitchIn() {
    }

    async onSwitchOut() {
        this.destroy();
    }

    onSceneResize(data: ISceneResizeData) {
        this.sceneResizeCallbacks.forEach(i => i(data));
    }
}