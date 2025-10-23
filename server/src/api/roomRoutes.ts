import { Router, type Request, type Response } from 'express';
import room from '../models/room.js';

const router = Router();

router.post('/', async(req: Request, res: Response) => {
  try{
    const newRoom = new room();
    await newRoom.save();
    res.status(201).json({ roomId: newRoom.roomId});
  } catch(error) {
    console.error('Error creating room: ', error);
    res.status(500).json({message: 'Server error'});
  }
});

export default router;