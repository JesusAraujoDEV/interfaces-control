export interface SourceMetadataItem {
  ok?: boolean;
  status?: number;
  cache?: string;
  cache_status?: string;
  updated_at?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export interface SourceMetadata {
  [key: string]: SourceMetadataItem | string | boolean | null | undefined;
}

export interface SatisfactionScoreResponse {
  satisfaction_score: {
    count: number;
    average: number;
    distribution: {
      "0": number;
      "1": number;
      "2": number;
      "3": number;
      "4": number;
      "5": number;
    };
  };
  sources: SourceMetadata;
}

export interface WaiterRankingItem {
  waiter_id: string;
  name: string;
  average: number;
  total_reviews: number;
}

export interface WaiterRankingResponse {
  waiter_ranking: {
    page: number;
    page_size: number;
    total_waiters: number;
    items: WaiterRankingItem[];
  };
  sources: SourceMetadata;
}
