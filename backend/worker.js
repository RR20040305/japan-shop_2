const amqp = require('amqplib');
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq';
const QUEUE_NAME = 'tasks_queue';
const EXCHANGE_NAME = 'tasks_exchange';
const DLX_NAME = 'tasks_dlx';
const DLQ_NAME = 'tasks_dlq';
const MAX_RETRIES = 3;

async function processTask(task, retryCount = 0) {
  const type = task.type || 'unknown';
  const payload = task.payload || {};
  console.log(`[${new Date().toISOString()}] Worker ${process.env.SERVER_ID || '?'} processing: ${type}, retry=${retryCount}`);
  
  // Имитация работы
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1500));
  
  // Демонстрация retry: если 'email' и payload.to содержит 'fail'
  if (type === 'email' && payload.to && payload.to.includes('fail')) {
    throw new Error('Simulated failure');
  }
  
  console.log(`[${new Date().toISOString()}] Worker ${process.env.SERVER_ID || '?'} completed ${type}`);
}

async function connectWithRetry() {
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      const conn = await amqp.connect(RABBITMQ_URL);
      console.log(`✅ Worker ${process.env.SERVER_ID} connected to RabbitMQ`);
      return conn;
    } catch (err) {
      console.error(`❌ Connection attempt ${attempt} failed: ${err.message}`);
      if (attempt === 10) {
        console.error('❌ All attempts exhausted, exiting');
        process.exit(1);
      }
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
}

async function startWorker() {
  const conn = await connectWithRetry();
  const channel = await conn.createChannel();
  
  await channel.assertExchange(EXCHANGE_NAME, 'direct', { durable: true });
  await channel.assertExchange(DLX_NAME, 'direct', { durable: true });
  await channel.assertQueue(DLQ_NAME, { durable: true });
  await channel.bindQueue(DLQ_NAME, DLX_NAME, '');
  
  await channel.assertQueue(QUEUE_NAME, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': DLX_NAME,
      'x-dead-letter-routing-key': ''
    }
  });
  await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, 'task');
  
  channel.consume(QUEUE_NAME, async (msg) => {
    if (!msg) return;
    const content = msg.content.toString();
    let task;
    try {
      task = JSON.parse(content);
    } catch (e) {
      channel.nack(msg, false, false);
      return;
    }
    
    const retryCount = (task['x-retry-count'] || 0);
    try {
      await processTask(task, retryCount);
      channel.ack(msg);
    } catch (err) {
      console.error(`Error: ${err.message}`);
      const newRetryCount = retryCount + 1;
      if (newRetryCount <= MAX_RETRIES) {
        const delay = Math.pow(2, newRetryCount) * 1000;
        console.log(`Retrying in ${delay}ms (${newRetryCount}/${MAX_RETRIES})`);
        setTimeout(() => {
          task['x-retry-count'] = newRetryCount;
          channel.publish(EXCHANGE_NAME, 'task', Buffer.from(JSON.stringify(task)), { persistent: true });
          channel.ack(msg);
        }, delay);
      } else {
        console.log('Max retries, sending to DLQ');
        channel.publish(DLX_NAME, '', Buffer.from(content), { persistent: true });
        channel.ack(msg);
      }
    }
  }, { noAck: false });
  
  console.log(`Worker ${process.env.SERVER_ID} ready`);
}

startWorker().catch(console.error);