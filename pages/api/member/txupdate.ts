import { connectDB } from "@/util/database"
import { ObjectId } from "mongodb";
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
){

    if (req.method == 'POST'){
        try {
            const filter = { _id: new ObjectId(req.body._id) }; 
            const db = (await connectDB).db("forum")
            let result = await db.collection('member').updateOne(filter
                , {$set : {txCheck: req.body.txCheck, txhash:req.body.txhash}});
            if(result.acknowledged == true && result.modifiedCount == 1){
                return res.status(200).json({ result : true })
            }
            return res.status(200).json({ result : false, reason: "update fail" })
        } catch (error) {
            return res.status(500).json({ result : false, reason: "db error" })
        }

    }

}