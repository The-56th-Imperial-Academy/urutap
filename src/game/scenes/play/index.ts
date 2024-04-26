import {sound} from "@pixi/sound";
import {max, random, sample, times} from "lodash-es";
import {Application, Container, FederatedEvent, Graphics, Rectangle, Sprite, Texture, Ticker} from "pixi.js";
import {Scene} from "../../../framework/classes/scene.ts";
import {lcm} from "../../../framework/utils/math.ts";
import {BounceAnimate} from "../../animates/bounceAnimate.ts";
import {FadeAnimate} from "../../animates/fadeAnimate.ts";
import {ThrowingAnimate} from "../../animates/throwingAnimate.ts";
import {IEasterEgg, IEasterEggMatcher} from "./interfaces/IEasterEgg.ts";
import {IEffect, IThrowEffectOptions} from "./interfaces/IEffect.ts";
import {ITouchButton} from "./interfaces/ITouchButton.ts";

export class PlayScene extends Scene {
    private background: Graphics = new Graphics();
    private throwingEffectLayer: Container = new Container();
    private danmakuEffectLayer: Container = new Container();
    private characterTexture: Texture = Texture.from("images/uru");
    private character: Sprite = new Sprite({
        anchor: {x: 0.5, y: 0.9},
        texture: this.characterTexture,
    });
    private touchLayer: Container = new Container();

    private msPerBeat: number;
    private queue: number[] = [];
    private queueMap: Map<string, boolean> = new Map();
    private history: number[] = [];
    private maxHistoryLength: number = 0;
    private easterEggs: IEasterEggMatcher[] = [];

    constructor(app: Application) {
        super(app);

        this.msPerBeat = Math.round((60 / this.app.environments.configs.bpm) * 1000);
        this.easterEggs = (this.app.environments.configs.easterEggs as IEasterEgg[]).reduce((array, item) => {
            item.matchers.forEach(matcher => array.push({matcher, effect: item.effect}));
            return array;
        }, [] as IEasterEggMatcher[]);
        this.maxHistoryLength = max(this.easterEggs.map(i => i.matcher.length)) ?? 0;

        this.initializeBackground();
        this.initializeQueueConsumer();
        this.initializeCharacter();
        this.initializeTouchLayer();
        this.initializeComplete();

        sound.play("sounds/bgm", {
            loop: true,
            volume: this.app.environments.configs.volume,
        });
    }

    initializeBackground() {
        this.addChild(this.background);

        this.sceneResizeCallbacks.push(data => this.background.clear().rect(0, 0, data.width, data.height).fill(this.app.environments.configs.background));
    }

    initializeQueueConsumer() {
        this.addChild(this.throwingEffectLayer);
        this.addChild(this.danmakuEffectLayer);

        const effects = this.app.environments.configs.effects as Record<string, IEffect>;

        let cycleTime = 60 / this.app.environments.configs.bpm / 2 * 1000;
        let cycleStart = Ticker.shared.lastTime - cycleTime;
        const action = () => {
            const currentTime = Ticker.shared.lastTime;
            // TODO sync mode has user latency issue. recommend turn it off for now
            if (this.app.environments.configs.sync) {
                if (cycleStart + cycleTime > currentTime)
                    return;
                cycleStart += cycleTime;
            }

            const queueMap = new Map(this.queueMap);
            const queue = [...this.queue];
            this.queueMap.clear();
            this.queue = [];

            Array.from(queueMap.keys()).forEach(effectId => {
                const effect = effects[effectId];
                if (!effect)
                    return;

                switch (effect.type) {
                    case "throw":
                        (() => {
                            const options = effect.options as IThrowEffectOptions;
                            times(random(options.number.min, options.number.max)).forEach((async () => {
                                const textureConfig = sample(options.texture);
                                if (!textureConfig)
                                    return;

                                const sprite = Sprite.from(textureConfig.name);
                                sprite.scale.set(textureConfig.scale);
                                sprite.anchor.set(0.5);

                                this.throwingEffectLayer.addChild(sprite);
                                await new ThrowingAnimate(sprite, this.app.modules.sceneManager.sceneSize, {min: -30, max: 30}).play(2000);
                                this.throwingEffectLayer.removeChild(sprite);
                            }));
                        })();
                        break;
                    case "danmaku":
                        (async () => {

                        })();
                        break;
                    case "stars":
                        (async () => {

                        })();
                        break;
                }

                if (effect.sound.length)
                    sound.play(effect.sound);
            });
            this.updateHistory(queue);
        };
        Ticker.shared.add(action);
    }

    initializeCharacter() {
        this.addChild(this.character);

        const cycleTime = Math.round(this.msPerBeat / 2);
        const animate = new BounceAnimate(this.character);
        animate.setMaxTransform({x: 0.95, y: 0.92});
        // TODO milliseconds level timestamp still can not perfectly sync to music. needs some patch like leap second
        animate.play(cycleTime, this.msPerBeat - cycleTime, 0.5);
        this.sceneResizeCallbacks.push(data => {
            const scale = data.height * this.app.environments.configs.characterHeightRatio / this.characterTexture.height;
            this.character.scale.set(scale, scale);
            animate.setScale({x: scale, y: scale});
            this.character.position.set(data.centerX, data.height - (this.characterTexture.height * scale * 0.1));
        });
    }

    initializeTouchLayer() {
        this.addChild(this.touchLayer);

        const grid = this.app.environments.configs.grid.number;
        const spacingSum = lcm(grid - 1, grid) * this.app.environments.configs.grid.spacing;
        const spacing = spacingSum / (grid - 1);
        const border = this.app.environments.configs.grid.border;

        const buttons: ITouchButton[] = [];
        let mouseDownState = false;
        let currentButton = -1;

        const eventHandlers = {
            mouseDown(event: FederatedEvent) {
                event.bubbles = false;
                mouseDownState = true;
            },
            mouseUp(event: FederatedEvent) {
                event.bubbles = false;
                mouseDownState = false;
                currentButton = -1;
            },
        };
        this.touchLayer.interactive = true;
        this.touchLayer.addEventListener("mousedown", eventHandlers.mouseDown);
        this.touchLayer.addEventListener("touchstart", eventHandlers.mouseDown);
        this.touchLayer.addEventListener("mouseup", eventHandlers.mouseUp);
        this.touchLayer.addEventListener("touchend", eventHandlers.mouseUp);

        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const button: ITouchButton = {
                    rowIndex: row,
                    colIndex: col,
                    effectIndex: row * grid + col,
                    effectId: `touch-${row * grid + col}`,
                    graphic: new Graphics({
                        interactive: true,
                        cursor: "pointer",
                        alpha: 0,
                    }),
                    animate: undefined,
                };

                const mouseMoveEventHandler = (event: FederatedEvent) => {
                    event.bubbles = false;
                    console.log(mouseDownState, currentButton === button.effectIndex);
                    if (!mouseDownState || currentButton === button.effectIndex)
                        return;
                    currentButton = button.effectIndex;
                    if (this.queueMap.has(button.effectId))
                        return;

                    button.animate?.reset();
                    button.animate = new FadeAnimate(button.graphic);
                    button.graphic.alpha = 1;
                    button.animate.play(0, 300);

                    this.queue.push(button.effectIndex);
                    this.queueMap.set(button.effectId, true);
                };

                button.graphic.addEventListener("mousedown", (...args) => {
                    eventHandlers.mouseDown(...args);
                    mouseMoveEventHandler(...args);
                });
                button.graphic.addEventListener("touchstart", (...args) => {
                    eventHandlers.mouseDown(...args);
                    mouseMoveEventHandler(...args);
                });
                button.graphic.addEventListener("mouseup", eventHandlers.mouseUp);
                button.graphic.addEventListener("touchend", eventHandlers.mouseUp);
                button.graphic.addEventListener("mousemove", mouseMoveEventHandler)
                button.graphic.addEventListener("touchmove", mouseMoveEventHandler)

                buttons.push(button);
                this.touchLayer.addChild(button.graphic);
            }
        }

        this.sceneResizeCallbacks.push(data => {
            this.touchLayer.hitArea = new Rectangle(0, 0, data.width, data.height);

            let x = data.width > data.height ? (data.width - data.height) / 2 : 0;
            let y = data.width > data.height ? 0 : (data.height - data.width) / 2;
            if (data.width >= data.height)
                y += border;
            if (data.height >= data.width)
                x += border;

            const containerSize = Math.min(data.width, data.height) - spacingSum - border * 2;
            const singleSize = Math.round(containerSize / grid);

            buttons.forEach(button => {
                button.graphic.clear()
                button.graphic.roundRect(0, 0, singleSize, singleSize, 12).stroke({
                    color: 0xffffff,
                    width: 4,
                });
                button.graphic.hitArea = new Rectangle(0, 0, singleSize, singleSize);
                button.graphic.position.set(
                    x + (singleSize * button.colIndex) + (spacing * button.colIndex),
                    y + (singleSize * button.rowIndex) + (spacing * button.rowIndex),
                );
            });
        });
    }

    updateHistory(queue: number[]) {
        const history = this.history.concat(queue);
        if (history.length > this.maxHistoryLength)
            history.splice(0, history.length - this.maxHistoryLength);

        let cloneEasterEggs: (IEasterEggMatcher | undefined)[] = this.easterEggs.map(i => ({...i, matcher: [...i.matcher]}));

        for (const number of [...history].reverse()) {
            for (let i = 0; i < cloneEasterEggs.length; i++) {
                const easterEgg = cloneEasterEggs[i];
                if (easterEgg == null)
                    continue;

                const index = easterEgg.matcher.indexOf(number);
                if (index === -1) {
                    cloneEasterEggs[i] = undefined;
                    continue;
                }

                easterEgg.matcher.splice(index, 1);
                if (easterEgg.matcher.length === 0) {
                    this.history = [];
                    this.queueMap.set(easterEgg.effect, true);
                    return;
                }
            }

            cloneEasterEggs = cloneEasterEggs.filter(i => !!i);
            if (cloneEasterEggs.length === 0)
                break;
        }

        this.history = history;
    }
}