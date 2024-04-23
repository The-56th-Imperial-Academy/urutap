import {Bezier} from "bezier-js";

export const easeInOut = (steps: number) =>
    new Bezier(0, 0, 42, 0, 58, 100, 100, 100)
        .getLUT(steps)
        .map((value, index) =>
            index < steps / 2 ? value.y * 2 : (100 - value.y) * 2
        );