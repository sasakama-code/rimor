export interface IPlugin {
  name: string;
  analyze(filePath: string): Promise<Issue[]>;
}

export interface Issue {
  type: string;
  severity: 'error' | 'warning';
  message: string;
}