import {Bezier} from "bezier-js";
import {random} from "lodash-es";
import {Container, Ticker} from "pixi.js";
import {Animate} from "../../framework/classes/animate.ts";
import {ISceneResizeData} from "../../framework/interfaces/ISceneResize.ts";
import {customEaseInOutByT} from "../../framework/utils/beizer.ts";

const progressByT = customEaseInOutByT(new Bezier(0, 0, 0, 30, 100, -10, 100, 100))

export class ShiningAnimation extends Animate {
    sceneSize: ISceneResizeData

    constructor(target: Container, sceneSize: ISceneResizeData) {
        super(target);
        this.sceneSize = sceneSize;
    }

    play(maxSize: number = 1, duration: number = 600) {
        this.playing = true;
        if (this.actionState)
            return;

        const startTime = Ticker.shared.lastTime;
        this.target.position.set(random(this.sceneSize.width), random(this.sceneSize.height));

        this.actionState = Animate.createActionState(() => {
            const currentTime = Ticker.shared.lastTime;

            if (startTime + duration <= currentTime) {
                this.reset();
                return;
            }

            const scale = maxSize * progressByT(Math.min(Math.round(currentTime - startTime), duration) / duration) / 100;
            this.target.scale.set(scale, scale);
        });

        Ticker.shared.add(this.actionState.ticking);
        return this.actionState.promise;
    }
}