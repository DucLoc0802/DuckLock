export interface LoginRequest {
    username: string,
    password: string
}

export interface UserEntity {
    id: string,
    username: string,
    password: string,
    status: 'ACTIVE' | 'INACTIVE'
}

