// services/embeddingService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const crypto = require('crypto');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Extract plain text from HTML content
 */
function doextractPlainText(html) {
  if (!html) return '';
  
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Create a content hash for change detection
 */
function createContentHash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Prepare text for embedding generation
 * Combines title, summary, and content with appropriate weighting
 */
function prepareTextForEmbedding(blog) {
  const plainContent = doextractPlainText(blog.content);
  
  // Weight title and summary more heavily by repeating them
  const weightedTitle = `${blog.title} `.repeat(3);
  const weightedSummary = blog.summary ? `${blog.summary} `.repeat(2) : '';
  const tags = blog.tags && blog.tags.length > 0 ? blog.tags.join(' ') + ' ' : '';
  
  // Truncate content to prevent token limits (approx 6000 tokens = 4500 words)
  const contentWords = plainContent.split(/\s+/);
  const truncatedContent = contentWords.slice(0, 4000).join(' ');
  
  const combinedText = `${weightedTitle}${weightedSummary}${tags}${truncatedContent}`.trim();
  
  return combinedText;
}

/**
 * Generate embedding using Gemini embedding model
 */
async function generateEmbedding(text, taskType = 'RETRIEVAL_DOCUMENT') {
  try {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty for embedding generation');
    }
    
    // Use Gemini's embedding model
    const embeddingModel = genAI.getGenerativeModel({ 
      model: 'text-embedding-004' 
    });
    
    // Generate embedding with task type
    const result = await embeddingModel.embedContent({
      content: { parts: [{ text: text }] },
      taskType: taskType  // RETRIEVAL_DOCUMENT for indexing, RETRIEVAL_QUERY for search
    });
    
    const embedding = result.embedding;
    
    if (!embedding || !embedding.values || embedding.values.length === 0) {
      throw new Error('Failed to generate embedding: empty response');
    }
    
    return embedding.values;
    
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error(`Embedding generation failed: ${error.message}`);
  }
}

/**
 * Generate embedding for a blog post
 */
async function generateBlogEmbedding(blog) {
  try {
    // Prepare text for embedding
    const text = prepareTextForEmbedding(blog);
    const contentHash = createContentHash(text);
    
    // Check if embedding needs to be regenerated
    if (blog.embedding && 
        blog.embeddingMetadata && 
        blog.embeddingMetadata.contentHash === contentHash) {
      console.log(`Embedding already up-to-date for blog: ${blog._id}`);
      return blog.embedding;
    }
    
    // Generate new embedding
    console.log(`Generating embedding for blog: ${blog._id} - "${blog.title}"`);
    const embedding = await generateEmbedding(text, 'RETRIEVAL_DOCUMENT');
    
    // Update blog with new embedding and metadata
    blog.embedding = embedding;
    blog.embeddingMetadata = {
      model: 'text-embedding-004',
      generatedAt: new Date(),
      contentHash: contentHash,
      dimension: embedding.length
    };
    
    return embedding;
    
  } catch (error) {
    console.error(`Error generating embedding for blog ${blog._id}:`, error);
    throw error;
  }
}

/**
 * Generate query embedding for search
 */
async function generateQueryEmbedding(queryText) {
  try {
    if (!queryText || queryText.trim().length === 0) {
      throw new Error('Query text cannot be empty');
    }
    
    // Generate embedding with RETRIEVAL_QUERY task type
    const embedding = await generateEmbedding(queryText, 'RETRIEVAL_QUERY');
    
    return embedding;
    
  } catch (error) {
    console.error('Error generating query embedding:', error);
    throw error;
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vectorA, vectorB) {
  if (!vectorA || !vectorB || vectorA.length !== vectorB.length) {
    throw new Error('Vectors must be of the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (normA * normB);
}

/**
 * Batch generate embeddings with rate limiting
 */
async function batchGenerateEmbeddings(blogs, onProgress = null) {
  const results = [];
  const batchSize = 5;  // Process 5 blogs at a time
  const delayMs = 1000;  // 1 second delay between batches
  
  for (let i = 0; i < blogs.length; i += batchSize) {
    const batch = blogs.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (blog) => {
      try {
        await generateBlogEmbedding(blog);
        await blog.save();
        return { success: true, blogId: blog._id, title: blog.title };
      } catch (error) {
        console.error(`Failed to generate embedding for blog ${blog._id}:`, error);
        return { success: false, blogId: blog._id, title: blog.title, error: error.message };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    if (onProgress) {
      onProgress({
        processed: Math.min(i + batchSize, blogs.length),
        total: blogs.length,
        percentage: Math.round((Math.min(i + batchSize, blogs.length) / blogs.length) * 100)
      });
    }
    
    // Delay between batches to respect rate limits
    if (i + batchSize < blogs.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}

module.exports = {
  generateBlogEmbedding,
  generateQueryEmbedding,
  cosineSimilarity,
  batchGenerateEmbeddings,
  doextractPlainText,
  prepareTextForEmbedding
};