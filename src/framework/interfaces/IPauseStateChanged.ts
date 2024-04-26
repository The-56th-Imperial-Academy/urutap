export interface IPauseStateChanged {
    onPauseStateChanged(paused: boolean): void
}

export function implementedIPauseStateChanged(object: any): object is IPauseStateChanged {
    return !!(object as IPauseStateChanged).onPauseStateChanged;
}