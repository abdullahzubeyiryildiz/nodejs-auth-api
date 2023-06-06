const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Log = require('../models/Log');
const htmlspecialchars = require('htmlspecialchars');
const md5 = require("md5");
const mongoose = require("mongoose");
const parser = require('ua-parser-js');
const { v4: uuidv4 } = require('uuid');
const jwt = require("jsonwebtoken"); 
const crypto = require('crypto');
const sendMail = require("../utils/sendMail");
const moment = require("moment/moment");


const register = asyncHandler(async (req, res) => { 
    try {
        
        const { name, email, password } = req.body;
        
        const vEmail = await htmlspecialchars(email);
        const vPass = await htmlspecialchars(password);
        const vHashedPass = md5(vPass);
        
        const existingUser = await User.findOne({ eposta: vEmail });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "This e-mail is already registered!"
            });
        }
        
        const user = new User({
            ad:name,
            eposta:vEmail, 
            sifre:vHashedPass
        });
        
        await user.save();
        
        let token = jwt.sign({ user: user._id, iat: new Date().getTime() + 43200 }, "auth_api")
        
        return res.json({ status: 200, data: { user: user, token } })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to Create Record!"
        });
    }
});

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const vEmail = await htmlspecialchars(email);
    const vPass = await htmlspecialchars(password);
    const vHashedPass = md5(vPass);
    
    let user = await User.findOne({ eposta: vEmail, sifre: vHashedPass }).lean().exec();
    if (!user) {
        return res.status(404).json({ status: 404, message: 'user not found or user password error' });
    }
    
    const userId = user._id;
    if (user.forbidden === true) {
        return res.status(403).json({ status: 403, message: 'forbidden' });
    }
    
    const updatedUser = await User.updateOne({ _id: userId }, { $set: { cevrimici: true } }).lean().exec();
    if (!updatedUser || updatedUser.modifiedCount === 0) {
        return res.status(500).json({ status: 500, message: 'an error occurred when updating' });
    }
     
    await createLog(userId, '/user/login', req);
     
    let token = jwt.sign({ user: userId, iat: new Date().getTime() + 43200 }, "auth_api")
    
    return res.status(200).json({ status: 200, data: { user: user, token } });
});

const loginControl = asyncHandler(async (req, res) => {
    const { token } = req.body; 
    res.json({ status: 200, data: {token} });
});

 
 const createLog = asyncHandler(async (userId, url, req) => {
    const ua = parser(req.headers['user-agent']);
    const kind = "request";
    const method = req.method;
    const uniqid = uuidv4();
    const ip = req.socket.remoteAddress;
    const reqDate = new Date();
    const reqTs = reqDate.getTime();
    const localTime = reqDate.toLocaleDateString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', minute: 'numeric' });
    
    const log = await Log.create({
      kind,
      method,
      url,
      uniqid,
      ipadresi: ip,
      tarayici: ua?.browser || {},
      tarayiciMotor: ua?.engine || {},
      isletimSistemi: ua?.os || {},
      cihaz: ua?.device || {},
      reqTs,
      localTime,
      user: userId
    });
    
    return log;
});
  
 
const logout = asyncHandler(async (req, res) => {
    const token = req.headers.authorization;
  
    try {
      const decoded = jwt.verify(token, "auth_api");
  
      if (decoded) {
        const userId = decoded.user;
    
        await User.updateOne({ _id: userId }, { $set: { cevrimici: false } });
  
        return res.status(200).json({ message: "Logout successful!" });
      }
    } catch (error) { 
      return res.status(401).json({ status: 401, message: 'Token verification failed!', error:error });
    }
  
    return res.status(401).json({ message: "Unauthorized!" });
  });


  const changePassword = asyncHandler(async (req, res) => {

    const token = req.headers.authorization; 

    const {old_password, password } = req.body;
    
    try {
      const decoded = jwt.verify(token, "auth_api");
      
      if (decoded) {
        const userId = decoded.user;
         
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ status: 404, message: 'User not found!' });
        }
         
        const isMatch = md5(old_password) === user.sifre;
        if (!isMatch) {
          return res.status(401).json({ status: 401, message: 'Invalid current password!' });
        }
         
        const hashedPassword = md5(password);
         
        user.sifre = hashedPassword;
        await user.save();

        await createLog(userId, '/user/change/password', req);
        
        return res.status(200).json({ status: 200, message: 'Password changed successfully!' });
      }
    } catch (error) { 
       return res.status(401).json({ status: 401, message: 'Token verification failed!', error:error });
    }
    
    return res.status(401).json({ status: 401, message: 'Unauthorized!' });
  });

 
  const profilupdate = asyncHandler(async (req, res) => {
        const token = req.headers.authorization;
        const {
            ad,
            aktiviteGoster,
            uyelikTeklifiGoster,
            pushBildirim,
            sadeceDMBildir,
            yaklasanAboneSureBildir,
            aylikBultenGonder,
            yeniYorumBildir,
            yeniBegeniBildir,
            takipEttiklerimdenIndirim,
            canliYayinBildirim,
            yayinSmsBildir
        } = req.body;

        try {
            const decoded = jwt.verify(token, "auth_api");

            if (decoded) {
                const userId = decoded.user;
 
                const user = await User.findByIdAndUpdate(userId, {
                    $set: {
                        ad: ad,
                        aktiviteGoster: aktiviteGoster,
                        uyelikTeklifiGoster: uyelikTeklifiGoster,
                        pushBildirim: pushBildirim,
                        sadeceDMBildir: sadeceDMBildir,
                        yaklasanAboneSureBildir: yaklasanAboneSureBildir,
                        aylikBultenGonder: aylikBultenGonder,
                        yeniYorumBildir: yeniYorumBildir,
                        yeniBegeniBildir: yeniBegeniBildir,
                        takipEttiklerimdenIndirim: takipEttiklerimdenIndirim,
                        canliYayinBildirim: canliYayinBildirim,
                        yayinSmsBildir: yayinSmsBildir
                    }
                });

                if (!user) {
                    return res.status(404).json({ status: 404, message: 'User not found!' });
                }

                await createLog(userId, '/user/profil/update', req);
                return res.status(200).json({ status: 200, message: 'Profile updated successfully!' });
            }
        } catch (error) { 
            return res.status(401).json({ status: 401, message: 'Token verification failed!', error:error });
        }

        return res.status(401).json({ status: 401, message: 'Unauthorized!' });
    });

 
   const forgetPassword = asyncHandler(async (req, res) => {
        const { email } = req.body;
        const vEmail = await htmlspecialchars(email);

        const user = await User.findOne({eposta: vEmail}).select(" ad eposta ")

        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found!' });
        }
        console.log("User info", user);
        const resetCode = crypto.randomBytes(3).toString("hex")


        const mailOptions = {
            from: process.env.MAIL_FROM_ADDRESS,
            to:vEmail,
            subject: "Password Reset",
            html: `<p>Your password reset code ${resetCode}`,
          };

        await sendMail(mailOptions)

        await User.updateOne(
            {eposta: vEmail},
            {
                reset: {
                    code:resetCode,
                    time: moment(new Date()).add(15,"minute").format("YYYY-MM-DD HH:mm:ss")
                }
            }
        ) 

        return res.status(200).json({ status: 200, message: 'Please Check Your Mail Box!' });

    });
     
      
  const resetCodeCheck = asyncHandler(async (req, res) => {
        const {email,code} = req.body; 
        const vEmail = await htmlspecialchars(email); 
        const user = await User.findOne({eposta: vEmail}).select("_id ad eposta reset")

        if (!user) {
            return res.status(404).json({ status: 404, message: 'User not found!' });
        }

        const dbTime = moment(user.reset.time)
        const nowTime = moment(new Date())
        const timeDiff = dbTime.diff(nowTime, "minutes") 

        if(timeDiff <= 0 || user.reset.code !== code) {
            return res.status(404).json({ status: 404, message: 'Invalid Code!' });
        }

        const temporaryToken = await createTemporaryToken(user._id, user.eposta)

        return res.status(200).json({ status: 200, data:{token:temporaryToken}, message: 'You can reset password!' });

  });
   
  const createTemporaryToken = async (userId, email) => {
        const payload = {
            sub:userId,
            email
        }
        const token = await jwt.sign(payload, "temporary_key", {
            algorithm:"HS512",
            expiresIn:"3m"
        })

        return "Bearer " + token
  }


  const resetPassword = async (req, res) => {
        const { password, token } = req.body
        const decodedToken = await decodedtemporaryToken(token,res)
      
        const hashedPassword = md5(password);

        await User.findByIdAndUpdate(
            { _id: decodedToken._id},
            {
                reset: {
                    code:null,
                    time:null
                },
                sifre: hashedPassword
            })

        return res.status(200).json({ status: 200, data:{token:token}, message: 'Password Reset Successful!' });
 
  }

  const decodedtemporaryToken = async (token,res) => {
        const token_parse = token.split(" ")[1]
        let userinfo;
        await jwt.verify(token_parse, "temporary_key", async (err,decoded) => {
            if (err) {
                return res.status(401).json({ message: "Invalid Token!" });
            }
             userinfo = await User.findById(decoded.sub).select("_id ad eposta")

            if(!userinfo) {
                return res.status(401).json({ message: "User not found!" });
            } 
        }) 
        return userinfo
  }

module.exports = {
    login,
    loginControl,
    register,
    changePassword,
    logout,
    profilupdate, 
    forgetPassword,
    resetCodeCheck,
    resetPassword
};
