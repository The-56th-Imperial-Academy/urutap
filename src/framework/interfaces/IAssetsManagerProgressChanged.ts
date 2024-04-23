export interface IAssetsManagerProgressChanged {
    onAssetsManagerProgressChanged(percentage: number, isLoaded: boolean): void
}

export function implementedIAssetsManagerProgressChanged(object: any): object is IAssetsManagerProgressChanged {
    return !!(object as IAssetsManagerProgressChanged).onAssetsManagerProgressChanged;
}