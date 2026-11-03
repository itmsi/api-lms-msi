const axios = require('axios');
const { pgCore: db } = require('../../config/database');
const { isRabbitMqEnabled, publishToQueue } = require('../../config/rabbitmq');
const { recalcQuizUser } = require('./grading');

/**
 * Penilaian jawaban short_answer lewat API AI (POST /api/mosa/answer-grading/grade), diproses lewat RabbitMQ.
 *
 * 1. assessShortAnswer(answerId, authorization): dipanggil setelah jawaban tersimpan, status PENDING lalu kirim ke queue.
 * 2. processAssessment(message): dipanggil consumer (lihat listeners/ai_assessment_listener.js), memanggil API AI
 *    lalu menyimpan hasilnya: status SUCCESS / FAILED, seluruh respon AI ke ai_assessment_message.
 *
 * authorization = header Authorization (Bearer token) dari request, ikut di pesan queue untuk diteruskan ke API AI.
 * Token tidak disimpan ke database dan isi pesan tidak boleh ditulis ke log.
 */

const STATUS = { PENDING: 'PENDING', SUCCESS: 'SUCCESS', FAILED: 'FAILED' };
const REQUEST_TIMEOUT_MS = 60000;
const AI_ASSESSMENT_QUEUE = 'quiz-ai-assessment';

// options & answers berformat [{ line, text, is_correct }]; lebih dari satu teks digabung per baris
const joinTexts = (items) => (Array.isArray(items) ? items : [])
  .map((item) => item && item.text)
  .filter((text) => typeof text === 'string' && text.trim())
  .join('\n');

const findPreviousAnswer = async (quizQuestionId, createdBy) => {
  return await db('quiz_answers')
    .where({ quiz_question_id: quizQuestionId, created_by: createdBy, is_delete: false })
    .first('answers', 'ai_assessment_status');
};

/**
 * AI hanya dipanggil bila teks jawaban berubah, atau penilaian sebelumnya belum selesai / gagal.
 * Jawaban yang dikirim ulang tanpa perubahan tidak dinilai ulang agar nilai dari AI / admin tidak tertimpa.
 */
const needsAssessment = (previous, answers) => {
  if (!previous || joinTexts(previous.answers) !== joinTexts(answers)) return true;
  return [STATUS.PENDING, STATUS.FAILED].includes(previous.ai_assessment_status);
};

const findContext = async (answerId) => {
  return await db('quiz_answers')
    .join('quiz_questions', 'quiz_questions.id', 'quiz_answers.quiz_question_id')
    .where({ 'quiz_answers.id': answerId, 'quiz_answers.is_delete': false })
    .first(
      'quiz_answers.id',
      'quiz_answers.answers',
      'quiz_answers.ai_assessment_status',
      'quiz_answers.created_by',
      'quiz_questions.quizzes_id',
      'quiz_questions.question',
      'quiz_questions.options',
      'quiz_questions.points'
    );
};

// hasil AI bisa selesai bersamaan: rekap quiz_users dikunci agar perhitungan berjalan bergantian dan tidak saling menimpa
const lockQuizUser = (context, trx) => trx('quiz_users')
  .where({ quizze_id: context.quizzes_id, created_by: context.created_by, is_delete: false })
  .forUpdate()
  .first('id');

// penilaian ulang: nilai lama dipertahankan sampai AI berhasil, agar kegagalan AI tidak menghapus nilai yang sudah ada
const markPending = async (context) => {
  await db('quiz_answers')
    .where({ id: context.id })
    .update({ ai_assessment_status: STATUS.PENDING, ai_assessment_message: null });
};

// nilai lama dikosongkan karena tidak berlaku untuk jawaban yang baru; status PENDING / null (jawaban kosong)
const resetAssessment = async (context, status) => {
  await db.transaction(async (trx) => {
    await lockQuizUser(context, trx);

    await trx('quiz_answers')
      .where({ id: context.id })
      .update({
        points: 0,
        admin_points: '0',
        is_correct: false,
        ai_assessment_status: status,
        ai_assessment_message: null
      });

    await recalcQuizUser(context.quizzes_id, context.created_by, trx);
  });
};

// score dibulatkan karena kolom points berupa integer, dan dibatasi 0 sampai poin soal
const toScore = (data, maxPoints) => {
  const score = data && data.score !== null && data.score !== '' ? Number(data.score) : NaN;
  if (!Number.isFinite(score)) return null;
  return Math.min(Math.max(Math.round(score), 0), maxPoints);
};

const requestGrade = async (context, authorization) => {
  const { MOSA_ANSWER_GRADING_URL: url } = process.env;
  if (!url) {
    return {
      status: STATUS.FAILED,
      message: { message: 'MOSA_ANSWER_GRADING_URL belum diatur' }
    };
  }

  try {
    const { data } = await axios.post(
      url,
      {
        question: context.question,
        employee_answer: joinTexts(context.answers),
        admin_answer: joinTexts(context.options),
        max_points: context.points
      },
      {
        headers: { accept: 'application/json', Authorization: authorization },
        timeout: REQUEST_TIMEOUT_MS
      }
    );

    const score = toScore(data, context.points);
    return score === null
      ? { status: STATUS.FAILED, message: data }
      : { status: STATUS.SUCCESS, message: data, score };
  } catch (error) {
    return {
      status: STATUS.FAILED,
      message: (error.response && error.response.data) || { message: error.message }
    };
  }
};

/**
 * Hasil hanya disimpan bila jawaban masih sama dan masih PENDING. Hasil dibuang bila selama menunggu AI
 * peserta mengubah jawaban atau admin sudah menilai lewat PUT /quiz_results/:id.
 */
const saveResult = async (context, { status, message, score }) => {
  await db.transaction(async (trx) => {
    await lockQuizUser(context, trx);

    const graded = status === STATUS.SUCCESS
      ? { points: score, admin_points: String(score), is_correct: score > 0 }
      : {};

    const updated = await trx('quiz_answers')
      .where({ id: context.id, is_delete: false, ai_assessment_status: STATUS.PENDING })
      .whereRaw('answers = ?::jsonb', [JSON.stringify(context.answers)])
      .update({
        ...graded,
        ai_assessment_status: status,
        // kolom jsonb, node-pg butuh string JSON
        ai_assessment_message: JSON.stringify(message)
      });

    if (updated && status === STATUS.SUCCESS) {
      await recalcQuizUser(context.quizzes_id, context.created_by, trx);
    }
  });
};

// gagal masuk queue berarti tidak ada consumer yang akan memproses, jadi langsung FAILED agar tidak PENDING selamanya
const enqueueAssessment = async (context, authorization) => {
  try {
    if (!isRabbitMqEnabled()) {
      throw new Error('RabbitMQ tidak aktif (RABBITMQ_ENABLED / RABBITMQ_URL)');
    }

    await publishToQueue(AI_ASSESSMENT_QUEUE, { answer_id: context.id, authorization });
  } catch (error) {
    console.error('Gagal mengirim penilaian AI ke queue:', error.message);
    await saveResult(context, { status: STATUS.FAILED, message: { message: error.message } });
  }
};

const assessShortAnswer = async (answerId, authorization, { keepPoints = false } = {}) => {
  try {
    const context = await findContext(answerId);
    if (!context) return;

    // jawaban kosong berarti belum dijawab, tidak perlu dinilai AI
    if (!joinTexts(context.answers)) {
      await resetAssessment(context, null);
      return;
    }

    if (keepPoints) {
      await markPending(context);
    } else {
      await resetAssessment(context, STATUS.PENDING);
    }

    // sengaja tidak di-await: request tidak ikut tertahan bila broker lambat atau tidak bisa dihubungi
    enqueueAssessment(context, authorization)
      .catch((error) => console.error('Gagal menyimpan status penilaian AI:', error.message));
  } catch (error) {
    console.error('Gagal memulai penilaian AI:', error.message);
  }
};

/**
 * Dipanggil consumer untuk satu pesan queue. Data jawaban selalu diambil terbaru dari database.
 * Pesan dilewati bila status bukan PENDING: jawaban sudah dinilai pesan lain, dinilai admin, atau dikosongkan.
 */
const processAssessment = async ({ answer_id: answerId, authorization }) => {
  const context = await findContext(answerId);
  if (!context || context.ai_assessment_status !== STATUS.PENDING) return;

  const result = await requestGrade(context, authorization);
  await saveResult(context, result);
};

module.exports = {
  STATUS,
  AI_ASSESSMENT_QUEUE,
  joinTexts,
  findPreviousAnswer,
  needsAssessment,
  assessShortAnswer,
  processAssessment
};
