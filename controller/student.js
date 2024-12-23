

const db=require('../config/db');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const crypto = require("crypto");
const mailSender = require("../util/mailsender");


exports.signup=async(req,res)=>{
    try{
     const{first_name,last_name,email,password}=req.body;
        const user=await db.query('SELECT * FROM AUTH_TABLE WHERE email=?',[email]);
        if(user.rows.length>0){
            return res.status(401).json({
                success:false,
                message:"user already exists",
            });
        }
        const hashpassword=await bcrypt.hash(password,10);
        const newUser=await db.query('INSERT INTO AUTH_TABLE(first_name,last_name,email,password) VALUES(?,?,?,?)',[
            first_name,
            last_name,
            email,
            hashpassword,
        ]);
        return res.status(201).json({
          
            success:true,
            message:"user created successfully",
            
            newUser:{
                id:newUser.insertId,
                first_name:first_name,
                last_name:last_name,
                email:email,
                password:hashpassword,
            },
        });
        
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"user not created",
        });
        
    }
}


exports.login=async(req,res)=>{
try{
const{email,password}=req.body;
const user =await db.query('SELECT  * FROM AUTH_TABLE WHERE email=?',[email]);
if(user.rows.length===0){
    return res.status(401).json({
        success:false,
        message:"user not found",
    });


}
const users=user.rows[0];
//check if the password is matches or not

const passwordMatch=await bcrypt.compare(password,users.password);
if(!passwordMatch){
    return res.status(401).json({
        success:false,
        message:"password not match",
    });


}

const payload={
   id:users.id,
   email:users.email,
    
};
//genereate a token

const token=jwt.sign(payload,process.env.JWT_SECRET,
    {
    expiresIn:"2h",
}
);

const options={
    expires:new Date(Date.now()+3*24*60*60*1000),
    httpOnly:true,
};
res.cookie("token",token,options).status(200).json({
    success:true,
    message:"user logged in successfully",
    token:token,
    users:{
        id:users.id,
        first_name:users.first_name,
        last_name:users.last_name,
        email:users.email,
        
    },
    message:"user logged in successfully",
});
}
catch(error){
    return res.status(500).json({
        success:false,
        message:"user not logged in",
    });
}
}





exports.resetPasswordToken = async (req, res) => {
  try {
    // Get email from request body
    const { email } = req.body;

    // Check if the user exists in the database
    const [user] = await db.query("SELECT * FROM AUTH_TABLE WHERE email = ?", [email]);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Your email is not registered",
      });
    }

    // Generate a reset token
    const token = crypto.randomUUID();

    // Update user with the token and expiration time
    const expirationTime = Date.now() + 5 * 60 * 1000; // 5 minutes
    await db.query(
      "UPDATE AUTH_TABLE SET reset_token = ?, reset_token_expires = ? WHERE email = ?",
      [token, expirationTime, email]
    );

    // Create the reset URL
    const url = `http://localhost:3000/update-password/${token}`;

    // Send email containing the URL
    await mailSender(
      email,
      "Password Reset Link",
      `Password reset link: ${url}`
    );

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    // Get data from request body
    const { password, confirmPassword, token } = req.body;

    // Validate passwords
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match! Try again.",
      });
    }

    // Fetch user details using the reset token
    const [user] = await db.query(
      "SELECT * FROM AUTH_TABLE WHERE reset_token = ?",
      [token]
    );

    // Check if the token is valid
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid token",
      });
    }

    // Check if the token has expired
    if (user.reset_token_expires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Token expired",
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password and clear the reset token
    await db.query(
      "UPDATE AUTH_TABLE SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE reset_token = ?",
      [hashedPassword, token]
    );

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Reset failed! Please try again.",
    });
  }
};
