import * as React from "react";
import Grid from "./Grid";
import Color, { getColorValue } from "./Color";

interface CanvasGridDrawerProps {
  width: number;
  height: number;
  rowSpacing: number;
  columnSpacing: number;
  drawing: boolean;
  grid: Grid;
  onMouseDown: PointCallback;
  onMouseUp: PointCallback;
  onMouseMove: PointCallback;
  onMouseLeave: PointCallback;
}

interface CanvasGridDrawerState {
  xOffset: number;
  yOffset: number;
  cellWidth: number;
  cellHeight: number;
}

type PointCallback = (x: number, y: number) => void;

export default class CanvasGridDrawer extends React.Component<
  CanvasGridDrawerProps,
  CanvasGridDrawerState
> {
  canvas: HTMLCanvasElement | null = null;

  constructor(props: CanvasGridDrawerProps) {
    super(props);
    this.state = CanvasGridDrawer.calculateStateFromProps(props);
  }

  componentWillReceiveProps(nextProps: CanvasGridDrawerProps) {
    this.setState(CanvasGridDrawer.calculateStateFromProps(nextProps));
  }

  static calculateStateFromProps(
    props: CanvasGridDrawerProps
  ): CanvasGridDrawerState {
    const { width, height } = props;
    const rowSpacing = 1;
    const columnSpacing = 1;
    const { rows, columns } = props.grid;
    const rowsScaled = rows * rowSpacing;
    const columnsScaled = columns * columnSpacing;
    let cellWidth, cellHeight;
    if (width / columnsScaled > height / rowsScaled) {
      cellHeight = Math.floor(height / rows);
      cellWidth = Math.floor((cellHeight * columnSpacing) / rowSpacing);
    } else {
      cellWidth = Math.floor(width / columns);
      cellHeight = Math.floor((cellWidth * rowSpacing) / columnSpacing);
    }
    const xOffset = Math.floor((width - columns * cellWidth) / 2);
    const yOffset = Math.floor((height - rows * cellHeight) / 2);
    return { cellWidth, cellHeight, xOffset, yOffset };
  }

  handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (this.props.drawing) return;
    this.getEventCoordinates(e, this.props.onMouseDown);
  };

  handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!this.props.drawing) return;
    this.getEventCoordinates(e, this.props.onMouseUp);
  };

  handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!this.props.drawing) return;
    this.getEventCoordinates(e, this.props.onMouseMove);
  };

  handleMouseLeave = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!this.props.drawing) return;
    this.getEventCoordinates(e, this.props.onMouseLeave);
  };

  getEventCoordinates(
    e: React.MouseEvent<HTMLCanvasElement>,
    callback: PointCallback
  ): void {
    const { state } = this;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor(
      (e.clientX - rect.left - state.xOffset) / state.cellWidth
    );
    const y = Math.floor(
      (e.clientY - rect.top - state.yOffset) / state.cellHeight
    );
    callback(x, y);
  }

  paint(): void {
    if (!this.canvas) return;
    const ctx = this.canvas.getContext("2d");
    if (ctx === null) return;

    const { state, props } = this;
    const { xOffset, yOffset, cellWidth, cellHeight } = state;
    const { grid } = props;
    const { rows, columns } = grid;

    ctx.fillStyle = "#eee";
    ctx.fillRect(0, 0, props.width, props.height);

    const paint = (x: number, y: number, color: Color) => {
      ctx.fillStyle = getColorValue(color);
      ctx.fillRect(
        xOffset + x * cellWidth,
        yOffset + y * cellHeight,
        cellWidth,
        cellHeight
      );
    };

    for (let x = 0; x < columns; x++) {
      for (let y = 0; y < rows; y++) {
        paint(x, y, grid.read(x, y)!);
      }
    }

    /* Grid lines

        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1;
        const xMax = columns * cellWidth + xOffset;
        const yMax = rows * cellHeight + yOffset;
        for (let x = xOffset; x <= xMax; x += cellWidth) {
            ctx.beginPath();
            ctx.moveTo(x, yOffset);
            ctx.lineTo(x, yMax);
            ctx.stroke();
        }
        for (let y = yOffset; y <= yMax; y += cellHeight) {
            ctx.beginPath();
            ctx.moveTo(xOffset, y);
            ctx.lineTo(xMax, y);
            ctx.stroke();
        }*/
  }

  canvasRefCallback = (ref: HTMLCanvasElement | null) => {
    this.canvas = ref;
  };

  componentDidMount() {
    this.paint();
  }

  componentDidUpdate() {
    this.paint();
  }

  render() {
    return (
      <canvas
        ref={this.canvasRefCallback}
        onMouseDown={this.handleMouseDown}
        onMouseUp={this.handleMouseUp}
        onMouseLeave={this.handleMouseLeave}
        onMouseMove={this.handleMouseMove}
        width={this.props.width}
        height={this.props.height}
        style={{
          width: this.props.width,
          height: this.props.height
        }}
      />
    );
  }
}
