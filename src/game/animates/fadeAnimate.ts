import {Container, Ticker} from "pixi.js";
import {Animate} from "../../framework/classes/animate.ts";

export class FadeAnimate extends Animate {
    private initialState?: {
        alpha: number
    };

    constructor(target: Container) {
        super(target);
    }

    play(to: number, duration: number = 1000) {
        this.playing = true;
        if (this.actionState)
            return;

        this.initialState = {
            alpha: this.target.alpha,
        };
        let remaining = duration;
        this.actionState = Animate.createActionState(() => {
            if (!this.playing || !this.initialState)
                return;

            remaining -= Ticker.shared.deltaMS;
            if (remaining <= 0)
                remaining = 0;

            this.target.alpha = to + ((this.initialState.alpha - to) * (remaining / duration));

            if (remaining <= 0)
                this.reset();
        });
        Ticker.shared.add(this.actionState.ticking);
        return this.actionState.promise;
    }

    reset() {
        super.reset();
        if (this.actionState) {
            Ticker.shared.remove(this.actionState.ticking);
            this.actionState.resolver();
            this.actionState = undefined;
        }
    }
}