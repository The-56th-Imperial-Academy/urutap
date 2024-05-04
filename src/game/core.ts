import {Application} from "pixi.js";
import {CreditsScene} from "./scenes/credits";
import {PlayScene} from "./scenes/play";
import {RootScene} from "./scenes/root";

export default function (app: Application) {
    app.modules.sceneManager.registerScene("root", RootScene, true);
    app.modules.sceneManager.registerScene("play", PlayScene);
    app.modules.sceneManager.registerScene("credits", CreditsScene);
    app.modules.sceneManager.switchTo("root", true);
}