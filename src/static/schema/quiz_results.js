/**
 * Swagger Schema Definitions for Quiz Results Module
 */

const quizResultsSchemas = {
  QuizResult: {
    type: 'object',
    description: 'Hasil pengerjaan quiz per user (quiz_users join quizzes & modules)',
    properties: {
      quiz_result_id: { type: 'string', format: 'uuid', description: 'quiz_users.id', example: '3c2b1a09-8f7e-4d6c-9b5a-4e3d2c1b0a99' },
      created_by_name: { type: 'string', nullable: true, description: 'gate_sso_employees.employee_name dari quiz_users.created_by', example: 'Budi Santoso' },
      updated_by_name: { type: 'string', nullable: true, description: 'gate_sso_employees.employee_name dari quiz_users.updated_by', example: 'Budi Santoso' },
      quizze_title: { type: 'string', nullable: true, description: 'quizzes.title', example: 'Ujian Pemahaman Onboarding Umum' },
      module_title: { type: 'string', nullable: true, description: 'modules.title', example: 'Pengenalan JavaScript' },
      completed_count: { type: 'string', nullable: true, description: 'quiz_users.completed_count', example: '8' },
      uncompleted_count: { type: 'string', nullable: true, description: 'quiz_users.uncompleted_count', example: '2' },
      status: { type: 'string', enum: ['completed', 'uncompleted'], description: 'completed jika uncompleted_count = 0, selain itu uncompleted', example: 'uncompleted' },
      send_date: { type: 'string', format: 'date-time', description: 'quiz_users.updated_at, jika kosong quiz_users.created_at', example: '2026-11-03T08:20:00.000Z' },
      updated_at: { type: 'string', format: 'date-time', nullable: true, description: 'quiz_users.updated_at', example: '2026-11-03T08:20:00.000Z' },
      total_point: { type: 'string', nullable: true, description: 'quiz_users.total_point', example: '80' },
      max_points: { type: 'string', nullable: true, description: 'quizzes.max_points: jumlah poin seluruh soal aktif quiz, dihitung ulang otomatis saat soal berubah', example: '100' }
    }
  }
};

module.exports = quizResultsSchemas;
