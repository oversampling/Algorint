import mongoose from "mongoose";

const Schema = mongoose.Schema;

const AssignmentSchema = new Schema({
    question: String,
    language: String,
    codeTemplate: String,
    testCases: [{
        type: Schema.Types.ObjectId,
        ref: "TestCase"
    }]
});

module.exports = mongoose.model("Assignment", AssignmentSchema);
