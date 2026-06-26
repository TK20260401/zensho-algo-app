export interface SampleProgram {
  title: string;
  description: string;
  grade: "2級" | "1級";
  code: string;
}

export const samplePrograms: SampleProgram[] = [
  {
    title: "1から10までの合計",
    description: "基本の繰り返しと累積加算。変数SUMにIを足していく。",
    grade: "2級",
    code: `SUM ← 0
I を 1 から 10 まで 1 ずつ増やしながら繰り返す
  SUM ← SUM + I
繰り返し終わり
表示(SUM)`,
  },
  {
    title: "最大値を求める",
    description: "5つの値から最大値を見つける。MAXと比較して大きければ入れ替え。",
    grade: "2級",
    code: `DATA[1] ← 34
DATA[2] ← 72
DATA[3] ← 15
DATA[4] ← 88
DATA[5] ← 41
MAX ← DATA[1]
I を 2 から 5 まで 1 ずつ増やしながら繰り返す
  もし DATA[I] > MAX ならば
    MAX ← DATA[I]
  もし終わり
繰り返し終わり
表示(MAX)`,
  },
  {
    title: "偶数の合計",
    description: "1から20まで繰り返し、偶数のみ合計する。MOD演算で判定。",
    grade: "2級",
    code: `SUM ← 0
I を 1 から 20 まで 1 ずつ増やしながら繰り返す
  AMARI ← I MOD 2
  もし AMARI ＝ 0 ならば
    SUM ← SUM + I
  もし終わり
繰り返し終わり
表示(SUM)`,
  },
  {
    title: "バブルソート（昇順）",
    description: "隣り合う要素を比較・交換して並べ替え。ワーク変数への退避がポイント。",
    grade: "1級",
    code: `DATA[1] ← 64
DATA[2] ← 25
DATA[3] ← 12
DATA[4] ← 89
DATA[5] ← 37
I を 1 から 4 まで 1 ずつ増やしながら繰り返す
  J を 1 から 4 まで 1 ずつ増やしながら繰り返す
    もし DATA[J] > DATA[J + 1] ならば
      WORK ← DATA[J]
      DATA[J] ← DATA[J + 1]
      DATA[J + 1] ← WORK
    もし終わり
  繰り返し終わり
繰り返し終わり
表示(DATA[1])
表示(DATA[2])
表示(DATA[3])
表示(DATA[4])
表示(DATA[5])`,
  },
];
