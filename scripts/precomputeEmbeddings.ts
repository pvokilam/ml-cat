import { pipeline, Pipeline } from '@xenova/transformers';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { ItemEmbedding, Category } from '../src/types/index.js';
import { MODEL_CONFIG } from '../src/config/modelConfig.js';

// L2 normalization function
function normalize(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return vector;
  return vector.map(val => val / magnitude);
}

async function precomputeEmbeddings() {
  console.log('Loading grocery items...');
  const groceryData = JSON.parse(
    readFileSync(join(process.cwd(), 'src/data/groceryItems.json'), 'utf-8')
  );

  console.log('Loading embedding model...');
  console.log(`Model: ${MODEL_CONFIG.modelId}`);
  const extractor = await pipeline(
    'feature-extraction',
    MODEL_CONFIG.modelId
  );

  console.log('Generating embeddings...');
  const embeddings: ItemEmbedding[] = [];
  let processed = 0;
  const total = Object.values(groceryData).flat().length;

  for (const [category, items] of Object.entries(groceryData)) {
    for (const item of items as string[]) {
      try {
        // Generate embedding
        const output = await extractor(item, MODEL_CONFIG.pipelineOptions);
        const vector = Array.from(output.data) as number[];
        
        // Normalize the vector
        const normalizedVector = normalize(vector);

        embeddings.push({
          name: item,
          vector: normalizedVector,
          category: category as Category,
        });

        processed++;
        if (processed % 50 === 0) {
          console.log(`Processed ${processed}/${total} items...`);
        }
      } catch (error) {
        console.error(`Error processing "${item}":`, error);
      }
    }
  }

  console.log(`\nGenerated ${embeddings.length} embeddings`);
  console.log(`Vector dimension: ${embeddings[0]?.vector.length}`);

  // Save embeddings
  const outputPath = join(process.cwd(), 'src/data/groceryEmbeddings.json');
  writeFileSync(outputPath, JSON.stringify(embeddings, null, 2));
  console.log(`\nSaved embeddings to ${outputPath}`);

  // Print summary by category
  const byCategory: Record<string, number> = {};
  for (const emb of embeddings) {
    byCategory[emb.category] = (byCategory[emb.category] || 0) + 1;
  }
  console.log('\nSummary by category:');
  for (const [cat, count] of Object.entries(byCategory)) {
    console.log(`  ${cat}: ${count} items`);
  }
}

precomputeEmbeddings().catch(console.error);

