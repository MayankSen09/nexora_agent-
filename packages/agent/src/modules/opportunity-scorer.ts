import { CandidateMarket } from "@nexora/shared";
import { OpportunityScorer as StrategyScorer, OpportunityScoreResult } from "@nexora/strategy";

export class OpportunityScorer {
  public static scoreMarket(market: CandidateMarket): OpportunityScoreResult {
    return StrategyScorer.computeScore(market);
  }

  public static rankOpportunities(
    markets: CandidateMarket[],
    minScoreThreshold = 75.0
  ): { market: CandidateMarket; scoreResult: OpportunityScoreResult }[] {
    const scored = markets.map((m) => {
      const scoreResult = StrategyScorer.computeScore(m);
      m.opportunityScore = scoreResult.score;
      return { market: m, scoreResult };
    });

    return scored
      .filter((item) => item.scoreResult.score >= minScoreThreshold)
      .sort((a, b) => b.scoreResult.score - a.scoreResult.score);
  }
}
