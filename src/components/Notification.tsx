import { useStore } from '../store/useStore';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export default function Notification() {
  const { notification, setNotification } = useStore();

  if (!notification) return null;

  const icons = {
    success: CheckCircle,
    error: XCircle,
    info: Info,
  };

  const colors = {
    success: 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
    error: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
    info: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  };

  const Icon = icons[notification.type];

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in-up">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${colors[notification.type]}`}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <p className="font-medium">{notification.message}</p>
        <button
          onClick={() => setNotification(null)}
          className="ml-2 p-1 rounded hover:bg-black/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
