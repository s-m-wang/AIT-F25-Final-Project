import mongoose from 'mongoose';
mongoose.connect('mongodb+srv://smw9999:Yl4cJRZTHdOStqzP@ait-final-f25.puypcna.mongodb.net/sets?appName=AIT-Final-F25');

const { Schema } = mongoose;

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true }, 
    url: String
})

const SetSchema = new mongoose.Schema({
    name: String,
    description: String,
    user: { type: Schema.Types.ObjectId, ref: 'User' },
}, {timestamps: true}); 

const CardSchema = new mongoose.Schema({
    name: String,
    description: String,
    url: String,
    set: { type: Schema.Types.ObjectId, ref: 'Set' },
}, {timestamps: true}); 

mongoose.model('User',UserSchema);
mongoose.model('Card',CardSchema);
mongoose.model('Set',SetSchema);
