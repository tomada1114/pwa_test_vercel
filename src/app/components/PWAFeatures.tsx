"use client";
import { useState, useEffect, useRef } from "react";

export default function PWAFeatures() {
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [notification, setNotification] = useState<string>("");
  const [storageData, setStorageData] = useState<string>("");
  const [indexedDBData, setIndexedDBData] = useState<string>("");
  const [isSupported, setIsSupported] = useState({
    notification: false,
    geolocation: false,
    camera: false,
    serviceWorker: false
  });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    setIsSupported({
      notification: 'Notification' in window,
      geolocation: 'geolocation' in navigator,
      camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      serviceWorker: 'serviceWorker' in navigator
    });

    const savedData = localStorage.getItem('pwa-demo-data');
    if (savedData) setStorageData(savedData);

    loadFromIndexedDB();
  }, []);

  const requestNotificationPermission = async () => {
    if (isSupported.notification) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification('PWA Demo', {
          body: 'プッシュ通知のテストです！',
          icon: '/icon-192x192.png'
        });
        setNotification('通知が送信されました！');
      } else {
        setNotification('通知の許可が必要です');
      }
    }
  };

  const getCurrentLocation = () => {
    if (isSupported.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('位置情報の取得に失敗:', error);
        }
      );
    }
  };

  const startCamera = async () => {
    if (isSupported.camera) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' } 
        });
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('カメラアクセスエラー:', error);
      }
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        setPhoto(dataURL);
      }
    }
  };

  const saveToLocalStorage = () => {
    localStorage.setItem('pwa-demo-data', storageData);
    alert('LocalStorageに保存しました！');
  };

  const saveToIndexedDB = async () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('PWADemo', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['data'], 'readwrite');
        const store = transaction.objectStore('data');
        store.put({ id: 1, value: indexedDBData });
        resolve(true);
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('data')) {
          db.createObjectStore('data', { keyPath: 'id' });
        }
      };
    }).then(() => {
      alert('IndexedDBに保存しました！');
    });
  };

  const loadFromIndexedDB = () => {
    const request = indexedDB.open('PWADemo', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['data'], 'readonly');
      const store = transaction.objectStore('data');
      const getRequest = store.get(1);
      
      getRequest.onsuccess = () => {
        if (getRequest.result) {
          setIndexedDBData(getRequest.result.value);
        }
      };
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('data')) {
        db.createObjectStore('data', { keyPath: 'id' });
      }
    };
  };

  return (
    <div className="space-y-6">
      {/* プッシュ通知 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📱 プッシュ通知
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          サポート状況: {isSupported.notification ? '✅ 対応' : '❌ 非対応'}
        </p>
        <button
          onClick={requestNotificationPermission}
          disabled={!isSupported.notification}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          通知を送信
        </button>
        {notification && (
          <p className="mt-2 text-green-600 dark:text-green-400">{notification}</p>
        )}
      </div>

      {/* 位置情報 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          🌍 位置情報取得
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          サポート状況: {isSupported.geolocation ? '✅ 対応' : '❌ 非対応'}
        </p>
        <button
          onClick={getCurrentLocation}
          disabled={!isSupported.geolocation}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
        >
          現在位置を取得
        </button>
        {location && (
          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded">
            <p className="text-gray-900 dark:text-white">
              緯度: {location.lat.toFixed(6)}<br />
              経度: {location.lng.toFixed(6)}
            </p>
          </div>
        )}
      </div>

      {/* カメラ・写真 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📷 カメラ・写真撮影
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          サポート状況: {isSupported.camera ? '✅ 対応' : '❌ 非対応'}
        </p>
        <div className="space-x-2 mb-4">
          <button
            onClick={startCamera}
            disabled={!isSupported.camera || !!cameraStream}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
          >
            カメラ開始
          </button>
          <button
            onClick={takePhoto}
            disabled={!cameraStream}
            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:bg-gray-400"
          >
            写真撮影
          </button>
          <button
            onClick={stopCamera}
            disabled={!cameraStream}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
          >
            カメラ停止
          </button>
        </div>
        
        {cameraStream && (
          <video
            ref={videoRef}
            autoPlay
            muted
            className="w-full max-w-md mb-4 rounded"
          />
        )}
        
        <canvas ref={canvasRef} className="hidden" />
        
        {photo && (
          <div className="mt-4">
            <p className="text-gray-900 dark:text-white mb-2">撮影した写真:</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="撮影した写真" className="w-full max-w-md rounded" />
          </div>
        )}
      </div>

      {/* ローカルストレージ */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          💾 ローカルストレージ
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              LocalStorageにデータを保存:
            </label>
            <input
              type="text"
              value={storageData}
              onChange={(e) => setStorageData(e.target.value)}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="保存するデータを入力"
            />
            <button
              onClick={saveToLocalStorage}
              className="mt-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              LocalStorageに保存
            </button>
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              IndexedDBにデータを保存:
            </label>
            <input
              type="text"
              value={indexedDBData}
              onChange={(e) => setIndexedDBData(e.target.value)}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="保存するデータを入力"
            />
            <button
              onClick={saveToIndexedDB}
              className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              IndexedDBに保存
            </button>
          </div>
        </div>
      </div>

      {/* Service Worker情報 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          ⚙️ Service Worker
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          サポート状況: {isSupported.serviceWorker ? '✅ 対応' : '❌ 非対応'}
        </p>
        <p className="text-gray-600 dark:text-gray-300">
          Service Workerは自動的に登録されており、オフライン機能とキャッシュ機能を提供します。
          ネットワークを切断してページを再読み込みしてもアプリが動作することを確認できます。
        </p>
      </div>
    </div>
  );
}