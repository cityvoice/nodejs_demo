const express = require("express");
const router = express.Router();
const ObjectId=require('mongodb').ObjectId;

const formatDate = (input, format)=>{  
  let output = '';
  let patterns = {   
    'M+' : input.getMonth()+1,                 //月份   
    'd+' : input.getDate(),                    //日   
    'h+' : input.getHours(),                   //小时   
    'm+' : input.getMinutes(),                 //分   
    's+' : input.getSeconds(),                 //秒    
    'S'  : input.getMilliseconds()             //毫秒   
  };
  if(/(y+)/.test(format)){
    format = format.replace(RegExp.$1, (input.getFullYear()+'').substr(4 - RegExp.$1.length));
  } 
  for(let item in patterns){
    if(new RegExp('('+ item +')').test(format)){
      format = format.replace(RegExp.$1, RegExp.$1.length==1 ? patterns[item] : ('00'+ patterns[item]).substr((''+patterns[item]).length));
    }
  }
  return format; 
}

async function createSerialNoSync(db, field){
  const serialNo=await db.collection('SerialNo_Table').findOne({[field]:{$exists:true}});
  var value;
  if(serialNo){
    value=serialNo[field]+1;
    await db.collection('SerialNo_Table').updateOne({[field]:{$exists:true}},{$set:{[field]:value}});
  }else{
    value=1;
    await db.collection('SerialNo_Table').insertOne({[field]:value});
  }
  
  return String(value).padStart(10, "0")
}


//user list
router.get('/user', (req, res)=>{
  const db=req.db;
  db.collection('User_Table').aggregate([
  {$sort:{'create_date':1}},{$project:{
    "_id":0,
    "username":1,
    "email":1,
    "birthday":1,
    "userid":1
  }}]).toArray((err, docs)=>{
    res.json({'errcode':0, 'errmsg':'', data:docs||[]})
  });
})

//new user
router.post('/user',(req, res)=>{
  const db=req.db;
  var username=req.body.username;
  var email=req.body.email;
  var birthday=req.body.birthday;
  if(username!=''&&email!=''&&birthday!=''){
     db.collection('User_Table').findOne({username}, async (err, doc)=>{
      if(err){
        res.json({'errcode':1,'errmsg':'server error!'})
        return;
      }
      if(doc){
        res.json({'errcode':1,'errmsg':'username already exists!'})
      }else{
        let create_date = formatDate(new Date(), 'yyyy/dd/MM hh:mm:ss');
        let userid = await createSerialNoSync(db, 'userid');
        birthday=birthday.replace(/-/g,'/');
        db.collection('User_Table').insertOne({username, userid, email, birthday, create_date},(err, doc)=>{
          res.json({'errcode':0,'errmsg':'', data:{
            userid,
            username,
            email,
            birthday
          }})
        }) 
      }
    })
  }else{
    res.json({'errcode':1,'errmsg':'username,email,birthday should not be empty!'})
  }
})

//modify user
router.put('/user/:username', (req, res)=>{
  const db=req.db;
  var username=req.params.username;
  var email=req.body.email;
  var birthday=req.body.birthday;
  if(username!=''&&email!=''&&birthday!=''){
    db.collection('User_Table').findOne({username}, (err, doc)=>{
      if(err){
        res.json({'errcode':1,'errmsg':'server error!'})
        return;
      }
      if(doc){
        let modify_date = formatDate(new Date(), 'yyyy/dd/MM hh:mm:ss');
        birthday=birthday.replace(/-/g,'/');
        db.collection('User_Table').updateOne({username},{$set:{email,birthday,modify_date}},(err, doc)=>{
          res.json({'errcode':0,'errmsg':''})
        })
      }else{
        res.json({'errcode':1,'errmsg':'username does not exist!'})   
      }
    })
  }else{
    res.json({'errcode':1,'errmsg':'username,email,birthday should not be empty!'})
  }
})

//delete user
router.delete('/user/:username', (req, res)=>{
  const db=req.db;
  var username=req.params.username;
  if(username!=''){
    db.collection('User_Table').findOne({username}, (err, doc)=>{
      if(err){
        res.json({'errcode':1,'errmsg':'server error!'})
        return;
      }
      if(doc){
        db.collection('User_Table').deleteOne({username},(err, doc)=>{
          res.json({'errcode':0,'errmsg':''})
        })
      }else{
        res.json({'errcode':1,'errmsg':'username does not exist!'})   
      }
    })
  }else{
    res.json({'errcode':1,'errmsg':'username should not be empty!'})
  }
})

module.exports = router;