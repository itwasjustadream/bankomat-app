import { NextResponse } from 'next/server';
import { ATMStatus } from '../../../lib/types';

const initialStatus: ATMStatus = {
  cashLevel: 100,
  cashAmount: 150000,
  isCardLeft: false,
  unauthorizedAccessAttempts: 0,
  tamperDetected: false
};

let atmStatus = { ...initialStatus };

export async function GET() {
  return NextResponse.json(atmStatus);
}

export async function POST(request: Request) {
  const { action } = await request.json();
  switch (action) {
    case 'cardLeft':
      atmStatus.isCardLeft = true;
      break;
    case 'unauthorizedAccess':
      atmStatus.unauthorizedAccessAttempts += 1;
      break;
    case 'tampering':
      atmStatus.tamperDetected = true;
      break;
    case 'reset':
      atmStatus = { ...initialStatus };
      break;
    default:
      return NextResponse.json({ error: 'Неизвестное действие' }, { status: 400 });
  }
  return NextResponse.json(atmStatus);
}
