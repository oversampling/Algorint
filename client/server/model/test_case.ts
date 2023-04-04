import mongoose from "mongoose";

const Schema = mongoose.Schema;

export interface ITestCase {
    stdin: string,
    stdout: string,
    replace: {
        from: string,
        to: string,
    }
}

const TestCaseSchema = new Schema<ITestCase>({
    stdin: String,
    stdout: String,
    replace: {
        from: String,
        to: String,
    }
});

const TestCase = mongoose.model<ITestCase>("TestCase", TestCaseSchema);
export default TestCase;
