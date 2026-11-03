const { connectRabbitMQ } = require('../config/rabbitmq')
const { AI_ASSESSMENT_QUEUE, processAssessment } = require('../modules/quiz_answers/ai_assessment')

const PREFETCH = 5
const RECONNECT_DELAY_MS = 5000

// isi pesan berisi Bearer token, jadi tidak boleh ditulis ke log
const handleMessage = async (msg, channel) => {
  try {
    await processAssessment(JSON.parse(msg.content.toString()))
    channel.ack(msg)
  } catch (error) {
    console.error(`Gagal memproses pesan ${AI_ASSESSMENT_QUEUE}:`, error.message)
    // gagal AI sudah dicatat sebagai FAILED, yang sampai ke sini gangguan lain (mis. database): dicoba ulang sekali
    channel.nack(msg, false, !msg.fields.redelivered)
  }
}

// consumer berjalan di proses API, jadi putusnya koneksi tidak boleh mematikan server dan harus tersambung lagi
const initAiAssessmentListener = async () => {
  let connection
  let restarting = false

  const restart = (error) => {
    if (restarting) return
    restarting = true
    console.error(`Consumer ${AI_ASSESSMENT_QUEUE} terputus, mencoba lagi:`, error?.message)
    if (connection) connection.close().catch(() => {})
    setTimeout(initAiAssessmentListener, RECONNECT_DELAY_MS)
  }

  try {
    const rabbit = await connectRabbitMQ()
    const { channel } = rabbit
    connection = rabbit.connection

    connection.on('error', restart)
    connection.on('close', restart)
    channel.on('error', restart)
    channel.on('close', restart)

    await channel.assertQueue(AI_ASSESSMENT_QUEUE, { durable: true })
    await channel.prefetch(PREFETCH)
    await channel.consume(
      AI_ASSESSMENT_QUEUE,
      (msg) => {
        if (!msg) return
        handleMessage(msg, channel).catch((error) => console.error(`Gagal ack ${AI_ASSESSMENT_QUEUE}:`, error.message))
      },
      { noAck: false, consumerTag: `consumer_${AI_ASSESSMENT_QUEUE}_${process.pid}` }
    )
  } catch (error) {
    restart(error)
  }
}

module.exports = {
  initAiAssessmentListener
}
