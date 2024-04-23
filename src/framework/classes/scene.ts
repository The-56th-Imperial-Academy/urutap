import {Application, Container} from "pixi.js";

export class Scene extends Container {
    protected app: Application;

    constructor(app: Application) {
        super();
        this.app = app;
    }

    async onSwitchIn() {
    }

    async onSwitchOut() {
        this.destroy();
    }
}