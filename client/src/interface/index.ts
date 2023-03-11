export interface Test_Case {
    replace: {
        from: string;
        to: string;
    };
    stdin: string;
    stdout: string;
}

export interface Assignment {
    question: string;
    code_template: string;
    language: string;
    test_cases: [Test_Case];
}

export interface Post {
    _id?: string;
    title: string;
    description: string;
    isPublic: boolean;
    publishDate? : Date;
    stars?: number;
    assignments: Assignment[];
}