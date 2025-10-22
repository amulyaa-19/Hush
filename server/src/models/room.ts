import { Schema, model, Document } from 'mongoose';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 7);
export interface IRoom extends Document {
  roomId: string;
  createdAt: Date;
}

const roomSchema = new Schema<IRoom>({
  roomId: {
    type: String,
    required: true,
    unique: true,
    default: () => nanoid(),
  },
  createdAt: {
    type: Date,
    deafult: Date.now,
  },
});

export default model<IRoom>('Room', roomSchema);