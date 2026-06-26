"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import PseudoEditor from "@/components/PseudoEditor";
import TraceTable from "@/components/TraceTable";
import VariableVisualizer from "@/components/VariableVisualizer";
import { execute, type TraceEntry } from "@/lib/interpreter";
import { samplePrograms } from "@/lib/samplePrograms";

export default function Home() {
  const [code, setCode] = useState(samplePrograms[0].code);
  const [trace, setTrace] = useState<TraceEntry[]>([]);
  const [currentStep, setCurrentStep] = useState<number | undefined>();
  const [stepIndex, setStepIndex] = useState(0);
  const [allTrace, setAllTrace] = useState<TraceEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(500); // ms per step
  const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepIndexRef = useRef(0);
  const allTraceRef = useRef<TraceEntry[]>([]);

  // 自動再生ループ
  useEffect(() => {
    if (!isPlaying) {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
      return;
    }

    const tick = () => {
      const idx = stepIndexRef.current;
      const traceData = allTraceRef.current;
      if (idx < traceData.length) {
        setTrace(traceData.slice(0, idx + 1));
        setCurrentStep(idx);
        stepIndexRef.current = idx + 1;
        setStepIndex(idx + 1);
        playTimerRef.current = setTimeout(tick, speed);
      } else {
        setIsPlaying(false);
        setIsRunning(false);
        setCurrentStep(undefined);
      }
    };

    playTimerRef.current = setTimeout(tick, speed);
    return () => {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    };
  }, [isPlaying, speed]);

  const handleRun = useCallback(() => {
    const result = execute(code);
    setTrace(result);
    setAllTrace(result);
    allTraceRef.current = result;
    setCurrentStep(undefined);
    setStepIndex(0);
    stepIndexRef.current = 0;
    setIsRunning(false);
    setIsPlaying(false);
  }, [code]);

  const handleAnimate = useCallback(() => {
    const result = execute(code);
    setAllTrace(result);
    allTraceRef.current = result;
    setTrace(result.slice(0, 1));
    setCurrentStep(0);
    setStepIndex(1);
    stepIndexRef.current = 1;
    setIsRunning(true);
    setIsPlaying(true);
  }, [code]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleResume = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handleStepStart = useCallback(() => {
    const result = execute(code);
    setAllTrace(result);
    allTraceRef.current = result;
    setTrace(result.slice(0, 1));
    setCurrentStep(0);
    setStepIndex(1);
    stepIndexRef.current = 1;
    setIsRunning(true);
    setIsPlaying(false);
  }, [code]);

  const handleStepNext = useCallback(() => {
    if (stepIndex < allTrace.length) {
      setTrace(allTrace.slice(0, stepIndex + 1));
      setCurrentStep(stepIndex);
      setStepIndex(stepIndex + 1);
      stepIndexRef.current = stepIndex + 1;
    } else {
      setIsRunning(false);
      setCurrentStep(undefined);
    }
  }, [stepIndex, allTrace]);

  const handleReset = useCallback(() => {
    setTrace([]);
    setAllTrace([]);
    allTraceRef.current = [];
    setCurrentStep(undefined);
    setStepIndex(0);
    stepIndexRef.current = 0;
    setIsRunning(false);
    setIsPlaying(false);
  }, []);

  const handleSampleChange = (idx: number) => {
    setCode(samplePrograms[idx].code);
    handleReset();
  };

  const highlightLine = currentStep != null && trace[currentStep]
    ? trace[currentStep].line
    : undefined;

  return (
    <div className="flex flex-col min-h-screen">
      {/* ヘッダー */}
      <header className="bg-slate-800 text-white py-4 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Zensho-Algo
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            全商検定アルゴリズム・トレーナー
          </p>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 py-6">
        {/* サンプル選択 */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="text-sm font-bold text-slate-700">サンプル:</label>
          <select
            onChange={(e) => handleSampleChange(parseInt(e.target.value))}
            className="border-2 border-slate-300 rounded-lg px-3 py-2 text-sm bg-white font-bold text-slate-700"
          >
            {samplePrograms.map((p, i) => (
              <option key={i} value={i}>
                [{p.grade}] {p.title}
              </option>
            ))}
          </select>
        </div>

        {/* 2カラムレイアウト */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 左: エディタ */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-600">疑似言語エディタ</h2>
            <PseudoEditor
              code={code}
              onChange={setCode}
              highlightLine={highlightLine}
            />

            {/* 実行ボタン群 */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleRun}
                className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-bold text-sm
                           hover:bg-emerald-700 active:scale-95 transition-all shadow"
              >
                ▶ 一括実行
              </button>
              {!isRunning ? (
                <>
                  <button
                    onClick={handleAnimate}
                    className="px-4 py-2.5 bg-orange-500 text-white rounded-lg font-bold text-sm
                               hover:bg-orange-600 active:scale-95 transition-all shadow"
                  >
                    ▶ アニメ再生
                  </button>
                  <button
                    onClick={handleStepStart}
                    className="px-4 py-2.5 bg-sky-600 text-white rounded-lg font-bold text-sm
                               hover:bg-sky-700 active:scale-95 transition-all shadow"
                  >
                    1歩ずつ
                  </button>
                </>
              ) : isPlaying ? (
                <button
                  onClick={handlePause}
                  className="px-4 py-2.5 bg-amber-500 text-white rounded-lg font-bold text-sm
                             hover:bg-amber-600 active:scale-95 transition-all shadow"
                >
                  ⏸ 一時停止
                </button>
              ) : (
                <>
                  <button
                    onClick={handleResume}
                    className="px-4 py-2.5 bg-orange-500 text-white rounded-lg font-bold text-sm
                               hover:bg-orange-600 active:scale-95 transition-all shadow"
                  >
                    ▶ 再開
                  </button>
                  <button
                    onClick={handleStepNext}
                    disabled={stepIndex >= allTrace.length}
                    className={`px-4 py-2.5 rounded-lg font-bold text-sm transition-all shadow ${
                      stepIndex >= allTrace.length
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-sky-600 text-white hover:bg-sky-700 active:scale-95"
                    }`}
                  >
                    次の1歩 ({stepIndex}/{allTrace.length})
                  </button>
                </>
              )}
              <button
                onClick={handleReset}
                className="px-4 py-2.5 bg-slate-500 text-white rounded-lg font-bold text-sm
                           hover:bg-slate-600 active:scale-95 transition-all shadow"
              >
                ↺ リセット
              </button>
            </div>

            {/* 速度スライダー */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500 whitespace-nowrap">速度:</label>
                <span className="text-xs text-slate-400">速い</span>
                <input
                  type="range"
                  min={100}
                  max={2000}
                  step={100}
                  value={speed}
                  onChange={(e) => setSpeed(parseInt(e.target.value))}
                  className="flex-1 accent-orange-500"
                />
                <span className="text-xs text-slate-400">遅い</span>
              </div>
              <div className="text-center text-xs font-mono text-slate-500">
                {speed}ms / ステップ
              </div>
            </div>
          </div>

          {/* 右: ビジュアライゼーション + トレース表 */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-600">変数ビジュアライズ</h2>
            <VariableVisualizer trace={trace} currentStep={currentStep} />
            <h2 className="text-sm font-bold text-slate-600">トレース表</h2>
            <TraceTable trace={trace} currentStep={currentStep} />
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-slate-800 text-slate-400 text-center py-4 text-xs">
        &copy; 2026 Zensho-Algo ー 全商情報処理検定 完全攻略
      </footer>
    </div>
  );
}
