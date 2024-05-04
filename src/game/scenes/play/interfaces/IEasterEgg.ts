export interface IEasterEgg {
    matchers: number[][],
    effects: string[],
    strictOrder: boolean,
}

export interface IEasterEggMatcher {
    matcher: number[],
    effects: string[],
    strictOrder: boolean,
}