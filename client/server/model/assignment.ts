import mongoose, { Schema } from "mongoose";

export interface IAssignment {
    question: string,
    language: string,
    code_template: string,
    test_cases: [
        Schema.Types.ObjectId,
    ]
}

const AssignmentSchema = new Schema({
    question: {
        type: String,
        required: true,
    },
    language: String,
    code_template: String,
    test_cases: [{
        type: Schema.Types.ObjectId,
        ref: "TestCase"
    }]
});

const Assignment = mongoose.model("Assignment", AssignmentSchema);
export default Assignment;
