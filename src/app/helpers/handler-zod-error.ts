import { TErrorSources, TGenericErrorResponse } from "../interfaces/error.types"

export const handlerZodError = (err: any): TGenericErrorResponse => {
    const errorSources: TErrorSources[] = JSON.parse(err).map(e=> e.message)
    return {
        statusCode: 400,
        message: "Zod Error",
        errorSources

    }
}