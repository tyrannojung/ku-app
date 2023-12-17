import { connectDB } from "@/util/database"
import { ObjectId } from "mongodb";
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
){
    console.log('타는거확인')
    console.log(req.body.tx)
    console.log(req.body.txhash)
    if (req.method == 'POST'){
        try {
            const filter = { _id: new ObjectId(req.body._id) }; 
            const db = (await connectDB).db("forum")
            
            let result = await db.collection('post').updateOne(filter
                , {$set : {tx: req.body.tx, txhash:req.body.txhash}});
                console.log(result);
                return res.status(200).json({ result : "success" })
        } catch (error) {
            return res.status(500).json({ result : "false", reason: "db error" })
        }

    }

}