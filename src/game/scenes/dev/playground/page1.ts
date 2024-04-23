import {Application, Graphics, Text} from "pixi.js";
import {Scene} from "../../../../framework/classes/scene.ts";
import {FadeAnimate} from "../../../animates/fadeAnimate.ts";

export class DevPlaygroundPage1Scene extends Scene {
    constructor(app: Application) {
        super(app);

        const graphic = new Graphics();
        graphic.rect(0, 0, 100, 100).fill(0xffff00);

        this.addChild(graphic);

        const text = new Text({
            text: "playground page1 scene",
        });
        text.x = 50;
        text.y = 50;

        text.interactive = true;
        (() => {
            // const animate = new FadeAnimate(text);
            text.addEventListener("click", () => {
                // if (animate.isPlaying)
                //     animate.reset();
                // text.alpha = 1;
                // animate.play(0.5, 1000);
                this.app.modules.sceneManager.switchTo("dev_playground_page2");
            });
        })();

        this.addChild(text);
    }

    async onSwitchOut(): Promise<void> {
        await new FadeAnimate(this).play(0);
        super.onSwitchOut();
    }
}