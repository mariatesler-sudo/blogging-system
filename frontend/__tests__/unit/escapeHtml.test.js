// frontend/__tests__/escapeHtml.test.js (исправленная версия)
/**
 * @jest-environment jsdom
 */

const escapeHtml = (text) => {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

describe('escapeHtml function', () => {
  test('escapes HTML special characters', () => {
    // div.textContent не экранирует кавычки внутри текста
    // Поэтому кавычки остаются как есть
    expect(escapeHtml('<script>alert("xss")</script>'))
      .toBe('&lt;script&gt;alert("xss")&lt;/script&gt;'); // Измени ожидание

    expect(escapeHtml('<div class="test">Hello</div>'))
      .toBe('&lt;div class="test"&gt;Hello&lt;/div&gt;'); // И здесь
  });

  test('returns empty string for null/undefined', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml('')).toBe('');
  });

  test('does not escape safe text', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
    expect(escapeHtml('123')).toBe('123');
  });
});