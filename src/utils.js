// @flow

export function is_int(x: number): boolean {
    return (x | 0) === x;
}
