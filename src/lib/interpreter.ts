// 全商疑似言語インタープリタ

export interface TraceEntry {
  step: number;
  line: number;
  lineText: string;
  variables: Record<string, number | string>;
  output?: string;
}

interface LoopFrame {
  varName: string;
  from: number;
  to: number;
  stepVal: number;
  bodyStartLine: number;
  endLine: number;
}

function resolveValue(
  expr: string,
  vars: Record<string, number | string>
): number {
  let resolved = expr.trim();

  // 配列アクセス: DATA[I] → DATA_<value of I>
  resolved = resolved.replace(
    /([A-Za-z_]\w*)\[([^\]]+)\]/g,
    (_, arr, idx) => {
      const idxVal = resolveValue(idx, vars);
      const key = `${arr}[${idxVal}]`;
      return String(vars[key] ?? 0);
    }
  );

  // 変数を値に置換（長い名前を先に）
  const sortedVars = Object.keys(vars).sort((a, b) => b.length - a.length);
  for (const name of sortedVars) {
    if (name.includes("[")) continue;
    const regex = new RegExp(`\\b${name}\\b`, "g");
    resolved = resolved.replace(regex, String(vars[name]));
  }

  // MOD演算子
  resolved = resolved.replace(/\bMOD\b/gi, "%");

  try {
    // eslint-disable-next-line no-eval
    return Math.floor(Function(`"use strict"; return (${resolved})`)());
  } catch {
    return 0;
  }
}

function findMatchingEnd(
  lines: string[],
  startIdx: number,
  startKeyword: string,
  endKeyword: string
): number {
  let depth = 1;
  for (let i = startIdx + 1; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.includes(startKeyword)) depth++;
    if (trimmed.startsWith(endKeyword)) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return lines.length - 1;
}

export function execute(code: string, maxSteps = 5000): TraceEntry[] {
  const lines = code.split("\n");
  const vars: Record<string, number | string> = {};
  const trace: TraceEntry[] = [];
  const loopStack: LoopFrame[] = [];
  let pc = 0;
  let stepCount = 0;

  const snapshot = (line: number, output?: string) => {
    trace.push({
      step: trace.length + 1,
      line: line + 1,
      lineText: lines[line]?.trim() ?? "",
      variables: { ...vars },
      output,
    });
  };

  while (pc < lines.length && stepCount < maxSteps) {
    const raw = lines[pc];
    const trimmed = raw.trim();
    stepCount++;

    // 空行・コメント
    if (!trimmed || trimmed.startsWith("//")) {
      pc++;
      continue;
    }

    // --- 代入: X ← expr ---
    const assignMatch = trimmed.match(/^(.+?)\s*←\s*(.+)$/);
    if (assignMatch) {
      const lhs = assignMatch[1].trim();
      const rhs = assignMatch[2].trim();

      // 配列代入: DATA[I] ← value
      const arrMatch = lhs.match(/^([A-Za-z_]\w*)\[([^\]]+)\]$/);
      if (arrMatch) {
        const idxVal = resolveValue(arrMatch[2], vars);
        const key = `${arrMatch[1]}[${idxVal}]`;
        vars[key] = resolveValue(rhs, vars);
      } else {
        vars[lhs] = resolveValue(rhs, vars);
      }
      snapshot(pc);
      pc++;
      continue;
    }

    // --- 繰り返し: X を A から B まで C ずつ増やしながら繰り返す ---
    const loopMatch = trimmed.match(
      /^(\w+)\s*を\s*(.+?)\s*から\s*(.+?)\s*まで\s*(\d+)\s*ずつ(増|減)やしながら繰り返す$/
    );
    if (loopMatch) {
      const varName = loopMatch[1];
      const from = resolveValue(loopMatch[2], vars);
      const to = resolveValue(loopMatch[3], vars);
      const stepVal =
        loopMatch[5] === "減"
          ? -parseInt(loopMatch[4])
          : parseInt(loopMatch[4]);
      const endLine = findMatchingEnd(lines, pc, "繰り返す", "繰り返し終わり");

      vars[varName] = from;
      const shouldEnter =
        stepVal > 0 ? from <= to : from >= to;

      if (shouldEnter) {
        loopStack.push({ varName, from, to, stepVal, bodyStartLine: pc + 1, endLine });
        snapshot(pc);
        pc++;
      } else {
        snapshot(pc);
        pc = endLine + 1;
      }
      continue;
    }

    // --- 繰り返し終わり ---
    if (trimmed === "繰り返し終わり") {
      const frame = loopStack[loopStack.length - 1];
      if (frame) {
        const current = (vars[frame.varName] as number) + frame.stepVal;
        vars[frame.varName] = current;

        const shouldContinue =
          frame.stepVal > 0 ? current <= frame.to : current >= frame.to;

        if (shouldContinue) {
          snapshot(pc);
          pc = frame.bodyStartLine;
        } else {
          loopStack.pop();
          snapshot(pc);
          pc++;
        }
      } else {
        pc++;
      }
      continue;
    }

    // --- もし condition ならば ---
    const ifMatch = trimmed.match(/^もし\s*(.+)\s*ならば$/);
    if (ifMatch) {
      const condition = ifMatch[1];
      const result = evaluateCondition(condition, vars);
      const elseLineIdx = findElseLine(lines, pc);
      const endIfLine = findMatchingEnd(lines, pc, "もし", "もし終わり");

      snapshot(pc);
      if (result) {
        pc++;
      } else {
        pc = elseLineIdx !== -1 ? elseLineIdx + 1 : endIfLine + 1;
      }
      continue;
    }

    // --- そうでなければ ---
    if (trimmed === "そうでなければ") {
      const endIfLine = findMatchingEnd(lines, pc, "もし", "もし終わり");
      pc = endIfLine + 1;
      continue;
    }

    // --- もし終わり ---
    if (trimmed === "もし終わり") {
      pc++;
      continue;
    }

    // --- 表示(expr) ---
    const printMatch = trimmed.match(/^表示\((.+)\)$/);
    if (printMatch) {
      const val = resolveValue(printMatch[1], vars);
      snapshot(pc, String(val));
      pc++;
      continue;
    }

    // 未認識の行
    pc++;
  }

  return trace;
}

function evaluateCondition(
  condition: string,
  vars: Record<string, number | string>
): boolean {
  let expr = condition;
  // ＝ → == (全角イコール)
  expr = expr.replace(/＝/g, "==");
  // ≠ → !=
  expr = expr.replace(/≠/g, "!=");
  // ≧ → >=
  expr = expr.replace(/≧/g, ">=");
  // ≦ → <=
  expr = expr.replace(/≦/g, "<=");
  // かつ → &&
  expr = expr.replace(/\s*かつ\s*/g, " && ");
  // または → ||
  expr = expr.replace(/\s*または\s*/g, " || ");

  const sortedVars = Object.keys(vars).sort((a, b) => b.length - a.length);
  for (const name of sortedVars) {
    if (name.includes("[")) continue;
    const regex = new RegExp(`\\b${name}\\b`, "g");
    expr = expr.replace(regex, String(vars[name]));
  }

  try {
    return !!Function(`"use strict"; return (${expr})`)();
  } catch {
    return false;
  }
}

function findElseLine(lines: string[], ifLine: number): number {
  let depth = 0;
  for (let i = ifLine; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.match(/^もし\s*.+\s*ならば$/)) depth++;
    if (trimmed === "もし終わり") depth--;
    if (depth === 1 && trimmed === "そうでなければ") return i;
  }
  return -1;
}
