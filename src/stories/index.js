import React from "react";

import { storiesOf } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { linkTo } from "@storybook/addon-links";

import { fitText, quantizeTextCanvas } from "../pipeline/fitText.ts";
import { loadingAnimation } from "../loadingAnimation.tsx";

function FitTextHarness() {
  const canvasRef = React.useRef(null);
  const imgRef = React.useRef(null);
  const [value, setValue] = React.useState("SEND\nNUDES");

  React.useLayoutEffect(() => {
    if (canvasRef.current === null) return;
    const ctx = canvasRef.current.getContext("2d");
    if (ctx === null) return;
    ctx.clearRect(0, 0, 500, 500);
    const lines = value
      .toUpperCase()
      .split(/[\r\n]+/)
      .map(l => l.trim())
      .filter(l => l !== "");
    if (lines.length === 0) return;
    ctx.strokeStyle = "black";
    ctx.strokeRect(20, 20, 180, 110);
    fitText(ctx, 20, 20, 180, 110, lines, {
      lineHeight: 0.8
    });
    quantizeTextCanvas(ctx, 20, 20, 180, 110, [0, 0, 0], 1);
  }, [value]);
  return (
    <React.Fragment>
      <textarea
        style={{ display: "block", border: "2px solid blue" }}
        value={value}
        onChange={e => {
          setValue(e.target.value);
        }}
      />
      <canvas
        style={{ border: "5px solid red" }}
        width="500"
        height="500"
        ref={canvasRef}
      />
    </React.Fragment>
  );
}

function LoadingHarness() {
  const canvasRef = React.useRef(null);

  React.useLayoutEffect(() => {
    if (canvasRef.current === null) return;
    const ctx = canvasRef.current.getContext("2d");
    if (ctx === null) return;
    return loadingAnimation(ctx);
  }, []);
  return (
    <canvas
      style={{ border: "5px solid red", width: 700, height: 700 }}
      width="1800"
      height="1800"
      ref={canvasRef}
    />
  );
}

storiesOf("all", module)
  .add("FitText", () => <FitTextHarness />)
  .add("LoadingAnimation", () => <LoadingHarness />);
