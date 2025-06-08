export interface User {
  id: string;
  name: string;
  accountNumber: string;
}

export interface Transaction {
  id: number;
  type: string;
  amount: number;
  date: string;
}

export interface BankNotification {
  id: number;
  message: string;
  time: string;
}

export interface ATMStatus {
  cashLevel: number;
  cashAmount: number;
  isCardLeft: boolean;
  unauthorizedAccessAttempts: number;
  tamperDetected: boolean;
}

export interface ServicePayment {
  service: string;
  amount: string;
}

export interface ATMOperationRequest {
  amount: number;
  userId: string;
}

export interface ServicePaymentRequest extends ATMOperationRequest {
  service: string;
}