import * as React from "react";

import styles from "./App.module.css";
import { loadingAnimation } from "./loadingAnimation";

import { loadDeps, createRenderer } from "./pipeline";
//import { Options } from "./pipeline/fitText";

interface State {
  text: string;

  showAdvancedTextOptions: boolean;

  dependenciesHaveLoaded: boolean;

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

const initialTextOptions = ["SEND\nNUDES", "DUMMY\nTHICC"];
const randomInitialText = () =>
  initialTextOptions[Math.floor(Math.random() * initialTextOptions.length)];

export default function App() {
  const canvasRef = React.useRef<null | HTMLCanvasElement>(null);
  const renderRef = React.useRef<any>(null);

  const [state, setState] = React.useState<State>({
    text: randomInitialText(),

    showAdvancedTextOptions: false,

    dependenciesHaveLoaded: false,

    // text options
    fontFamily: "sans-serif",
    bold: true,
    italic: false,
    lineHeight: 0.9,
    textAlign: "center",
    vAlign: "center",
    adaptiveFontSize: true,
    maxFontSize: 150,
    forceUpperCase: false,
    forceTrimSpace: false,
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
      {state.showAdvancedTextOptions ? (
        <AdvancedOptions state={state} setState={setState} />
      ) : null}
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

function AdvancedOptions(props: {
  state: State;
  setState: React.Dispatch<React.SetStateAction<State>>;
}) {
  const { state, setState } = props;
  return (
    <ul>
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
      <li>
        <select
          value={state.fontFamily}
          onChange={e => {
            const value = e.target.value;
            setState(state => ({ ...state, fontFamily: value }));
          }}
        >
          {fontStacks}
        </select>
      </li>
    </ul>
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
  const { rkey } = props;
  const isSelected = props.state[rkey];
  return (
    <li>
      <button
        onClick={() => {
          props.setState(state => ({
            ...state,
            [rkey]: !state[rkey]
          }));
        }}
      >
        {isSelected ? <strong>*{rkey}</strong> : rkey}
      </button>
    </li>
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
    <li>
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
    </li>
  );
}

function Choose<K extends keyof State>(props: {
  rkey: K;
  state: State;
  setState: React.Dispatch<React.SetStateAction<State>>;
  options: string[];
}) {
  return (
    <li>
      {props.rkey}:{" "}
      <ul>
        {props.options.map(opt => {
          const onClick = () => {
            props.setState(state => ({ ...state, [props.rkey]: opt }));
          };
          const isSelected = opt === props.state[props.rkey];
          return (
            <li key={opt} onClick={onClick}>
              {isSelected ? <strong>* {opt}</strong> : opt}
            </li>
          );
        })}
      </ul>
    </li>
  );
}
