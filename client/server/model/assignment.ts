import mongoose, { Schema, Types } from "mongoose";

export interface IAssignment{
    question: string,
    language: string,
    code_template: string,
    test_cases: [
        Types.ObjectId,
    ]
}

const AssignmentSchema = new Schema<IAssignment>({
    question: {
        type: String,
        required: true,
    },
    language: String,
    code_template: String,
    test_cases: [{
        type: Types.ObjectId,
        ref: "TestCase"
    }]
});

const Assignment = mongoose.model("Assignment", AssignmentSchema);
export default Assignment;
