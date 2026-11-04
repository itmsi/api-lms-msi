/**
 * Swagger API Path Definitions for Quiz Results Module
 */
const {
  listRequest,
  json,
  envelope,
  errorResponse,
  idParam,
  ref,
  authErrors,
} = require("./_crud");

const quizResultsPaths = {
  "/quiz_results/get": {
    post: {
      tags: ["Quiz Results"],
      summary: "Get all quiz results",
      description:
        "Daftar hasil pengerjaan quiz per user (quiz_users join quizzes & modules) dengan pagination, sorting, search (judul quiz & judul module), serta filter quizzes_id dan status.",
      requestBody: {
        required: false,
        content: json(
          listRequest(
            ["quizze_title", "module_title", "created_at", "updated_at"],
            "created_at",
            "desc",
            {
              quizzes_id: {
                type: "string",
                format: "uuid",
                description: "Filter berdasarkan quiz",
                example: "",
              },
              employee_id: {
                type: "string",
                format: "uuid",
                description: "Filter berdasarkan karyawan",
                example: "",
              },
              status: {
                type: "string",
                enum: ["completed", "uncompleted"],
                description: "Filter berdasarkan status pengerjaan",
                example: "",
              },
            },
          ),
        ),
      },
      responses: {
        ...authErrors,
        200: {
          description: "Success",
          content: json(
            envelope(
              {
                type: "object",
                properties: {
                  items: { type: "array", items: ref("QuizResult") },
                  pagination: ref("Pagination"),
                },
              },
              "Success",
            ),
          ),
        },
        400: errorResponse("Validation error"),
      },
    },
  },
  "/quiz_results/{id}": {
    get: {
      tags: ["Quiz Results"],
      summary: "Get quiz result by ID",
      description:
        "Detail hasil pengerjaan quiz (id = quiz_users.id) beserta question_answers: seluruh soal aktif quiz (urut berdasarkan line) dan jawaban user. Kolom jawaban dan answer_status bernilai null serta user_point 0 jika soal belum dijawab. answer_status dari quiz_answers.is_correct: correct / incorrect. question_answer berisi kunci jawaban (opsi is_correct = true).",
      parameters: [idParam("quiz result")],
      responses: {
        ...authErrors,
        200: {
          description: "Success",
          content: json(envelope(ref("QuizResultDetail"), "Success")),
        },
        400: errorResponse("Validation error"),
        404: errorResponse("Not found"),
      },
    },
    put: {
      tags: ["Quiz Results"],
      summary: "Update nilai jawaban oleh admin",
      description:
        'id adalah quiz_users.id. Body berupa array jawaban yang dinilai; semua jawaban harus milik hasil quiz ini dan admin_points tidak boleh melebihi poin soal (quiz_questions.points), jika ada satu saja yang tidak sesuai maka semuanya dibatalkan. admin_points terisi (termasuk "0"): is_correct = true. admin_points null atau kosong: is_correct = false dan admin_points disimpan sebagai 0. updated_at & updated_by pada quiz_answers dan quiz_users diisi otomatis (updated_by = admin dari token), lalu total_point pada quiz_users dihitung ulang.',
      parameters: [idParam("quiz result")],
      requestBody: {
        required: true,
        content: json(ref("QuizResultAdminPointsInput")),
      },
      responses: {
        ...authErrors,
        200: {
          description: "Updated successfully",
          content: json(
            envelope(
              ref("QuizResultAdminPointsResult"),
              "Data berhasil diupdate",
            ),
          ),
        },
        400: errorResponse("Validation error"),
        404: errorResponse("Not found"),
      },
    },
  },
  "/quiz_results/{id}/regrade": {
    post: {
      tags: ["Quiz Results"],
      summary: "Penilaian ulang hasil quiz",
      description:
        "id adalah quiz_users.id. Menilai ulang seluruh jawaban aktif user pada quiz ini, termasuk nilai yang sudah diubah admin. multiple_choice, multiple_answers & true_false langsung dinilai ulang. short_answer dikirim ulang ke API AI memakai Bearer token dari header request; lewat queue RabbitMQ dan hasilnya menyusul (ai_assessment_status: PENDING lalu SUCCESS / FAILED). Jika AI gagal nilai lama tetap dipertahankan. short_answer dengan jawaban kosong dilewati. updated_at & updated_by pada quiz_users tidak berubah.",
      parameters: [idParam("quiz result")],
      responses: {
        ...authErrors,
        200: {
          description: "Success",
          content: json(
            envelope(
              ref("QuizResultRegradeResult"),
              "Penilaian ulang diproses",
            ),
          ),
        },
        400: errorResponse("Validation error"),
        404: errorResponse("Not found"),
      },
    },
  },
};

module.exports = quizResultsPaths;
