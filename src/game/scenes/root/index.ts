import {sample, template} from "lodash-es";
import {Application, Container, Graphics, Rectangle, Text} from "pixi.js";
import {Scene} from "../../../framework/classes/scene.ts";
import {IAssetsManagerProgressChanged} from "../../../framework/interfaces/IAssetsManagerProgressChanged.ts";
import {ISceneResizeData} from "../../../framework/interfaces/ISceneResize.ts";
import {BlinkAnimate} from "../../animates/blinkAnimate.ts";

export class RootScene extends Scene implements IAssetsManagerProgressChanged {
    private background: Graphics = new Graphics();
    private mainTextLoadingTemplate = template(sample(this.app.environments.texts.root.mainButtonText.loading));
    private startButtonText: Text = new Text({
        anchor: 0.5,
        style: {
            fontFamily: "Sourcehansanssc Bold",
            fill: 0xffffff,
            stroke: 1,
            letterSpacing: 1.5,
            dropShadow: {
                alpha: 1,
                angle: 0.52,
                blur: 0,
                distance: 2,
                color: 0x000000
            },
        },
    });
    private startButton: Container = new Container({
        cursor: "pointer",
    });

    constructor(app: Application) {
        super(app);

        this.initializeBackground();
        this.initializeStartButton();
        this.initializeComplete();
    }

    initializeComplete() {
        super.initializeComplete();
        this.onAssetsManagerProgressChanged(this.app.modules.assetsManager.percentage, this.app.modules.assetsManager.isLoaded);
    }

    initializeBackground() {
        this.addChild(this.background);

        this.background.interactive = true;
        this.background.addEventListener("mousemove", () => {
            console.log("move");
        });

        this.sceneResizeCallbacks.push(data => this.background.clear().rect(0, 0, data.width, data.height).fill(this.app.environments.configs.background));
    }

    initializeStartButton() {
        this.addChild(this.startButton);

        this.startButton.addEventListener("click", () => {
            this.app.modules.sceneManager.switchTo("play");
        });
        this.sceneResizeCallbacks.push(data => this.resizeStartButton(data));

        this.initializeStartButtonText();
    }

    resizeStartButton(data: ISceneResizeData) {
        const sizeWithPadding = {
            width: this.startButton.width + 60,
            height: this.startButton.height + 24,
        };

        this.startButton.hitArea = new Rectangle(data.centerX - sizeWithPadding.width / 2, data.centerY - sizeWithPadding.height / 2, sizeWithPadding.width, sizeWithPadding.height);
    }

    initializeStartButtonText() {
        this.startButton.addChild(this.startButtonText);

        new BlinkAnimate(this.startButtonText).play(1200, 1000);
        this.sceneResizeCallbacks.push(data => this.startButtonText.position.set(data.centerX, data.centerY));
    }

    onAssetsManagerProgressChanged(percentage: number, isLoaded: boolean) {
        if (isLoaded) {
            this.startButtonText.text = sample(this.app.environments.texts.root.mainButtonText.standby) ?? "";
            this.startButton.interactive = true;
            this.resizeStartButton(this.app.modules.sceneManager.sceneSize);
        } else
            this.startButtonText.text = this.mainTextLoadingTemplate({percentage});
    }
}