export interface INewPost {
    title: string,
    description: string,
    isPublic: boolean,
    assignments: [
        {
            question: string,
            language: string,
            codeTemplate: string,
            testCases: [
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
