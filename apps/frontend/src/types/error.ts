export interface ApiError {
    status: number
    statusCode: number
    message: string[]
    error: string
}

export interface AuthApiError {
    code: number
    message: string
}

export type AppError = ApiError | AuthApiError
