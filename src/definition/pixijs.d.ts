import {Modules} from "./modules";

declare module "pixi.js" {
    interface Application {
        environments: Record<string, any>
        modules: Modules
    }
}