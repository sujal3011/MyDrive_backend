const jwt = require('jsonwebtoken');
require('dotenv').config();
const secret_key=process.env.SECRET_KEY

const fetchUser=(req,res,next)=>{
    const token=req.header('auth-token')  
    if(!token){
        return res.status(401).json({error:"Enter a token to authenticate"})  
    }
    try{
        const data=jwt.verify(token,secret_key);
        // console.log("data:",data)  
        req.user=data.user;  
        next();   

    }catch{
        res.status(401).json({error:"Enter a valid token to authenticate"})  
    }
}

module.exports=fetchUser