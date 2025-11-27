

const { generateQueryEmbedding, cosineSimilarity } = require("./embeddingService");

async function generateSpecialityEmbeddings(specialities = []) {
  if (!Array.isArray(specialities) || specialities.length === 0) {
    return [];
  }

  const embeddings = [];

  for (const spec of specialities) {
    const emb = await generateQueryEmbedding(spec, "RETRIEVAL_DOCUMENT");
    embeddings.push(emb);
  }

  return embeddings;
}

/**
 * Generate embeddings for legal case:
 * - case_type
 * - plaintiff subject
 * - respondent subject
 */
async function generateCaseEmbeddings(case_type, plaintiffSubject, respondentSubject) {
  const caseEmb = await generateQueryEmbedding(case_type, "RETRIEVAL_DOCUMENT");

  const plaintiffEmb = plaintiffSubject
    ? await generateQueryEmbedding(plaintiffSubject, "RETRIEVAL_DOCUMENT")
    : Array(caseEmb.length).fill(0);

  const respondentEmb = respondentSubject
    ? await generateQueryEmbedding(respondentSubject, "RETRIEVAL_DOCUMENT")
    : Array(caseEmb.length).fill(0);

  // Combine embeddings by averaging
  const combined = averageVectors([caseEmb, plaintiffEmb, respondentEmb]);

  return {
    caseEmbedding: caseEmb,
    plaintiffEmbedding: plaintiffEmb,
    respondentEmbedding: respondentEmb,
    combinedEmbedding: combined
  };
}

/**
 * Average multiple vectors
 */
function averageVectors(vectors) {
  const count = vectors.length;
  const length = vectors[0].length;

  const result = Array(length).fill(0);

  // Sum
  for (const vec of vectors) {
    for (let i = 0; i < length; i++) {
      result[i] += vec[i];
    }
  }

  // Divide by count
  for (let i = 0; i < length; i++) {
    result[i] /= count;
  }

  return result;
}

module.exports = {
  generateSpecialityEmbeddings,
  generateCaseEmbeddings,
  averageVectors
};
