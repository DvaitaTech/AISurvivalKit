import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

export interface ModelInfo {
  name: string;
  size: string; // Human readable size (e.g., "2.5GB")
  url: string;
  localPath: string;
}

// Common models that are compatible with llama.rn
export const availableModels: ModelInfo[] = [
  {
    name: 'Gemma 2B Instruct',
    size: '1.57GB',
    url: 'https://huggingface.co/lmstudio-community/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-IQ4_XS.gguf',
    localPath: 'gemma-2-2b-it-IQ4_XS.gguf',
  },
  {
    name: 'Phi-2 (Small)',
    size: '1.7GB',
    url: 'https://huggingface.co/TheBloke/phi-2-GGUF/resolve/main/phi-2.Q4_K_M.gguf',
    localPath: 'phi-2.Q4_K_M.gguf',
  },
];

// Get the models directory path
export const getModelsDir = (): string => {
  const documentsDir = Platform.OS === 'ios' 
    ? RNFS.DocumentDirectoryPath 
    : RNFS.ExternalDirectoryPath;
    
  return `${documentsDir}/models`;
};

// Check if model exists locally
export const checkModelExists = async (modelFileName: string): Promise<boolean> => {
  const modelsDir = getModelsDir();
  const modelPath = `${modelsDir}/${modelFileName}`;
  
  try {
    return await RNFS.exists(modelPath);
  } catch (error) {
    console.error('Error checking model existence:', error);
    return false;
  }
};

// Get full path to a model
export const getModelPath = (modelFileName: string): string => {
  return `${getModelsDir()}/${modelFileName}`;
};

// Ensure models directory exists
export const ensureModelsDir = async (): Promise<void> => {
  const modelsDir = getModelsDir();
  
  try {
    const exists = await RNFS.exists(modelsDir);
    if (!exists) {
      await RNFS.mkdir(modelsDir);
      console.log('Models directory created');
    }
  } catch (error) {
    console.error('Error ensuring models directory exists:', error);
    throw error;
  }
};

// Download a model
export const downloadModel = async (
  model: ModelInfo, 
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    await ensureModelsDir();
    
    const modelPath = getModelPath(model.localPath);
    const exists = await checkModelExists(model.localPath);
    
    if (exists) {
      console.log(`Model ${model.name} already exists at ${modelPath}`);
      return modelPath;
    }
    
    console.log(`Downloading model ${model.name} from ${model.url}`);
    
    const downloadOptions = {
      fromUrl: model.url,
      toFile: modelPath,
      background: true,
      progressDivider: 10,
      progress: (res: { bytesWritten: number, contentLength: number }) => {
        const progress = res.bytesWritten / res.contentLength;
        onProgress?.(progress);
      },
    };
    
    const result = await RNFS.downloadFile(downloadOptions).promise;
    
    if (result.statusCode === 200) {
      console.log(`Model ${model.name} downloaded to ${modelPath}`);
      return modelPath;
    } else {
      throw new Error(`Download failed with status code ${result.statusCode}`);
    }
  } catch (error) {
    console.error('Error downloading model:', error);
    throw error;
  }
};

// Get list of locally available models
export const getLocalModels = async (): Promise<string[]> => {
  try {
    await ensureModelsDir();
    const modelsDir = getModelsDir();
    const files = await RNFS.readDir(modelsDir);
    return files
      .filter((file: RNFS.ReadDirItem) => file.isFile() && file.name.endsWith('.gguf'))
      .map((file: RNFS.ReadDirItem) => file.name);
  } catch (error) {
    console.error('Error getting local models:', error);
    return [];
  }
}; 