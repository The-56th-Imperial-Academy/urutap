import {Application} from "pixi.js";
import {RootScene} from "./scenes/root";

export default function (app: Application) {
    app.modules.sceneManager.registerScene("root", RootScene);
    app.modules.sceneManager.switchTo("root");
}