import type { Category, Priority } from "../../shared/types";

export const CATEGORY_META: Record<Category, { emoji: string; color: string }> = {
  دراسة: { emoji: "📚", color: "#6366f1" },
  اختبار: { emoji: "📝", color: "#ef4444" },
  ورشة: { emoji: "🛠️", color: "#f59e0b" },
  محاضرة: { emoji: "🎓", color: "#0ea5e9" },
  نادي: { emoji: "🎯", color: "#22c55e" },
  فرصة: { emoji: "✨", color: "#a855f7" },
  تقديم: { emoji: "📮", color: "#ec4899" },
  مشروع: { emoji: "🧩", color: "#14b8a6" },
  شخصي: { emoji: "🌱", color: "#64748b" },
};

export const PRIORITY_META: Record<Priority, { label: string; dot: string }> = {
  high: { label: "عالية", dot: "🔴" },
  medium: { label: "متوسطة", dot: "🟡" },
  low: { label: "منخفضة", dot: "🟢" },
};
