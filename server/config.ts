import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
loadEnv();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),

  // API Keys
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',

  // Paths
  storageDir: resolve(process.env.STORAGE_DIR || './storage'),
  databasePath: resolve(process.env.DATABASE_PATH || './data/smartdocs.db'),

  // Model paths for llama.cpp
  whisperModelPath: resolve(process.env.WHISPER_MODEL_PATH || './models/ggml-base.en.bin'),
  visionModelPath: resolve(process.env.VISION_MODEL_PATH || './models/qwen3-vl-8b-instruct-q4_k_m.gguf'),

  // Claude configuration
  claudeModel: process.env.CLAUDE_MODEL || 'claude-sonnet-4-5-20250929',

  // Video processing
  silenceThreshold: parseFloat(process.env.SILENCE_THRESHOLD || '-30'),
  silenceMinDuration: parseFloat(process.env.SILENCE_MIN_DURATION || '1.5'),

  // llama.cpp configuration
  llamaCppGpuLayers: parseInt(process.env.LLAMA_CPP_GPU_LAYERS || '35', 10),
  llamaCppThreads: parseInt(process.env.LLAMA_CPP_THREADS || '4', 10),
};

// Validate required configuration
export function validateConfig() {
  if (!config.anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY is required');
  }

  console.log('Configuration loaded:');
  console.log(`  - Port: ${config.port}`);
  console.log(`  - Storage: ${config.storageDir}`);
  console.log(`  - Database: ${config.databasePath}`);
  console.log(`  - Whisper model: ${config.whisperModelPath}`);
  console.log(`  - Vision model: ${config.visionModelPath}`);
  console.log(`  - Claude model: ${config.claudeModel}`);
}
