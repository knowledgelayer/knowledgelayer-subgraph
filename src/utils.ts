export const generateUniqueId = (transactionHash: string, logIndex: string): string => {
  return transactionHash + "-" + logIndex;
};
