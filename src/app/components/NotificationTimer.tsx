"use client";
import { useState, useEffect, useRef } from "react";

export default function NotificationTimer() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isActive, setIsActive] = useState(false);
  const [interval, setInterval] = useState(30); // 秒
  const [message, setMessage] = useState('定期通知のテストです！');
  const [count, setCount] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  
  const timerRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);

  useEffect(() => {
    setIsSupported('Notification' in window);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (countdownRef.current) window.clearInterval(countdownRef.current);
    };
  }, []);

  const requestPermission = async () => {
    if (isSupported) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    }
    return false;
  };

  const sendNotification = () => {
    if (permission === 'granted') {
      new Notification('PWA 通知タイマー', {
        body: message,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'pwa-timer',
        requireInteraction: false,
        silent: false
      });
      setCount(prev => prev + 1);
    }
  };

  const startTimer = async () => {
    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) {
        alert('通知の許可が必要です');
        return;
      }
    }

    setIsActive(true);
    setRemainingTime(interval);
    
    // 即座に最初の通知を送信
    sendNotification();

    // 定期的な通知タイマー
    timerRef.current = window.setInterval(() => {
      sendNotification();
      setRemainingTime(interval);
    }, interval * 1000);

    // カウントダウンタイマー
    countdownRef.current = window.setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          return interval;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    setIsActive(false);
    setRemainingTime(0);
    
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (countdownRef.current) {
      window.clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  const resetCount = () => {
    setCount(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
        📱 プッシュ通知タイマー
      </h2>

      {/* サポート状況 */}
      <div className="mb-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          <strong>サポート状況:</strong> {isSupported ? '✅ 対応' : '❌ 非対応'}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          <strong>通知許可:</strong> {
            permission === 'granted' ? '✅ 許可済み' :
            permission === 'denied' ? '❌ 拒否' : '⏳ 未設定'
          }
        </p>
      </div>

      {/* 設定エリア */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            通知間隔（秒）
          </label>
          <input
            type="number"
            min="5"
            max="300"
            value={interval}
            onChange={(e) => setInterval(Math.max(5, parseInt(e.target.value) || 5))}
            disabled={isActive}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                     dark:bg-gray-700 dark:text-white text-center text-lg font-mono
                     disabled:bg-gray-100 dark:disabled:bg-gray-600"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            5秒〜300秒（5分）の間で設定
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            通知メッセージ
          </label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isActive}
            placeholder="通知に表示するメッセージ"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                     dark:bg-gray-700 dark:text-white
                     disabled:bg-gray-100 dark:disabled:bg-gray-600"
          />
        </div>
      </div>

      {/* タイマー表示 */}
      {isActive && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-center">
          <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">次の通知まで</p>
          <p className="text-3xl font-mono font-bold text-blue-800 dark:text-blue-200">
            {formatTime(remainingTime)}
          </p>
        </div>
      )}

      {/* 統計情報 */}
      <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-green-600 dark:text-green-400">送信回数</p>
            <p className="text-2xl font-bold text-green-800 dark:text-green-200">{count}</p>
          </div>
          <button
            onClick={resetCount}
            className="px-3 py-1 text-xs bg-green-200 dark:bg-green-700 text-green-800 dark:text-green-200 
                     rounded hover:bg-green-300 dark:hover:bg-green-600"
          >
            リセット
          </button>
        </div>
      </div>

      {/* 操作ボタン */}
      <div className="space-y-3">
        {permission !== 'granted' && (
          <button
            onClick={requestPermission}
            disabled={!isSupported}
            className="w-full py-3 px-4 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 
                     text-white font-medium rounded-lg transition-colors"
          >
            通知を許可する
          </button>
        )}

        {!isActive ? (
          <button
            onClick={startTimer}
            disabled={!isSupported || permission !== 'granted'}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 
                     text-white font-medium rounded-lg transition-colors"
          >
            タイマー開始
          </button>
        ) : (
          <button
            onClick={stopTimer}
            className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 
                     text-white font-medium rounded-lg transition-colors"
          >
            タイマー停止
          </button>
        )}

        <button
          onClick={sendNotification}
          disabled={!isSupported || permission !== 'granted'}
          className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 
                   text-white font-medium rounded-lg transition-colors"
        >
          今すぐ通知を送信
        </button>
      </div>

      {/* 説明 */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="font-medium text-gray-900 dark:text-white mb-2">使い方</h3>
        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
          <li>• 通知間隔とメッセージを設定</li>
          <li>• 「タイマー開始」で定期通知開始</li>
          <li>• タブを閉じても通知は継続</li>
          <li>• ブラウザを最小化しても動作</li>
        </ul>
      </div>
    </div>
  );
}