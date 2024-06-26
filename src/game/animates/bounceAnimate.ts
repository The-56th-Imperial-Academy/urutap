import {Container, PointData, Ticker} from "pixi.js";
import {Animate} from "../../framework/classes/animate.ts";
import {easeInOutByT} from "../../framework/utils/beizer.ts";

export class BounceAnimate extends Animate {
    private startTOffset: number;
    private cycleTime: number;
    private spaceTime: number;
    private totalTime: number;
    private cycleStart: number = 0;
    private baseScale: PointData = {x: 1, y: 1};
    private maxTransform: PointData = {x: 0.7, y: 0.7};
    private diffTransform: PointData = {x: 0, y: 0};

    constructor(target: Container, cycleTime: number = 300, spaceTime: number = 300, startTOffset: number = 0) {
        super(target);
        this.cycleTime = cycleTime;
        this.spaceTime = spaceTime;
        this.startTOffset = startTOffset;
        this.totalTime = this.cycleTime + this.spaceTime;
    }

    setScale(scale: PointData) {
        this.baseScale = scale;
        this.updateDiffTransform();
    }

    setMaxTransform(scale: PointData) {
        this.maxTransform = scale;
        this.updateDiffTransform();
    }

    private updateDiffTransform() {
        const minimalTransformValue = {x: this.baseScale.x * this.maxTransform.x, y: this.baseScale.y * this.maxTransform.y};
        this.diffTransform = {x: this.baseScale.x - minimalTransformValue.x, y: this.baseScale.y - minimalTransformValue.y};
    }

    sync(time: number) {
        this.cycleStart = time - (this.cycleTime * this.startTOffset);
    }

    play() {
        this.playing = true;
        if (this.actionState)
            return;

        this.sync(Ticker.shared.lastTime);

        this.actionState = Animate.createActionState(() => {
            const currentTime = Ticker.shared.lastTime;

            // find nearest startTime
            while (this.cycleStart + this.totalTime < currentTime)
                this.cycleStart += this.totalTime;

            const diffTime = currentTime - this.cycleStart;
            if (diffTime > this.cycleTime) {
                this.target.scale = this.baseScale;
            } else {
                const ratio = easeInOutByT(diffTime / this.cycleTime) / 100;

                this.target.scale = {
                    x: this.baseScale.x - this.diffTransform.x * ratio,
                    y: this.baseScale.y - this.diffTransform.y * ratio,
                };
            }
        });

        Ticker.shared.add(this.actionState.ticking);
        return this.actionState.promise;
    }
}