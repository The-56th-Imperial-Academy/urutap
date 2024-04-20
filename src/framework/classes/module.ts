import {Application} from "pixi.js";

export class Module {
    protected app: Application

    constructor(app: Application) {
        this.app = app;
    }
}