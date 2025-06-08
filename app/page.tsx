'use client';

import { useState, useEffect } from 'react';
import { User, Transaction, BankNotification, ATMStatus, ServicePayment } from '../lib/types';
import OperationCard from '../components/OperationCard';
import TestButton from '../components/TestButton';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cashInAmount, setCashInAmount] = useState('');
  const [cashOutAmount, setCashOutAmount] = useState('');
  const [servicePayment, setServicePayment] = useState<ServicePayment>({ service: '', amount: '' });
  const [bankNotifications, setBankNotifications] = useState<BankNotification[]>([]);
  const [atmStatus, setAtmStatus] = useState<ATMStatus>({
    cashLevel: 100,
    cashAmount: 150000,
    isCardLeft: false,
    unauthorizedAccessAttempts: 0,
    tamperDetected: false
  });

  // Загрузка данных при авторизации
  const handleLogin = async () => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error || 'Ошибка авторизации');
      }
      const data = await response.json();
      setUser(data.user);
      setBalance(data.balance);
      setTransactions(data.transactions);
    } catch (error) {
      console.error('Ошибка авторизации:', error);
    }
  };

  // Загрузка статуса банкомата
  const loadATMStatus = async () => {
    try {
      const response = await fetch('/api/status');
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error || 'Ошибка загрузки статуса банкомата');
      }
      const data = await response.json();
      // Автоматически пересчитываем cashLevel на основе cashAmount
      if (typeof data.cashAmount === 'number') {
        data.cashLevel = Math.round((data.cashAmount / 150000) * 100);
      }
      setAtmStatus(data);
    } catch (error) {
      console.error('Ошибка загрузки статуса банкомата:', error);
    }
  };

  // Загрузка уведомлений
  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error || 'Ошибка загрузки уведомлений');
      }
      const data = await response.json();
      setBankNotifications(data);
    } catch (error) {
      console.error('Ошибка загрузки уведомлений:', error);
    }
  };

  // Загрузка транзакций
  const loadTransactions = async () => {
    try {
      const response = await fetch('/api/transactions');
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error || 'Ошибка загрузки транзакций');
      }
      const data = await response.json();
      setBalance(data.balance);
      setTransactions(data.transactions);
    } catch (error) {
      console.error('Ошибка загрузки транзакций:', error);
    }
  };

  // Пополнение счета
  const handleCashIn = async () => {
    if (!cashInAmount || isNaN(Number(cashInAmount))) return;
    const amount = Number(cashInAmount);
    try {
      const response = await fetch('/api/transactions?operation=cashIn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          userId: user?.id
        }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        alert(error?.error || 'Ошибка пополнения счета');
      }
      setCashInAmount('');
      // Увеличиваем cashAmount и cashLevel
      setAtmStatus(prev => {
        const newAmount = (prev.cashAmount || 0) + amount;
        return {
          ...prev,
          cashAmount: newAmount,
          cashLevel: Math.round((newAmount / 150000) * 100)
        };
      });
      await Promise.all([loadTransactions(), loadNotifications()]);
    } catch (error) {
      console.error('Ошибка пополнения счета:', error);
    }
  };

  // Снятие средств
  const handleCashOut = async () => {
    if (!cashOutAmount || isNaN(Number(cashOutAmount))) return;
    const amount = Number(cashOutAmount);
    if (amount > atmStatus.cashAmount) {
      alert('В банкомате недостаточно наличных для выдачи этой суммы!');
      return;
    }
    try {
      const response = await fetch('/api/transactions?operation=cashOut', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          userId: user?.id
        }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        alert(error?.error || 'Ошибка снятия средств');
      }
      setCashOutAmount('');
      // Уменьшаем cashAmount и cashLevel
      setAtmStatus(prev => {
        const newAmount = (prev.cashAmount || 0) - amount;
        return {
          ...prev,
          cashAmount: newAmount,
          cashLevel: Math.round((newAmount / 150000) * 100)
        };
      });
      await Promise.all([loadTransactions(), loadNotifications()]);
    } catch (error) {
      console.error('Ошибка снятия средств:', error);
      alert(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  // Оплата услуг
  const handleServicePayment = async () => {
    if (!servicePayment.amount || isNaN(Number(servicePayment.amount))) return;
    
    try {
      const response = await fetch('/api/transactions?operation=servicePayment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service: servicePayment.service,
          amount: Number(servicePayment.amount),
          userId: user?.id
        }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        alert(error?.error || 'Ошибка оплаты услуг');
      }
      setServicePayment({ service: '', amount: '' });
      await loadTransactions();
    } catch (error) {
      console.error('Ошибка оплаты услуг:', error);
      alert(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  // Тестовые события
  const simulateCardLeft = async () => {
    try {
      await fetch('/api/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'cardLeft' }),
      });
      await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: "Клиент забыл карту в банкомате" 
        }),
      });
      await Promise.all([loadATMStatus(), loadNotifications()]);
    } catch (error) {
      console.error('Ошибка эмуляции забытой карты:', error);
    }
  };

  const simulateUnauthorizedAccess = async () => {
    try {
      await fetch('/api/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'unauthorizedAccess' }),
      });
      await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: "Обнаружена попытка несанкционированного доступа" 
        }),
      });
      await Promise.all([loadATMStatus(), loadNotifications()]);
    } catch (error) {
      console.error('Ошибка эмуляции несанкционированного доступа:', error);
    }
  };

  const simulateTampering = async () => {
    try {
      await fetch('/api/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'tampering' }),
      });
      await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: "Обнаружена попытка взлома банкомата" 
        }),
      });
      await Promise.all([loadATMStatus(), loadNotifications()]);
    } catch (error) {
      console.error('Ошибка эмуляции взлома:', error);
    }
  };

  const clearNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error || 'Ошибка очистки уведомлений');
      }
      // Сбросить статус банкомата
      await fetch('/api/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' })
      });
      await loadNotifications();
      await loadATMStatus();
    } catch (error) {
      console.error('Ошибка очистки уведомлений:', error);
    }
  };

  // Загрузка данных при монтировании
  useEffect(() => {
    if (user) {
      // Сбросить транзакции и баланс при загрузке страницы
      fetch('/api/transactions', { method: 'DELETE' })
        .then(() => {
          loadATMStatus();
          loadNotifications();
          loadTransactions();
        });
    }
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-100 to-blue-50 text-gray-800 transition-all duration-300">
      {/* Заголовок */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-wide">Банкомат</h1>
          <div className="text-sm opacity-90">
            {user ? `Добро пожаловать, ${user.name}` : "Авторизуйтесь для работы"}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto p-2 sm:p-4 md:p-6">
        {!user ? (
          <div className="max-w-md w-full mx-auto mt-16 bg-white rounded-xl shadow-2xl p-6 sm:p-8 transform hover:scale-105 transition-all duration-300">
            <h2 className="text-3xl font-extrabold mb-6 text-center text-gray-800">Вход в систему</h2>
            <button 
              onClick={handleLogin}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md transition duration-300 transform hover:-translate-y-1"
            >
              Вставить карту и войти
            </button>
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
              {/* Баланс */}
              <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                <h2 className="text-xl font-semibold mb-3 text-gray-700">Текущий баланс</h2>
                <p className="text-4xl font-bold text-green-600">{balance} ₽</p>
                <p className="text-sm text-gray-500 mt-2">Счет: {user.accountNumber}</p>
              </div>

              {/* Информация о банкомате */}
              <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                <h2 className="text-xl font-semibold mb-3 text-gray-700">Статус банкомата</h2>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="mr-2">Наличность:</span>
                      <span>{atmStatus.cashAmount} ₽ ({atmStatus.cashLevel}%)</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
                      <div 
                        className={`h-full rounded-full ${
                          atmStatus.cashLevel > 70 ? 'bg-green-500' : 
                          atmStatus.cashLevel > 30 ? 'bg-yellow-500' : 'bg-red-500'
                        } transition-all duration-500 ease-in-out`} 
                        style={{ width: `${atmStatus.cashLevel}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Забыта ли карта:</span>
                    <span className={`text-sm ${atmStatus.isCardLeft ? "text-red-500" : "text-green-500"}`}>
                      {atmStatus.isCardLeft ? "Да" : "Нет"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Попытки взлома:</span>
                    <span className="text-sm">{atmStatus.unauthorizedAccessAttempts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Повреждение корпуса:</span>
                    <span className={`text-sm ${atmStatus.tamperDetected ? "text-red-500" : "text-green-500"}`}>
                      {atmStatus.tamperDetected ? "Да" : "Нет"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Уведомления для банка */}
              <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                <h2 className="text-xl font-semibold mb-3 text-gray-700">Уведомления банку</h2>
                {bankNotifications.length === 0 ? (
                  <p className="text-gray-400 italic">Нет активных уведомлений</p>
                ) : (
                  <ul className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {bankNotifications.map((notification, idx) => (
                      <li key={notification.id ? notification.id : idx} className="text-sm border-l-4 border-red-500 pl-3 py-1 animate-fadeIn">
                        <strong>{notification.message}</strong>
                        <div className="text-xs text-gray-500">{notification.time}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            {/* Операции */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
              <OperationCard title="Пополнение счета" onSubmit={handleCashIn}>
                <input
                  type="number"
                  value={cashInAmount}
                  onChange={(e) => setCashInAmount(e.target.value)}
                  placeholder="Введите сумму"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </OperationCard>

              <OperationCard title="Снять средства" onSubmit={handleCashOut}>
                <input
                  type="number"
                  value={cashOutAmount}
                  onChange={(e) => setCashOutAmount(e.target.value)}
                  placeholder="Введите сумму"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </OperationCard>

              <OperationCard title="Оплата услуг" onSubmit={handleServicePayment}>
                <select
                  value={servicePayment.service}
                  onChange={(e) => setServicePayment({...servicePayment, service: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Выберите услугу</option>
                  <option value="ЖКХ">ЖКХ</option>
                  <option value="Электричество">Электричество</option>
                  <option value="Интернет">Интернет</option>
                  <option value="Телефон">Телефон</option>
                </select>
                <input
                  type="number"
                  value={servicePayment.amount}
                  onChange={(e) => setServicePayment({...servicePayment, amount: e.target.value})}
                  placeholder="Введите сумму"
                  className="mt-3 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </OperationCard>
            </section>

            {/* История транзакций */}
            <section className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-8 hover:shadow-xl transition-shadow duration-300">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">История транзакций</h2>
              <div className="w-full overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Тип</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сумма</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{transaction.type}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                          transaction.amount > 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {transaction.amount > 0 ? "+" : ""}{transaction.amount} ₽
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Тестовые кнопки */}
            <section className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow duration-300">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Тестовые события (для демонстрации)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <TestButton label="Эмуляция: Карта забыта" onClick={simulateCardLeft} color="yellow" />
                <TestButton label="Эмуляция: Несанкциониро-ванный доступ" onClick={simulateUnauthorizedAccess} color="red" />
                <TestButton label="Эмуляция: Повреждение корпуса" onClick={simulateTampering} color="purple" />
                <TestButton label="Очистить уведомления" onClick={clearNotifications} color="gray" />
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="bg-gray-800 text-white p-4 mt-12 w-full">
        <div className="container mx-auto text-center text-sm">
          © 2025 Банк. Все права защищены.
        </div>
      </footer>
    </div>
  );
}