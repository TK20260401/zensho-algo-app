"use client";

interface Props {
  code: string;
  onChange: (code: string) => void;
  highlightLine?: number;
}

export default function PseudoEditor({ code, onChange, highlightLine }: Props) {
  const lines = code.split("\n");

  return (
    <div className="relative flex border-2 border-slate-300 rounded-xl overflow-hidden bg-white font-mono text-sm">
      {/* 行番号 */}
      <div className="flex flex-col bg-slate-100 text-slate-400 text-right select-none px-2 py-3 border-r border-slate-200 min-w-[3rem]">
        {lines.map((_, i) => (
          <div
            key={i}
            className={`leading-6 px-1 ${
              highlightLine === i + 1 ? "bg-amber-200 text-amber-800 font-bold rounded" : ""
            }`}
          >
            {i + 1}
          </div>
        ))}
      </div>
      {/* エディタ本体 */}
      <textarea
        value={code}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="flex-1 p-3 leading-6 resize-none outline-none min-h-[300px] bg-transparent text-slate-800"
        style={{ tabSize: 2 }}
      />
    </div>
  );
}
