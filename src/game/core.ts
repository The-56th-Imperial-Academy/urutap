import {Application} from "pixi.js";
import {PlayScene} from "./scenes/play";
import {RootScene} from "./scenes/root";

export default function (app: Application) {
    app.modules.sceneManager.registerScene("root", RootScene);
    app.modules.sceneManager.registerScene("play", PlayScene);
    app.modules.sceneManager.switchTo("root");
}