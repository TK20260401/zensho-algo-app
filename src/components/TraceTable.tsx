"use client";

import type { TraceEntry } from "@/lib/interpreter";

interface Props {
  trace: TraceEntry[];
  currentStep?: number;
}

export default function TraceTable({ trace, currentStep }: Props) {
  if (trace.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm p-8">
        実行ボタンを押すと、ここにトレース表が表示されます
      </div>
    );
  }

  // 全ステップに出現する変数名を収集
  const varNames = new Set<string>();
  for (const entry of trace) {
    for (const key of Object.keys(entry.variables)) {
      varNames.add(key);
    }
  }
  const sortedVars = Array.from(varNames).sort();

  return (
    <div className="space-y-3">
      {/* トレース表 */}
      <div className="overflow-auto max-h-[400px] border-2 border-slate-300 rounded-xl">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-slate-700 text-white sticky top-0">
            <tr>
              <th className="px-3 py-2 text-center border-r border-slate-600">#</th>
              <th className="px-3 py-2 text-center border-r border-slate-600">行</th>
              {sortedVars.map((v) => (
                <th key={v} className="px-3 py-2 text-center border-r border-slate-600 whitespace-nowrap">
                  {v}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trace.map((entry, i) => (
              <tr
                key={i}
                className={`border-b border-slate-200 transition-colors ${
                  currentStep === i
                    ? "bg-amber-100 font-bold"
                    : i % 2 === 0
                      ? "bg-white"
                      : "bg-slate-50"
                }`}
              >
                <td className="px-3 py-1.5 text-center text-slate-500 border-r border-slate-200">
                  {entry.step}
                </td>
                <td className="px-3 py-1.5 text-center border-r border-slate-200">
                  {entry.line}
                </td>
                {sortedVars.map((v) => (
                  <td key={v} className="px-3 py-1.5 text-center border-r border-slate-200 font-mono">
                    {entry.variables[v] != null ? String(entry.variables[v]) : "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
