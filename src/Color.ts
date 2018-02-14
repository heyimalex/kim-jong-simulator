enum Color {
    Invalid,
    Red,
    Green,
    Blue,
    Cyan,
    Yellow,
    Magenta,
    Black,
    White
}

export default Color;

export const colorList: Color[] = [
    Color.Red,
    Color.Green,
    Color.Blue,
    Color.Cyan,
    Color.Magenta,
    Color.Yellow,
    Color.Black,
    Color.White
];

export function getColorName(c: Color): string {
    const name = Color[c];
    return name === undefined ? "invalid" : name.toLowerCase();
}

const valueMap = new Map<Color, string>([
    [Color.Red, "#FF0000"],
    [Color.Green, "#00FF00"],
    [Color.Blue, "#0000FF"],
    [Color.Cyan, "#00FFFF"],
    [Color.Magenta, "#FF00FF"],
    [Color.Yellow, "#FFFF00"],
    [Color.Black, "#000000"],
    [Color.White, "#FFFFFF"]
]);

export function getColorValue(c: Color): string {
    const value = valueMap.get(c);
    return value === undefined ? "#959595" : value;
}
