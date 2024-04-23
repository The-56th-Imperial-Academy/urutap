export interface ISceneResizeData {
    width: number;
    height: number;
    centerX: number;
    centerY: number;
}

export interface ISceneResize {
    onSceneResize(data: ISceneResizeData): void
}

export function implementedISceneResized(object: any): object is ISceneResize {
    return !!(object as ISceneResize).onSceneResize;
}