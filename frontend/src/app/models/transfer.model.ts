export interface TransferRequestModel {
  userId: number;
  sourceAccountId: number;
  destinationAccountId: number;
  amount: number;
  currencyCode: string;
  date: string;
  description?: string;
}

export interface TransferModel extends TransferRequestModel {
  transferGroupId: string;
  sourceTransactionId: number;
  destinationTransactionId: number;
  sourceAccountName: string;
  sourceAccountIconName?: string | null;
  destinationAccountName: string;
  destinationAccountIconName?: string | null;
}
