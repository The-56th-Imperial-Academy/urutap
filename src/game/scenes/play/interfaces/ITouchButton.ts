import {Graphics} from "pixi.js";
import {FadeAnimate} from "../../../animates/fadeAnimate.ts";

export interface ITouchButton {
    rowIndex: number;
    colIndex: number;
    effectIndex: number;
    effectId: string;
    graphic: Graphics;
    animate?: FadeAnimate;
}
