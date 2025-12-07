import { BankInfo, BankId } from '@/types/bank';

export const bankList: BankInfo[] = [
  {
    id: "acb",
    name: "ACB",
    accountNumber: "1234567890",
    accountName: "NGUYEN VAN A",
    branch: "Ha Noi",
    logo: "/images/banks/bidv.jpg"
  }
];

export const getBankInfo = (bankId: BankId): BankInfo | undefined => {
  return bankList.find(bank => bank.id === bankId);
}; 