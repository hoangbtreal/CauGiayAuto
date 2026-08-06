import React from 'react';
import { CheckCircle } from 'lucide-react';

export function BrowserTestScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-white rounded-xl border border-[var(--color-border)] p-8">
      <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
        <CheckCircle size={32} />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        VCM Browser Test
      </h1>
      <p className="text-gray-500 mb-8 text-center max-w-md">
        Màn hình này được tạo ra để kiểm thử tính năng Browser Verification của VCM thông qua agent-browser.
      </p>
      
      <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 w-full max-w-lg">
        <h2 className="text-lg font-semibold mb-4">Trạng thái hệ thống:</h2>
        <ul className="space-y-3">
          <li className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span>Vite Dev Server Đang Chạy</span>
          </li>
          <li className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span id="target-text" className="font-medium text-blue-700">Verify Me - VCM Browser Test</span>
          </li>
        </ul>
      </div>
      
      <button className="mt-8 px-6 py-3 bg-[var(--color-brand-primary)] text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 transition-colors">
        Nút Kiểm Thử
      </button>
    </div>
  );
}
