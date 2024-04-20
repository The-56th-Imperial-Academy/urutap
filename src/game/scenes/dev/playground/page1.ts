import {Text} from "pixi.js";
import {Scene} from "../../../../framework/classes/scene.ts";

export class DevPlaygroundPage1Scene extends Scene {
    constructor() {
        super();

        const text = new Text({
            text: "playground page1 scene",
        });
        text.x = 50;
        text.y = 50;

        text.interactive = true;
        text.addEventListener("click", () => {
            this.app?.modules.sceneManager.switchTo("dev_playground_page2");
        });

        this.addChild(text);
    }
}