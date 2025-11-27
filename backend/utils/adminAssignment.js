const CourtAdmin = require("../models/CourtAdmin");
const LegalCase = require("../models/LegalCase");

async function getLeastLoadedCourt(district) {
  // 1. Get all courts in the district
  const admins = await CourtAdmin.find({
    district,
    status: "active"
  });

  if (!admins || admins.length === 0) return null;

  // Extract unique courts
  const courts = [...new Set(admins.map(a => a.court_name))];

  // 2. Count cases per court
  const courtLoads = await Promise.all(
    courts.map(async (courtName) => {
      const count = await LegalCase.countDocuments({
        "for_office_use_only.court_allotted": courtName
      });

      return { courtName, caseCount: count };
    })
  );

  // 3. Choose court with lowest case count
  courtLoads.sort((a, b) => a.caseCount - b.caseCount);

  return courtLoads[0].courtName; // return the court name
}

module.exports = { getLeastLoadedCourt };
