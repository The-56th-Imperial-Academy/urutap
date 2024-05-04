import {Graphics} from "pixi.js";
import {FadeAnimate} from "../../../animates/fadeAnimate.ts";

export interface ITouchButton {
    rowIndex: number;
    colIndex: number;
    buttonIndex: number;
    binding: {
        effects: string[];
        key: string;
    };
    graphic: Graphics;
    animate?: FadeAnimate;
}
