import React from 'react';

export const StatusBadge = ({ status }) => {
  const styles = {
    available: "bg-amber-100 text-amber-800",
    pending_approval: "bg-orange-100 text-orange-800",
    reserved: "bg-blue-100 text-blue-800",
    rejected: "bg-red-100 text-red-800",
    expired: "bg-gray-100 text-gray-800",
    completed: "bg-purple-100 text-purple-800"
  };
  const names = {
    available: "Доступно",
    pending_approval: "На проверке",
    reserved: "Забронировано",
    rejected: "Отклонено",
    expired: "Истекло",
    completed: "Завершено"
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-bold ${styles[status] || 'bg-gray-100'}`}>
      {names[status] || status}
    </span>
  );
};
