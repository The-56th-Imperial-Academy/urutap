import {IMediaInstance, sound} from "@pixi/sound";
import {formatHex, interpolate} from "culori";
import {max, random, sample, times} from "lodash-es";
import {Application, Container, FederatedEvent, Graphics, Rectangle, Sprite, Texture} from "pixi.js";
import {Scene} from "../../../framework/classes/scene.ts";
import {IKeyboardStateChanged, KeyboardEventTypes, KeyboardMetaKeyState} from "../../../framework/interfaces/IKeyboardStateChanged.ts";
import {ISceneResizeData} from "../../../framework/interfaces/ISceneResize.ts";
import {delay} from "../../../framework/utils/delay.ts";
import {lcm} from "../../../framework/utils/math.ts";
import {BounceAnimate} from "../../animates/bounceAnimate.ts";
import {DanmakuAnimate} from "../../animates/danmakuAnimate.ts";
import {FadeAnimate} from "../../animates/fadeAnimate.ts";
import {ShiningAnimation} from "../../animates/shiningAnimation.ts";
import {ThrowingAnimate} from "../../animates/throwingAnimate.ts";
import {WaveAnimate} from "../../animates/waveAnimate.ts";
import {IEasterEgg, IEasterEggMatcher} from "./interfaces/IEasterEgg.ts";
import {IDanmakuEffectOptions, IEffect, IShiningEffectOptions, IThrowingEffectOptions} from "./interfaces/IEffect.ts";
import {ITouchButton} from "./interfaces/ITouchButton.ts";
import {RhythmKeeper} from "./rhythmKeeper.ts";

export const PlaySceneBGMMutedKey = "scene.game.play.bgm.muted";

export class PlayScene extends Scene implements IKeyboardStateChanged {
    private background: Graphics = new Graphics();
    private waveEffectLayer: Container = new Container();
    private shiningEffectLayer: Container = new Container();
    private throwingEffectLayer: Container = new Container();
    private danmakuEffectLayer: Container = new Container();
    private characterTexture: Texture = Texture.from("images/uru");
    private character: Sprite = new Sprite({
        anchor: {x: 0.5, y: 0.9},
        texture: this.characterTexture,
    });
    private wave: Graphics = new Graphics({
        alpha: 0,
    });
    private touchLayer: Container = new Container();

    private sync: boolean;
    private muted: boolean = false;
    private bgm?: IMediaInstance;
    private easterEggs: IEasterEggMatcher[] = [];
    private rhythmKeeper: RhythmKeeper;
    private effectMapping: Record<string, IEffect>;
    private effectQueue: number[] = [];
    private effectQueueMap: Map<string, boolean> = new Map();
    private effectHistory: number[] = [];
    private effectMaxHistoryLength: number = 0;
    private keyboardStateChangedCallbacks: ((action: KeyboardEventTypes, key: string, meta: KeyboardMetaKeyState) => void)[] = [];

    constructor(app: Application) {
        super(app);

        this.sync = this.app.environments.configs.sync;
        this.easterEggs = (this.app.environments.configs.easterEggs as IEasterEgg[]).reduce((array, item) => {
            item.matchers.forEach(matcher => array.push({matcher, effects: item.effects, strictOrder: item.strictOrder}));
            return array;
        }, [] as IEasterEggMatcher[]);
        this.rhythmKeeper = new RhythmKeeper(this.app.environments.configs.bgm.bpm.logic);
        this.effectMapping = this.app.environments.configs.effects as Record<string, IEffect>;
        this.effectMaxHistoryLength = max(this.easterEggs.map(i => i.matcher.length)) ?? 0;

        this.initializeBGM();
        this.initializeBackground();
        this.addChild(this.waveEffectLayer);
        this.initializeEffects();
        this.initializeCharacter();
        this.initializeTouchLayer();
        this.initializeMuteButton();
        this.initializeSyncButton();
        this.initializeComplete();
    }

    initializeBGM() {
        this.muted = this.app.modules.persistenceManager.get(PlaySceneBGMMutedKey) as boolean;

        const playMusic = async () => {
            this.rhythmKeeper.reSync();
            this.bgm = await sound.play(this.app.environments.configs.bgm.asset, {
                muted: this.muted,
                volume: this.app.environments.configs.bgm.volume,
                start: this.app.environments.configs.bgm.loopOffset,
                complete: playMusic,
            });
        };
        playMusic();
    }

    initializeBackground() {
        this.addChild(this.background);

        const colorRhythmKeeper = new RhythmKeeper(2);
        const gradient = interpolate(this.app.environments.configs.background, "lch");
        const reDraw = (data: ISceneResizeData) => this.background.clear().rect(0, 0, data.width, data.height).fill(formatHex(gradient(colorRhythmKeeper.latestCycleProgress)));

        colorRhythmKeeper.addEventListener("tick", () => reDraw(this.app.modules.sceneManager.sceneSize));
        colorRhythmKeeper.reSync();
        this.sceneResizeCallbacks.push(data => reDraw(data));
    }

    initializeEffects() {
        this.addChild(this.shiningEffectLayer);
        this.addChild(this.throwingEffectLayer);
        this.addChild(this.danmakuEffectLayer);

        this.rhythmKeeper.addEventListener("cycle", () => this.effectQueueConsume());
    }

    initializeCharacter() {
        this.addChild(this.character);

        const msPerBeat = 60 / this.app.environments.configs.bgm.bpm.animation * 1000;
        const cycleTime = Math.round(msPerBeat / 2);
        const spaceTime = msPerBeat - cycleTime;
        const bounceAnimate = new BounceAnimate(this.character, cycleTime, spaceTime, 0.5);
        bounceAnimate.setMaxTransform({x: 0.95, y: 0.92});
        bounceAnimate.play();
        this.rhythmKeeper.addEventListener("sync", rhythmKeeper => bounceAnimate.sync(rhythmKeeper.latestTick));

        this.waveEffectLayer.addChild(this.wave);
        const circleStroke = 6;
        const waveAnimate = new WaveAnimate(this.wave, cycleTime, spaceTime, 0.5, this.app.modules.sceneManager.sceneSize);
        waveAnimate.setMaxTransform({x: 5, y: 5});
        waveAnimate.play();
        this.rhythmKeeper.addEventListener("sync", rhythmKeeper => waveAnimate.sync(rhythmKeeper.latestTick));

        this.sceneResizeCallbacks.push(data => {
            const characterScale = data.height * this.app.environments.configs.characterHeightRatio / this.characterTexture.height;
            this.character.scale.set(characterScale, characterScale);
            bounceAnimate.setScale({x: characterScale, y: characterScale});
            this.character.position.set(data.centerX, data.height - (this.characterTexture.height * characterScale * 0.1));

            const circleRad = Math.max(data.width, data.height) / 5 / 2;
            this.wave.clear();
            this.wave.circle(circleRad + circleStroke, circleRad + circleStroke, circleRad).stroke({
                width: 6,
                color: 0xaaaaaa,
            });
            waveAnimate.setSceneSize(data);
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
                    buttonIndex: row * grid + col,
                    binding: this.app.environments.configs.grid.bindings[row * grid + col],
                    graphic: new Graphics({
                        interactive: true,
                        cursor: "pointer",
                        alpha: 0,
                    }),
                    animate: undefined,
                };

                const mouseMoveEventHandler = (event: FederatedEvent) => {
                    event.bubbles = false;
                    if (!mouseDownState || currentButton === button.buttonIndex)
                        return;
                    currentButton = button.buttonIndex;
                    this.touchLayerTrigger(button);
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
                button.graphic.addEventListener("mousemove", mouseMoveEventHandler);
                button.graphic.addEventListener("touchmove", mouseMoveEventHandler);

                if (button.binding.key.length)
                    this.keyboardStateChangedCallbacks.push((action, key) => {
                        if (action !== "keypress")
                            return;
                        if (button.binding.key.toLowerCase() === key)
                            this.touchLayerTrigger(button);
                    });

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

    initializeMuteButton() {
        const margin = {x: 10, y: 10};
        const size = 30;
        const textures = {
            on: Texture.from("images/ui/speaker-on"),
            off: Texture.from("images/ui/speaker-off"),
        };
        const sprite = new Sprite({
            texture: this.muted ? textures.off : textures.on,
            width: size,
            height: size,
            anchor: {
                x: 1,
                y: 0
            },
            alpha: 0.2,
            interactive: true,
            cursor: "pointer",
        });
        const action = () => {
            const targetMuted = !this.muted;
            sprite.texture = targetMuted ? textures.off : textures.on;
            sprite.setSize(size, size);
            this.toggleBGMMuted(targetMuted);
        };

        sprite.addEventListener("click", action);
        sprite.addEventListener("tap", action);

        this.addChild(sprite);
        this.sceneResizeCallbacks.push(data => {
            sprite.position.set(data.width - margin.x, margin.y);
        });
    }

    initializeSyncButton() {
        const margin = {x: 10, y: 50};
        const size = 30;
        const textures = {
            on: Texture.from("images/ui/sync-on"),
            off: Texture.from("images/ui/sync-off"),
        };
        const sprite = new Sprite({
            texture: this.sync ? textures.on : textures.off,
            width: size,
            height: size,
            anchor: {
                x: 1,
                y: 0
            },
            alpha: 0.2,
            interactive: true,
            cursor: "pointer",
        });
        const action = () => {
            const targetSync = !this.sync;
            sprite.texture = targetSync ? textures.on : textures.off;
            sprite.setSize(size, size);
            this.sync = targetSync;
        };

        sprite.addEventListener("click", action);
        sprite.addEventListener("tap", action);

        this.addChild(sprite);
        this.sceneResizeCallbacks.push(data => {
            sprite.position.set(data.width - margin.x, margin.y);
        });
    }

    touchLayerTrigger(button: ITouchButton) {
        button.animate?.reset();
        button.animate = new FadeAnimate(button.graphic);
        button.graphic.alpha = 1;
        button.animate.play(0, 300);

        if (!this.sync) {
            button.binding.effects.forEach(effectId => {
                const effect = this.effectMapping[effectId];
                if (effect)
                    this.effectExecute(effect);
            });
            this.effectUpdateHistory([button.buttonIndex]);
            return;
        }

        if (this.effectQueue.includes(button.buttonIndex))
            return;

        this.effectQueue.push(button.buttonIndex);
        button.binding.effects.forEach(effectId => this.effectQueueMap.set(effectId, true));
    }

    effectQueueConsume() {
        const queueMap = new Map(this.effectQueueMap);
        const queue = [...this.effectQueue];
        this.effectQueueMap.clear();
        this.effectQueue = [];

        Array.from(queueMap.keys()).forEach(effectId => {
            const effect = this.effectMapping[effectId];
            if (!effect)
                return;
            this.effectExecute(effect);
        });
        this.effectUpdateHistory(queue);
    }

    effectExecute(effect: IEffect) {
        switch (effect.type) {
            case "throwing":
                (() => {
                    const options = effect.options as IThrowingEffectOptions;
                    times(random(options.number.min, options.number.max)).forEach((async () => {
                        const textureConfig = sample(options.textures);
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
                    const options = effect.options as IDanmakuEffectOptions;
                    new DanmakuAnimate(this.danmakuEffectLayer, this.app.modules.sceneManager.sceneSize, options.texts).play(random(options.number.min, options.number.max));
                })();
                break;
            case "shining":
                (async () => {
                    const options = effect.options as IShiningEffectOptions;
                    times(random(options.number.min, options.number.max)).forEach((async () => {
                        const textureConfig = sample(options.textures);
                        if (!textureConfig)
                            return;

                        const sprite = Sprite.from(textureConfig.name);
                        sprite.scale.set(0);
                        sprite.anchor.set(0.5);

                        await delay(random(0, 400));

                        this.throwingEffectLayer.addChild(sprite);
                        await new ShiningAnimation(sprite, this.app.modules.sceneManager.sceneSize).play(textureConfig.scale);
                        this.throwingEffectLayer.removeChild(sprite);
                    }));
                })();
                break;
        }

        if (effect.sound.length)
            sound.play(effect.sound);
    }

    effectUpdateHistory(queue: number[]) {
        const history = this.effectHistory.concat(queue);
        if (history.length > this.effectMaxHistoryLength)
            history.splice(0, history.length - this.effectMaxHistoryLength);

        let cloneEasterEggs: (IEasterEggMatcher | undefined)[] = this.easterEggs.map(i => ({...i, matcher: [...i.matcher]}));

        for (const number of [...history].reverse()) {
            for (let i = 0; i < cloneEasterEggs.length; i++) {
                const easterEgg = cloneEasterEggs[i];
                if (easterEgg == null)
                    continue;

                let index: number;
                if (easterEgg.strictOrder) {
                    if (easterEgg.matcher[easterEgg.matcher.length - 1] === number)
                        index = easterEgg.matcher.length - 1;
                    else {
                        cloneEasterEggs[i] = undefined;
                        continue;
                    }
                } else {
                    index = easterEgg.matcher.indexOf(number);
                    if (index === -1) {
                        cloneEasterEggs[i] = undefined;
                        continue;
                    }
                }

                easterEgg.matcher.splice(index, 1);
                if (easterEgg.matcher.length === 0) {
                    this.effectHistory = [];
                    easterEgg.effects.forEach(effectId => {
                        const effect = this.effectMapping[effectId];
                        if (effect)
                            this.effectExecute(effect)
                    });
                    return;
                }
            }

            cloneEasterEggs = cloneEasterEggs.filter(i => !!i);
            if (cloneEasterEggs.length === 0)
                break;
        }

        this.effectHistory = history;
    }

    toggleBGMMuted(state: boolean) {
        this.muted = state;
        this.app.modules.persistenceManager.set(PlaySceneBGMMutedKey, state);
        if (this.bgm)
            this.bgm.muted = state;
    }

    async onSwitchOut(): Promise<void> {
        this.bgm?.stop();
        this.rhythmKeeper.destroy();
        super.onSwitchOut();
    }

    onKeyboardStateChanged(action: KeyboardEventTypes, key: string, meta: KeyboardMetaKeyState): void {
        this.keyboardStateChangedCallbacks.forEach(i => i(action, key, meta));
    }
}