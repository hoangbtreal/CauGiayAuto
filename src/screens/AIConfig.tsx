import React, { useState } from 'react';
import { Bot, Save, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function AIConfig() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [config, setConfig] = useState({
    model: 'gpt-4o',
    temperature: 0.0,
    allowedTopics: 'giờ mở cửa\nvị trí xưởng\nchính sách bảo hành\nbảng giá cố định',
    escalationTopics: 'lỗi pan bệnh kỹ thuật (kêu gầm, hỏng máy...)\nbáo giá sửa chữa va chạm, đâm đụng\nbất kỳ câu hỏi nào ngoài Knowledge Base đã nạp',
    escalationTemplate: 'Dạ, hiện tượng lỗi kỹ thuật này cần được Cố vấn dịch vụ và Kỹ thuật viên kiểm tra trực tiếp để lập phương án sửa chữa và báo giá chính xác. Em xin ghi nhận thông tin xe và SĐT để cố vấn dịch vụ gọi lại hỗ trợ anh/chị ngay ạ!',
    systemPrompt: 'Bạn là Trợ lý ảo của Xưởng Ô Tô Demo. Bạn CHỈ ĐƯỢC PHÉP sử dụng thông tin trong tài liệu đã nạp (Knowledge Base) để trả lời về các chủ đề trong allowed_topics. Đối với các chủ đề trong escalation_required_topics hoặc bất kỳ câu hỏi nào nằm ngoài tài liệu: Bạn TUYỆT ĐỐI KHÔNG ĐƯỢC TỰ ĐOÁN HOẶC CHẾ TẠO CÂU TRẢ LỜI. Bạn phải trả lời đúng nguyên văn escalation_response_template.'
  });

  const handleChange = (field: string, value: string | number) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaving(true);
    // Giả lập gọi API lưu invariants.yaml
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full pb-10">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bot size={24} className="text-[var(--color-brand-primary)]" />
            Cấu hình AI Agent
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Quản lý quy tắc phản hồi (Invariants) của Flowise AI cho xưởng
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2 shrink-0">
          {saving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : saved ? (
            <CheckCircle2 size={16} />
          ) : (
            <Save size={16} />
          )}
          {saving ? 'Đang lưu...' : saved ? 'Đã lưu' : 'Lưu cấu hình'}
        </Button>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <div className="bg-[var(--color-brand-surface)] border border-[var(--color-border)] rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Bot size={18} />
            Mô hình ngôn ngữ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">LLM Model</label>
              <select 
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-background)]"
                value={config.model}
                onChange={(e) => handleChange('model', e.target.value)}
              >
                <option value="gpt-4o">GPT-4o (Khuyên dùng)</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="claude-3-haiku">Claude 3 Haiku</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Sáng tạo (Temperature)</label>
              <div className="flex items-center gap-3">
                <input 
                  type="range" 
                  min="0" max="1" step="0.1" 
                  className="flex-1"
                  value={config.temperature}
                  onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                />
                <span className="w-8 text-sm font-medium">{config.temperature.toFixed(1)}</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">0.0 là trả lời chính xác theo tài liệu, không tự bịa.</p>
            </div>
          </div>
        </div>

        {/* Knowledge Scope */}
        <div className="bg-[var(--color-brand-surface)] border border-[var(--color-border)] rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-green-600" />
            Phạm vi trả lời (Allowed Topics)
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-3">
            Những chủ đề AI ĐƯỢC PHÉP tự trả lời từ Knowledge Base. (Mỗi dòng một chủ đề)
          </p>
          <textarea
            className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-background)] min-h-[100px]"
            value={config.allowedTopics}
            onChange={(e) => handleChange('allowedTopics', e.target.value)}
          />
        </div>

        {/* Escalation Scope */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-700">
            <AlertCircle size={18} />
            Yêu cầu Escalate (Escalation Topics)
          </h2>
          <p className="text-sm text-red-600 mb-3">
            Những chủ đề PHẢI chuyển tiếp cho Cố vấn dịch vụ, AI KHÔNG ĐƯỢC tự đoán.
          </p>
          <textarea
            className="w-full px-3 py-2 border border-red-200 rounded-md bg-white min-h-[100px]"
            value={config.escalationTopics}
            onChange={(e) => handleChange('escalationTopics', e.target.value)}
          />

          <h3 className="text-sm font-semibold text-red-700 mt-4 mb-2">Mẫu câu trả lời khi Escalate</h3>
          <textarea
            className="w-full px-3 py-2 border border-red-200 rounded-md bg-white min-h-[80px]"
            value={config.escalationTemplate}
            onChange={(e) => handleChange('escalationTemplate', e.target.value)}
          />
        </div>

        {/* System Prompt */}
        <div className="bg-[var(--color-brand-surface)] border border-[var(--color-border)] rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ShieldAlert size={18} />
            System Prompt Template
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-3">
            Lệnh hệ thống cốt lõi điều khiển hành vi của AI.
          </p>
          <textarea
            className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md bg-[var(--color-background)] min-h-[120px] font-mono text-sm"
            value={config.systemPrompt}
            onChange={(e) => handleChange('systemPrompt', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
