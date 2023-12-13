import type { NextApiRequest, NextApiResponse } from 'next'
import { connectDB } from "@/util/database"
import { member } from "@/app/_types/member"

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
){
    const type = Array.isArray(req.query.info) ? req.query.info[0] : req.query.info;
    let result : member | null = null

    if(type){
        const value = JSON.parse(type)
        const db = (await connectDB).db("forum")
        
        let query = { email : value.info };
        result = await db.collection('member').findOne<member>(query)
       
    }

    return res.status(200).json(result)

}