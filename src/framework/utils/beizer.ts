import {Bezier} from "bezier-js";

export const easeInOut = (steps: number) =>
    new Bezier(0, 0, 42, 0, 58, 100, 100, 100)
        .getLUT(steps)
        .map((value, index) =>
            index < steps / 2 ? value.y * 2 : (100 - value.y) * 2
        );

export const customEaseInOutByT = (curve: Bezier) => {
    const center = curve.get(0.5);

    return (t: number, horizontalAxis: boolean = false) => {
        const result = curve.get(t)[horizontalAxis ? "x" : "y"];
        const reference = center[horizontalAxis ? "x" : "y"];
        return (t <= 0.5 ? result / reference : (1 - (result - reference) / (100 - reference))) * 100;
    };
};

const easeInOutByT_bezier = new Bezier(0, 0, 42, 0, 58, 100, 100, 100);
export const easeInOutByT = customEaseInOutByT(easeInOutByT_bezier);