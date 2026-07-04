import { prisma } from "../config/prismaConfig.js"
import bcrypt from "bcrypt"

export const register = async (data, res) => {
    console.log(`Data received: ${data.name}, ${data.email}`)
    if (!data.name) {
        return res.status(400).json({
            success: false,
            message: "Name is required"

        })
    }

    const user = await prisma.user.findFirst(
        {
            where: {
                email: data.email
            }
        })

    if (user) {
        return res.status(409).json({
            success: false,
            message: "User already exists"
        })
    }

    const hashPassword = await bcrypt.hash(data.password, 12)

    await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: hashPassword
        }
    })

    return res.status(200).json({
        success: true,
        message: "User registered successfully"
    })

}


export const login = async (data, res) => {

    const user = await prisma.user.findFirst({
        where: {
            email: data.email
        }
    })
    
    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        })
    }
    
    const isPasswordValid = await bcrypt.compare(data.password, user.password)
    
    if (!isPasswordValid) {
        return res.status(401).json({
            success: false,
            message: "Invalid password"
        })
    }
    
    return res.status(200).json({

        success: true,
        message: "Login successful",
        user: {
            id: user.id,
            name: user.name,
            email: user.email
        }
    })

}