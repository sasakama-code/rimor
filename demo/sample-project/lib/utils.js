// ユーティリティ関数群（一部のみテストあり）
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// これらの関数は意図的にテストなし
function generateRandomId() {
  return Math.random().toString(36).substr(2, 9);
}

function capitalizeString(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

module.exports = {
  formatDate,
  validateEmail,
  generateRandomId,
  capitalizeString,
  debounce
};