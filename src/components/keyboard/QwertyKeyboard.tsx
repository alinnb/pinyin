import { useEffect, useState } from "react";

type KeyDef = {
  code: string;
  width: string; // tailwind class for width
  render: React.ReactNode;
  align?: "left" | "center" | "right";
};

const Dual = ({ top, bottom }: { top: string; bottom: string }) => (
  <div className="flex flex-col items-center justify-center leading-none h-full">
    <span className="text-[10px] text-gray-500">{top}</span>
    <span className="text-sm font-medium">{bottom}</span>
  </div>
);

const Single = ({ label }: { label: string }) => (
  <div className="flex items-center justify-center h-full">
    <span className="text-sm font-medium">{label}</span>
  </div>
);

const Special = ({
  main,
  sub,
  align = "center",
}: {
  main: string;
  sub?: string;
  align?: "left" | "center" | "right";
}) => (
  <div
    className={`flex flex-col h-full justify-center px-1 ${ 
      align === "left"
        ? "items-start"
        : align === "right"
        ? "items-end"
        : "items-center"
    }`}
  >
    <span className="text-xs font-medium leading-tight">{main}</span>
    {sub && (
      <span className="text-[10px] text-gray-500 leading-tight">{sub}</span>
    )}
  </div>
);

const ROW_1: KeyDef[] = [
  { code: "Backquote", width: "w-[4%]", render: <Dual top="~" bottom="`" /> },
  { code: "Digit1", width: "w-[6%]", render: <Dual top="!" bottom="1" /> },
  { code: "Digit2", width: "w-[6%]", render: <Dual top="@" bottom="2" /> },
  { code: "Digit3", width: "w-[6%]", render: <Dual top="#" bottom="3" /> },
  { code: "Digit4", width: "w-[6%]", render: <Dual top="$" bottom="4" /> },
  { code: "Digit5", width: "w-[6%]", render: <Dual top="%" bottom="5" /> },
  { code: "Digit6", width: "w-[6%]", render: <Dual top="^" bottom="6" /> },
  { code: "Digit7", width: "w-[6%]", render: <Dual top="&" bottom="7" /> },
  { code: "Digit8", width: "w-[6%]", render: <Dual top="*" bottom="8" /> },
  { code: "Digit9", width: "w-[6%]", render: <Dual top="(" bottom="9" /> },
  { code: "Digit0", width: "w-[6%]", render: <Dual top=")" bottom="0" /> },
  { code: "Minus", width: "w-[6%]", render: <Dual top="_" bottom="-" /> },
  { code: "Equal", width: "w-[6%]", render: <Dual top="+" bottom="=" /> },
  {
    code: "Backspace",
    width: "flex-1",
    render: <Special main="← 退格" align="right" />,
  },
];

const ROW_2: KeyDef[] = [
  {
    code: "Tab",
    width: "w-[8%]",
    render: <Special main="Tab" sub="首行缩进" align="left" />,
  },
  { code: "KeyQ", width: "w-[6%]", render: <Single label="Q" /> },
  { code: "KeyW", width: "w-[6%]", render: <Single label="W" /> },
  { code: "KeyE", width: "w-[6%]", render: <Single label="E" /> },
  { code: "KeyR", width: "w-[6%]", render: <Single label="R" /> },
  { code: "KeyT", width: "w-[6%]", render: <Single label="T" /> },
  { code: "KeyY", width: "w-[6%]", render: <Single label="Y" /> },
  { code: "KeyU", width: "w-[6%]", render: <Single label="U" /> },
  { code: "KeyI", width: "w-[6%]", render: <Single label="I" /> },
  { code: "KeyO", width: "w-[6%]", render: <Single label="O" /> },
  { code: "KeyP", width: "w-[6%]", render: <Single label="P" /> },
  { code: "BracketLeft", width: "w-[6%]", render: <Dual top="{" bottom="[" /> },
  {
    code: "BracketRight",
    width: "w-[6%]",
    render: <Dual top="}" bottom="]" />,
  },
  { code: "Backslash", width: "flex-1", render: <Dual top="|" bottom="\" /> },
];

const ROW_3: KeyDef[] = [
  {
    code: "CapsLock",
    width: "w-[10%]",
    render: <Special main="Caps Lock" sub="大写锁定" align="left" />,
  },
  { code: "KeyA", width: "w-[6%]", render: <Single label="A" /> },
  { code: "KeyS", width: "w-[6%]", render: <Single label="S" /> },
  { code: "KeyD", width: "w-[6%]", render: <Single label="D" /> },
  { code: "KeyF", width: "w-[6%]", render: <Single label="F" /> },
  { code: "KeyG", width: "w-[6%]", render: <Single label="G" /> },
  { code: "KeyH", width: "w-[6%]", render: <Single label="H" /> },
  { code: "KeyJ", width: "w-[6%]", render: <Single label="J" /> },
  { code: "KeyK", width: "w-[6%]", render: <Single label="K" /> },
  { code: "KeyL", width: "w-[6%]", render: <Single label="L" /> },
  { code: "Semicolon", width: "w-[6%]", render: <Dual top=":" bottom=";" /> },
  { code: "Quote", width: "w-[6%]", render: <Dual top='"' bottom="'" /> },
  {
    code: "Enter",
    width: "flex-1",
    render: <Special main="Enter" sub="回车" align="right" />,
  },
];

const ROW_4: KeyDef[] = [
  {
    code: "ShiftLeft",
    width: "w-[13%]",
    render: <Special main="Shift" align="left" />,
  },
  { code: "KeyZ", width: "w-[6%]", render: <Single label="Z" /> },
  { code: "KeyX", width: "w-[6%]", render: <Single label="X" /> },
  { code: "KeyC", width: "w-[6%]", render: <Single label="C" /> },
  { code: "KeyV", width: "w-[6%]", render: <Single label="V" /> },
  { code: "KeyB", width: "w-[6%]", render: <Single label="B" /> },
  { code: "KeyN", width: "w-[6%]", render: <Single label="N" /> },
  { code: "KeyM", width: "w-[6%]", render: <Single label="M" /> },
  { code: "Comma", width: "w-[6%]", render: <Dual top="<" bottom="," /> },
  { code: "Period", width: "w-[6%]", render: <Dual top=">" bottom="." /> },
  { code: "Slash", width: "w-[6%]", render: <Dual top="?" bottom="/" /> },
  {
    code: "ShiftRight",
    width: "flex-1",
    render: <Special main="Shift" align="right" />,
  },
];

const ROW_5: KeyDef[] = [
  {
    code: "ControlLeft",
    width: "w-[8%]",
    render: <Special main="Ctrl" align="left" />,
  },
  { code: "MetaLeft", width: "w-[8%]", render: <Special main="Win/Cmd" /> },
  {
    code: "AltLeft",
    width: "w-[8%]",
    render: <Special main="Alt" align="left" />,
  },
  {
    code: "Space",
    width: "flex-1",
    render: <Special main="Space" sub="空格" />,
  },
  {
    code: "AltRight",
    width: "w-[8%]",
    render: <Special main="Alt" align="right" />,
  },
  {
    code: "Fn",
    width: "w-[8%]",
    render: <Special main="Fn" />,
  },
  {
    code: "ControlRight",
    width: "w-[8%]",
    render: <Special main="Ctrl" align="right" />,
  },
];

const ALL_ROWS = [ROW_1, ROW_2, ROW_3, ROW_4, ROW_5];

export default function QwertyKeyboard() {
  const [pressed, setPressed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // e.code is physically accurate (e.g. KeyA, Digit1, ShiftLeft)
      // 仅显示字母和空格的按下效果
      if (e.code === "Space" || e.code.startsWith("Key")) {
        setPressed((p) => ({ ...p, [e.code]: true }));
      }
    };
    const up = (e: KeyboardEvent) => {
      setPressed((p) => ({ ...p, [e.code]: false }));
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  return (
    <div className="mt-8 w-full select-none bg-white p-2 rounded-xl border shadow-sm">
      <div className="flex flex-col gap-2">
        {ALL_ROWS.map((row, i) => (
          <div key={i} className="flex gap-1.5 w-full">
            {row.map((k) => (
              <div
                key={k.code}
                className={`${ 
                  k.width
                } h-12 rounded border flex items-center justify-center transition-all duration-75 ${ 
                  pressed[k.code]
                    ? "bg-blue-500 border-blue-600 shadow-inner translate-y-[1px] [&_*]:!text-white"
                    : "bg-white border-gray-300 shadow-[0_1px_0_rgba(0,0,0,0.1)] hover:border-gray-400"
                }`}
              >
                {k.render}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
