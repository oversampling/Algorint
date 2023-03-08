import mongoose, { Schema } from "mongoose";

export interface IAssignment {
    question: string,
    language: string,
    codeTemplate: string,
    testCases: [
        Schema.Types.ObjectId,
    ]
}

const AssignmentSchema = new Schema({
    question: {
        type: String,
        required: true,
        maxLength: 50
    },
    language: String,
    codeTemplate: String,
    testCases: [{
        type: Schema.Types.ObjectId,
        ref: "TestCase"
    }]
});

const Assignment = mongoose.model("Assignment", AssignmentSchema);
export default Assignment;
