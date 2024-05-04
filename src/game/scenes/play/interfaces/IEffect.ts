export interface IEffect {
    type: string,
    options: IThrowingEffectOptions | IDanmakuEffectOptions | IShiningEffectOptions,
    sound: string,
}

export interface IEffectTexture {
    name: string,
    scale: number,
}

export interface IThrowingEffectOptions {
    number: {
        min: number,
        max: number,
    },
    textures: IEffectTexture[],
}

export interface IDanmakuEffectOptions {
    number: {
        min: number,
        max: number,
    },
    texts: string[]
}

export interface IShiningEffectOptions {
    number: {
        min: number,
        max: number,
    },
    textures: IEffectTexture[],
}