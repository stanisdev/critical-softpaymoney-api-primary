export type Dictionary = {
    [key: string]: string | number | Dictionary;
};

export type SuccessfulResponse = {
    ok: boolean;
};
