const amqp = require('amqplib');
const { lang } = require('../lang');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:9505';

const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    return { connection, channel };
  } catch (error) {
    console.error('Error connecting to RabbitMQ:', error);
    throw error;
  }
};

const publishToRabbitMqQueueSingle = async (exchangeName, queueName, data) => {
  const config = await connectRabbitMQ()

  try {
    if (config?.connection && config?.channel) {
      await config?.channel.assertExchange(exchangeName, 'fanout', { durable: true })
      await config?.channel.assertQueue(queueName, { durable: true })
      await config?.channel.bindQueue(queueName, exchangeName)

      config?.channel.publish(exchangeName, '', Buffer.from(JSON.stringify(data)))
      console.info(lang.__('rabbitmq.publish'))
    } else {
      console.info(`failed to publish ${exchangeName} - ${queueName}`, config?.error)
    }
  } catch (e) {
    console.error(lang.__('rabbitmq.error'), e)
  } finally {
    console.info(lang.__('rabbitmq.closing'))
    await config?.channel.close()
    await config?.connection.close()
    console.info(lang.__('rabbitmq.closed'))
  }
}

const isRabbitMqEnabled = () => process.env.RABBITMQ_ENABLED === 'true'
  && Boolean(process.env.RABBITMQ_URL)
  && process.env.RABBITMQ_URL !== 'disabled'

/**
 * Kirim pesan langsung ke queue durable. Pesan persistent dan ditunggu konfirmasinya dari broker,
 * sehingga pesan tetap ada walau broker restart. Melempar error bila gagal agar pemanggil bisa menanganinya.
 */
const publishToQueue = async (queueName, data) => {
  const { connection } = await connectRabbitMQ()
  connection.on('error', (error) => console.error('RabbitMQ connection error:', error.message))

  try {
    const channel = await connection.createConfirmChannel()
    await channel.assertQueue(queueName, { durable: true })
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)), { persistent: true })
    await channel.waitForConfirms()
  } finally {
    await connection.close()
  }
}

module.exports = {
  connectRabbitMQ,
  publishToRabbitMqQueueSingle,
  isRabbitMqEnabled,
  publishToQueue
}
