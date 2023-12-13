import { connectDB } from "@/util/database"
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
){
    if (req.method == 'POST'){
        try {
            const db = (await connectDB).db("forum")
            let result = await db.collection('member').insertOne(req.body);
            if (result.acknowledged === true && result.insertedId){
                return res.status(200).json({ result : "success" })
            }
            return res.status(500).json({ result : "false", reason: "insert fail" })
        } catch (error) {
            return res.status(500).json({ result : "false", reason: "db error" })
        }
    }
}