import {Text} from "pixi.js";
import {Scene} from "../../../framework/classes/scene.ts";

export class RootScene extends Scene {
    constructor() {
        super();

        const text = new Text({
            text: "root scene",
        });
        text.x = 50;
        text.y = 50;
        this.addChild(text);
    }
}