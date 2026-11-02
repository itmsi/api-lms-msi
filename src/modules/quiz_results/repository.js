const { pgCore: db } = require("../../config/database");
const { normalizeListParams } = require("../../utils/list_params");
const { recalcQuizUser } = require("../quiz_answers/grading");

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
  db.raw(`COALESCE(quiz_users.updated_at, quiz_users.created_at) as send_date`),
  "quiz_users.updated_at",
  "quiz_users.total_point",
  "quizzes.max_points",
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
    if (params.quizzes_id) q.andWhere("quiz_users.quizze_id", params.quizzes_id);
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
    .where({ "quiz_questions.quizzes_id": quizId, "quiz_questions.is_delete": false })
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
      db.raw("COALESCE(quiz_answers.points, 0) as user_point"),
    )
    .orderBy("quiz_questions.line", "asc")
    .orderBy("quiz_questions.created_at", "asc");
};

// simpan nilai dari admin, lalu hitung ulang rekap quiz_users (total_point) milik user yang menjawab
const updateAdminPoints = async (answerId, data, actorId = null) => {
  return await db.transaction(async (trx) => {
    const [answer] = await trx("quiz_answers")
      .where({ id: answerId, is_delete: false })
      .update({ ...data, updated_by: actorId, updated_at: trx.fn.now() })
      .returning([
        "id as quiz_answer_id",
        "quiz_question_id",
        "created_by",
        "admin_points",
        "is_correct",
        "updated_at",
        "updated_by",
      ]);

    if (!answer) return null;

    const question = await trx("quiz_questions")
      .where({ id: answer.quiz_question_id })
      .first("quizzes_id");
    if (question) {
      await recalcQuizUser(question.quizzes_id, answer.created_by, trx);
    }

    const { quiz_question_id: questionId, created_by: userId, ...result } = answer;
    return result;
  });
};

module.exports = {
  findAll,
  findById,
  findQuestionAnswers,
  updateAdminPoints,
};
