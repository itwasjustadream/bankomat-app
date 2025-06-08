import { NextResponse } from 'next/server';
import { User } from '../../../lib/types';

const mockUser: User = {
  id: "12345",
  name: "Иван Иванов",
  accountNumber: "**** **** **** 1234"
};

export async function POST() {
  // В реальном приложении здесь была бы проверка карты и пин-кода
  return NextResponse.json({
    user: mockUser,
    balance: 50000,
    transactions: []
  });
}

export function GET() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}
