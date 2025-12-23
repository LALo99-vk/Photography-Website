/**
 * Format number in Indian numbering system (lakhs, crores)
 * Example: 100000 -> "1,00,000"
 */
export const formatIndianNumber = (num: number): string => {
  return num.toLocaleString('en-IN');
};

/**
 * Format currency in Indian Rupees
 * Example: 100000 -> "₹1,00,000"
 */
export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) {
    return 'N/A';
  }
  return `₹${formatIndianNumber(amount)}`;
};

/**
 * Format currency without symbol (just the number)
 * Example: 100000 -> "1,00,000"
 */
export const formatAmount = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) {
    return 'N/A';
  }
  return formatIndianNumber(amount);
};

