import {Ticker} from "pixi.js";
import {Animate} from "../../framework/classes/animate.ts";

export class ShrinkOutAnimate extends Animate {
    private initialState?: {
        scale: {
            x: number,
            y: number,
        },
    };

    play(to: number, duration: number = 1000) {
        this.playing = true;
        if (this.actionState)
            return;

        this.initialState = {
            scale: {
                x: this.target.scale.x,
                y: this.target.scale.y,
            },
        };
        let remaining = duration;
        this.actionState = Animate.createActionState(() => {
            if (!this.playing || !this.initialState)
                return;

            remaining -= Ticker.shared.deltaMS;
            if (remaining <= 0)
                remaining = 0;

            const ratio = remaining / duration;
            this.target.scale.set(to + ((this.initialState.scale.x - to) * ratio), to + ((this.initialState.scale.y - to) * ratio));

            if (remaining <= 0)
                this.reset();
        });
        Ticker.shared.add(this.actionState.ticking);
        return this.actionState.promise;
    }
}