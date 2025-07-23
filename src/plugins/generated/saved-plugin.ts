import { IPlugin, Issue } from '../../core/types';

export class SavedPlugin implements IPlugin {
  name = 'saved-plugin';

  async analyze(filePath: string): Promise<Issue[]> {
    return [];
  }
}