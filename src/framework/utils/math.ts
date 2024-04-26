// GCD of two numbers
// https://en.wikipedia.org/wiki/Greatest_common_divisor#Euclid's_algorithm
export const gcd = (a: number, b: number): number => (b === 0) ? a : gcd(b, a % b);
// LCM of two numbers
// https://en.wikipedia.org/wiki/Least_common_multiple#Using_the_greatest_common_divisor
export const lcm = (a: number, b: number): number => a * b / gcd(a, b);