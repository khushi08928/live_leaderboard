import express from "express";
import Redis from "ioredis";

const app=express();
app.use(express.json());

const redis=new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

app.post("/post/:id/view",async(req,res)=>{
    const postId=req.params.id;
    const viewcount=req.body.viewcount;
    await redis.set(`post:${postId}:viewcount`,viewcount);
    const newcount=await redis.incr(`post:${postId}:viewcount`)
    return res.json({message:newcount});
})

const leaderboardkey="game:top-scores";
app.post("/leaderboard/score",async(req,res)=>{
    const payload={
        userid:req.body.userid,
        score:req.body.score
    }
    const newscore=await redis.zincrby(leaderboardkey,payload.score,payload.userid);
    return res.json({newScore:newscore});
})

app.get("/leaderboard",async(req,res)=>{
    const rawresult=await redis.zrevrange(leaderboardkey,0,1,"WITHSCORES");
    const formattedresult=[];
    for(let i=0;i<rawresult.length;i+=2){
        formattedresult.push({
            userId:rawresult[i],
            score:rawresult[i+1]
        })
    }
    return res.json({leaderboard:formattedresult});
})

app.get("/leaderboard/:userid/rank",async(req,res)=>{
    const userid=req.params.userid;
    const userRank=await redis.zrevrank(leaderboardkey,userid);
    return res.json({userRank:userRank});
})

app.listen(3000,()=>{
    console.log("app is running on port 3000");
})