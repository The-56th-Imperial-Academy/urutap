import {Application} from "pixi.js";
import {RootScene} from "./scenes/root";

export default function (app: Application) {
    app.modules.sceneManager.switchTo(new RootScene());
}