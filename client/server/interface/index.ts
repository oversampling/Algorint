export interface INewPost {
    title: string,
    description: string,
    isPublic: boolean,
    assignments: [
        {
            question: string,
            language: string,
            code_template: string,
            test_cases: [
                {
                    stdin: string,
                    stdout: string,
                    inject: {
                        from: string,
                        to: string,
                    }
                }
            ]
        }
    ]
}

export interface IRequestQuery_Posts{
    page: number;
    limit: number;
    stars?: "ASC" | "DESC";
    publishDate?: "ASC" | "DESC";
    search?: string;
}
