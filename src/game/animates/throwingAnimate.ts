import {Bezier} from "bezier-js";
import {random} from "lodash-es";
import {Container, Ticker} from "pixi.js";
import {Animate} from "../../framework/classes/animate.ts";
import {ISceneResizeData} from "../../framework/interfaces/ISceneResize.ts";

export class ThrowingAnimate extends Animate {
    sceneSize: ISceneResizeData
    rotation: { min: number; max: number }

    constructor(target: Container, sceneSize: ISceneResizeData, rotation: { min: number; max: number }) {
        super(target);
        this.sceneSize = sceneSize;
        this.rotation = rotation;
    }

    /*
    FIXME:
      rotation functionality has some issue. maybe caused by misunderstand. needs fix later (or never)
      start end has unbalanced issue too

      actually... it work's!
      only at some condition BTW
     */
    play(duration: number) {
        this.playing = true;
        if (this.actionState)
            return;

        const startTime = Ticker.shared.lastTime;
        const standardY = this.sceneSize.height + this.target.height + 100;
        let startLocation = {
            x: random(0 - random(200), this.sceneSize.width / 2 - random(50)),
            y: standardY,
        };
        let endLocation = {
            x: this.sceneSize.width / 2 + startLocation.x + random(50, this.sceneSize.width / 2),
            y: standardY,
        };
        let middleLocation = {
            x: startLocation.x + (endLocation.x - startLocation.x) / 2,
            y: random(-this.sceneSize.height * 1.75, this.sceneSize.height * 0.25),
        };
        const fromLeftToRight = random(true) <= 0.6; // FIXME: use some bias to cancel some start end unbalanced issue
        const startDegree = random(this.rotation.min, this.rotation.max);
        let degreeMaxOffset = random(0.1, 3, true);
        if (!fromLeftToRight) {
            const temp = startLocation;
            startLocation = endLocation;
            endLocation = temp;
        }

        const curve = new Bezier(startLocation, middleLocation, endLocation);
        this.target.position.set(startLocation.x, startLocation.y);
        this.target.rotation = startDegree;

        this.actionState = Animate.createActionState(() => {
            const currentTime = Ticker.shared.lastTime;

            // find nearest startTime
            if (startTime + duration < currentTime) {
                this.reset();
                return;
            }

            const tValue = (currentTime - startTime) / duration;
            const position = curve.get(tValue);
            this.target.position.set(position.x, position.y);
            this.target.rotation = fromLeftToRight ? startDegree + degreeMaxOffset * tValue : startDegree - degreeMaxOffset * tValue;
        });

        Ticker.shared.add(this.actionState.ticking);
        return this.actionState.promise;
    }
}