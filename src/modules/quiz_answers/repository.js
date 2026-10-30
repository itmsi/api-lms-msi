const { pgCore: db } = require("../../config/database");
const { normalizeListParams } = require("../../utils/list_params");

const TABLE_NAME = "quiz_users";
const ANSWER_TABLE = "quiz_answers";

/**
 * Repository Layer - Database Operations (quiz_answers)
 * Data utama adalah rekap pengerjaan quiz per user (quiz_users),
 * jawaban per soal disimpan di quiz_answers.
 */

const SORTABLE = {
  quiz_title: "quizzes.title",
  created_at: "quiz_users.created_at",
  updated_at: "quiz_users.updated_at",
};

const COLUMNS = [
  "quiz_users.id",
  "quiz_users.quizze_id",
  "quizzes.title as quiz_title",
  "quizzes.type as quiz_type",
  db.raw(`to_char(quizzes.start_date, 'YYYY-MM-DD') as quiz_start_date`),
  db.raw(`to_char(quizzes.end_date, 'YYYY-MM-DD') as quiz_end_date`),
  "quiz_users.total_point",
  "quiz_users.completed_count",
  "quiz_users.uncompleted_count",
  "quiz_users.created_at",
  "quiz_users.created_by",
  "quiz_users.updated_at",
  "quiz_users.updated_by",
  "quiz_users.deleted_at",
  "quiz_users.deleted_by",
  "quiz_users.is_delete",
];

const ANSWER_COLUMNS = [
  "quiz_answers.id",
  "quiz_answers.quiz_question_id",
  "quiz_questions.line as question_line",
  "quiz_questions.type as question_type",
  "quiz_questions.question",
  "quiz_answers.answers",
  "quiz_answers.points",
  "quiz_answers.admin_points",
  "quiz_answers.files",
  "quiz_answers.created_at",
  "quiz_answers.created_by",
  "quiz_answers.updated_at",
  "quiz_answers.updated_by",
  "quiz_answers.deleted_at",
  "quiz_answers.deleted_by",
  "quiz_answers.is_delete",
];

const baseQuery = (conn = db) =>
  conn(TABLE_NAME).leftJoin("quizzes", "quizzes.id", "quiz_users.quizze_id");

const answerQuery = (conn = db) =>
  conn(ANSWER_TABLE).leftJoin(
    "quiz_questions",
    "quiz_questions.id",
    "quiz_answers.quiz_question_id",
  );

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
    if (params.quizze_id) q.andWhere("quiz_users.quizze_id", params.quizze_id);
    if (params.created_by)
      q.andWhere("quiz_users.created_by", params.created_by);
    if (search) q.andWhereILike("quizzes.title", `%${search}%`);
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

const QUIZ_SORTABLE = {
  title: 'quizzes.title',
  start_date: 'quizzes.start_date',
  end_date: 'quizzes.end_date',
  created_at: 'quizzes.created_at',
  updated_at: 'quizzes.updated_at'
};

// kolom quiz sama seperti list quizzes, ditambah rekap pengerjaan user (quiz_users)
const QUIZ_COLUMNS = [
  'quizzes.id as quizzes_id',
  'quizzes.title',
  'quizzes.modules_id',
  'modules.title as module_title',
  'quizzes.type',
  db.raw(`to_char(quizzes.start_date, 'YYYY-MM-DD') as start_date`),
  db.raw(`to_char(quizzes.end_date, 'YYYY-MM-DD') as end_date`),
  db.raw(`(SELECT count(*)::int FROM quiz_questions qq WHERE qq.quizzes_id = quizzes.id AND qq.is_delete = false) as question_count`),
  db.raw(`CASE WHEN quizzes.banner IS NOT NULL AND quizzes.banner <> '' THEN concat_ws('', quizzes.banner, '/preview'::text) ELSE quizzes.banner END as banner`),
  'quiz_users.completed_count',
  'quiz_users.uncompleted_count',
  'quiz_users.total_point'
];

/**
 * Daftar quiz (filter sama seperti POST /quizzes/get) beserta rekap pengerjaan user created_by.
 * Rekap bernilai null jika user belum pernah menjawab quiz tersebut.
 */
const findQuizzes = async (params = {}) => {
  const { page, limit, sortColumn, sortOrder, search } = normalizeListParams(params, {
    sortable: QUIZ_SORTABLE,
    defaultSort: 'created_at',
    defaultOrder: 'desc'
  });
  const offset = (page - 1) * limit;

  const base = () => {
    const q = db('quizzes')
      .leftJoin('modules', 'modules.id', 'quizzes.modules_id')
      .where('quizzes.is_delete', false);
    if (params.modules_id) q.andWhere('quizzes.modules_id', params.modules_id);
    if (params.type) q.andWhereRaw('quizzes.type @> ?::jsonb', [JSON.stringify([params.type])]);
    if (search) q.andWhereILike('quizzes.title', `%${search}%`);
    return q;
  };

  const items = await base()
    .leftJoin(TABLE_NAME, function () {
      this.on('quiz_users.quizze_id', 'quizzes.id')
        .andOn('quiz_users.created_by', db.raw('?', [params.created_by]))
        .andOn('quiz_users.is_delete', db.raw('false'));
    })
    .select(QUIZ_COLUMNS)
    .orderBy(sortColumn, sortOrder)
    .limit(limit)
    .offset(offset);

  const total = await base().count('quizzes.id as count').first();

  return {
    items,
    pagination: {
      page,
      limit,
      total: parseInt(total.count),
      totalPages: Math.ceil(total.count / limit)
    }
  };
};

const findById = async (id) => {
  return await baseQuery()
    .where({ "quiz_users.id": id, "quiz_users.is_delete": false })
    .first(COLUMNS);
};

// jawaban milik user pada quiz tersebut (soal quiz yang dijawab oleh created_by yang sama)
const findAnswers = async (quizId, userId) => {
  return await answerQuery()
    .where({
      "quiz_questions.quizzes_id": quizId,
      "quiz_answers.created_by": userId,
      "quiz_answers.is_delete": false,
    })
    .select(ANSWER_COLUMNS)
    .orderBy("quiz_questions.line", "asc")
    .orderBy("quiz_answers.created_at", "asc");
};

const findAnswerById = async (id, conn = db) => {
  return await answerQuery(conn)
    .where({ "quiz_answers.id": id, "quiz_answers.is_delete": false })
    .first(ANSWER_COLUMNS);
};

/**
 * Rekap pengerjaan user pada sebuah quiz, dihitung dari quiz_answers:
 * - total_point       : jumlah points jawaban user pada soal-soal quiz ini
 * - completed_count   : jumlah soal quiz yang sudah dijawab user
 * - uncompleted_count : jumlah soal quiz (aktif) yang belum dijawab user
 * Disimpan sebagai string sesuai tipe kolom quiz_users.
 */
const computeSummary = async (trx, quizId, userId) => {
  const row = await trx("quiz_questions as qq")
    .leftJoin("quiz_answers as qa", function () {
      this.on("qa.quiz_question_id", "qq.id")
        .andOn("qa.created_by", trx.raw("?", [userId]))
        .andOn("qa.is_delete", trx.raw("false"));
    })
    .where({ "qq.quizzes_id": quizId, "qq.is_delete": false })
    .first(
      trx.raw("coalesce(sum(qa.points), 0)::int as total_point"),
      trx.raw("count(qa.id)::int as completed_count"),
      trx.raw("(count(qq.id) - count(qa.id))::int as uncompleted_count"),
    );

  return {
    total_point: String(row.total_point),
    completed_count: String(row.completed_count),
    uncompleted_count: String(row.uncompleted_count),
  };
};

/**
 * Simpan jawaban dalam satu transaksi:
 * - quiz_answers dicari by quiz_question_id + created_by. Jika sudah ada di-update, jika belum dibuat baru.
 * - rekap quiz_users (total_point, completed_count, uncompleted_count) dihitung ulang dari quiz_answers.
 * - quiz_users dicari by quizze_id + created_by. Jika belum ada dibuat baru; jika sudah ada,
 *   hanya di-update bila ada nilai rekap yang berbeda (selain itu dilewati).
 */
const upsert = async (quizId, answerData, actorId = null) => {
  return await db.transaction(async (trx) => {
    const existingAnswer = await trx(ANSWER_TABLE)
      .where({
        quiz_question_id: answerData.quiz_question_id,
        created_by: actorId,
        is_delete: false,
      })
      .first("id");

    let answerId;
    if (existingAnswer) {
      answerId = existingAnswer.id;
      await trx(ANSWER_TABLE)
        .where({ id: answerId })
        .update({
          ...answerData,
          updated_by: actorId,
          updated_at: trx.fn.now(),
        });
    } else {
      const [created] = await trx(ANSWER_TABLE)
        .insert({
          ...answerData,
          created_by: actorId,
          created_at: trx.fn.now(),
          updated_at: trx.fn.now(),
        })
        .returning("id");
      answerId = created.id;
    }

    const summary = await computeSummary(trx, quizId, actorId);

    const existingUser = await trx(TABLE_NAME)
      .where({ quizze_id: quizId, created_by: actorId, is_delete: false })
      .first();

    let quizUserId;
    if (existingUser) {
      quizUserId = existingUser.id;

      const changes = Object.fromEntries(
        Object.entries(summary).filter(([k, v]) => existingUser[k] !== v),
      );
      if (Object.keys(changes).length) {
        await trx(TABLE_NAME)
          .where({ id: quizUserId })
          .update({
            ...changes,
            updated_by: actorId,
            updated_at: trx.fn.now(),
          });
      }
    } else {
      const [created] = await trx(TABLE_NAME)
        .insert({
          ...summary,
          quizze_id: quizId,
          created_by: actorId,
          created_at: trx.fn.now(),
          updated_at: trx.fn.now(),
        })
        .returning("id");
      quizUserId = created.id;
    }

    return {
      quiz_user: await baseQuery(trx)
        .where("quiz_users.id", quizUserId)
        .first(COLUMNS),
      quiz_answer: await findAnswerById(answerId, trx),
    };
  });
};

// subquery id soal milik sebuah quiz, untuk memilih jawaban user pada quiz tersebut
const questionIdsOfQuiz = (trx, quizId) =>
  trx("quiz_questions").where({ quizzes_id: quizId }).select("id");

/**
 * Soft delete quiz_users beserta jawaban user tersebut pada quiz yang sama dalam satu transaksi.
 * deleted_at jawaban = deleted_at quiz_users (trx.fn.now() konstan dalam transaksi), dipakai restore
 * untuk hanya memulihkan jawaban yang ikut terhapus bersamanya.
 */
const remove = async (id, actorId = null) => {
  return await db.transaction(async (trx) => {
    const [quizUser] = await trx(TABLE_NAME)
      .where({ id, is_delete: false })
      .update({
        is_delete: true,
        deleted_at: trx.fn.now(),
        deleted_by: actorId,
      })
      .returning(["id", "quizze_id", "created_by"]);

    if (!quizUser) return null;

    await trx(ANSWER_TABLE)
      .where({ created_by: quizUser.created_by, is_delete: false })
      .whereIn("quiz_question_id", questionIdsOfQuiz(trx, quizUser.quizze_id))
      .update({
        is_delete: true,
        deleted_at: trx.fn.now(),
        deleted_by: actorId,
      });

    return quizUser;
  });
};

const restore = async (id, actorId = null) => {
  const restored = await db.transaction(async (trx) => {
    const deleted = await trx(TABLE_NAME)
      .where({ id, is_delete: true })
      .first("id", "quizze_id", "created_by", "deleted_at");
    if (!deleted) return null;

    // satu user hanya boleh punya satu quiz_users aktif per quiz
    const active = await trx(TABLE_NAME)
      .where({
        quizze_id: deleted.quizze_id,
        created_by: deleted.created_by,
        is_delete: false,
      })
      .first("id");
    if (active) {
      throw {
        message: "User sudah memiliki data pengerjaan aktif untuk quiz ini",
        statusCode: 409,
      };
    }

    await trx(TABLE_NAME).where({ id }).update({
      is_delete: false,
      deleted_at: null,
      deleted_by: null,
      updated_at: trx.fn.now(),
      updated_by: actorId,
    });

    await trx(ANSWER_TABLE)
      .where({
        created_by: deleted.created_by,
        is_delete: true,
        deleted_at: deleted.deleted_at,
      })
      .whereIn("quiz_question_id", questionIdsOfQuiz(trx, deleted.quizze_id))
      .update({
        is_delete: false,
        deleted_at: null,
        deleted_by: null,
        updated_at: trx.fn.now(),
        updated_by: actorId,
      });

    return deleted.id;
  });

  return restored ? await findById(restored) : null;
};

// image disimpan sebagai share link Nextcloud, '/preview' ditambahkan agar bisa dipakai langsung di <img>
const QUESTION_COLUMNS = [
  "id as quiz_question_id",
  "line",
  "type",
  "question",
  "estimated_time",
  "estimated_time_unit",
  "points",
  "options",
  db.raw(
    `CASE WHEN image IS NOT NULL AND image <> '' THEN concat_ws('', image, '/preview'::text) ELSE image END as image`,
  ),
];

const findQuestionDetail = async (questionId) => {
  return await db("quiz_questions")
    .where({ id: questionId, is_delete: false })
    .first(QUESTION_COLUMNS);
};

const findAnswerOfUser = async (questionId, userId) => {
  return await db(ANSWER_TABLE)
    .where({
      quiz_question_id: questionId,
      created_by: userId,
      is_delete: false,
    })
    .first(
      "id as quiz_answer_id",
      "answers",
      "points",
      "admin_points",
      "files",
    );
};

// daftar soal ringkas milik quiz, dipakai GET /quiz-answers/quizzes/get/:id
const findQuizQuestions = async (quizId) => {
  return await db('quiz_questions')
    .where({ quizzes_id: quizId, is_delete: false })
    .select('id', 'line', 'question')
    .orderBy('line', 'asc')
    .orderBy('created_at', 'asc');
};

const findQuestion = async (questionId) => {
  return await db("quiz_questions")
    .where({ id: questionId, is_delete: false })
    .first("id", "quizzes_id");
};

module.exports = {
  findAll,
  findQuizzes,
  findById,
  findAnswers,
  upsert,
  remove,
  restore,
  findQuestion,
  findQuizQuestions,
  findQuestionDetail,
  findAnswerOfUser,
};
