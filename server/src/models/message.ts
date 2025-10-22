import { Schema, model, Document } from "mongoose";

export interface IMeassage extends Document {
  text: string,
  authorId: string,
  roomId: string,
  createdAt: Date,
}

const messageSchema = new Schema<IMeassage>({
  text: {
    type: String,
    required: true,
  },
  authorId: {
    type: String,
    required: true,
  },
  roomId: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default model<IMeassage>('Message', messageSchema);