import {PointData, Ticker} from "pixi.js";
import {Animate} from "../../framework/classes/animate.ts";
import {easeInOutByT} from "../../framework/utils/beizer.ts";

export class BounceAnimate extends Animate {
    private baseScale: PointData = {x: 1, y: 1};
    private maxTransform: PointData = {x: 0.7, y: 0.7};
    private diffTransform: PointData = {x: 0, y: 0};
    private cycleStart: number = 0;

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

    play(cycleTime: number = 300, spaceTime: number = 100, startTOffset: number = 0) {
        this.playing = true;
        if (this.actionState)
            return;

        const totalTime = cycleTime + spaceTime;
        this.cycleStart = Ticker.shared.lastTime - (cycleTime * startTOffset);

        this.actionState = Animate.createActionState(() => {
            const currentTime = Ticker.shared.lastTime;

            // find nearest startTime
            while (this.cycleStart + totalTime < currentTime)
                this.cycleStart += totalTime;

            const diffTime = currentTime - this.cycleStart;
            if (diffTime > cycleTime) {
                this.target.scale = this.baseScale;
            } else {
                const ratio = easeInOutByT(diffTime / cycleTime) / 100;

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