import Color from "./Color";

export default class Grid {
  rows: number;
  columns: number;
  data: Uint8Array;

  constructor(rows: number, columns: number, source?: Grid) {
    this.rows = rows;
    this.columns = columns;
    this.data = new Uint8Array(rows * columns);
    if (!source) {
      this.data.fill(Color.Red);
    } else {
      if (source.rows === rows && source.columns === columns) {
        this.data.set(source.data);
      } else {
        for (let x = 0; x < columns; x++) {
          for (let y = 0; y < rows; y++) {
            this.data[y * columns + x] = source.read(x, y) || Color.Red;
          }
        }
      }
    }
  }

  set(src: Grid): void {
    this.data.set(src.data);
  }

  clone(): Grid {
    return new Grid(this.rows, this.columns, this);
  }

  paint(x: number, y: number, color: Color): void {
    if (x >= 0 && x < this.columns && y >= 0 && y < this.rows) {
      this.data[y * this.columns + x] = color;
    }
  }

  paintSize(x: number, y: number, size: number, color: Color): void {
    this.paint(x, y, color);
    for (let i = size * -1; i < size; i++) {
      for (let j = size * -1; j < size; j++) {
        this.paint(x + i, y + j, color);
      }
    }
  }

  paintLine(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    size: number,
    color: Color
  ): void {
    plotLine(x0, y0, x1, y1, (x: number, y: number) => {
      this.paintSize(x, y, size, color);
    });
  }

  paintRect(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    color: Color
  ): void {
    plotRect(x0, y0, x1, y1, (x: number, y: number) => {
      this.paint(x, y, color);
    });
  }

  floodFill(x: number, y: number, color: Color): void {
    const targetColor = this.read(x, y);
    if (targetColor === undefined || targetColor === color) {
      return;
    }
    const floodFill = (x: number, y: number) => {
      if (this.read(x, y) !== targetColor) return;
      this.paint(x, y, color);
      floodFill(x + 1, y);
      floodFill(x - 1, y);
      floodFill(x, y + 1);
      floodFill(x, y - 1);
    };
    floodFill(x, y);
  }

  fill(color: Color): void {
    this.data.fill(color);
  }

  read(x: number, y: number): Color | undefined {
    if (x >= 0 && x < this.columns && y >= 0 && y < this.rows) {
      return this.data[y * this.columns + x];
    } else {
      return undefined;
    }
  }
}

function plotLine(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  plot: (x: number, y: number) => void
): void {
  var dx = Math.abs(x1 - x0);
  var dy = Math.abs(y1 - y0);
  var sx = x0 < x1 ? 1 : -1;
  var sy = y0 < y1 ? 1 : -1;
  var err = dx - dy;

  while (true) {
    plot(x0, y0);
    if (x0 === x1 && y0 === y1) break;
    var e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
}

function plotRect(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  plot: (x: number, y: number) => void
): void {
  const x = Math.min(x0, x1);
  const y = Math.min(y0, y1);
  const w = Math.abs(x0 - x1) + 1;
  const h = Math.abs(y0 - y1) + 1;
  for (let i = 0; i < w; i++) {
    for (let j = 0; j < h; j++) {
      plot(x + i, y + j);
    }
  }
}
