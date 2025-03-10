import mongoose from "mongoose";

const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "user" },
    userName: { type: String, required: true, date: Date },
    message: { type: String, required: true, date: Date },
    emoji: { type: String, required: true, date: Date },
    colorCode: { type: String, required: true },
    time: { type: String },
  },
  { timestamps: true }
);

const messageModel = mongoose.model("message", messageSchema);

export default messageModel;
