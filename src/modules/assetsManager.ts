import {Application, Assets} from "pixi.js";
import {Module} from "../framework/classes/module.ts";
import {implementedIAssetsManagerProgressChanged} from "../framework/interfaces/IAssetsManagerProgressChanged.ts";

export class AssetsManager extends Module {
    private progress: number = 0;

    get percentage() {
        return Math.round(this.progress * 100);
    }

    get isLoaded() {
        return this.percentage === 100;
    }

    constructor(app: Application) {
        super(app);

        Assets.addBundle("full", app.environments.assets);
        Assets.loadBundle("full", progress => this.updateProgress(progress));
    }

    private updateProgress(progress: number) {
        this.progress = progress;

        this.app.stage.children.forEach(container => {
            if (implementedIAssetsManagerProgressChanged(container))
                container.onAssetsManagerProgressChanged(this.percentage, this.isLoaded);
        });
    }
}