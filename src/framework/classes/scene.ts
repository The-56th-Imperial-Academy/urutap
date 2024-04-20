import {Container} from "pixi.js";
import {ActionResponse} from "../enums/ActionResponse.ts";

export class Scene extends Container {
    onBeforeIn(): ActionResponse | undefined {
        return undefined
    }

    onBeforeOut(): ActionResponse | undefined {
        return undefined
    }

    onTick(): void {
    }
}