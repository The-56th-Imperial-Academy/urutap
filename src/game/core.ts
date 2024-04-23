import {Application} from "pixi.js";
import {DevPlaygroundPage1Scene} from "./scenes/dev/playground/page1.ts";
import {DevPlaygroundPage2Scene} from "./scenes/dev/playground/page2.ts";
import {RootScene} from "./scenes/root";

export default function (app: Application) {
    app.modules.sceneManager.registerScene("root", RootScene);
    app.modules.sceneManager.registerScene("dev_playground_page1", DevPlaygroundPage1Scene);
    app.modules.sceneManager.registerScene("dev_playground_page2", DevPlaygroundPage2Scene);
    app.modules.sceneManager.switchTo("root");
}