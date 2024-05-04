import {Ticker, TickerCallback} from "pixi.js";

type RhythmKeeperEventHandler = (rhythmKeeper: RhythmKeeper) => void;
type RhythmKeeperEventTypes = "sync" | "cycle" | "tick";

export class RhythmKeeper {
    private onSyncHandlers: Map<RhythmKeeperEventHandler, RhythmKeeperEventHandler> = new Map();
    private onCycleHandlers: Map<RhythmKeeperEventHandler, RhythmKeeperEventHandler> = new Map();
    private onTickHandlers: Map<RhythmKeeperEventHandler, RhythmKeeperEventHandler> = new Map();
    private started: boolean = false;
    private tickHandler?: TickerCallback<null>;
    private bpm: number;
    private _cycleTime: number;
    private _latestStart: number = 0;
    private _latestCycleStart: number = 0;
    private _latestTick: number = 0;
    private _latestCycleProgress: number = 0;

    get cycleTime(): number {
        return this._cycleTime;
    }

    get latestStart() {
        return this._latestStart;
    }

    get latestCycleStart(): number {
        return this._latestCycleStart;
    }

    get latestTick(): number {
        return this._latestTick;
    }

    // 0 ~ 1
    get latestCycleProgress(): number {
        return this._latestCycleProgress;
    }

    constructor(bpm: number) {
        this.bpm = bpm;
        this._cycleTime = 60 / this.bpm * 1000;
    }

    private sync() {
        this._latestStart = Ticker.shared.lastTime;
        this._latestCycleStart = Ticker.shared.lastTime;
        this._latestTick = Ticker.shared.lastTime;
    }

    private start() {
        this.tickHandler = () => {
            let fastForward = false;
            const currentTick = Ticker.shared.lastTime;
            this._latestTick = currentTick;

            while (this._latestCycleStart + this._cycleTime <= currentTick) {
                this._latestCycleStart += this._cycleTime;
                fastForward = true;
            }
            this._latestCycleProgress = (currentTick - this._latestCycleStart) / this._cycleTime;

            this.onTickHandlers.forEach(handler => handler(this));
            if (fastForward)
                this.onCycleHandlers.forEach(handler => handler(this));
        };

        this.started = true;
        this.sync();
        Ticker.shared.add(this.tickHandler);
    }

    private stop() {
        this.started = false;
        if (!this.tickHandler)
            return;
        Ticker.shared.remove(this.tickHandler);
        this.tickHandler = undefined;
    }

    reSync() {
        if (!this.started)
            this.start();
        else
            this.sync();

        this.onSyncHandlers.forEach(handler => handler(this));
        this.onCycleHandlers.forEach(handler => handler(this));
        this.onTickHandlers.forEach(handler => handler(this));
    }

    addEventListener(event: RhythmKeeperEventTypes, handler: RhythmKeeperEventHandler): void {
        switch (event) {
            case "sync":
                this.onSyncHandlers.set(handler, handler);
                break;
            case "cycle":
                this.onCycleHandlers.set(handler, handler);
                break;
            case "tick":
                this.onTickHandlers.set(handler, handler);
                break;
        }
    }

    removeEventListener(event: RhythmKeeperEventTypes, handler: RhythmKeeperEventHandler): void {
        switch (event) {
            case "sync":
                this.onSyncHandlers.delete(handler);
                break;
            case "cycle":
                this.onCycleHandlers.delete(handler);
                break;
            case "tick":
                this.onTickHandlers.delete(handler);
                break;
        }
    }

    destroy() {
        this.stop();
        this.onSyncHandlers.clear();
        this.onTickHandlers.clear();
    }
}