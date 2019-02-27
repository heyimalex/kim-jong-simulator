import * as React from "react";

import styles from "./App.module.css";
import { loadingAnimation } from "./loadingAnimation";

import { loadDeps, createRenderer } from "./pipeline";

interface State {
  text: string;

  showAdvancedTextOptions: boolean;

  dependenciesHaveLoaded: boolean;

  // text options
  fontFamily: string;
  bold: boolean;
  italic: boolean;
  lineHeight: number;
  textAlign: "left" | "center" | "right";
  vAlign: "top" | "center" | "bottom";
  adaptiveFontSize: boolean;
  maxFontSize: number;
  forceUpperCase: boolean;
  forceTrimSpace: boolean;
  quantizationPoint: number;
}

export default function App() {
  const canvasRef = React.useRef<null | HTMLCanvasElement>(null);
  const renderRef = React.useRef<any>(null);

  const [state, setState] = React.useState<State>({
    text: "SEND\nNUDES",

    showAdvancedTextOptions: false,

    dependenciesHaveLoaded: false,

    // text options
    fontFamily: "sans-serif",
    bold: true,
    italic: false,
    lineHeight: 0.8,
    textAlign: "center",
    vAlign: "center",
    adaptiveFontSize: true,
    maxFontSize: 150,
    forceUpperCase: true,
    forceTrimSpace: true,
    quantizationPoint: 1
  });

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setState(state => ({ ...state, text }));
  };

  React.useLayoutEffect(() => {
    if (state.dependenciesHaveLoaded) return;
    if (canvasRef.current === null) return;
    const ctx = canvasRef.current.getContext("2d");
    if (ctx === null) return;
    return loadingAnimation(ctx);
  }, [state.dependenciesHaveLoaded]);

  React.useEffect(() => {
    loadDeps().then(deps => {
      renderRef.current = createRenderer(deps);
      setState(state => ({ ...state, dependenciesHaveLoaded: true }));
    });
  }, []);

  React.useEffect(() => {
    if (!state.dependenciesHaveLoaded) return;
    if (canvasRef.current === null || renderRef.current === null) return;
    return renderRef.current({
      text: state.text,
      target: canvasRef.current,
      fontFamily: state.fontFamily,
      bold: state.bold,
      italic: state.italic,
      lineHeight: state.lineHeight,
      textAlign: state.textAlign,
      vAlign: state.vAlign,
      adaptiveFontSize: state.adaptiveFontSize,
      maxFontSize: state.maxFontSize,
      forceUpperCase: state.forceUpperCase,
      forceTrimSpace: state.forceTrimSpace,
      quantizationPoint: state.quantizationPoint
    });
  });

  return (
    <div className={styles.Container}>
      <div className={styles.TopContainer}>
        <h1>김정X 시뮬레이터</h1>
        <h2>Kim Jong Simulator</h2>
      </div>
      <textarea
        className={styles.MainText}
        value={state.text}
        onChange={onChange}
      />
      <Toggle rkey="bold" state={state} setState={setState} />
      <Toggle rkey="italic" state={state} setState={setState} />
      <Toggle rkey="adaptiveFontSize" state={state} setState={setState} />
      <Toggle rkey="forceUpperCase" state={state} setState={setState} />
      <Toggle rkey="forceTrimSpace" state={state} setState={setState} />
      <Slider
        rkey="lineHeight"
        min={0.1}
        max={2.0}
        step={0.1}
        state={state}
        setState={setState}
      />
      <Slider
        rkey="quantizationPoint"
        min={1}
        max={255}
        step={1}
        state={state}
        setState={setState}
      />
      <Slider
        rkey="maxFontSize"
        min={1}
        max={150}
        step={1}
        state={state}
        setState={setState}
      />
      <Choose
        rkey="vAlign"
        state={state}
        setState={setState}
        options={["top", "center", "bottom"]}
      />
      <Choose
        rkey="textAlign"
        state={state}
        setState={setState}
        options={["left", "center", "right"]}
      />
      <select
        value={state.fontFamily}
        onChange={e => {
          const value = e.target.value;
          setState(state => ({ ...state, fontFamily: value }));
        }}
      >
        {fontStacks}
      </select>
      <div className={styles.CanvasContainer}>
        <canvas width={1080} height={1080} ref={canvasRef} />
      </div>
      <div className={styles.MadeByAlex}>
        <span>
          made by <a href="https://github.com/heyimalex">alex</a>.
        </span>
      </div>
    </div>
  );
}

const fontStacks = [
  `sans-serif`,
  `Georgia, serif`,
  `"Palatino Linotype", "Book Antiqua", Palatino, serif`,
  `"Times New Roman", Times, serif`,
  `Arial, Helvetica, sans-serif`,
  `"Arial Black", Gadget, sans-serif`,
  `"Comic Sans MS", cursive, sans-serif`,
  `Impact, Charcoal, sans-serif`,
  `"Lucida Sans Unicode", "Lucida Grande", sans-serif`,
  `Tahoma, Geneva, sans-serif`,
  `"Trebuchet MS", Helvetica, sans-serif`,
  `Verdana, Geneva, sans-serif`,
  `"Courier New", Courier, monospace`,
  `"Lucida Console", Monaco, monospace`
].map(opt => <option value={opt}>{opt}</option>);

function Toggle<K extends keyof State>(props: {
  rkey: K;
  state: State;
  setState: React.Dispatch<React.SetStateAction<State>>;
}) {
  return (
    <div
      onClick={() => {
        props.setState(state => ({
          ...state,
          [props.rkey]: !state[props.rkey]
        }));
      }}
    >
      Toggle {props.rkey}
    </div>
  );
}

function Slider<K extends keyof State>(props: {
  rkey: K;
  min: number;
  max: number;
  step: number;
  state: State;
  setState: React.Dispatch<React.SetStateAction<State>>;
}) {
  return (
    <div>
      {props.rkey}:
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step || 1}
        value={props.state[props.rkey].toString()}
        onChange={e => {
          const value = e.target.value;
          props.setState(state => ({
            ...state,
            [props.rkey]: parseFloat(value)
          }));
        }}
      />
      {props.state[props.rkey]}
    </div>
  );
}

function Choose<K extends keyof State>(props: {
  rkey: K;
  state: State;
  setState: React.Dispatch<React.SetStateAction<State>>;
  options: string[];
}) {
  return (
    <div>
      {props.rkey}:{" "}
      {props.options.map(opt => {
        const onClick = () => {
          props.setState(state => ({ ...state, [props.rkey]: opt }));
        };
        if (opt === props.state[props.rkey]) {
          return <strong onClick={onClick}>{opt}</strong>;
        }
        return <span onClick={onClick}>{opt}</span>;
      })}
    </div>
  );
}
