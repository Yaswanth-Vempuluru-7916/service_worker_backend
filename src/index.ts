import express, { Request, Response } from 'express';
import webPush from 'web-push';
import cors from 'cors';
import dotenv from "dotenv";
dotenv.config();

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
if (!publicKey || !privateKey) {
  throw new Error("VAPID keys not set in .env file");
}
// Interface for push subscription
interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}
// In-memory storage for subscriptions
const subscriptions: PushSubscription[] = [];

// Set up VAPID keys
const vapidKeys = {
  publicKey: publicKey, 
  privateKey: privateKey, 
};


webPush.setVapidDetails(
  'mailto:bekaxa1100@acedby.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);


const app = express();
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

app.get('/',(req: Request ,res : Response)=>{
     res.send('Hello from Express!');
})

app.post('/subscribe',(req: Request ,res : Response)=>{
    const subscription : PushSubscription = req.body;
    subscriptions.push(subscription);
      console.log('Subscription received:', subscription);
  res.status(200).json({ message: 'Subscription added' });
})

let notificationCounter = 1
app.post('/send-notification', async(req : Request , res : Response)=>{
     const payload = JSON.stringify({
    title: 'Hello from Express!',
    body: `This is a push notification ${notificationCounter++}!`,
  });

  try {
    for (const subscription of subscriptions){
         await webPush.sendNotification(subscription, payload);
    }
    res.status(200).json({ message: 'Notifications sent' });

  } catch (error) {
     console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
})

// // Send notifications every 30 seconds
// setInterval(async () => {
//   if (subscriptions.length > 0) {
//     const payload = JSON.stringify({
//       title: 'Scheduled Notification',
//       body: 'This is an automatic push notification!',
//     });
//     try {
//       for (const subscription of subscriptions) {
//         console.log('Sending scheduled notification to:', subscription.endpoint);
//         await webPush.sendNotification(subscription, payload);
//       }
//       console.log('Scheduled notifications sent');
//     } catch (error) {
//       console.error('Error sending scheduled notification:', error);
//     }
//   } else {
//     console.log('No subscriptions to send notifications to');
//   }
// }, 10000); // Every 10 seconds


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});