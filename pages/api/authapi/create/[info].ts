import type { NextApiRequest, NextApiResponse } from 'next'
import { connectDB } from "@/util/database"
import { member } from "@/app/_types/member"

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
){
    console.log('여기타니??????')
    const type = Array.isArray(req.query.info) ? req.query.info[0] : req.query.info;
    console.log(type)
    let result : member | null = null

    if(type){
        const value = JSON.parse(type)
        const db = (await connectDB).db("forum")
        
        let query = { email : value.info };
        console.log(query)
        result = await db.collection('member').findOne<member>(query)
       
    }

    console.log("====>")
    console.log(result)

    return res.status(200).json(result)

}