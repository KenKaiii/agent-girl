/**
 * Premium Builder Utilities
 * Export all premium server-side utilities
 */

// Image Processing Pipeline
export {
  processImage,
  removeWatermarks,
  generateAIImage,
  batchProcessImages,
  type ImageProcessConfig,
  type ImageProcessResult,
  type ImageMetadata,
  type AIImageConfig,
} from './imageProcessor';

// Smart 100-Step Decomposition
export {
  generateDecompositionPlan,
  type DecompositionPlan,
  type DecompositionStep,
  type WebsiteProject,
  type Phase,
} from './smartDecomposition';

// Quick Edit Commands
export {
  parseEditCommand,
  executeEditCommand,
  pushToUndoStack,
  undo,
  redo,
  generateEditSuggestions,
  type EditCommand,
  type EditCommandType,
  type ParsedCommand,
  type ChangeOperation,
  type EditResult,
} from './quickEditCommands';

// Content Generation
export {
  generateHeroContent,
  generateAboutContent,
  generateServicesContent,
  generateContactContent,
  generateSEOContent,
  generateFullPageContent,
  type BusinessInfo,
  type ContentConfig,
  type ContentTone,
  type ContentStyle,
  type GeneratedContent,
  type FullPageContent,
  type SEOContent,
} from './contentGenerator';

// Export & Delivery Pipeline
export {
  exportProject,
  deployProject,
  validateBeforeExport,
  type ExportFormat,
  type DeployPlatform,
  type ExportConfig,
  type DeployConfig,
  type ExportResult,
  type DeployResult,
  type ValidationResult,
  type ValidationCheck,
} from './exportPipeline';
