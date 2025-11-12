import mongoose from 'mongoose';
mongoose.connect('mongodb+srv://smw9999:Yl4cJRZTHdOStqzP@ait-final-f25.puypcna.mongodb.net/sets?appName=AIT-Final-F25');

const { Schema } = mongoose;

const SetSchema = new mongoose.Schema({
    name: String,
    description: String
})

SetSchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { slug: { $exists: true, $ne: null } } }
);

const CardSchema = new mongoose.Schema({
    name: String,
    description: String,
    set: { type: Schema.Types.ObjectId, ref: 'Set' },
}, {timestamps: true}); 


mongoose.model('Card',CardSchema);
mongoose.model('Set',SetSchema);
