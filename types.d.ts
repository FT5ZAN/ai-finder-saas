// this for ts TO connect to a MongoDB database using Mongoose in a TypeScript environment.
import { Connection } from 'mongoose';

declare global {
    var mongoose:{
        conn:Connection | null;
        promise: Promise<Connection> | null;
    };
}
export{};

// Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

export interface RazorpayPayment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  created_at: number;
}

export interface RazorpayWebhookPayload {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment: {
      entity: RazorpayPayment;
    };
    order: {
      entity: RazorpayOrder;
    };
  };
}