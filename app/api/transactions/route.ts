import { NextResponse } from 'next/server';
import { Transaction } from '../../../lib/types';

let globalTransactions: Transaction[] = [];
let globalBalance = 50000;

export async function GET() {
  // Возвращаем текущее состояние
  return NextResponse.json({ balance: globalBalance, transactions: globalTransactions });
}
export async function DELETE() {
  globalBalance = 50000;
  globalTransactions = [];
  return NextResponse.json({ balance: globalBalance, transactions: globalTransactions });
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const operation = searchParams.get('operation');
  const data = await request.json();

  // Копируем глобальное состояние для расчёта
  let balance = globalBalance;
  let transactions = [...globalTransactions];

  try {
    switch (operation) {
      case 'cashIn':
        handleCashIn(data);
        break;
      case 'cashOut':
        handleCashOut(data);
        break;
      case 'servicePayment':
        handleServicePayment(data);
        break;
      default:
        return NextResponse.json({ error: 'Неизвестная операция' }, { status: 400 });
    }
    // Сохраняем изменения в глобальных переменных
    globalBalance = balance;
    globalTransactions = transactions;
    return NextResponse.json({ balance, transactions });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Ошибка' }, { status: 400 });
  }

  function handleCashIn(data: any) {
    if (data.amount <= 0) throw new Error('Неверная сумма');
    balance += data.amount;
    addTransaction('Пополнение', data.amount);
  }

  function handleCashOut(data: any) {
    if (data.amount <= 0) throw new Error('Неверная сумма');
    if (data.amount > balance) throw new Error('Недостаточно средств на счете');
    if (data.amount > 20000) throw new Error('Максимальная сумма снятия за раз — 20 000 ₽');
    balance -= data.amount;
    addTransaction('Снятие', -data.amount);
  }

  function handleServicePayment(data: any) {
    if (data.amount <= 0) throw new Error('Неверная сумма');
    if (data.amount > balance) throw new Error('Недостаточно средств для оплаты');
    if (!data.service) throw new Error('Не указана услуга');
    balance -= data.amount;
    addTransaction(`Оплата ${data.service}`, -data.amount);
  }

  function addTransaction(type: string, amount: number) {
    const now = new Date();
    const date = now.toLocaleDateString('ru-RU');
    const time = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    transactions.unshift({
      id: transactions.length + 1,
      type,
      amount,
      date: `${date} ${time}`
    });
  }
}
