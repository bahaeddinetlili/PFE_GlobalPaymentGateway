import { User } from "../models/user.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import otpGenerator from "otp-generator";
import sendEmail from "../middlewares/nodemailer.js";
import nodemailer from "nodemailer";

import expressJwt from "express-jwt";

// ki user yaamel register nhotolo fi ProfilePhoto taswira par defaut esmha default.png w baad ki yaamel login ibadel wahdo
export async function register(req, res) {
  const { userName, email, password } = req.body;

  if (!(userName && password && email)) {
    console.log(email)
    res.status(400).send("All fields are required");
  }

  const oldUser = await User.findOne({ email: email });
  if (oldUser) {
    return res.status(409).send("User already exists");
  }

  let NewUser = new User({
    userName: userName,
    email: email,
    password: await bcrypt.hash(password, 10),
    ProfilePhoto: `${req.protocol}://${req.get("host")}${process.env.IMGURL}/fifa.jpg`,
  });

  User.create(NewUser)
    .then((docs) => {
      // Send the verification email to the user's email address
      const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: process.env.USER,
          pass: process.env.PASS,
        },
      });
      const mailOptions = {
        from: process.env.USER,
        to: email,
        subject: "Email verification",
        html: `
        <html>
        <head>
          <title>Email Verification</title>
        </head>
        <body style="background-color: #f5f5f5; padding: 10px;">
          <div style="background-color: #ffffff; max-width: 600px; margin: auto; padding: 20px; border-radius: 10px;">
            <h2 style="text-align: center; color: #2c42db;">Verify Your Email</h2>
            <p style="color: #333333;">Dear ${userName},</p>
            <p style="color: #333333;">Please click the button below to verify your email:</p>
            <div style="text-align: center;">
            <a href="http://localhost:3000/emailVerification?email=${userName}" style="background-color: blue; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 10px;">Verify Email</a>
            </div>
            <p style="color: #333333;">Thank you for using our service!</p>
            <p style="color: #333333;">The Team</p>
          </div>
        </body>
      </html>
        `,
      };
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.log(err);
          res.status(500).send("Failed to send verification email");
        } else {
          res.status(201).json(docs);
        }
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send("Failed to create user");
    });
}

//Verify email 
export async function emailVerification(req, res) {
  const { email } = req.query;

  try {
    // Find the user by email
    const user = await User.findOne({ email: email });

    // If user not found, return error
    if (!user) {
      return res.status(400).send('User not found');
    }

    // Update the user's 'Verified' attribute to true
    user.Verified = true;
    await user.save();
    console.log(email)
    // Redirect the user to the login page after successful verification
    res.redirect('http://localhost:3000/login');
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).send('Internal server error');
  }
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!(email && password)) {
    return res.status(400).send("All fields are required");
  }

  const user = await User.findOne({ email });
  console.log(user)

  if (!user) {
    return res.status(404).send("Unexistant user");
  }

  if (!(await bcrypt.compare(password, user.password))) {
    return res.status(401).send("Invalid credentials");
  }

  const newToken = await jwt.sign({ user }, process.env.TOKENKEY, {
    expiresIn: "4d",
  });

  user.token = newToken;

  try {
    await user.updateOne({ _id: user._id, token: newToken });
    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ error: err });
  }
}

export function getById(req, res) {
  User.findById(req.id)
    .then((docs) => {

      res.status(200).json(docs)
    })
    .catch((err) => {
      res.status(404).json({ error: "Unvalid ID" });
    });
}
export async function sendOTPResetEmail(req, res) {
  let user = await User.findOne({ email: req.body.Email });
  if (user) {
    //create OTP
    const OTP = Math.floor(1000 + Math.random() * 9000).toString();
    //update OTP in the database
    User.findOneAndUpdate({ _id: user._id }, { OTPReset: OTP })
      .then(async (docs) => {
        //send otp to email
        sendEmail(user.email, "Password Reset", OTP);


        user.OTPReset = OTP


        res.status(200).json("OTP generated");
      })
      .catch((err) => {
        res.status(500).json({ error: err });
      });
  }
}

//Change password
export async function resetPassword(req, res) {

  const user = await User.findOne({ email: req.body.Email });


  if (user) {
    if (req.body.OTP === user.OTPReset) {
      const EncryptedPassword = await bcrypt.hash(req.body.Password, 10);

      await User.findOneAndUpdate(
        { _id: user._id },
        {
          password: EncryptedPassword,
          OTPReset: null

        }
      )
        .then((docs) => {
          user.password = EncryptedPassword;
          res.status(200).json(docs);
        })
        .catch((err) => {
          res.status(500).json("Error while reseting password");
        });
    }
  }
}

export async function logout(req, res) {
  await User.findOneAndUpdate(
    { _id: req.params.id },
    {
      token: null,
    }
  )
    .then((docs) => {
      res.status(200).json(docs);
    })
    .catch((err) => {
      res.status(500).json({ error: err });
    });
}



