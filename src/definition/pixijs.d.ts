import {Modules} from "./modules";
import environments from "../ environments.json";

declare module "pixi.js" {
    interface Application {
        environments: typeof environments
        modules: Modules
    }
}