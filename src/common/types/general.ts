export type Dictionary = {
    [key: string]: string | number | Dictionary;
};

export type SuccessfulResponse = {
    ok: boolean;
};

export type AxiosResponse<T> = {
    status: number;
    data: T;
};

export type HttpRequestResult = {
    ok: boolean;
    message?: string;
    data?: Dictionary;
};
