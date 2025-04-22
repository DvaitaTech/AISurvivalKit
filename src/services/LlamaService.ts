import { initLlama, LlamaContext } from 'llama.rn';

interface LlamaOptions {
  modelPath: string;
  promptTemplate?: string;
  temperature?: number;
  maxTokens?: number;
  contextSize?: number;
  gpuLayers?: number;
  useMLock?: boolean;
}

class LlamaService {
  private isInitialized: boolean = false;
  private context: LlamaContext | null = null;
  private defaultOptions: LlamaOptions = {
    modelPath: '',
    promptTemplate: '<start_of_turn>user\n{prompt}<end_of_turn>\n<start_of_turn>model\n',
    temperature: 0.7,
    maxTokens: 512,
    contextSize: 2048,
    gpuLayers: 0, // 0 lets library decide, 99 for max on iOS
    useMLock: true,
  };

  async init(options?: Partial<LlamaOptions>): Promise<boolean> {
    try {
      const mergedOptions = { ...this.defaultOptions, ...options };
      
      if (!mergedOptions.modelPath) {
        console.error('No model path provided for initialization');
        return false;
      }

      console.log(`Initializing LLaMA with model: ${mergedOptions.modelPath}`);
      
      // Initialize the context using initLlama
      this.context = await initLlama({
        model: mergedOptions.modelPath,
        n_ctx: mergedOptions.contextSize,
        n_gpu_layers: mergedOptions.gpuLayers,
        use_mlock: mergedOptions.useMLock,
        // Add other relevant options if needed
      });
      
      this.isInitialized = true;
      this.defaultOptions.modelPath = mergedOptions.modelPath;
      console.log('LLaMA context initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing LLaMA context:', error);
      this.context = null;
      this.isInitialized = false;
      return false;
    }
  }

  async generateResponse(prompt: string, options?: Partial<LlamaOptions>): Promise<string> {
    if (!this.isInitialized || !this.context) {
      throw new Error('LLaMA context not initialized. Call init() first.');
    }

    const mergedOptions = { ...this.defaultOptions, ...options };
    let formattedPrompt = prompt;

    if (mergedOptions.promptTemplate) {
      formattedPrompt = mergedOptions.promptTemplate.replace('{prompt}', prompt);
    }

    try {
      console.log(`Generating completion for prompt: ${formattedPrompt.substring(0, 50)}...`);
      
      // Generate completion using the context instance
      const result = await this.context.completion({
        prompt: formattedPrompt,
        n_predict: mergedOptions.maxTokens || 512,
        temperature: mergedOptions.temperature || 0.7,
        stop: ['<end_of_turn>', '</s>', '<|eot_id|>', 'User:', 'Llama:'], // Common stop words
        // Add other completion params like top_k, top_p, repeat_penalty if needed
      });
      
      console.log(`Generated response: ${result.text.substring(0, 50)}...`);
      return result.text.trim(); // Trim whitespace from response
    } catch (error) {
      console.error('Error generating LLaMA response:', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    // Release the context
    if (this.context) {
      try {
        await this.context.release();
        this.context = null;
        this.isInitialized = false;
        console.log('LLaMA context released');
      } catch (error) {
        console.error(`Error releasing LLaMA context:`, error);
      }
    }
  }
}

// Export a singleton instance
export default new LlamaService(); 