export type KeyboardEventTypes = "keypress";

export interface KeyboardMetaKeyState {
    ctrl: boolean,
    alt: boolean,
    shift: boolean,
}

export interface IKeyboardStateChanged {
    onKeyboardStateChanged(action: KeyboardEventTypes, key: string, meta: KeyboardMetaKeyState): void
}

export function implementedIKeyboardStateChanged(object: any): object is IKeyboardStateChanged {
    return !!(object as IKeyboardStateChanged).onKeyboardStateChanged;
}