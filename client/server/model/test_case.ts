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
    configuration: {
        time_limit: number,
        memory_limit: number,
    }
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
    },
    configuration: {
        time_limit: {
            type: Number,
            default: 2
        },
        memory_limit: {
            type: Number,
            default: 200,
        }
    }
});

const TestCase = mongoose.model<ITestCase>("TestCase", TestCaseSchema);
export default TestCase;
