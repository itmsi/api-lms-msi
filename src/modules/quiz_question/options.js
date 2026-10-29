// Aturan tipe soal & options, dipakai validation (create) dan service (update, nilai gabungan)
// options: [{ line, text, is_correct }]

const QUESTION_TYPES = ['multiple_choice', 'multiple_answers', 'true_false', 'short_answer'];
const TIME_UNITS = ['minutes', 'seconds'];

// request multipart/form-data mengirim options sebagai string JSON array
const parseOptions = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  if (!trimmed) return [];

  try {
    return JSON.parse(trimmed);
  } catch {
    // bukan JSON valid, biarkan gagal di validasi
    return value;
  }
};

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/**
 * Validasi options terhadap type soal. Melempar Error jika tidak sesuai.
 * - multiple_choice  : minimal 2 opsi, tepat 1 jawaban benar
 * - multiple_answers : minimal 2 opsi, minimal 1 jawaban benar
 * - true_false       : tepat 2 opsi (mis. Benar/Salah), tepat 1 jawaban benar
 * - short_answer     : minimal 1 opsi = jawaban yang diterima (semua dianggap benar)
 */
const assertOptions = (type, options) => {
  if (!Array.isArray(options)) {
    throw new Error('options harus berupa array JSON');
  }

  options.forEach((option, idx) => {
    if (!isPlainObject(option)) {
      throw new Error(`options[${idx}] harus berupa objek`);
    }
    if (typeof option.text !== 'string' || option.text.trim() === '') {
      throw new Error(`options[${idx}].text wajib diisi`);
    }
    if (option.is_correct !== undefined && typeof option.is_correct !== 'boolean') {
      throw new Error(`options[${idx}].is_correct harus berupa boolean`);
    }
    if (option.line !== undefined && option.line !== null && (!Number.isInteger(option.line) || option.line < 1)) {
      throw new Error(`options[${idx}].line harus berupa angka bulat >= 1`);
    }
  });

  const correct = options.filter((o) => o.is_correct === true).length;

  switch (type) {
    case 'multiple_choice':
      if (options.length < 2) throw new Error('multiple_choice minimal memiliki 2 opsi');
      if (correct !== 1) throw new Error('multiple_choice harus memiliki tepat 1 jawaban benar');
      break;
    case 'multiple_answers':
      if (options.length < 2) throw new Error('multiple_answers minimal memiliki 2 opsi');
      if (correct < 1) throw new Error('multiple_answers minimal memiliki 1 jawaban benar');
      break;
    case 'true_false':
      if (options.length !== 2) throw new Error('true_false harus memiliki tepat 2 opsi');
      if (correct !== 1) throw new Error('true_false harus memiliki tepat 1 jawaban benar');
      break;
    case 'short_answer':
      if (options.length < 1) throw new Error('short_answer minimal memiliki 1 jawaban yang diterima');
      break;
    default:
      throw new Error(`type harus salah satu dari ${QUESTION_TYPES.join(', ')}`);
  }

  return true;
};

// rapikan options: trim text, line berurutan 1..n bila tidak diisi, is_correct selalu boolean
// (short_answer: semua opsi adalah jawaban yang benar)
const normalizeOptions = (type, options) =>
  options.map((option, idx) => ({
    line: Number.isInteger(option.line) && option.line >= 1 ? option.line : idx + 1,
    text: option.text.trim(),
    is_correct: type === 'short_answer' ? true : option.is_correct === true
  }));

module.exports = {
  QUESTION_TYPES,
  TIME_UNITS,
  parseOptions,
  assertOptions,
  normalizeOptions
};
