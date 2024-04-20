import {Application, Container} from "pixi.js";

export class Scene extends Container {
    protected app?: Application;
    private registered: boolean = false;
    private displayStatus: boolean = false;

    // 是否链接到Application
    get isAttached() {
        return this.app != null;
    }

    // 是否未链接到Application
    get isDetached() {
        return !this.isAttached;
    }

    // 是否注册到场景管理器
    get isRegistered() {
        return this.registered;
    }

    // 是否在屏幕上
    get isOnScreen() {
        return this.displayStatus;
    }

    // 是否不在屏幕上
    get isOffScreen() {
        return !this.isOnScreen;
    }

    attach(app: Application): void {
        this.app = app;
    }

    detach() {
        this.app = undefined;
    }

    onRegistered(): void {
        this.registered = true;
    }

    onUnregistered(): void {
        this.registered = false;
    }

    onDisplayStatusChange(status: boolean) {
        this.displayStatus = status;
    }

    onTick(): void {
    }
}