import mongoose from 'mongoose';
//import mongooseSlugPlugin from 'mongoose-slug-plugin';
mongoose.connect('mongodb+srv://smw9999:Yl4cJRZTHdOStqzP@ait-final-f25.puypcna.mongodb.net/sets?appName=AIT-Final-F25');

const { Schema } = mongoose;

const SetSchema = new mongoose.Schema({
    name: String,
    description: String
})

const CardSchema = new mongoose.Schema({
    name: String,
    set: { type: Schema.Types.ObjectId, ref: 'Set' },
}, {timestamps: true}); 

//SetSchema.plugin(mongooseSlugPlugin, {tmpl: '<%=name%>'});

mongoose.model('Card',CardSchema);
mongoose.model('Set',SetSchema);
