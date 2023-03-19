require('dotenv').config()
import express, {Express, NextFunction, Request, Response} from 'express';
import cors from 'cors';
import path from 'path';
import mongoose from 'mongoose';
import Post from './model/post';
import Assignment from './model/assignment';
import TestCase from './model/test_case';
import ExpressError from './utils/ExpressError';
import { IJWT_decoded, INewPost, IRequestQuery_Posts } from './interface';
import { Credentials, OAuth2Client, UserRefreshClient } from 'google-auth-library';
import cookieParser from 'cookie-parser';
import jwt_decode from "jwt-decode";
import User from './model/user';

const oAuth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'postmessage',
  );

const app: Express = express();
mongoose.connect('mongodb://127.0.0.1:27017/algorint')
  .then(() => console.log('Mongodb Connected'));

app.use(cors({origin: "http://localhost:5173", credentials: true}))
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))
process.env.ENV === "production" && app.use(express.static(path.join(__dirname, '../../dist')));

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
    process.env.ENV === "production" && res.sendFile(path.join(__dirname, './index.html'));
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

app.post('/auth/google/refresh-token', async (req, res) => {
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
        res.json(credentials);
    }
    return res.status(403).json({message: "Unauthorized"})
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
                res.status(200).json(posts)
        }else{
            const posts = await Post.find({isPublic: true}).populate("assignments").populate({
                path: "assignments",
                populate: {
                    path: "test_cases"
                }
            }).sort({stars: options.sort.stars === "ASC" ? 1 : -1})
            .sort({publishDate: options.sort.publishDate === "ASC" ? 1 : -1})
            .limit(options.limit).skip((options.page - 1) * options.limit)
            res.status(200).json(posts)
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
                        inject: test_case.inject,
                    });
                    await newTestCase.save();
                    newAssignment.test_cases.push(newTestCase._id);
                }
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
    console.log(err)
    res.status(status).send( err )
})

app.listen(3000, () => {
    console.log("Server started on port 3000");
    }
)
