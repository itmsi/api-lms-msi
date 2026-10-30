const { pgCore: db } = require('../../config/database');

/**
 * Penilaian jawaban quiz.
 *
 * Format answers (quiz_answers.answers) sama seperti options soal (quiz_questions.options):
 *   [{ "line": 1, "text": "...", "is_correct": true }]
 * Pada answers, is_correct = true berarti opsi tersebut dipilih user; [] berarti belum dijawab.
 *
 * Entry point: gradeAnswer(quizQuestionId, createdBy) — bisa dipanggil dari mana saja untuk nilai ulang
 * satu jawaban, sekaligus menghitung ulang rekap quiz_users milik user tersebut.
 * Semua fungsi menerima `conn` opsional (mis. trx) agar bisa ikut transaksi pemanggil.
 */

const SKIPPED_TYPES = ['short_answer']; // dinilai terpisah

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// himpunan line (unik, terurut) dari item yang is_correct = true
const selectedLines = (items) => {
  if (!Array.isArray(items)) return [];

  const lines = items
    .filter((item) => isPlainObject(item) && item.is_correct === true && Number.isInteger(item.line))
    .map((item) => item.line);

  return [...new Set(lines)].sort((a, b) => a - b);
};

const hasAnswer = (answers) => Array.isArray(answers) && answers.length > 0;

// admin_points disimpan sebagai string; nilai yang bukan angka dianggap 0
const toNumber = (value) => {
  const n = Number(value);
  return value !== null && value !== '' && Number.isFinite(n) ? n : 0;
};

/**
 * Jawaban benar jika semua line yang dipilih user sama persis dengan semua opsi is_correct = true.
 * Dicocokkan berdasarkan line (text tidak dibandingkan, agar koreksi typo opsi tidak membuat jawaban salah).
 */
const isAnswerCorrect = (options, answers) => {
  const correct = selectedLines(options);
  const chosen = selectedLines(answers);

  return correct.length > 0
    && correct.length === chosen.length
    && correct.every((line, idx) => line === chosen[idx]);
};

/**
 * Hitung ulang rekap quiz_users milik user pada sebuah quiz dari jawaban aktif user di soal-soal aktif quiz tsb:
 * - total_point       : jumlah admin_points
 * - completed_count   : jumlah jawaban dengan answers tidak kosong
 * - uncompleted_count : jumlah jawaban dengan answers kosong ([])
 * quiz_users dibuat bila belum ada (dan user punya jawaban); jika sudah ada hanya di-update bila nilainya berubah.
 */
const recalcQuizUser = async (quizId, createdBy, conn = db) => {
  const answers = await conn('quiz_answers as qa')
    .join('quiz_questions as qq', 'qq.id', 'qa.quiz_question_id')
    .where({
      'qq.quizzes_id': quizId,
      'qq.is_delete': false,
      'qa.created_by': createdBy,
      'qa.is_delete': false
    })
    .select('qa.answers', 'qa.admin_points');

  const completed = answers.filter((a) => hasAnswer(a.answers)).length;
  const summary = {
    total_point: String(answers.reduce((sum, a) => sum + toNumber(a.admin_points), 0)),
    completed_count: String(completed),
    uncompleted_count: String(answers.length - completed)
  };

  const existing = await conn('quiz_users')
    .where({ quizze_id: quizId, created_by: createdBy, is_delete: false })
    .first('id', 'total_point', 'completed_count', 'uncompleted_count');

  if (existing) {
    const changes = Object.fromEntries(
      Object.entries(summary).filter(([k, v]) => existing[k] !== v)
    );
    if (Object.keys(changes).length) {
      await conn('quiz_users')
        .where({ id: existing.id })
        .update({ ...changes, updated_by: createdBy, updated_at: conn.fn.now() });
    }
  } else if (answers.length) {
    await conn('quiz_users').insert({
      ...summary,
      quizze_id: quizId,
      created_by: createdBy,
      created_at: conn.fn.now(),
      updated_at: conn.fn.now()
    });
  }

  return summary;
};

/**
 * Nilai satu jawaban (quiz_question_id + created_by), lalu hitung ulang rekap quiz_users user tsb.
 * 1. ambil type, options, points soal
 * 2. selain short_answer: jika benar points & admin_points = points soal, jika salah 0
 * 3. rekap quiz_users dihitung ulang (quiz diambil dari quiz_questions.quizzes_id)
 */
const gradeAnswer = async (quizQuestionId, createdBy, conn = db) => {
  const question = await conn('quiz_questions')
    .where({ id: quizQuestionId })
    .first('quizzes_id', 'type', 'options', 'points');
  if (!question) return null;

  const answer = await conn('quiz_answers')
    .where({ quiz_question_id: quizQuestionId, created_by: createdBy, is_delete: false })
    .first('id', 'answers', 'points', 'admin_points');

  if (answer && !SKIPPED_TYPES.includes(question.type)) {
    const points = isAnswerCorrect(question.options, answer.answers) ? question.points : 0;

    if (answer.points !== points || answer.admin_points !== String(points)) {
      await conn('quiz_answers')
        .where({ id: answer.id })
        .update({ points, admin_points: String(points) });
    }
  }

  return await recalcQuizUser(question.quizzes_id, createdBy, conn);
};

/**
 * Nilai ulang semua jawaban pada sebuah soal (mis. setelah kunci jawaban / poin soal diubah),
 * dengan memanggil gradeAnswer per user yang menjawab soal tsb.
 */
const regradeQuestion = async (quizQuestionId, conn = db) => {
  const users = await conn('quiz_answers')
    .where({ quiz_question_id: quizQuestionId, is_delete: false })
    .distinct('created_by');

  for (const { created_by: createdBy } of users) {
    await gradeAnswer(quizQuestionId, createdBy, conn);
  }
};

module.exports = {
  isAnswerCorrect,
  recalcQuizUser,
  gradeAnswer,
  regradeQuestion
};
