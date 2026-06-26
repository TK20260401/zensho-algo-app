"use client";

import type { TraceEntry } from "@/lib/interpreter";

interface Props {
  trace: TraceEntry[];
  currentStep?: number;
}

export default function VariableVisualizer({ trace, currentStep }: Props) {
  if (trace.length === 0) return null;

  const displayEntry = currentStep != null ? trace[currentStep] : trace[trace.length - 1];
  const prevEntry = currentStep != null && currentStep > 0 ? trace[currentStep - 1] : null;

  if (!displayEntry) return null;

  // 変数を通常変数と配列に分離
  const scalarVars: { name: string; value: number | string; changed: boolean }[] = [];
  const arrayVars: Map<string, { index: number; value: number | string }[]> = new Map();

  for (const [key, val] of Object.entries(displayEntry.variables)) {
    const arrMatch = key.match(/^([A-Za-z_]\w*)\[(\d+)\]$/);
    if (arrMatch) {
      const arrName = arrMatch[1];
      const idx = parseInt(arrMatch[2]);
      if (!arrayVars.has(arrName)) arrayVars.set(arrName, []);
      arrayVars.get(arrName)!.push({ index: idx, value: val });
    } else {
      const changed = prevEntry ? prevEntry.variables[key] !== val : true;
      scalarVars.push({ name: key, value: val, changed });
    }
  }

  // SUMのような累積変数の履歴を取得（棒グラフ用）
  const sumVar = scalarVars.find((v) => v.name === "SUM" || v.name === "sum");
  const sumHistory: number[] = [];
  if (sumVar) {
    const limit = currentStep != null ? currentStep + 1 : trace.length;
    for (let i = 0; i < limit; i++) {
      const val = trace[i].variables[sumVar.name];
      if (val != null) sumHistory.push(typeof val === "number" ? val : 0);
    }
  }
  const sumMax = sumHistory.length > 0 ? Math.max(...sumHistory, 1) : 1;

  // 出力を収集
  const limit = currentStep != null ? currentStep + 1 : trace.length;
  const outputs = trace.slice(0, limit).filter((e) => e.output != null).map((e) => e.output);

  return (
    <div className="space-y-4">
      {/* 変数ボックス */}
      <div className="flex flex-wrap gap-3">
        {scalarVars.map((v) => (
          <div
            key={v.name}
            className={`rounded-xl px-4 py-3 min-w-[80px] text-center transition-all duration-300 ${
              v.changed
                ? "bg-amber-100 border-2 border-amber-400 scale-105 shadow-lg"
                : "bg-slate-100 border-2 border-slate-200"
            }`}
          >
            <div className="text-xs font-bold text-slate-500 mb-1">{v.name}</div>
            <div className={`text-2xl font-bold font-mono ${v.changed ? "text-amber-700" : "text-slate-800"}`}>
              {String(v.value)}
            </div>
          </div>
        ))}
      </div>

      {/* 配列の可視化 */}
      {Array.from(arrayVars.entries()).map(([arrName, items]) => {
        const sorted = items.sort((a, b) => a.index - b.index);
        return (
          <div key={arrName} className="space-y-1">
            <div className="text-xs font-bold text-slate-500">{arrName}[]</div>
            <div className="flex gap-1 flex-wrap">
              {sorted.map((item) => {
                const prevVal = prevEntry?.variables[`${arrName}[${item.index}]`];
                const changed = prevVal !== item.value;
                return (
                  <div
                    key={item.index}
                    className={`flex flex-col items-center rounded-lg px-3 py-2 min-w-[50px] transition-all duration-300 ${
                      changed
                        ? "bg-amber-100 border-2 border-amber-400 scale-105"
                        : "bg-slate-100 border-2 border-slate-200"
                    }`}
                  >
                    <div className="text-[10px] text-slate-400">[{item.index}]</div>
                    <div className={`text-lg font-bold font-mono ${changed ? "text-amber-700" : "text-slate-800"}`}>
                      {String(item.value)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* SUM棒グラフ */}
      {sumHistory.length > 1 && (
        <div className="space-y-1">
          <div className="text-xs font-bold text-slate-500">SUMの推移</div>
          <div className="flex items-end gap-[2px] h-40 bg-slate-50 rounded-xl p-3 border-2 border-slate-200 overflow-hidden">
            {sumHistory.map((val, i) => {
              const height = (val / sumMax) * 85;
              const isActive = currentStep != null ? i === currentStep : i === sumHistory.length - 1;
              return (
                <div key={i} className="flex flex-col items-center flex-1 justify-end h-full">
                  {isActive && (
                    <div className="text-[9px] font-bold text-emerald-700 mb-0.5">{val}</div>
                  )}
                  <div
                    className={`w-full rounded-t transition-all duration-300 ${
                      isActive ? "bg-emerald-500" : "bg-emerald-300"
                    }`}
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 出力 */}
      {outputs.length > 0 && (
        <div className="bg-slate-800 text-green-400 rounded-xl p-4 font-mono text-sm">
          <p className="text-xs text-slate-400 mb-1">出力:</p>
          {outputs.map((o, i) => (
            <div key={i}>{o}</div>
          ))}
        </div>
      )}
    </div>
  );
}
