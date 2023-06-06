const express = require('express')
const userRouter = express.Router()
const authController = require("../controllers/authController")
 
userRouter.post('/login',authController.login)
userRouter.post('/login-control',authController.loginControl)
 
userRouter.post('/register',authController.register) 
userRouter.get('/logout', authController.logout);

userRouter.post('/change/password', authController.changePassword)  
userRouter.post('/profil/update', authController.profilupdate)  

userRouter.post('/forget-password/send', authController.forgetPassword);
userRouter.post('/reset-code/check', authController.resetCodeCheck); 
userRouter.post('/reset/password', authController.resetPassword);

module.exports = userRouter