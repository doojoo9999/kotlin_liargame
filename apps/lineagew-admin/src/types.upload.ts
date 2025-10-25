export interface UploadPreviewResponse {
  memberCount: number;
  bossCount: number;
  bossKillCount: number;
  itemCount: number;
  saleCount: number;
  clanFundTxnCount: number;
  essenceCount: number;
  warnings: string[];
}

export interface UploadCommitResponse {
  createdMembers: number;
  createdBosses: number;
  createdBossKills: number;
  createdItems: number;
  createdSales: number;
  finalizedSales: number;
  clanFundTxns: number;
  essences: number;
}
