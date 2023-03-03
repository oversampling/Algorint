import express, {Express, Request, Response} from 'express';
const app: Express = express();

app.get("/", (req: Request, res: Response) => {
    res.send("Hello World 1");
})

app.listen(3000, () => {
    console.log("Server started on port 3000");
    }
)
