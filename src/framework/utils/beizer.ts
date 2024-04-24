import {Bezier} from "bezier-js";

export const easeInOut = (steps: number) =>
    new Bezier(0, 0, 42, 0, 58, 100, 100, 100)
        .getLUT(steps)
        .map((value, index) =>
            index < steps / 2 ? value.y * 2 : (100 - value.y) * 2
        );

const easeInOutByT_bezier = new Bezier(0, 0, 42, 0, 58, 100, 100, 100);
export const easeInOutByT = (t: number) => {
    const result = easeInOutByT_bezier.get(t).y;
    return t < 0.5 ? result * 2 : (100 - result) * 2;
}