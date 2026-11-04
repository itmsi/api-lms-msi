const { pgCore: db } = require("../../config/database");
const { normalizeListParams } = require("../../utils/list_params");
const { recalcQuizUser, gradeAnswer } = require("../quiz_answers/grading");

const TABLE_NAME = "quiz_users";
const EMPLOYEE_TABLE = "gate_sso_employees";

/**
 * Repository Layer - Database Operations (quiz_results)
 * Data utama adalah rekap pengerjaan quiz per user (quiz_users).
 */

const SORTABLE = {
  quizze_title: "quizzes.title",
  module_title: "modules.title",
  created_at: "quiz_users.created_at",
  updated_at: "quiz_users.updated_at",
};

// completed jika tidak ada jawaban yang masih kosong; dipakai untuk kolom response dan filter status
const STATUS_SQL = `CASE WHEN COALESCE(quiz_users.uncompleted_count, '0') = '0' THEN 'completed' ELSE 'uncompleted' END`;

// nama diambil dari foreign table gate_sso_employees (FDW ke database gate_sso);
// pakai subquery agar jumlah baris tidak berlipat bila employee_id duplikat
const employeeName = (column, alias) =>
  db.raw(
    `(select e.employee_name from ${EMPLOYEE_TABLE} e where e.employee_id = ${TABLE_NAME}.${column} limit 1) as ${alias}`,
  );

const COLUMNS = [
  "quiz_users.id as quiz_result_id",
  employeeName("created_by", "created_by_name"),
  employeeName("updated_by", "updated_by_name"),
  "quizzes.title as quizze_title",
  "modules.title as module_title",
  "quiz_users.completed_count",
  "quiz_users.uncompleted_count",
  db.raw(`${STATUS_SQL} as status`),
  "quiz_users.send_date",
  "quiz_users.updated_at",
  "quiz_users.total_point",
  "quizzes.max_points",
  "quiz_users.total_correct_points",
  "quiz_users.total_possible_points",
];

const baseQuery = () =>
  db(TABLE_NAME)
    .leftJoin("quizzes", "quizzes.id", "quiz_users.quizze_id")
    .leftJoin("modules", "modules.id", "quizzes.modules_id");

const findAll = async (params = {}) => {
  const { page, limit, sortColumn, sortOrder, search } = normalizeListParams(
    params,
    {
      sortable: SORTABLE,
      defaultSort: "created_at",
      defaultOrder: "desc",
    },
  );
  const offset = (page - 1) * limit;

  const base = () => {
    const q = baseQuery().where("quiz_users.is_delete", false);
    if (params.quizzes_id)
      q.andWhere("quiz_users.quizze_id", params.quizzes_id);
    if (params.employee_id)
      q.andWhere("quiz_users.created_by", params.employee_id);
    if (params.status) q.andWhereRaw(`${STATUS_SQL} = ?`, [params.status]);
    if (search) {
      q.andWhere((b) =>
        b
          .whereILike("quizzes.title", `%${search}%`)
          .orWhereILike("modules.title", `%${search}%`),
      );
    }
    return q;
  };

  const items = await base()
    .select(COLUMNS)
    .orderBy(sortColumn, sortOrder)
    .limit(limit)
    .offset(offset);

  const total = await base().count("quiz_users.id as count").first();

  return {
    items,
    pagination: {
      page,
      limit,
      total: parseInt(total.count),
      totalPages: Math.ceil(total.count / limit),
    },
  };
};

// quizze_id & created_by hanya dipakai service untuk mengambil soal dan jawaban user
const findById = async (id) => {
  return await baseQuery()
    .where({ "quiz_users.id": id, "quiz_users.is_delete": false })
    .first([...COLUMNS, "quiz_users.quizze_id", "quiz_users.created_by"]);
};

// seluruh soal aktif quiz beserta jawaban user (kolom jawaban null / 0 jika soal belum dijawab)
const findQuestionAnswers = async (quizId, userId) => {
  return await db("quiz_questions")
    .leftJoin("quiz_answers", function () {
      this.on("quiz_answers.quiz_question_id", "quiz_questions.id")
        .andOn("quiz_answers.created_by", db.raw("?", [userId]))
        .andOn("quiz_answers.is_delete", db.raw("false"));
    })
    .where({
      "quiz_questions.quizzes_id": quizId,
      "quiz_questions.is_delete": false,
    })
    .select(
      "quiz_questions.id as quiz_question_id",
      "quiz_questions.line",
      "quiz_questions.type",
      "quiz_questions.question",
      "quiz_questions.points as question_point",
      "quiz_questions.options as question_answer",
      "quiz_answers.id as quiz_answer_id",
      "quiz_answers.answers as user_answer",
      "quiz_answers.files as user_answer_file",
      "quiz_questions.image as question_file",
      "quiz_answers.files as answer_file",
      // admin_points bisa bertipe varchar atau integer tergantung database, samakan dulu ke integer
      db.raw("COALESCE(quiz_answers.admin_points::integer, 0) as user_point"),
      db.raw(
        `CASE WHEN quiz_answers.id IS NULL THEN NULL WHEN quiz_answers.is_correct THEN 'correct' ELSE 'incorrect' END as answer_status`,
      ),
    )
    .orderBy("quiz_questions.line", "asc")
    .orderBy("quiz_questions.created_at", "asc");
};

/**
 * Simpan nilai dari admin untuk beberapa jawaban dalam satu transaksi, lalu hitung ulang rekap quiz_users.
 * Semua jawaban harus milik hasil quiz ini (user & quiz yang sama); jika ada satu saja yang tidak, semuanya dibatalkan.
 */
const updateAdminPoints = async (quizUserId, items, actorId = null) => {
  return await db.transaction(async (trx) => {
    const quizUser = await trx(TABLE_NAME)
      .where({ id: quizUserId, is_delete: false })
      .first("quizze_id", "created_by");
    if (!quizUser) return null;

    const answerIds = items.map((item) => item.id);
    const owned = await trx("quiz_answers")
      .join(
        "quiz_questions",
        "quiz_questions.id",
        "quiz_answers.quiz_question_id",
      )
      .where({
        "quiz_questions.quizzes_id": quizUser.quizze_id,
        "quiz_questions.is_delete": false,
        "quiz_answers.created_by": quizUser.created_by,
        "quiz_answers.is_delete": false,
      })
      .whereIn("quiz_answers.id", answerIds)
      .select("quiz_answers.id", "quiz_questions.points");
    if (owned.length !== answerIds.length) {
      throw {
        message: "Ada quiz_answer_id yang tidak ditemukan pada hasil quiz ini",
        statusCode: 400,
      };
    }

    // nilai dari admin tidak boleh melebihi poin soal
    const maxPoints = new Map(owned.map((row) => [row.id, row.points]));
    for (const { id, admin_points: adminPoints } of items) {
      const max = maxPoints.get(id.toLowerCase());
      if (adminPoints > max) {
        throw {
          message: `admin_points untuk quiz_answer_id ${id} tidak boleh melebihi poin soal (${max})`,
          statusCode: 400,
        };
      }
    }

    const answers = [];
    for (const { id, ...data } of items) {
      const [answer] = await trx("quiz_answers")
        .where({ id })
        .update({
          ...data,
          // nilai admin menggantikan penilaian AI yang belum selesai / gagal, status SUCCESS tetap sebagai riwayat
          ai_assessment_status: trx.raw(
            "CASE WHEN ai_assessment_status IN ('PENDING', 'FAILED') THEN NULL ELSE ai_assessment_status END",
          ),
          updated_by: actorId,
          updated_at: trx.fn.now(),
        })
        .returning([
          "id as quiz_answer_id",
          "admin_points",
          "is_correct",
          "updated_at",
          "updated_by",
        ]);
      answers.push(answer);
    }

    const { total_point: totalPoint } = await recalcQuizUser(
      quizUser.quizze_id,
      quizUser.created_by,
      trx,
    );

    await trx(TABLE_NAME)
      .where({ id: quizUserId })
      .update({ updated_by: actorId, updated_at: trx.fn.now() });

    return { quiz_result_id: quizUserId, total_point: totalPoint, answers };
  });
};

// jawaban aktif user pada soal aktif quiz, dipakai untuk penilaian ulang
const findAnswersToRegrade = async (quizId, userId) => {
  return await db("quiz_answers")
    .join(
      "quiz_questions",
      "quiz_questions.id",
      "quiz_answers.quiz_question_id",
    )
    .where({
      "quiz_questions.quizzes_id": quizId,
      "quiz_questions.is_delete": false,
      "quiz_answers.created_by": userId,
      "quiz_answers.is_delete": false,
    })
    .select(
      "quiz_answers.id",
      "quiz_answers.quiz_question_id",
      "quiz_answers.answers",
      "quiz_questions.type",
    );
};

// nilai ulang jawaban otomatis (non short_answer) dalam satu transaksi, lalu hitung ulang rekap quiz_users
const regradeAnswers = async (quizId, userId, questionIds) => {
  await db.transaction(async (trx) => {
    for (const questionId of questionIds) {
      await gradeAnswer(questionId, userId, trx);
    }

    await recalcQuizUser(quizId, userId, trx);
  });
};

module.exports = {
  findAll,
  findById,
  findQuestionAnswers,
  updateAdminPoints,
  findAnswersToRegrade,
  regradeAnswers,
};
