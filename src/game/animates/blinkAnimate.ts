import {Ticker} from "pixi.js";
import {Animate} from "../../framework/classes/animate.ts";
import {easeInOut} from "../../framework/utils/beizer.ts";

export class BlinkAnimate extends Animate {
    play(frames: number = 20) {
        this.playing = true;
        if (this.actionState)
            return;

        const steps = easeInOut(frames);
        let index = 0;
        this.actionState = Animate.createActionState(() => {
            if (!this.playing)
                return;
            if (index >= steps.length) // loop
                index = 1; // ignore easeInOut's head while looping

            this.target.alpha = 1 - steps[index] / 100;
            index++;
        });

        Ticker.shared.add(this.actionState.ticking);
        return this.actionState.promise;
    }
}