export interface IPlugin {
  name: string;
  analyze(filePath: string): Promise<Issue[]>;
}

export interface Issue {
  type: string;
  severity: 'error' | 'warning';
  message: string;
  line?: number;  // 行番号（オプション）
  file?: string;  // ファイルパス（オプション）
}