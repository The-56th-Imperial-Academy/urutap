import {Ticker} from "pixi.js";
import {Animate} from "../../framework/classes/animate.ts";
import {easeInOutByT} from "../../framework/utils/beizer.ts";

export class BlinkAnimate extends Animate {
    private cycleStart: number = 0;

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
            if (diffTime > cycleTime)
                this.target.alpha = 1;
            else
                this.target.alpha = 1 - easeInOutByT(diffTime / cycleTime) / 100;
        });

        Ticker.shared.add(this.actionState.ticking);
        return this.actionState.promise;
    }
}