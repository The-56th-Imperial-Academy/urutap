import {random, sample, times} from "lodash-es";
import {Container, Text, Ticker} from "pixi.js";
import {Animate} from "../../framework/classes/animate.ts";
import {ISceneResizeData} from "../../framework/interfaces/ISceneResize.ts";

export class DanmakuAnimate extends Animate {
    sceneSize: ISceneResizeData
    texts: string[];
    maxInterval: number = 100;
    speed: number = 3;

    constructor(target: Container, sceneSize: ISceneResizeData, texts: string[], maxInterval?: number, speed?: number) {
        super(target);
        this.sceneSize = sceneSize;
        this.texts = texts;
        this.maxInterval = maxInterval ?? this.maxInterval;
        this.speed = speed ?? this.speed;
    }

    play(number: number) {
        if (this.target.children.find(i => i.x + i.width > this.sceneSize.width))
            return;

        const container = new Container();
        const texts = times(number).map(() => sample(this.texts)).map(text => {
            const element = new Text({
                text,
                style: {
                    fontFamily: "Sourcehansanssc Bold",
                    fill: 0xffffff,
                    stroke: 1,
                    letterSpacing: 0.5,
                    dropShadow: {
                        alpha: 1,
                        angle: 0.52,
                        blur: 0,
                        distance: 1,
                        color: 0x000000
                    },
                },
                roundPixels: true,
            });
            container.addChild(element);
            return element;
        });

        let splitBy = this.findNearestRowCount(texts.length);
        times(splitBy).map(rowIndex => texts.slice(splitBy * rowIndex, splitBy * (rowIndex + 1)).reduce((offset, text) => {
            text.position.set(offset, rowIndex * text.height);
            return offset + text.width + random(8, 20);
        }, 0));

        this.target.addChild(container);
        container.position.set(this.sceneSize.width, 0);
        this.actionState = Animate.createActionState(() => {
            container.position.set(container.position.x - this.speed, 0);
            if (container.position.x + container.width <= 0) {
                this.target.removeChild(container);
                this.reset();
            }
        });
        Ticker.shared.add(this.actionState.ticking);
        return this.actionState.promise;
    }

    findNearestRowCount(targetValue: number, start: number = 1): number {
        if (start * start >= targetValue)
            return start;
        return this.findNearestRowCount(targetValue, start + 1);
    }
}