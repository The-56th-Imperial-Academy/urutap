import {Module} from "../framework/classes/module.ts";

export class PersistenceManager extends Module {
    set(key: string, value: any) {
        return localStorage.setItem(key, JSON.stringify(value));
    }

    get(key: string) {
        try {
            return JSON.parse(localStorage.getItem(key) ?? "");
        } catch {
            return null;
        }
    }
}