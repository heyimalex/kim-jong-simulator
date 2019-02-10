import * as React from "react";
import "./App.css";

import Grid from "./Grid";
import Color, { colorList, getColorValue } from "./Color";
import CanvasDrawer from "./CanvasDrawer";
import KJSim from "./KJSimulator";

type PaintMode = "paint" | "line" | "rect" | "fill" | "clear";

interface AppState {
  color: Color;
  mode: PaintMode;
  brushSize: number;
  drawing: null | DrawOperation;
  grid: GridHistory;
}

type DrawOperation = PendingPaint | PendingLine | PendingRect;

interface PendingPaint {
  kind: "paint";
  pending: Grid;
  cursor: { x: number; y: number };
}

interface PendingLine {
  kind: "line";
  pending: Grid;
  cursor: { x: number; y: number };
  start: { x: number; y: number };
}

interface PendingRect {
  kind: "rect";
  pending: Grid;
  cursor: { x: number; y: number };
  start: { x: number; y: number };
}

interface GridHistory {
  past: Grid[];
  present: Grid;
  future: Grid[];
}

function ghettoLoadImage(imdata: ImageData) {
  const grid = new Grid(220, 180);
  for (let x = 0; x < grid.columns; x++) {
    for (let y = 0; y < grid.rows; y++) {
      const r = imdata.data[(y * grid.columns + x) * 4] === 255;
      const g = imdata.data[(y * grid.columns + x) * 4 + 1] === 255;
      const b = imdata.data[(y * grid.columns + x) * 4 + 2] === 255;
      let color: Color = Color.Invalid;
      if (r && g && b) {
        color = Color.White;
      } else if (!r && !g && !b) {
        color = Color.Black;
      } else if (r && !g && !b) {
        color = Color.Red;
      } else if (!r && g && !b) {
        color = Color.Green;
      } else if (!r && !g && b) {
        color = Color.Blue;
      } else if (r && g && !b) {
        color = Color.Yellow;
      } else if (r && !g && b) {
        color = Color.Magenta;
      } else if (!r && g && b) {
        color = Color.Cyan;
      }
      grid.paint(x, y, color);
    }
  }
  return grid;
}

export default class App extends React.Component<any, AppState> {
  constructor(props: any) {
    super(props);
    this.state = {
      color: Color.Yellow,
      mode: "paint",
      brushSize: 1,
      drawing: null,
      grid: {
        past: [],
        present: new Grid(220, 180),
        future: []
      }
    };
  }

  componentDidMount() {
    // Ghetto load the base image on mount.
    const url = `${process.env.PUBLIC_URL}/textures/send-nudes.png`;
    fetch(url)
      .then(res => res.blob())
      .then(b => createImageBitmap(b))
      .then(bmp => {
        const canvas = document.createElement("canvas");
        canvas.width = bmp.width;
        canvas.height = bmp.height;
        const ctx = canvas.getContext("2d");
        ctx!.drawImage(bmp, 0, 0);
        const imdata = ctx!.getImageData(0, 0, bmp.width, bmp.height);

        this.setState({
          grid: { past: [], present: ghettoLoadImage(imdata), future: [] }
        });
      });
  }

  pushNextGrid(state: AppState, nextGrid: Grid): GridHistory {
    let nextPast =
      state.grid.past.length > 9
        ? state.grid.past.slice(1)
        : state.grid.past.slice();
    nextPast.push(state.grid.present);
    return {
      past: nextPast,
      present: nextGrid,
      future: []
    };
  }

  handleMouseDown = (x: number, y: number) => {
    this.setState((state: AppState) => {
      if (state.drawing !== null) return null;

      if (state.mode === "clear") {
        const nextGrid = state.grid.present.clone();
        nextGrid.fill(state.color);
        return {
          grid: this.pushNextGrid(state, nextGrid),
          drawing: state.drawing
        };
      }

      if (state.mode === "fill") {
        const nextGrid = state.grid.present.clone();
        nextGrid.floodFill(x, y, state.color);
        return {
          grid: this.pushNextGrid(state, nextGrid),
          drawing: state.drawing
        };
      }

      // Clone the current grid to create the mutable pending grid. All of the
      // drawing modes should start with the current coordinate being painted,
      // so do that first.
      const pending = state.grid.present.clone();
      if (state.mode === "line" || state.mode === "paint") {
        pending.paintSize(x, y, state.brushSize, state.color);
      } else {
        pending.paint(x, y, state.color);
      }

      switch (state.mode) {
        case "line":
          return {
            grid: state.grid,
            drawing: {
              kind: "line",
              pending,
              cursor: { x, y },
              start: { x, y }
            }
          };
        case "rect":
          return {
            grid: state.grid,
            drawing: {
              kind: "rect",
              pending,
              cursor: { x, y },
              start: { x, y }
            }
          };
        case "paint":
          return {
            grid: state.grid,
            drawing: {
              kind: "paint",
              pending,
              cursor: { x, y }
            }
          };
        default:
          return null;
      }
      return null;
    });
  };

  handleMouseMove = (x: number, y: number) => {
    this.setState(state => {
      const { drawing } = state;
      if (
        drawing === null ||
        (drawing.cursor.x === x && drawing.cursor.y === y)
      ) {
        return null;
      }
      updatePendingDrawing(state, x, y);
      const nextDrawing: DrawOperation = {
        ...drawing,
        cursor: { x, y }
      };
      return { drawing: nextDrawing };
    });
  };

  handleMouseUp = (x: number, y: number) => {
    this.setState(state => {
      if (state.drawing === null) return null;
      updatePendingDrawing(state, x, y);
      return {
        drawing: null,
        grid: this.pushNextGrid(state, state.drawing.pending)
      };
    });
  };

  handleSetColor = (color: Color): void => {
    this.setState(state => {
      if (state.drawing !== null) return null;
      return { color };
    });
  };

  handleSetMode = (mode: PaintMode): void => {
    this.setState(state => {
      if (state.drawing !== null) return null;
      return { mode };
    });
  };

  handleIncBrushSize = (): void => {
    this.setState(state => {
      if (state.drawing !== null) return null;
      const nextBrushSize = state.brushSize + 1;
      if (nextBrushSize > 10) return null;
      return { brushSize: nextBrushSize };
    });
  };

  handleDecBrushSize = (): void => {
    this.setState(state => {
      if (state.drawing !== null) return null;
      const nextBrushSize = state.brushSize - 1;
      if (nextBrushSize <= 0) return null;
      return { brushSize: nextBrushSize };
    });
  };

  handleUndo = (): void => {
    this.setState(state => {
      if (state.drawing !== null) return null;
      const history = state.grid;
      if (history.past.length === 0) return null;
      const nextPast = history.past.slice();
      const nextPresent = nextPast.pop();
      return {
        grid: {
          past: nextPast,
          present: nextPresent as Grid,
          future: [history.present, ...history.future]
        }
      };
    });
  };

  handleRedo = (): void => {
    this.setState(state => {
      if (state.drawing !== null) return null;
      const history = state.grid;
      if (history.future.length === 0) return null;
      const nextFuture = history.future.slice();
      const nextPresent = nextFuture.shift();
      return {
        grid: {
          past: history.past.concat([history.present]),
          present: nextPresent as Grid,
          future: nextFuture
        }
      };
    });
  };

  render() {
    return (
      <div>
        <h1 style={{ color: "red", fontStyle: "italic", textAlign: "center" }}>
          KIM JONG SIMULTATOR
        </h1>
        <div className="ControlContainer">
          <ModeSelector mode={this.state.mode} onChange={this.handleSetMode} />
          <ColorSelector
            color={this.state.color}
            onChange={this.handleSetColor}
          />
          <BrushSizeSelector
            brushSize={this.state.brushSize}
            onIncrement={this.handleIncBrushSize}
            onDecrement={this.handleDecBrushSize}
          />
          <UndoRedoControls
            canUndo={this.state.grid.past.length > 0}
            canRedo={this.state.grid.future.length > 0}
            onUndo={this.handleUndo}
            onRedo={this.handleRedo}
          />
        </div>

        <CanvasDrawer
          width={1000}
          height={500}
          rowSpacing={1}
          columnSpacing={1}
          grid={
            this.state.drawing !== null
              ? this.state.drawing.pending
              : this.state.grid.present
          }
          drawing={this.state.drawing !== null}
          onMouseDown={this.handleMouseDown}
          onMouseUp={this.handleMouseUp}
          onMouseMove={this.handleMouseMove}
          onMouseLeave={() => {}}
        />
        <KJSim grid={this.state.grid.present} />
      </div>
    );
  }
}

function updatePendingDrawing(state: AppState, x: number, y: number) {
  const { drawing } = state;
  if (drawing === null) return;
  const { pending } = drawing;
  switch (drawing.kind) {
    case "paint":
      pending.paintLine(
        drawing.cursor.x,
        drawing.cursor.y,
        x,
        y,
        state.brushSize,
        state.color
      );
      return;
    case "line":
      pending.set(state.grid.present);
      pending.paint(drawing.start.x, drawing.start.y, state.color);
      pending.paintLine(
        drawing.start.x,
        drawing.start.y,
        x,
        y,
        state.brushSize,
        state.color
      );
      return;
    case "rect":
      pending.set(state.grid.present);
      pending.paint(drawing.start.x, drawing.start.y, state.color);
      pending.paintRect(drawing.start.x, drawing.start.y, x, y, state.color);
      return;
    default:
      return;
  }
}

const modes: Array<PaintMode> = ["paint", "line", "rect", "fill", "clear"];

class ModeSelector extends React.PureComponent<{
  mode: PaintMode;
  onChange: (mode: PaintMode) => void;
}> {
  render() {
    const currentMode = this.props.mode;
    const { onChange } = this.props;
    return (
      <div>
        <h3>MODE</h3>
        <ul>
          {modes.map(mode => {
            const style =
              currentMode === mode
                ? { color: "white", backgroundColor: "black" }
                : undefined;
            return (
              <li
                key={mode}
                onClick={() => onChange(mode)}
                style={{ cursor: "pointer" }}
              >
                <span style={style}>{mode.toUpperCase()}</span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
}

class ColorSelector extends React.PureComponent<{
  color: Color;
  onChange: (color: Color) => void;
}> {
  render() {
    const currentColor = this.props.color;
    const { onChange } = this.props;
    return (
      <div>
        <h3>COLOR</h3>
        <ul>
          {colorList.map(c => {
            const hex = getColorValue(c);
            const style =
              currentColor === c
                ? { color: "white", backgroundColor: "black" }
                : undefined;
            return (
              <li
                key={hex}
                onClick={() => onChange(c)}
                style={{ cursor: "pointer" }}
              >
                <span style={style}>
                  <div
                    style={{
                      border: "1px solid black",
                      backgroundColor: hex,
                      width: 10,
                      height: 10,
                      display: "inline-block"
                    }}
                  />
                  {hex.toUpperCase()}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
}

class BrushSizeSelector extends React.PureComponent<{
  brushSize: number;
  onIncrement: () => void;
  onDecrement: () => void;
}> {
  render() {
    const { props } = this;
    return (
      <div>
        <h3>BRUSH SIZE</h3>
        <button onClick={props.onDecrement}>-</button>
        {props.brushSize}
        <button onClick={props.onIncrement}>+</button>
      </div>
    );
  }
}

class UndoRedoControls extends React.PureComponent<{
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}> {
  render() {
    const { props } = this;
    return (
      <div>
        <h3>HISTORY</h3>
        <ul>
          <li>
            <button disabled={!props.canUndo} onClick={props.onUndo}>
              UNDO
            </button>
          </li>
          <li>
            <button disabled={!props.canRedo} onClick={props.onRedo}>
              REDO
            </button>
          </li>
        </ul>
      </div>
    );
  }
}
