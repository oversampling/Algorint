require('dotenv').config()
import express, {Express, NextFunction, Request, Response} from 'express';
import cors from 'cors';
import path from 'path';
import mongoose from 'mongoose';
import Post from './model/post';
import Assignment, { IAssignment } from './model/assignment';
import TestCase from './model/test_case';
import ExpressError from './utils/ExpressError';
import { IJWT_decoded, INewPost, IPost_Update_Body, IRequestQuery_Posts } from './interface';
import { Credentials, OAuth2Client, UserRefreshClient } from 'google-auth-library';
import cookieParser from 'cookie-parser';
import jwt_decode from "jwt-decode";
import User from './model/user';
import axios from 'axios';

const oAuth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'postmessage',
  );

const app: Express = express();
let mongo_uri = ""
if (!process.env.MONGO_USER) {
    mongo_uri = process.env.MONGO_URI || "mongodb://localhost:27017/algorint"
    mongoose.connect(mongo_uri).then(() => console.log('Mongodb Connected'));
}else{
    mongo_uri = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_URI}:27017/algorint`
    mongoose.connect(mongo_uri, {
        ssl: true,
        retryWrites: false,
        replicaSet: 'rs0',
        readPreference: 'secondaryPreferred',
        sslValidate: true,
        sslCA: `./rds-combined-ca-bundle.pem`
    }).then(() => console.log('Mongodb Connected'));
}


app.use(cors({origin: ["http://localhost:5173", "https://www.chanjinyee.online"], credentials: true}))
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))
process.env.ENV === "production" && app.use(express.static(path.join(__dirname, '../../dist')));
const ROUTER_URL = process.env.ROUTER_URL || "http://localhost:80"
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
async function verify(token: string): Promise<Boolean> {
    try{
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        return true
    }
    catch (err){
        return false
    }
}

const isLoggedIn = async function (req: Request, res: Response, next: NextFunction) {
    const token = req.cookies.token;
    if (!token) return res.status(403).json({message: "Unauthorized"})
    const isValid = await verify(token);
    if (!isValid) return res.status(403).json({message: "Unauthorized"})
    next();
}

app.get("/", (req: Request, res: Response) => {
    if (process.env.ENV === "production") return res.sendFile(path.join(__dirname, '../../dist/index.html'))
    res.json({message: "Hello World"})
})

app.post('/auth/google', async (req, res) => {
    const { tokens } : {tokens: Credentials} = await oAuth2Client.getToken(req.body.code); // exchange code for tokens
    res.cookie('token', tokens.id_token, { httpOnly: true, secure: true, maxAge: 24 * 60 * 60 * 1000, sameSite: "none" })
    const id_token = tokens.id_token;
    if (id_token){
        const decoded_jwt: IJWT_decoded = jwt_decode(id_token);
        // Find user in database
        const user = await User.findOne({googleId: decoded_jwt.sub});
        if (user){
            tokens.refresh_token && (user.refresh_token = tokens.refresh_token);
            await user.save();
            return res.json({"tokens": id_token});
        } else {
            const newUser = new User({
                googleId: decoded_jwt.sub,
                refresh_token: tokens.refresh_token,
            })
            await newUser.save();
            return res.json({"tokens": id_token});
        }
    }else{
        return res.status(403).json({message: "Unauthorized"})
    }
  });

app.get('/auth/google/refresh-token', async (req, res) => {
    const cookies = req.cookies;
    if (!cookies.token) return res.status(403).json({message: "Unauthorized"})
    const token = cookies.token;
    res.clearCookie('token', { httpOnly: true, secure: true, sameSite: "none" })
    const decoded_jwt: IJWT_decoded = jwt_decode(token);
    const found_user = await User.findOne({googleId: decoded_jwt.sub});
    if (found_user){
        const user = new UserRefreshClient(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            found_user.refresh_token
        );
        const { credentials } = await user.refreshAccessToken(); // optain new tokens
        console.log(credentials)
        res.cookie('token', credentials.id_token, { httpOnly: true, secure: true, maxAge: 24 * 60 * 60 * 1000, sameSite: "none" })
        return res.json({"tokens": credentials.id_token});
    }
    return res.status(403).json({message: "Unauthorized"})
})

app.get("/auth/logout", async (req: Request, res: Response) => {
    const cookies = req.cookies
    if (!cookies.token) return res.status(403).json({message: "Unauthorized"})
    const token = cookies.token;
    if (token){
        const decoded_jwt: IJWT_decoded = jwt_decode(token);
        // Find user in database
        const user = await User.findOne({googleId: decoded_jwt.sub});
        if (user){
            user.refresh_token = "";
            const result = await user.save();
        }
    }

    res.clearCookie('token', { httpOnly: true, secure: true, sameSite: "none" })
    return res.status(200).json({message: "Logout successful"})
})

app.get("/api/posts", isLoggedIn ,async (req: Request<{}, {}, IRequestQuery_Posts>, res: Response, next: NextFunction) => {
    const {query} = req;
    const {page, limit, stars, publishDate, search} = query;
    const options = {
        page: Number(page)|| 1,
        limit: Number(limit) || 10,
        sort: {
            stars: stars || "DESC",
            publishDate: publishDate || "DESC"
        },
        search: search || ""
    }
    try {
        if (options.page < 1) throw new ExpressError("Page number must be greater than 0", 400)
        if (options.limit < 1) throw new ExpressError("Limit must be greater than 0", 400)
        if (options.search && options.search !== ""){
            const posts = await Post.find({$text: {$search: options.search.toString()}, isPublic: true}).populate("assignments").populate({
                path: "assignments",
                populate: {
                    path: "test_cases"
                }}).sort({stars: options.sort.stars === "ASC" ? 1 : -1})
                .sort({publishDate: options.sort.publishDate === "ASC" ? 1 : -1})
                .limit(options.limit).skip((options.page - 1) * options.limit)
            return res.status(200).json(posts)
        }else{
            const posts = await Post.find({isPublic: true}).populate("assignments").populate({
                path: "assignments",
                populate: {
                    path: "test_cases"
                }
            }).sort({stars: options.sort.stars === "ASC" ? 1 : -1})
            .sort({publishDate: options.sort.publishDate === "ASC" ? 1 : -1})
            .limit(options.limit).skip((options.page - 1) * options.limit)
            return res.status(200).json(posts)
        }
    } catch (error) {
        next(error)
    }
})

app.get("/api/posts/:id", isLoggedIn ,async (req: Request, res: Response, next: NextFunction) => {
    try {
        const post = await Post.findById(req.params.id).populate({
            path: "assignments",
            populate: {
                path: "test_cases"
            }
        });
        res.status(200).json(post)
    }catch (error) {
        res.status(404).json({message: "Post not found"})
    }
})

app.post("/api/posts/new", isLoggedIn, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies.token;
        if (token){
            const decoded_jwt: IJWT_decoded = jwt_decode(token);
            // Find user in database
            const user = await User.findOne({googleId: decoded_jwt.sub}).populate("posts");
            if (!user){
                throw new ExpressError("User not found", 404)
            }
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
                    language: assignment.language || "python",
                    code_template: assignment.code_template,
                });
                await newAssignment.save();
                if (assignment.test_cases){
                    for (const test_case of assignment.test_cases) {
                        const newTestCase = new TestCase({
                            stdin: test_case.stdin,
                            stdout: test_case.stdout,
                            replace: test_case.replace ? test_case.replace : [{from: "", to: ""}],
                            isHidden: test_case.isHidden,
                            configuration: test_case.configuration ? test_case.configuration : {time_limit: 2, memory_limit: 200}
                        });
                        await newTestCase.save();
                        newAssignment.test_cases.push(newTestCase._id);
                    }
                }
                await newAssignment.save();
                post.assignments.push(newAssignment._id);
            }
            const savedPost = await post.save();
            user.posts.push(savedPost._id);
            await user.save();
            res.status(200).json(savedPost)
        }
    } catch (error) {
        next(error)
    }

})

app.post("/api/posts/assignment/execute", isLoggedIn, async (req: Request, res: Response, next: NextFunction) => {
    const {code, language, assignment_id} = req.body;
    const assignment = await Assignment.findById(assignment_id).populate("test_cases");
    if (assignment){
        const test_cases = assignment.test_cases.filter((test_case: any) => test_case.isHidden === true);
        if (test_cases.length === 0){
            return res.status(300).json({message: "No sample test cases being set"})
        }else{
            const response = await axios.post(`${ROUTER_URL}/make_submission`, {
                code,
                language,
                test_cases: test_cases.map((test_case: any) => test_case.stdout),
                input: test_cases.map((test_case: any) => test_case.stdin),
                replace: test_cases.map((test_case: any) => test_case.replace),
                configuration: test_cases.map((test_case: any) => test_case.configuration ? test_case.configuration : {time_limit: 2, memory_limit: 200})
            })
            return res.json({submission_token: response.data})
        }
    }else {
        throw new ExpressError("Assignment not found", 404)
    }
})

app.get("/api/posts/assignment/fetch_result/:submission_token", isLoggedIn,  async (req: Request, res: Response, next: NextFunction) => {
    const { submission_token } = req.params
    const response = await axios.get(`${ROUTER_URL}/retrieve_submission/${submission_token}`)
    res.json(response.data)
})

app.post("/api/posts/assignment/submit", isLoggedIn, async (req: Request, res: Response, next: NextFunction) => {
    const {code, language, assignment_id} = req.body;
    const assignment: IAssignment | null = await Assignment.findById(assignment_id).populate("test_cases")
    if (!assignment) return res.status(404).json({message: "Assignment not found"})
    const stdin: string[] = assignment.test_cases.map((test_case: any)=> test_case.stdin)
    const stdout: string[] = assignment.test_cases.map((test_case: any)=> test_case.stdout)
    const replace: {from: string, to: string}[][] = assignment.test_cases.map((test_case: any)=> test_case.replace)
    const configuration = assignment.test_cases.map((test_case: any)=> test_case.configuration ? test_case.configuration : {time_limit: 2, memory_limit: 200})
    const response = await axios.post(`${ROUTER_URL}/make_submission`, {
        code,
        language,
        test_cases: stdout,
        input: stdin,
        replace: replace,
        configuration: configuration
    })
    return res.json({submission_token: response.data})
})

app.get("/api/acccount/posts", isLoggedIn, async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.token;
    if (token){
        const decoded_jwt: IJWT_decoded = jwt_decode(token);
        // Find user in database
        const user = await User.findOne({googleId: decoded_jwt.sub}).populate("posts");
        if (user){
            return res.status(200).json(user.posts)
        }
    }
    return res.status(400).json({message: "User not found"})
})

app.delete("/api/posts", isLoggedIn, async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.token;
    if (token){
        const decoded_jwt: IJWT_decoded = jwt_decode(token);
        // Find user in database
        const user = await User.findOne({googleId: decoded_jwt.sub});
        if (user){
            const userPosts = user.posts;
            if (userPosts.includes(req.body.post_id)){
                user.posts.splice(userPosts.indexOf(req.body.post_id), 1)
                await user.save();
            }
            // Delete Test Case and Assignment inside Post
            const post = await Post.findById(req.body.post_id).populate("assignments");
            if (post){
                for (const assignment of post.assignments){
                    const foundAssignment = await Assignment.findById(assignment._id).populate("test_cases");
                    if (foundAssignment){
                        for (const test_case of foundAssignment.test_cases){
                            await TestCase.findByIdAndDelete(test_case._id);
                        }
                        await Assignment.findByIdAndDelete(foundAssignment._id);
                    }
                }
                await Post.findByIdAndDelete(post._id);
            }
        }else {
            return res.status(400).json({message: "User not found"})
        }
    }
    return res.status(200).json({message: "Post deleted"})
})

app.put("/api/posts", isLoggedIn, async (req: Request<{}, {}, IPost_Update_Body>, res: Response, next: NextFunction) => {
    const token = req.cookies.token;
    const postBody: IPost_Update_Body = req.body;
    if (token){
        const decoded_jwt: IJWT_decoded = jwt_decode(token);
        // Find user in database
        const user = await User.findOne({googleId: decoded_jwt.sub});
        if (user){
            const userPosts = user.posts;
            if (userPosts.includes(new mongoose.Types.ObjectId(postBody._id))){
                const post = await Post.findById(postBody._id)
                // Update Post
                if (post){
                    post.title = postBody.title;
                    post.description = postBody.description;
                    post.isPublic = postBody.isPublic;
                    await post.save();
                    // Update Post Assignment
                    for (const assignment of postBody.assignments) {
                        if (assignment._id){
                            const assingmentToUpdate = await Assignment.findById(assignment._id)
                            if (assingmentToUpdate){
                                assingmentToUpdate.question = assignment.question;
                                assingmentToUpdate.language = assignment.language || "python";
                                assingmentToUpdate.code_template = assignment.code_template;
                                await assingmentToUpdate.save();
                                // Update Post Assignment Test Cases
                                for (const test_case of assignment.test_cases) {
                                    const testCaseToUpdate = await TestCase.findById(test_case._id)
                                    if (testCaseToUpdate){
                                        testCaseToUpdate.stdin = test_case.stdin;
                                        testCaseToUpdate.stdout = test_case.stdout;
                                        testCaseToUpdate.replace = test_case.replace || [{from: "", to: ""}];
                                        testCaseToUpdate.isHidden = test_case.isHidden;
                                        testCaseToUpdate.configuration = test_case.configuration ? test_case.configuration : {time_limit: 2, memory_limit: 200};
                                        await testCaseToUpdate.save();
                                    }else{
                                        const newTestCase = new TestCase({
                                            stdin: test_case.stdin,
                                            stdout: test_case.stdout,
                                            replace: test_case.replace || [{from: "", to: ""}],
                                            isHidden: test_case.isHidden,
                                            configuration: test_case.configuration ? test_case.configuration : {time_limit: 2, memory_limit: 200}
                                        });
                                        await newTestCase.save();
                                        assingmentToUpdate.test_cases.push(newTestCase._id);
                                        await assingmentToUpdate.save();
                                    }
                                }
                            }
                        }else{
                            const newAssignment = new Assignment({
                                question: assignment.question,
                                language: assignment.language || "python",
                                code_template: assignment.code_template,
                            });
                            await newAssignment.save();
                            post.assignments.push(newAssignment._id);
                            await post.save();
                            // Update Post Assignment Test Cases
                            for (const test_case of assignment.test_cases) {
                                if (test_case._id){
                                    const testCaseToUpdate = await TestCase.findById(test_case._id)
                                    if (testCaseToUpdate){
                                        testCaseToUpdate.stdin = test_case.stdin;
                                        testCaseToUpdate.stdout = test_case.stdout;
                                        testCaseToUpdate.replace = test_case.replace;
                                        testCaseToUpdate.isHidden = test_case.isHidden;
                                        testCaseToUpdate.configuration = test_case.configuration ? test_case.configuration : {time_limit: 2, memory_limit: 200};
                                        await testCaseToUpdate.save();
                                    }
                                }else{
                                    const newTestCase = new TestCase({
                                        stdin: test_case.stdin,
                                        stdout: test_case.stdout,
                                        replace: test_case.replace ? test_case.replace : [{from: "", to: ""}],
                                        isHidden: test_case.isHidden,
                                        configuration: test_case.configuration ? test_case.configuration : {time_limit: 2, memory_limit: 200}
                                    });
                                    await newTestCase.save();
                                    newAssignment.test_cases.push(newTestCase._id);
                                    await newAssignment.save();
                                }
                            }
                        }
                    }
                }
            }
        }else {
            return res.status(400).json({id: "User not found"})
        }
    }
    return res.status(200).json({_id: postBody._id})
})

function timeout(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

app.post("/api/assignment/evaluate", async (req: Request<{}, {}, {}>, res: Response, next: NextFunction) => {
    const post: any = await Post.findOne({title: "Python Test"}).populate({
        path: "assignments",
        populate: {
            path: "test_cases"
        }
    })
    if (post){
        const assignment = post.assignments[0];
        const code: string = post.assignments[0].code_template;
        const language: string = post.assignments[0].language;
        const stdin: string[] = assignment.test_cases.map((test_case: any)=> test_case.stdin)
        const stdout: string[] = assignment.test_cases.map((test_case: any)=> test_case.stdout)
        const replace: {from: string, to: string}[][] = assignment.test_cases.map((test_case: any)=> test_case.replace)
        const configuration = assignment.test_cases.map((test_case: any)=> test_case.configuration ? test_case.configuration : {time_limit: 2, memory_limit: 200})
        const response = await axios.post(`${ROUTER_URL}/make_submission`, {
            code,
            language,
            test_cases: stdout,
            input: stdin,
            replace: replace,
            configuration: configuration
        })
        if (response.status === 200){
            const submission_token = response.data
            let submission_response = await axios.get(`${ROUTER_URL}/retrieve_submission/${submission_token}`)
            let count = 0;
            let status = submission_response.data.status;
            while (status != "done execution"){
              if (count > 20){
                return res.status(400).json({message: "Execution Time Exceeded, execution time limit is 20 seconds"})
              }
              await timeout(1000);
              submission_response = await axios.get(`${ROUTER_URL}/retrieve_submission/${submission_token}`)
              status = submission_response.data.status;
              count++;
            }
            return res.status(200).json(submission_response.data)
        }
        return res.status(400).json({message: "Execution Time Exceeded, execution time limit is 20 seconds"})
    }
    return res.status(400).json({message: "Post not found"})
})

app.all("*", (req: Request, res:Response, next: NextFunction) => {
    return res.redirect("/")
})

app.use((err: ExpressError, req: Request, res: Response, next: NextFunction) => {
    const { status = 404 } = err
    if (!err.message) err.message = "!Oh No something went wrong"
    console.log(err)
    res.status(status).send( err )
})

app.listen(3000, () => {
    console.log("Server started on port 3000");
    }
)
