import type { AIServiceOptions } from '../../text/types.js';
import { BaseAIDefaultConfig } from '../base.js';
import { OpenAI } from '../openai/api.js';
import type { OpenAIConfig } from '../openai/types.js';

type TogetherAIConfig = OpenAIConfig;

/**
 * TogetherAI: Default Model options for text generation
 * @export
 */
export const TogetherDefaultConfig = (): TogetherAIConfig =>
  structuredClone({
    model: 'llama2-70b-4096',
    ...BaseAIDefaultConfig()
  });

export interface TogetherArgs {
  apiKey: string;
  config: Readonly<TogetherAIConfig>;
  options?: Readonly<AIServiceOptions>;
}

/**
 * TogetherAI: AI Service
 * @export
 */
export class Together extends OpenAI {
  constructor({
    apiKey,
    config = TogetherDefaultConfig(),
    options
  }: Readonly<TogetherArgs>) {
    if (!apiKey || apiKey === '') {
      throw new Error('Together API key not set');
    }
    super({
      apiKey,
      config,
      options,
      apiURL: 'https://api.together.xyz/v1'
    });

    super.setName('Together');
  }
}
