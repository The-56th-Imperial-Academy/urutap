import {IMediaInstance, sound} from "@pixi/sound";
import {Application, Container, Graphics, Sprite, Text, Texture, Ticker} from "pixi.js";
import {Animate} from "../../../framework/classes/animate.ts";
import {Scene} from "../../../framework/classes/scene.ts";
import {delay} from "../../../framework/utils/delay.ts";
import {FadeAnimate} from "../../animates/fadeAnimate.ts";
import {ShrinkOutAnimate} from "../../animates/shrinkOutAnimate.ts";

class MoveUpAnimate extends Animate {
    private initialState?: {
        y: number
    };

    play(to: number, duration: number = 1000) {
        this.playing = true;
        if (this.actionState)
            return;

        this.initialState = {
            y: this.target.position.y,
        };
        let remaining = duration;
        this.actionState = Animate.createActionState(() => {
            if (!this.playing || !this.initialState)
                return;

            remaining -= Ticker.shared.deltaMS;
            if (remaining <= 0)
                remaining = 0;

            this.target.position.set(this.target.position.x, to + ((this.initialState.y - to) * (remaining / duration)));

            if (remaining <= 0)
                this.reset();
        });
        Ticker.shared.add(this.actionState.ticking);
        return this.actionState.promise;
    }
}

export class CreditsScene extends Scene {
    private sceneMask: Graphics = new Graphics();
    private background: Graphics = new Graphics();
    private textContainer: Container = new Container();
    private texts: Text[] = [];
    private logo: Sprite = new Sprite({
        texture: Texture.from("images/credits/logo"),
        anchor: 0.5,
        alpha: 0,
    });

    private bgm?: IMediaInstance;

    constructor(app: Application) {
        super(app);

        this.initializeBackground();
        this.initializeText();
        this.initializeLogo();
        this.initializeSceneMask();

        this.initializeComplete();
    }

    initializeBackground() {
        this.addChild(this.background);

        this.sceneResizeCallbacks.push(data => this.background.clear().rect(0, 0, data.width, data.height).fill(0x000000));
    }

    initializeText() {
        this.addChild(this.textContainer);

        const texts = [
            {text: "urutap", size: 56},
            {text: "", size: 20},
            {text: "[制作]", size: 32},
            {text: "The-56th-Imperial-Academy", size: 24},
            {text: "", size: 20},
            {text: "[程序]", size: 32},
            {text: "Greesea", size: 24},
            {text: "", size: 20},
            {text: "[制作协力]", size: 32},
            {text: "mimo金金中", size: 24},
            {text: "", size: 20},
            {text: "[素材提供]", size: 32},
            {text: "星熊uru字幕组", size: 24},
            {text: "枭柒", size: 24},
            {text: "", size: 20},
            {text: "[伟大的前人]", size: 32},
            {text: "mikutap - daniwellP", size: 24},
        ];
        let offset = 0;
        for (const {text, size} of texts) {
            const element = new Text({
                style: {
                    fontFamily: "Sourcehansanssc Bold",
                    fontSize: size,
                    fill: 0x8f8d03,
                    align: "center",
                    whiteSpace: "pre-line",
                },
                anchor: {
                    x: 0.5,
                    y: 0,
                },
                text,
            });
            element.position.set(0, offset);
            this.texts.push(element);
            this.textContainer.addChild(element);

            offset += size + 20;
        }
        this.textContainer.alpha = 0;

        this.sceneResizeCallbacks.push(data => {
            this.textContainer.position.set(0, data.height);
            this.texts.forEach(i => i.position.set(data.centerX, i.position.y));
        });
    }

    initializeLogo() {
        this.addChild(this.logo);

        const size = {
            width: this.logo.width,
            height: this.logo.height,
        };

        this.sceneResizeCallbacks.push(data => {
            const scale = Math.min(data.width / size.width, data.height / size.height);
            this.logo.scale.set(scale, scale);
            this.logo.position.set(data.centerX, data.centerY);
        });
    }

    initializeSceneMask() {
        this.addChild(this.sceneMask);

        this.sceneResizeCallbacks.push(data => this.sceneMask.clear().rect(0, 0, data.width, data.height).fill(this.app.environments.configs.background[0]));
    }

    async onSwitchIn(): Promise<void> {
        super.onSwitchIn();

        // mask
        await delay(500);
        if (this.destroyed)
            return;
        const sceneMaskFadeAnimate = new FadeAnimate(this.sceneMask);
        await sceneMaskFadeAnimate.play(0, 3000);

        // main
        await delay(1200);
        if (this.destroyed)
            return;
        this.bgm = await sound.play("sounds/staffroll", {
            complete: async () => {
                await delay(2000);
                history.go(-1);
            },
        });
        this.logo.alpha = 1;
        new ShrinkOutAnimate(this.logo).play(0.1, 6000);
        await delay(5000);
        await new FadeAnimate(this.logo).play(0, 1000);
        this.textContainer.alpha = 1;
        new MoveUpAnimate(this.textContainer).play(0 - this.textContainer.height, 18000);
    }

    async onSwitchOut(): Promise<void> {
        this.bgm?.stop();
        super.onSwitchOut();
    }
}