export interface Test_Case {
    _id?: string;
    replace: {
        from: string;
        to: string;
    }[];
    stdin: string;
    stdout: string;
    isHidden: boolean;
    configuration: {
        time_limit: number;
        memory_limit: number;
    }
}

export interface Assignment {
    _id?: string;
    question: string;
    code_template: string;
    language: string;
    test_cases: Test_Case[];
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

export interface IJWT_decode{
    at_hash: string;
    aud: string;
    azp: string;
    email: string;
    email_verified: boolean;
    exp: number;
    family_name: string;
    given_name: string;
    iat: number;
    iss: string;
    locale: string;
    name: string;
    picture: string;
    sub: string;
}

export interface IPosts_Requst_Params {
    page?: number;
    limit?: number;
    stars?: string;
    publishDate?: string;
    search?: string;
}

export interface ICode_Execution_Body {
    code: string;
    language: string;
}

export interface IAssignment_Code_Execution extends ICode_Execution_Body {
    assingment_index: number;
}

export interface IAssignment_Code_Submission extends IAssignment_Code_Execution {
    assignment_id: string;
}

export interface ISubmission_Result {
    stderr: string;
    stdout: string;
    result: boolean;
    replace: {
        from: string;
        to: string;
    }[];
    test_case_input: string;
    test_case_output: string;
    test_case_index?: number;
    assignment_index?: number;
}
