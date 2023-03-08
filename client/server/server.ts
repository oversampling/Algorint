import express, {Express, NextFunction, Request, Response} from 'express';
import cors from 'cors';
import path from 'path';
import mongoose from 'mongoose';
import Post from './model/post';
import Assignment from './model/assignment';
import TestCase from './model/test_case';
import ExpressError from './utils/ExpressError';
import { INewPost } from './interface';

const app: Express = express();
mongoose.connect('mongodb://127.0.0.1:27017/algorint')
  .then(() => console.log('Mongodb Connected'));

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
process.env.ENV === "production" && app.use(express.static(path.join(__dirname, '../../dist')));

app.get("/", (req: Request, res: Response) => {
    process.env.ENV === "production" && res.sendFile(path.join(__dirname, './index.html'));
    res.json({message: "Hello World"})
})

app.post("/api/post/new", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body: INewPost = req.body;
        const post = new Post({
            title: body.title,
            description: body.description,
            isPublic: body.isPublic,
            assignments: []
        });
        for (const assignment of body.assignments) {
            const newAssignment = new Assignment({
                question: assignment.question,
                language: assignment.language,
                codeTemplate: assignment.codeTemplate,
            });
            await newAssignment.save();
            for (const testCase of assignment.testCases) {
                const newTestCase = new TestCase({
                    stdin: testCase.stdin,
                    stdout: testCase.stdout,
                    inject: testCase.inject,
                });
                await newTestCase.save();
                newAssignment.testCases.push(newTestCase._id);
            }
            await newAssignment.save();
            post.assignments.push(newAssignment._id);
        }
        const savedPost = await post.save();
        res.status(200).json(savedPost)
    } catch (error) {
        next(error)
    }

})

app.all("*", (req: Request, res:Response, next: NextFunction) => {
    next(new ExpressError("Page not found", 404))
})

app.use((err: ExpressError, req: Request, res: Response, next: NextFunction) => {
    const { status = 404 } = err
    if (!err.message) err.message = "!Oh No something went wrong"
    res.status(status).send( err )
})

app.listen(3000, () => {
    console.log("Server started on port 3000");
    }
)
