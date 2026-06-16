import express from "express";
import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config({path:".env.local"});

const app=express();
app.use(express.json());

const PORT=process.env.PORT;

const redis=new Redis(process.env.REDIS_URL);

const postLeaderboardKey = "posts:top-views";
app.post("/post/:id/view",async(req,res)=>{
    const postId=req.params.id;
    const newcount=await redis.zincrby(postLeaderboardKey,1,postId)
    return res.json({message:newcount});
})

const gameleaderboardkey="game:top-scores";
app.post("/leaderboard/score",async(req,res)=>{
    const payload={
        userid:req.body.userid,
        score:req.body.score
    }
    const newscore=await redis.zincrby(gameleaderboardkey,payload.score,payload.userid);
    return res.json({newScore:newscore});
})

app.get("/leaderboard",async(req,res)=>{
    const rawresult=await redis.zrevrange(gameleaderboardkey,0,1,"WITHSCORES");
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
    const userRank=await redis.zrevrank(gameleaderboardkey,userid);
    return res.json({userRank:userRank});
})

app.listen(PORT,()=>{
    console.log("app is running on port",PORT);
})