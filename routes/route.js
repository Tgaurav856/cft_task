const express=require("express");



const router=express.Router();

const{signup,login,resetPassword}=require('../controller/student');

router.post('/signup',signup);
router.post('/login',login);
router.post('/resetPassword',resetPassword);



module.exports=router;