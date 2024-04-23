import {Container, Ticker, TickerCallback} from "pixi.js";

export class Animate {
    protected target: Container;
    protected playing: boolean = false;
    protected actionState?: {
        promise: Promise<void>
        resolver: Function,
        ticking: TickerCallback<null>
    };

    get isPlaying() {
        return this.playing;
    }

    constructor(target: Container) {
        this.target = target;
    }

    static createActionState(ticking: TickerCallback<null>) {
        let resolver: Function = () => {
        };
        const promise = new Promise<void>(resolve => {
            resolver = resolve;
        });

        return {
            promise,
            resolver,
            ticking,
        }
    }

    pause() {
        this.playing = false;
    }

    reset() {
        this.playing = false;
        if (this.actionState) {
            Ticker.shared.remove(this.actionState.ticking);
            this.actionState.resolver();
            this.actionState = undefined;
        }
    }
}