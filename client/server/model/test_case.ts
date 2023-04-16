import mongoose from "mongoose";

const Schema = mongoose.Schema;

export interface ITestCase {
    stdin: string,
    stdout: string,
    replace: [{
        from: string,
        to: string,
    }],
    isHidden: boolean,
}

const TestCaseSchema = new Schema<ITestCase>({
    stdin: String,
    stdout: String,
    replace: {
        type: [{
            from: String,
            to: String,
        }],
        default: []
    },
    isHidden: {
        type: Boolean,
        default: true
    }
});

const TestCase = mongoose.model<ITestCase>("TestCase", TestCaseSchema);
export default TestCase;
