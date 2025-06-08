import { NextResponse } from 'next/server';
import { BankNotification } from '../../../lib/types';

let notifications:BankNotification[] = [];

export async function GET() {
  return NextResponse.json(notifications);
}

export async function POST(request: Request) {
  const { message } = await request.json();
  if (!message) {
    return NextResponse.json({ error: 'Не указано сообщение' }, { status: 400 });
  }
  const newNotification = {
    id: notifications.length + 1,
    message,
    time: new Date().toLocaleTimeString()
  };
  notifications.unshift(newNotification);
  return NextResponse.json(newNotification, { status: 201 });
}

export async function DELETE() {
  notifications = [];
  return new Response(null, { status: 204 });
}
