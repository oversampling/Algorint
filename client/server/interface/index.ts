export interface INewPost {
    title: string,
    description: string,
    isPublic: boolean,
    assignments: [
        {
            _id?: string,
            question: string,
            language: string,
            code_template: string,
            test_cases: [
                {
                    _id?: string,
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

export interface IGoogle_Auth {
    access_token: string,
    refresh_token: string,
    scope: string,
    token_type: string,
    id_token: string,
    expiry_date: number,
}

export interface IJWT_decoded {
    iss: string,
    azp: string,
    aud: string,
    sub: string,
    email: string,
    email_verified: boolean,
    at_hash: string,
    name: string,
    picture: string,
    given_name: string,
    family_name: string,
    locale: string,
    iat: number,
    exp: number,
}

export interface IPost_Update_Body extends INewPost {
    _id: string;
}
