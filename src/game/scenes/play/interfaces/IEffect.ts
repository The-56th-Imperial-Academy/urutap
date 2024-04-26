export interface IEffect {
    type: string,
    options: IThrowEffectOptions | IDanmakuOptions,
    sound: string,
}

export interface IEffectTexture {
    name: string,
    scale: number,
}

export interface IThrowEffectOptions {
    number: {
        min: number,
        max: number,
    },
    texture: IEffectTexture[],
}

export interface IDanmakuOptions {
    number: {
        min: number,
        max: number,
    },
    texts: string[]
}