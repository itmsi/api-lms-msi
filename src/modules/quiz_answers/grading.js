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
 * multiple_answers dinilai sebagian: poin = poin soal x (jumlah opsi benar yang dipilih - jumlah opsi salah yang dipilih)
 * / jumlah semua opsi benar, dibulatkan ke angka terdekat (0.5 ke atas), minimal 0.
 * Jawaban dianggap benar jika minimal satu opsi benar dipilih.
 */
const gradeMultipleAnswers = (question, answers) => {
  const correct = selectedLines(question.options);
  const chosen = selectedLines(answers);
  const hits = correct.filter((line) => chosen.includes(line)).length;
  const wrongs = chosen.length - hits;

  return {
    isCorrect: hits > 0,
    points: hits > wrongs ? Math.round((question.points * (hits - wrongs)) / correct.length) : 0
  };
};

// multiple_choice & true_false hanya punya satu jawaban benar: harus sama persis, poin penuh atau 0
const gradeAllOrNothing = (question, answers) => {
  const isCorrect = isAnswerCorrect(question.options, answers);
  return { isCorrect, points: isCorrect ? question.points : 0 };
};

const GRADERS = {
  multiple_choice: gradeAllOrNothing,
  multiple_answers: gradeMultipleAnswers,
  true_false: gradeAllOrNothing
};

/**
 * Hitung ulang rekap quiz_users milik user pada sebuah quiz dari jawaban aktif user di soal-soal aktif quiz tsb:
 * - total_point       : jumlah admin_points
 * - completed_count   : jumlah jawaban dengan answers tidak kosong
 * - uncompleted_count : jumlah jawaban dengan answers kosong ([])
 * - total_correct_points  : jumlah admin_points
 * - total_possible_points : jumlah quiz_questions.points dari seluruh soal aktif quiz
 * quiz_users dibuat bila belum ada (dan user punya jawaban); jika sudah ada hanya di-update bila nilainya berubah.
 * updated_at & updated_by quiz_users tidak diisi di sini: hanya diisi saat admin menilai (PUT /quiz_results/:id).
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

  const { total: possiblePoints } = await conn('quiz_questions')
    .where({ quizzes_id: quizId, is_delete: false })
    .sum('points as total')
    .first();

  const completed = answers.filter((a) => hasAnswer(a.answers)).length;
  const summary = {
    total_point: String(answers.reduce((sum, a) => sum + toNumber(a.admin_points), 0)),
    completed_count: String(completed),
    uncompleted_count: String(answers.length - completed),
    total_correct_points: String(answers.reduce((sum, a) => sum + toNumber(a.admin_points), 0)),
    total_possible_points: String(possiblePoints || 0)
  };

  const existing = await conn('quiz_users')
    .where({ quizze_id: quizId, created_by: createdBy, is_delete: false })
    .first('id', ...Object.keys(summary));

  if (existing) {
    const changes = Object.fromEntries(
      Object.entries(summary).filter(([k, v]) => existing[k] !== v)
    );
    if (Object.keys(changes).length) {
      await conn('quiz_users')
        .where({ id: existing.id })
        .update(changes);
    }
  } else if (answers.length) {
    await conn('quiz_users').insert({
      ...summary,
      quizze_id: quizId,
      created_by: createdBy,
      created_at: conn.fn.now(),
      // kolom updated_at punya default CURRENT_TIMESTAMP, harus dikosongkan eksplisit
      updated_at: null
    });
  }

  return summary;
};

/**
 * Nilai satu jawaban (quiz_question_id + created_by), lalu hitung ulang rekap quiz_users user tsb.
 * 1. ambil type, options, points soal
 * 2. dinilai sesuai type soal (lihat GRADERS), short_answer dilewati karena dinilai AI (lihat ai_assessment.js)
 *    dan bisa diubah admin;
 *    hasilnya disimpan ke is_correct, points & admin_points
 * 3. rekap quiz_users dihitung ulang (quiz diambil dari quiz_questions.quizzes_id)
 */
const gradeAnswer = async (quizQuestionId, createdBy, conn = db) => {
  const question = await conn('quiz_questions')
    .where({ id: quizQuestionId })
    .first('quizzes_id', 'type', 'options', 'points');
  if (!question) return null;

  const answer = await conn('quiz_answers')
    .where({ quiz_question_id: quizQuestionId, created_by: createdBy, is_delete: false })
    .first('id', 'answers', 'points', 'admin_points', 'is_correct');

  const grade = GRADERS[question.type];

  if (answer && grade) {
    const { isCorrect, points } = grade(question, answer.answers);

    if (
      answer.is_correct !== isCorrect
      || answer.points !== points
      || answer.admin_points !== String(points)
    ) {
      await conn('quiz_answers')
        .where({ id: answer.id })
        .update({ is_correct: isCorrect, points, admin_points: String(points) });
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
