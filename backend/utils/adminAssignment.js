const CourtAdmin = require("../models/CourtAdmin");
const LegalCase = require("../models/LegalCase");
const { cosineSimilarity } = require("../services/embeddingService");


async function getBestCourtForCase(district, combinedCaseEmbedding) {

  // 1. Get all active court admins from district
  const admins = await CourtAdmin.find({
    district,
    status: "active"
  });

  if (!admins || admins.length === 0) return null;

  // Build list of evaluation results
  const evaluation = [];

  for (const admin of admins) {

    let bestSimilarity = 0;

    // 2. Compute similarity against each speciality embedding
    if (admin.speciality_embeddings && admin.speciality_embeddings.length > 0) {
      for (const specEmb of admin.speciality_embeddings) {
        const sim = cosineSimilarity(combinedCaseEmbedding, specEmb);
        if (sim > bestSimilarity) {
          bestSimilarity = sim;
        }
      }
    }

    // 3. Case load
    const caseCount = await LegalCase.countDocuments({
      "for_office_use_only.court_allotted": admin.court_name
    });

    // 4. Compute score
    const score = (0.8 * bestSimilarity) + (0.2 * (1 / (1 + caseCount)));

    evaluation.push({
      admin,
      similarity: bestSimilarity,
      caseCount,
      score
    });
  }

  // 5. Sort by score (descending)
  evaluation.sort((a, b) => b.score - a.score);

  // 6. Return best court name
  return evaluation[0].admin.court_name;
}

module.exports = { getBestCourtForCase };
