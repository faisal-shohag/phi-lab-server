
import { Role, Status } from "../../../generated/prisma/enums"
export interface User  {
    id: string
    name: string
    password: string
    email: string
    role: Role
    status: Status
}

