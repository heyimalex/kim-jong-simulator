import * as React from "react";

import styles from "./App.module.css";
import { loadingAnimation } from "./loadingAnimation";

import { loadDeps, createRenderer } from "./pipeline";

export default function App() {
  const canvasRef = React.useRef<null | HTMLCanvasElement>(null);
  const renderRef = React.useRef<any>(null);

  const [value, setValue] = React.useState("SEND\nNUDES");
  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  };

  const [loaded, setLoaded] = React.useState(false);

  React.useLayoutEffect(() => {
    if (loaded) return;
    if (canvasRef.current === null) return;
    const ctx = canvasRef.current.getContext("2d");
    if (ctx === null) return;
    return loadingAnimation(ctx);
  }, [loaded]);

  React.useEffect(() => {
    loadDeps().then(deps => {
      renderRef.current = createRenderer(deps);
      setLoaded(true);
    });
  }, []);

  React.useEffect(() => {
    if (!loaded) return;
    if (canvasRef.current === null || renderRef.current === null) return;
    let rafId = window.requestAnimationFrame(() => {
      renderRef.current(value, canvasRef.current);
    });
    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [loaded, value]);

  return (
    <div className={styles.Container}>
      <div className={styles.TopContainer}>
        <h1>김정X 시뮬레이터</h1>
        <h2>Kim Jong Simulator</h2>
      </div>
      <textarea className={styles.MainText} value={value} onChange={onChange} />
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
