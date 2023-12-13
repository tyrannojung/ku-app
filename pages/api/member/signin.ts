import { connectDB } from "@/util/database"
import type { NextApiRequest, NextApiResponse } from 'next'
import { member } from "@/app/_types/member"

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
){
    if (req.method == 'POST'){
        try {
            console.log('여기타니??signin')
            const db = (await connectDB).db("forum")
            let result : member | null = await db.collection('member').findOne<member>(req.body)
            if(result){
                return res.status(200).json({ result : true, value: result })
            } 
            return res.status(500).json({ result : false, reason: "login fail" })
        } catch (error) {
            return res.status(500).json({ result : false, reason: "db error" })
        }
    }
}