import mongoose from 'mongoose';
const predictionSchema=new mongoose.Schema({zoneId:String,features:Object,ml:Object,threshold:Object,final:Object,source:String},{timestamps:true});
predictionSchema.index({zoneId:1,createdAt:-1});
export default mongoose.model('Prediction',predictionSchema);
