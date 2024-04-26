import {sound} from "@pixi/sound";
import {Application, Ticker} from "pixi.js";
import {Module} from "../framework/classes/module.ts";
import {implementedIPauseStateChanged} from "../framework/interfaces/IPauseStateChanged.ts";

export class PauseDetector extends Module {
    private runningState: boolean = true;
    enabled: boolean = false;

    get running() {
        return this.runningState;
    }

    constructor(app: Application) {
        super(app);

        window.addEventListener("focus", () => {
            this.trigger(false);
        });
        window.addEventListener("blur", () => {
            this.trigger(true);
        });
    }

    private trigger(paused: boolean) {
        if (!this.enabled)
            return;

        this.runningState = !paused;
        if (paused) {
            this.app.ticker.stop();
            Ticker.shared.stop();
            sound.pauseAll();
        } else {
            this.app.ticker.start();
            Ticker.shared.start();
            sound.resumeAll();
        }

        for (const container of this.app.stage.children) {
            if (implementedIPauseStateChanged(container))
                container.onPauseStateChanged(paused);
        }
    }
}