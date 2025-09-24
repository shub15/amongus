import mongoose, { Document, Schema } from 'mongoose';

export interface IPlayer extends Document {
    playerId: string;
    name: string;
    role: 'imposter' | 'crewmate';
    status: 'active' | 'inactive';
}

const PlayerSchema: Schema = new Schema({
    playerId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['imposter', 'crewmate'], required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
});

const Player = mongoose.model<IPlayer>('Player', PlayerSchema);

export default Player;