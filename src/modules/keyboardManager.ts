import {Application} from "pixi.js";
import {Module} from "../framework/classes/module.ts";
import {implementedIKeyboardStateChanged} from "../framework/interfaces/IKeyboardStateChanged.ts";

export class KeyboardManager extends Module {
    constructor(app: Application) {
        super(app);

        window.addEventListener("keypress", event => {
            const meta = {
                ctrl: event.ctrlKey,
                alt: event.altKey,
                shift: event.shiftKey,
            };
            for (const container of this.app.stage.children) {
                if (implementedIKeyboardStateChanged(container))
                    container.onKeyboardStateChanged("keypress", event.key, meta);
            }
        });
    }
}