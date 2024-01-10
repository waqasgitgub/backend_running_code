const bcrypt = require("bcryptjs");
const userService = require("../Services/userServices");
const {formatCurrency,convertToNumeric} = require("../Services/helperMethods.js");
const FormData = require('form-data');
const hubspot = require('@hubspot/api-client');
const companyService = require('../Services/companyService.js');
const nodemailer = require('nodemailer');
const userModel = require("../modals/userModel");
const auth = require("../MiddleWares/auth");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { Readable } = require('stream');
var db = require('../modals/index.js');
const PDFDocument = require('pdfkit');
const fs = require('fs');
// var db = require('../Images');
// image Upload
const multer = require('multer')
const path = require('path');
const { response } = require("express");
const { json } = require("body-parser");
const e = require("express");
var  User =  db.userModel;
//user   registration, updation(on the  bases  of  existing  user ) and  login  
// const register = async (req, res) => {
//   const { email } = req.body;
//   // Check if the user with the provided email already exists
//   const existingUser = await User.findOne({ where: { email } });
//   if (existingUser && (existingUser.applicationStatus == null||existingUser.applicationStatus==false)) {
//     // User with the email already exists, update the user
//     await userService.updateUser(existingUser.id, req.body);
//     return res.status(200).send({ message: "User updated successfully!"});
//   } else {
//     // User doesn't exist, proceed to register a new user
//     await userService.register(req.body, async (err, result) => {
//       if (err) return res.status(400).send(err);
//       // Log in the newly registered user
//       await userService.login(email, async (loginErr, loginResult) => {
//         if (loginErr) return res.status(400).send(loginErr);
//         loginResult.token = auth.generateToken(
//           loginResult.id.toString(),
//           loginResult.email
//         );
//         return res.status(201).send({
//           message: "User registered and logged in successfully!",
//           user: loginResult,
//         });
//       });
//     });
//   }
// };

// const register = async  (req, res) => {
//   const { email, } = req.body;
//   const { business_name,trade_name,address_line_1,city,state,address_line_2,zip } = req.body;
// 		const companyData={ business_name,trade_name,address_line_1,city,state,address_line_2,zip }
//     // Check if the user with the provided email already exists
//     const existingUser = await User.findOne({ where: { email } });
//     if (existingUser) {
//       // User with the email already exists, update the user
//       await userService.updateUser(existingUser.id, req.body);
//       return res.status(200).send({ message: "User updated successfully!" });
//     } else {
//         // User doesn't exist, proceed to register a new user
//     await userService.register(req.body, async(err, result) => {
//       if (err) return res.status(400).send(err);
//       // Log in the newly registered user
//    await  userService.login(email, async(loginErr, loginResult) => {
//         if (loginErr) return res.status(400).send(loginErr);
//         loginResult.token = auth.generateToken(loginResult.id.toString(), loginResult.email);
//   // Call the companyService.create function here
//    await companyService.create(companyData, loginResult.id, (companyErr, createdCompany) => {
//     if (companyErr) {
//       return res.status(500).send({ message: "Error creating company", details: companyErr.message });
//     }
//     return res.status(201).send({ message: "User registered and logged in successfully and  Also  Company  is  Created  successfully!", user: loginResult, company: createdCompany });
// });
//       });
//     });
// }};
const register = async (req, res) => {
  const { email } = req.body;
  // Check if the user with the provided email already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser && (existingUser.applicationStatus == null || existingUser.applicationStatus == false)) {
    // User with the email already exists, return an error
    return res.status(400).send({ message: "User with this email already exists and cannot be updated." });
  } else {
    // User doesn't exist, proceed to register a new user
    await userService.register(req.body, async (err, result) => {
      if (err) return res.status(400).send(err);
      // Log in the newly registered user
      await userService.login(email, async (loginErr, loginResult) => {
        if (loginErr) return res.status(400).send(loginErr);
        loginResult.token = auth.generateToken(
          loginResult.id.toString(),
          loginResult.email
        );
        return res.status(201).send({
          message: "User registered and logged in successfully!",
          user: loginResult,
        });
      });
    });
  }
};
const registerViaInvite = async  (req, res) => {
  const token = req.query.token;
  const invitationToken = jwt.decode(token);
  const {  email, name ,surname,  password } = req.body;
 const Invited_Email = invitationToken.id
 console.log("entered Email",email);
  console.log("Invited Email",Invited_Email);
  if (Invited_Email== email) {
 if (!(name && surname && email && password))
    return res
      .status("400")
      .send({ errMessage: "Please fill all required areas!" });
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);
  req.body.password = hashedPassword;
  await userService.register(req.body, (err, result) => {
    if (err) return res.status(400).send(err);
    return res.status(201).send(result);
  });
  } else {
    return res
      .status("400")
      .send({ errMessage: `Please Enter Same  Email :${Invited_Email} on which  your   Invited!` });
  }
  // if (!(name && surname && email && password))
  //   return res
  //     .status("400")
  //     .send({ errMessage: "Please fill all required areas!" });
  // const salt = bcrypt.genSaltSync(10);
  // const hashedPassword = bcrypt.hashSync(password, salt);
  // req.body.password = hashedPassword;
  // await userService.register(req.body, (err, result) => {
  //   if (err) return res.status(400).send(err);
  //   return res.status(201).send(result);
  // });
};
const login = async (req, res) => {
  const {email} = req.body;
  await userService.login(email, (err, result) => {
        console.log("result.....",result);
     result.token = auth.generateToken(result.id.toString(), result.email);
    return res
      .status(200)
      .send({ message: "User login successful!", user: result });
  });
};
const getUser = async (req, res) => {
  const userId =   req.user.id;
  console.log("userId......",userId);
  await userService.getUser(userId, (err, result) => {
    if (err) return res.status(404).send(err);
    result.password = undefined;
    return res.status(200).send(result);
  });
};
const getById = async (req, res) => {
  const userId =   req.body.userId;
  console.log("userId......",userId);
  await userService.getById(userId, (err, result) => {
    if (err) return res.status(404).send(err);
    result.password = undefined;
    return res.status(200).send(result);
  });
};
const getAllFiles = async (req, res) => {
  const userId =   req.user.id;
  await userService.getAllFiles(userId, (err, result) => {
    if (err) return res.status(404).send(err);
    result.password = undefined;
    return res.status(200).send(result);
  });
};
const getAllUser = async (req, res) => {
  await userService.getAllUser( (err, result) => {
    if (err) return res.status(404).send(err);
    return res.status(200).send(result);
  });
};
const getUserWithMail = async(req,res) => {
  const {email} = req.body;
  await userService.getUserWithMail(email,(err,result)=>{
    if(err) return res.status(404).send(err);
    const dataTransferObject = {
      user: result.id,
      name: result.name,
      surname: result.surname,
      color: result.color,
      email : result.email
    };
    return res.status(200).send(dataTransferObject);
  })
}
// const updateUser = async (req, res) => {
//     try {   
// const id=req.user.id;
// let step=req.params.stepNumber;
// const nextstep = req.params.stepNumber;
// const prevstep = req.user.step;
//  step = (nextstep >= prevstep) ? nextstep : prevstep;

//       const updatedUser = await userService.updateUser(id, {...req.body,step:step});
//  // Now it should be defined
//       res.status(200).json(updatedUser);
//     } catch (err) {
//       res.status(500).json(err);
//     }
// };
const sendEmail = async (req, res) => {
  
  let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.OUR_EMAIL,
        pass: process.env.EMAIL_PASSWORD 
      }
  })
    // <table>
    //   <tr>
    //     <td><b>Name:</b></td>
    //     <td>${req.body.user.first_name} ${req.body.user.last_name}</td>
    //   </tr>
    //   <tr>
    //     <td><b>Email:</b></td>
    //     <td>${req.body.user.email}</td>
    //   </tr>
    //   <tr>
    //     <td><b>Phone:</b></td>
    //     <td>${req.body.user.phone}</td>
    //   </tr>
    //   <tr>
    //     <td><b>Company Name:</b></td>
    //     <td>${req.body.user.trade_name}</td>
    //   </tr>
     
    // </table>
  // Create the HTML content dynamically
  const htmlContent = `
    <table>
  <!-- Displaying basic user information -->
  <tr>
    <td><b>Name:</b></td>
    <td>${req.body.user.first_name} ${req.body.user.last_name}</td>
  </tr>
  <tr>
    <td><b>Email:</b></td>
    <td>${req.body.user.email}</td>
  </tr>
  <tr>
    <td><b>Phone:</b></td>
    <td>${req.body.user.phone}</td>
  </tr>
  <tr>
    <td><b>Company Name:</b></td>
    <td>${req.body.user.trade_name}</td>
  </tr>
  <!-- Displaying additional user properties dynamically -->
  ${Object.entries(req.body.user).map(([key, value]) => {
    // Check if the value is null or undefined
    const displayValue = value != null ? value : ''; 

    // Display only if the property is not one of the known properties
    if (!['first_name', 'last_name', 'email', 'phone', 'trade_name'].includes(key)) {
      return `
        <tr>
          <td><b>${key.replace(/_/g, ' ')}:</b></td>
          <td>${displayValue}</td>
        </tr>
      `;
    }
    return ''; // Skip known properties
  }).join('')}
</table>
  `;
  
  let info = await transporter.sendMail({
    from: 'afaq58681@gmail.com',
    to: 'afaq58681@gmail.com', // list of receivers
    text: 'uogiiiiiiiisssssssssssss',
    html: htmlContent,
  });
  
  if (info.messageId) {
      console.log(info, 84)
      if (info.messageId) {
        console.log(info, 84);
   res.status(200).json({ code: 200, message: 'Email  has  been  sent  successfully'});
      } else {
        res.status(500).json({ code: 500, message: 'Server error' });
      }
    } 
}
const sendEmailonFirstStep = async (req, res) => {
// console.log(req.body,",,,,,,,,,,,,,,,");
 //req.body.user=req.body
  let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.OUR_EMAIL,
        pass: process.env.EMAIL_PASSWORD 
      }
  })
    // <table>
    //   <tr>
    //     <td><b>Name:</b></td>
    //     <td>${req.body.user.first_name} ${req.body.user.last_name}</td>
    //   </tr>
    //   <tr>
    //     <td><b>Email:</b></td>
    //     <td>${req.body.user.email}</td>
    //   </tr>
    //   <tr>
    //     <td><b>Phone:</b></td>
    //     <td>${req.body.user.phone}</td>
    //   </tr>
    //   <tr>
    //     <td><b>Company Name:</b></td>
    //     <td>${req.body.user.trade_name}</td>
    //   </tr>
     
    // </table>
  // Create the HTML content dynamically
//   const htmlContent = `
  
//   <!DOCTYPE html>
// <html lang="en">
//     <head>
//         <meta charset="utf-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1">
//         <title>SETC Zone - Application in Process</title>
//         <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
//         <link rel="preconnect" href="https://fonts.googleapis.com">
// <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
// <link rel="preconnect" href="https://fonts.googleapis.com">
// <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
// <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap" rel="stylesheet">
//     <style>
//       body {
//         font-family: 'Roboto', sans-serif;
//         line-height: 1.6;
//         font-weight: 400;
//         margin: 20px;
//       }
//       .container {
//         max-width: 550px;
//         margin: 0 auto;
//       }
//       .message {
//         background-color: #f4f4f4;
//         border-top: 4px solid  #5AB5E6; 
//         border-bottom: 4px solid  #5AB5E6;
//         padding: 40px 20px ;
//         border-radius: 8px;
//         margin-top: 20px;
//         font-family: 'Roboto', sans-serif;
        
//         font-weight: 400;
//       }
//       .message p{
//         font-family: 'Roboto', sans-serif;
        
//         font-weight:400;
//       }
//     </style>
//   </head>
//   <body>
//     <div class="container">
     
//       <!-- <div class="text-center fw-bold"><h2>Welcome to SETC Zone</h2></div> -->
//       <div class="message">
//            <div style="text-align:center;margin-bottom: 20px;">
//            <img src="http://beta.ccalerc.com/public/storage/logo-set.png" alt="" style="height: 80px; width: 270px;">
//       </div>
//             <p>
                 
//                 Dear <strong>${req.body.user.first_name}' '${req.body.user.last_name}</strong> , 
//             </p>
//         <p>
//             We are writing to inform you that your application for the Self-Employment Tax Credit (SETC) is currently being processed. We understand the importance of this credit to you, and we want to assure you that handling your application in a diligent and timely manner is our top priority.
//         </p>
        
//         <p>
//             Our team of experts is working hard to ensure that your application is processed as soon as possible. A member of our team will be in touch with you soon regarding the status of your application. In the meantime, we encourage you to visit <a href="https://setczone.com">https://setczone.com</a> for answers to frequently asked questions.
//         </p>
        
//         <p>
//             If you have any further questions or concerns regarding your application, please do not hesitate to contact us at <a href="mailto:support@setczone.com">support@setczone.com</a>. We are always here to help and are committed to providing you with the best possible service.
//         </p>
    
//         <p>
//             Sincerely,<br>
//             The SETC Team
//         </p>
// <div style="text-align:center;">
//             <a href="https://app.setczone.com/"><button type="button" class="btn btn-primary" style="background-color:#5ab5e6;border:1px #5ab5e6;padding:10px 40px;border-radius:10px" > Login</button></a>
//         </div>
//       </div>
//     </div>
//     <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.8/dist/umd/popper.min.js" integrity="sha384-I7E8VVD/ismYTF4hNIPjVp/Zjvgyol6VFvRkX/vR+Vc4jQkC+hVqc2pM8ODewa9r" crossorigin="anonymous"></script>
//     <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.min.js" integrity="sha384-BBtl+eGJRgqQAUMxJ7pMwbEyER4l1g+O15P+16Ep7Q9Q+zqX6gSbd85u4mG4QzX+" crossorigin="anonymous"></script>
//     <script script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
// </body>
//   </body>
// </html>

//   `;

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>SETC Zone - Prequalification</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap" rel="stylesheet">
    <style>
      body {
        font-family: 'Roboto', sans-serif;
        line-height: 1.6;
        font-weight: 400;
        margin: 20px;
      }
      .container {
        max-width: 550px;
        margin: 0 auto;
      }
      .message {
        background-color: #f4f4f4;
        border-top: 4px solid #5AB5E6;
        border-bottom: 4px solid #5AB5E6;
        padding: 40px 20px;
        border-radius: 8px;
        margin-top: 20px;
        font-family: 'Roboto', sans-serif;
        font-weight: 400;
      }
      .message p {
        font-family: 'Roboto', sans-serif;
        font-weight: 400;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="message">
      <div style="text-align:center;margin-bottom: 20px;">
          <img src="http://beta.ccalerc.com/public/storage/logo-set.png" alt="" style="height: 80px; width: 270px;">
        </div>
        <p>
        Dear <strong>${req.body.user.first_name} ${req.body.user.last_name}</strong>,
      </p>
        <p>
          Well done on taking the initial step towards getting the Self-Employed Tax Credit. We are pleased to inform you that you have been prequalified for [$Amount]. The next crucial step is to have one of our expert CPAs review your file to confirm your tax credit amount.
        </p>
        <p>
          We understand that the process of claiming your tax credit may be confusing, but don't worry, we will guide you every step of the way. Completing your application is simple, and you only need to follow these three easy steps:
        </p>
        <ol>
          <li>Fill out the online questionnaire on <a href="https://setczone.com">https://setczone.com</a>.</li>
          <li>Upload your documents, including your tax returns for 2019, 2020, and 2021, along with all schedules.</li>
          <li>Collect your funds!</li>
        </ol>
        <p>
          Please note that the application deadline is fast approaching. We urge you to complete the above steps as soon as possible. Once you submit your application and documents, one of our team members will reach out to you within 72 hours to discuss your application's specifics and answer any questions you may have.
        </p>
        <p>
          If you have any queries or concerns, please do not hesitate to contact us at <a href="mailto:support@setczone.com">support@setczone.com</a>. We are here to help you.
        </p>
        <p>
          Thank you for trusting SETC Zone.
        </p>
        <p>
          Sincerely,
          SETC Zone, Here to help.
        </p>
      </div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.8/dist/umd/popper.min.js" integrity="sha384-I7E8VVD/ismYTF4hNIPjVp/Zjvgyol6VFvRkX/vR+Vc4jQkC+hVqc2pM8ODewa9r" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.min.js" integrity="sha384-BBtl+eGJRgqQAUMxJ7pMwbEyER4l1g+O15P+16Ep7Q9Q+zqX6gSbd85u4mG4QzX+" crossorigin="anonymous"></script>
    <script script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
  </body>
</html>
`;

// Use the htmlContent variable wherever you need to send or display the HTML content.

  let info = await transporter.sendMail({
    from: 'afaq58681@gmail.com',
    to: 'afaq58681@gmail.com', // list of receivers
    text: 'uogiiiiiiiisssssssssssss',
    html: htmlContent,
  });
  if (info.messageId) {
      console.log(info, 84)
      if (info.messageId) {
        console.log(info, 84);
   res.status(200).json({ code: 200, message: 'Email  has  been  sent  successfully'});
      } else {
        res.status(500).json({ code: 500, message: 'Server error' });
      }
    } 
}
const sendEmailonNinteenStep = async (req, res) => {
 
  let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.OUR_EMAIL,
        pass: process.env.EMAIL_PASSWORD 
      }
  })
    // <table>
    //   <tr>
    //     <td><b>Name:</b></td>
    //     <td>${req.body.user.first_name} ${req.body.user.last_name}</td>
    //   </tr>
    //   <tr>
    //     <td><b>Email:</b></td>
    //     <td>${req.body.user.email}</td>
    //   </tr>
    //   <tr>
    //     <td><b>Phone:</b></td>
    //     <td>${req.body.user.phone}</td>
    //   </tr>
    //   <tr>
    //     <td><b>Company Name:</b></td>
    //     <td>${req.body.user.trade_name}</td>
    //   </tr>
     
    // </table>
  // Create the HTML content dynamically
  // const htmlContent = `
  
  // <!DOCTYPE html>
  // <html lang="en">
  //     <head>
  //         <meta charset="utf-8">
  //         <meta name="viewport" content="width=device-width, initial-scale=1">
  //         <title>SETC Zone - Document Uplaoded </title>
  //         <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
  //         <link rel="preconnect" href="https://fonts.googleapis.com">
  // <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  // <link rel="preconnect" href="https://fonts.googleapis.com">
  // <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  // <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap" rel="stylesheet">
  //     <style>
  //       body {
  //         font-family: 'Roboto', sans-serif;
  //         line-height: 1.6;
  //         font-weight: 400;
  //         margin: 20px;
  //       }
  //       .container {
  //         max-width: 550px;
  //         margin: 0 auto;
  //       }
  //       .message {
  //         background-color: #f4f4f4;
  //         border-top: 4px solid  #5AB5E6; 
  //         border-bottom: 4px solid  #5AB5E6;
  //         padding: 40px 20px ;
  //         border-radius: 8px;
  //         margin-top: 20px;
  //         font-family: 'Roboto', sans-serif;
          
  //         font-weight: 400;
  //       }
  //       .message p{
  //         font-family: 'Roboto', sans-serif;
          
  //         font-weight:400;
  //       }
  //     </style>
  //   </head>
  //   <body>
  //     <div class="container">
  //       <div style="text-align:center">
  //         <!--<img src="logo-set.png" alt="" srcset="" / style="height: 100px;width:-->
  //         <!--300;">-->
  //         <img src="http://beta.ccalerc.com/public/storage/logo-set.png" alt="" style="height: 80px; width: 270px;">
  //       </div>
  //       <!-- <div class="text-center fw-bold"><h2>Welcome to SETC Zone</h2></div> -->
  //       <div class="message">
  //             <p>
                 
  //                 Dear <strong>${req.body.user.first_name}' '${req.body.user.last_name}</strong> ,
  //             </p>
  //         <p>
  //             We are writing to confirm that we have received the documentation you uploaded for your application for the Self-employment Tax Credit (SETC). Thank you for submitting all the required materials in a timely manner.
  //         </p>
          
  //         <p>
  //             We understand how important this credit is for you, and we want to assure you that we are committed to assisting you throughout the application process. Our team of experts is working diligently to ensure that your application is handled promptly and efficiently.
  //         </p>
          
  //         <p>
  //             Within the next 72 hours, a member of our team will be in contact with you to discuss your application further. If you have any additional questions or concerns, please do not hesitate to reach out to us at <a href="mailto:support@setczone.com">support@setczone.com</a>. We are always here to help.
  //         </p>
          
  //         <p>
  //             Thank you again for choosing us to assist you with your SETC application. We look forward to working with you.
  //         </p>
      
  //         <p>
  //             Best regards,<br>
  //             SETC Zone
  //         </p>
  //        <div style="text-align:center;">
  //             <a href="https://app.setczone.com/"><button type="button" class="btn btn-primary" style="background-color:#5ab5e6;border:1px #5ab5e6;padding:10px 40px;border-radius:10px" > Login</button></a>
  //         </div>
  //       </div>
  //     </div>
  //     <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.8/dist/umd/popper.min.js" integrity="sha384-I7E8VVD/ismYTF4hNIPjVp/Zjvgyol6VFvRkX/vR+Vc4jQkC+hVqc2pM8ODewa9r" crossorigin="anonymous"></script>
  //     <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.min.js" integrity="sha384-BBtl+eGJRgqQAUMxJ7pMwbEyER4l1g+O15P+16Ep7Q9Q+zqX6gSbd85u4mG4QzX+" crossorigin="anonymous"></script>
  //     <script script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
  // </body>
  //   </body>
  // </html>

  // `;
  // const htmlContent = `
  // <!DOCTYPE html>
  // <html lang="en">
  //   <head>
  //     <meta charset="utf-8">
  //     <meta name="viewport" content="width=device-width, initial-scale=1">
  //     <title>SETC Zone - Prequalification</title>
  //     <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
  //     <link rel="preconnect" href="https://fonts.googleapis.com">
  //     <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  //     <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap" rel="stylesheet">
  //     <style>
  //       body {
  //         font-family: 'Roboto', sans-serif;
  //         line-height: 1.6;
  //         font-weight: 400;
  //         margin: 20px;
  //       }
  //       .container {
  //         max-width: 550px;
  //         margin: 0 auto;
  //       }
  //       .message {
  //         background-color: #f4f4f4;
  //         border-top: 4px solid #5AB5E6;
  //         border-bottom: 4px solid #5AB5E6;
  //         padding: 40px 20px;
  //         border-radius: 8px;
  //         margin-top: 20px;
  //         font-family: 'Roboto', sans-serif;
  //         font-weight: 400;
  //       }
  //       .message p {
  //         font-family: 'Roboto', sans-serif;
  //         font-weight: 400;
  //       }
  //     </style>
  //   </head>
  //   <body>
  //     <div class="container">
  //       <div class="message">
  //         <p>
  //           Dear [Client],
  //         </p>
  //         <p>
  //           Well done on taking the initial step towards getting the Self-Employed Tax Credit. We are pleased to inform you that you have been prequalified for [$Amount]. The next crucial step is to have one of our expert CPAs review your file to confirm your tax credit amount.
  //         </p>
  //         <p>
  //           We understand that the process of claiming your tax credit may be confusing, but don't worry, we will guide you every step of the way. Completing your application is simple, and you only need to follow these three easy steps:
  //         </p>
  //         <ol>
  //           <li>Fill out the online questionnaire on <a href="https://setczone.com">https://setczone.com</a>.</li>
  //           <li>Upload your documents, including your tax returns for 2019, 2020, and 2021, along with all schedules.</li>
  //           <li>Collect your funds!</li>
  //         </ol>
  //         <p>
  //           Please note that the application deadline is fast approaching. We urge you to complete the above steps as soon as possible. Once you submit your application and documents, one of our team members will reach out to you within 72 hours to discuss your application's specifics and answer any questions you may have.
  //         </p>
  //         <p>
  //           If you have any queries or concerns, please do not hesitate to contact us at <a href="mailto:support@setczone.com">support@setczone.com</a>. We are here to help you.
  //         </p>
  //         <p>
  //           Thank you for trusting SETC Zone.
  //         </p>
  //         <p>
  //           Sincerely,
  //           SETC Zone, Here to help.
  //         </p>
  //       </div>
  //     </div>
  //     <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.8/dist/umd/popper.min.js" integrity="sha384-I7E8VVD/ismYTF4hNIPjVp/Zjvgyol6VFvRkX/vR+Vc4jQkC+hVqc2pM8ODewa9r" crossorigin="anonymous"></script>
  //     <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.min.js" integrity="sha384-BBtl+eGJRgqQAUMxJ7pMwbEyER4l1g+O15P+16Ep7Q9Q+zqX6gSbd85u4mG4QzX+" crossorigin="anonymous"></script>
  //     <script script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
  //   </body>
  // </html>
  // `;
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>SETC Zone - Congratulations</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap" rel="stylesheet">
    <style>
      body {
        font-family: 'Roboto', sans-serif;
        line-height: 1.6;
        font-weight: 400;
        margin: 20px;
      }
      .container {
        max-width: 550px;
        margin: 0 auto;
      }
      .message {
        background-color: #f4f4f4;
        border-top: 4px solid #5AB5E6;
        border-bottom: 4px solid #5AB5E6;
        padding: 40px 20px;
        border-radius: 8px;
        margin-top: 20px;
        font-family: 'Roboto', sans-serif;
        font-weight: 400;
      }
      .message p {
        font-family: 'Roboto', sans-serif;
        font-weight: 400;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="message">
      <div style="text-align:center;margin-bottom: 20px;">
      <img src="http://beta.ccalerc.com/public/storage/logo-set.png" alt="" style="height: 80px; width: 270px;">
    </div>
    <p>
    Dear <strong>${req.body.user.first_name} ${req.body.user.last_name}</strong>,
  </p>
        <p>
          Congratulations on taking the first steps towards claiming your SETC Credit!
        </p>
        <p>
          With up to $32,200.00 available to self-employed individuals and a deadline for the application soon approaching, now is the time to take action and file yours today!
        </p>
        <p>
          It’s just 3 easy steps to finish your application:
        </p>
        <ol>
          <li>Complete the online questionnaire at <a href="https://setczone.com">https://setczone.com</a>.</li>
          <li>Upload your 2019, 2020, and 2021 tax returns.</li>
          <li>Collect your funds.</li>
        </ol>
        <p>
          You can use your email address on our website under the “Login” tab to access your secure uploads portal.
        </p>
        <p>
          Need help navigating the application process or have questions? Book a call with a SETC expert today!
        </p>
        <p>
          Looking forward to assisting you!
        </p>
        <p>
          Sincerely,
          SETC Zone
        </p>
      </div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.8/dist/umd/popper.min.js" integrity="sha384-I7E8VVD/ismYTF4hNIPjVp/Zjvgyol6VFvRkX/vR+Vc4jQkC+hVqc2pM8ODewa9r" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.min.js" integrity="sha384-BBtl+eGJRgqQAUMxJ7pMwbEyER4l1g+O15P+16Ep7Q9Q+zqX6gSbd85u4mG4QzX+" crossorigin="anonymous"></script>
    <script script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
  </body>
</html>
`;

// Use the htmlContent variable wherever you need to send or display the HTML content.

  
  // Use the htmlContent variable wherever you need to send or display the HTML content.
  
  let info = await transporter.sendMail({
    from: 'afaq58681@gmail.com',
    to: 'afaq58681@gmail.com', // list of receivers
    text: 'uogiiiiiiiisssssssssssss',
    html: htmlContent,
  });
  if (info.messageId) {
      console.log(info, 84)
      if (info.messageId) {
        console.log(info, 84);
   res.status(200).json({ code: 200, message: 'Email  has  been  sent  successfully'});
      } else {
        res.status(500).json({ code: 500, message: 'Server error' });
      }
    } 
}
const sendEmailonNinteenStep2 = async (req, res) => {
 
  let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.OUR_EMAIL,
        pass: process.env.EMAIL_PASSWORD 
      }
  })
    // <table>
    //   <tr>
    //     <td><b>Name:</b></td>
    //     <td>${req.body.user.first_name} ${req.body.user.last_name}</td>
    //   </tr>
    //   <tr>
    //     <td><b>Email:</b></td>
    //     <td>${req.body.user.email}</td>
    //   </tr>
    //   <tr>
    //     <td><b>Phone:</b></td>
    //     <td>${req.body.user.phone}</td>
    //   </tr>
    //   <tr>
    //     <td><b>Company Name:</b></td>
    //     <td>${req.body.user.trade_name}</td>
    //   </tr>
     
    // </table>
  // Create the HTML content dynamically
  // const htmlContent = `
  
  // <!DOCTYPE html>
  // <html lang="en">
  //     <head>
  //         <meta charset="utf-8">
  //         <meta name="viewport" content="width=device-width, initial-scale=1">
  //         <title>SETC Zone - Document Uplaoded </title>
  //         <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
  //         <link rel="preconnect" href="https://fonts.googleapis.com">
  // <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  // <link rel="preconnect" href="https://fonts.googleapis.com">
  // <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  // <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap" rel="stylesheet">
  //     <style>
  //       body {
  //         font-family: 'Roboto', sans-serif;
  //         line-height: 1.6;
  //         font-weight: 400;
  //         margin: 20px;
  //       }
  //       .container {
  //         max-width: 550px;
  //         margin: 0 auto;
  //       }
  //       .message {
  //         background-color: #f4f4f4;
  //         border-top: 4px solid  #5AB5E6; 
  //         border-bottom: 4px solid  #5AB5E6;
  //         padding: 40px 20px ;
  //         border-radius: 8px;
  //         margin-top: 20px;
  //         font-family: 'Roboto', sans-serif;
          
  //         font-weight: 400;
  //       }
  //       .message p{
  //         font-family: 'Roboto', sans-serif;
          
  //         font-weight:400;
  //       }
  //     </style>
  //   </head>
  //   <body>
  //     <div class="container">
  //       <div style="text-align:center">
  //         <!--<img src="logo-set.png" alt="" srcset="" / style="height: 100px;width:-->
  //         <!--300;">-->
  //         <img src="http://beta.ccalerc.com/public/storage/logo-set.png" alt="" style="height: 80px; width: 270px;">
  //       </div>
  //       <!-- <div class="text-center fw-bold"><h2>Welcome to SETC Zone</h2></div> -->
  //       <div class="message">
  //             <p>
                 
  //                 Dear <strong>${req.body.user.first_name}' '${req.body.user.last_name}</strong> ,
  //             </p>
  //         <p>
  //             We are writing to confirm that we have received the documentation you uploaded for your application for the Self-employment Tax Credit (SETC). Thank you for submitting all the required materials in a timely manner.
  //         </p>
          
  //         <p>
  //             We understand how important this credit is for you, and we want to assure you that we are committed to assisting you throughout the application process. Our team of experts is working diligently to ensure that your application is handled promptly and efficiently.
  //         </p>
          
  //         <p>
  //             Within the next 72 hours, a member of our team will be in contact with you to discuss your application further. If you have any additional questions or concerns, please do not hesitate to reach out to us at <a href="mailto:support@setczone.com">support@setczone.com</a>. We are always here to help.
  //         </p>
          
  //         <p>
  //             Thank you again for choosing us to assist you with your SETC application. We look forward to working with you.
  //         </p>
      
  //         <p>
  //             Best regards,<br>
  //             SETC Zone
  //         </p>
  //        <div style="text-align:center;">
  //             <a href="https://app.setczone.com/"><button type="button" class="btn btn-primary" style="background-color:#5ab5e6;border:1px #5ab5e6;padding:10px 40px;border-radius:10px" > Login</button></a>
  //         </div>
  //       </div>
  //     </div>
  //     <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.8/dist/umd/popper.min.js" integrity="sha384-I7E8VVD/ismYTF4hNIPjVp/Zjvgyol6VFvRkX/vR+Vc4jQkC+hVqc2pM8ODewa9r" crossorigin="anonymous"></script>
  //     <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.min.js" integrity="sha384-BBtl+eGJRgqQAUMxJ7pMwbEyER4l1g+O15P+16Ep7Q9Q+zqX6gSbd85u4mG4QzX+" crossorigin="anonymous"></script>
  //     <script script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
  // </body>
  //   </body>
  // </html>

  // `;
  // const htmlContent = `
  // <!DOCTYPE html>
  // <html lang="en">
  //   <head>
  //     <meta charset="utf-8">
  //     <meta name="viewport" content="width=device-width, initial-scale=1">
  //     <title>SETC Zone - Prequalification</title>
  //     <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
  //     <link rel="preconnect" href="https://fonts.googleapis.com">
  //     <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  //     <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap" rel="stylesheet">
  //     <style>
  //       body {
  //         font-family: 'Roboto', sans-serif;
  //         line-height: 1.6;
  //         font-weight: 400;
  //         margin: 20px;
  //       }
  //       .container {
  //         max-width: 550px;
  //         margin: 0 auto;
  //       }
  //       .message {
  //         background-color: #f4f4f4;
  //         border-top: 4px solid #5AB5E6;
  //         border-bottom: 4px solid #5AB5E6;
  //         padding: 40px 20px;
  //         border-radius: 8px;
  //         margin-top: 20px;
  //         font-family: 'Roboto', sans-serif;
  //         font-weight: 400;
  //       }
  //       .message p {
  //         font-family: 'Roboto', sans-serif;
  //         font-weight: 400;
  //       }
  //     </style>
  //   </head>
  //   <body>
  //     <div class="container">
  //       <div class="message">
  //         <p>
  //           Dear [Client],
  //         </p>
  //         <p>
  //           Well done on taking the initial step towards getting the Self-Employed Tax Credit. We are pleased to inform you that you have been prequalified for [$Amount]. The next crucial step is to have one of our expert CPAs review your file to confirm your tax credit amount.
  //         </p>
  //         <p>
  //           We understand that the process of claiming your tax credit may be confusing, but don't worry, we will guide you every step of the way. Completing your application is simple, and you only need to follow these three easy steps:
  //         </p>
  //         <ol>
  //           <li>Fill out the online questionnaire on <a href="https://setczone.com">https://setczone.com</a>.</li>
  //           <li>Upload your documents, including your tax returns for 2019, 2020, and 2021, along with all schedules.</li>
  //           <li>Collect your funds!</li>
  //         </ol>
  //         <p>
  //           Please note that the application deadline is fast approaching. We urge you to complete the above steps as soon as possible. Once you submit your application and documents, one of our team members will reach out to you within 72 hours to discuss your application's specifics and answer any questions you may have.
  //         </p>
  //         <p>
  //           If you have any queries or concerns, please do not hesitate to contact us at <a href="mailto:support@setczone.com">support@setczone.com</a>. We are here to help you.
  //         </p>
  //         <p>
  //           Thank you for trusting SETC Zone.
  //         </p>
  //         <p>
  //           Sincerely,
  //           SETC Zone, Here to help.
  //         </p>
  //       </div>
  //     </div>
  //     <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.8/dist/umd/popper.min.js" integrity="sha384-I7E8VVD/ismYTF4hNIPjVp/Zjvgyol6VFvRkX/vR+Vc4jQkC+hVqc2pM8ODewa9r" crossorigin="anonymous"></script>
  //     <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.min.js" integrity="sha384-BBtl+eGJRgqQAUMxJ7pMwbEyER4l1g+O15P+16Ep7Q9Q+zqX6gSbd85u4mG4QzX+" crossorigin="anonymous"></script>
  //     <script script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
  //   </body>
  // </html>
  // `;
//   const htmlContent = `
// <!DOCTYPE html>
// <html lang="en">
//   <head>
//     <meta charset="utf-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1">
//     <title>SETC Zone - Congratulations</title>
//     <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
//     <link rel="preconnect" href="https://fonts.googleapis.com">
//     <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
//     <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap" rel="stylesheet">
//     <style>
//       body {
//         font-family: 'Roboto', sans-serif;
//         line-height: 1.6;
//         font-weight: 400;
//         margin: 20px;
//       }
//       .container {
//         max-width: 550px;
//         margin: 0 auto;
//       }
//       .message {
//         background-color: #f4f4f4;
//         border-top: 4px solid #5AB5E6;
//         border-bottom: 4px solid #5AB5E6;
//         padding: 40px 20px;
//         border-radius: 8px;
//         margin-top: 20px;
//         font-family: 'Roboto', sans-serif;
//         font-weight: 400;
//       }
//       .message p {
//         font-family: 'Roboto', sans-serif;
//         font-weight: 400;
//       }
//     </style>
//   </head>
//   <body>
//     <div class="container">
//       <div class="message">
//       <div style="text-align:center;margin-bottom: 20px;">
//       <img src="http://beta.ccalerc.com/public/storage/logo-set.png" alt="" style="height: 80px; width: 270px;">
//     </div>
//     <p>
//     Dear <strong>${req.body.user.first_name} ${req.body.user.last_name}</strong>,
//   </p>
//         <p>
//           Congratulations on taking the first steps towards claiming your SETC Credit!
//         </p>
//         <p>
//           With up to $32,200.00 available to self-employed individuals and a deadline for the application soon approaching, now is the time to take action and file yours today!
//         </p>
//         <p>
//           It’s just 3 easy steps to finish your application:
//         </p>
//         <ol>
//           <li>Complete the online questionnaire at <a href="https://setczone.com">https://setczone.com</a>.</li>
//           <li>Upload your 2019, 2020, and 2021 tax returns.</li>
//           <li>Collect your funds.</li>
//         </ol>
//         <p>
//           You can use your email address on our website under the “Login” tab to access your secure uploads portal.
//         </p>
//         <p>
//           Need help navigating the application process or have questions? Book a call with a SETC expert today!
//         </p>
//         <p>
//           Looking forward to assisting you!
//         </p>
//         <p>
//           Sincerely,
//           SETC Zone
//         </p>
//       </div>
//     </div>
//     <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.8/dist/umd/popper.min.js" integrity="sha384-I7E8VVD/ismYTF4hNIPjVp/Zjvgyol6VFvRkX/vR+Vc4jQkC+hVqc2pM8ODewa9r" crossorigin="anonymous"></script>
//     <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.min.js" integrity="sha384-BBtl+eGJRgqQAUMxJ7pMwbEyER4l1g+O15P+16Ep7Q9Q+zqX6gSbd85u4mG4QzX+" crossorigin="anonymous"></script>
//     <script script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
//   </body>
// </html>
// `;
const htmlContent = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>SETC Zone - Document Submission Confirmation</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap" rel="stylesheet">
    <style>
      body {
        font-family: 'Roboto', sans-serif;
        line-height: 1.6;
        font-weight: 400;
        margin: 20px;
      }
      .container {
        max-width: 550px;
        margin: 0 auto;
      }
      .message {
        background-color: #f4f4f4;
        border-top: 4px solid #5AB5E6;
        border-bottom: 4px solid #5AB5E6;
        padding: 40px 20px;
        border-radius: 8px;
        margin-top: 20px;
        font-family: 'Roboto', sans-serif;
        font-weight: 400;
      }
      .message p {
        font-family: 'Roboto', sans-serif;
        font-weight: 400;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="message">
      <div style="text-align:center;margin-bottom: 20px;">
          <img src="http://beta.ccalerc.com/public/storage/logo-set.png" alt="" style="height: 80px; width: 270px;">
        </div>
        <p>
          Dear <strong>${req.body.user.first_name} ${req.body.user.last_name}</strong>,
        </p>
        <p>
          We have received the documents you uploaded for your application for the Self-Employed Tax Credit (SETC).
        </p>
        <p>
          Thank you for submitting all the required materials. We understand how important this credit is for you, and our team of experts is working diligently to see that your application is reviewed promptly and efficiently.
        </p>
        <p>
          Within the next 72 hours, a member of our team will contact you to discuss your application and provide your calculation should you qualify. If you have any additional questions or concerns, please do not hesitate to reach out to us at <a href="mailto:support@setczone.com">support@setczone.com</a>. We are always here to help.
        </p>
        <p>
          Best Regards,
          SETC Zone
        </p>
      </div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.8/dist/umd/popper.min.js" integrity="sha384-I7E8VVD/ismYTF4hNIPjVp/Zjvgyol6VFvRkX/vR+Vc4jQkC+hVqc2pM8ODewa9r" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.min.js" integrity="sha384-BBtl+eGJRgqQAUMxJ7pMwbEyER4l1g+O15P+16Ep7Q9Q+zqX6gSbd85u4mG4QzX+" crossorigin="anonymous"></script>
    <script script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
  </body>
</html>
`;

// Use the htmlContent variable wherever you need to send or display the HTML content.


// Use the htmlContent variable wherever you need to send or display the HTML content.

  
  // Use the htmlContent variable wherever you need to send or display the HTML content.
  
  let info = await transporter.sendMail({
    from: 'afaq58681@gmail.com',
    to: 'afaq58681@gmail.com', // list of receivers
    text: 'uogiiiiissssssssss',
    subject: 'Welcome....',
    html: htmlContent,
  });
  if (info.messageId) {
      console.log(info, 84)
      if (info.messageId) {
        console.log(info, 84);
   res.status(200).json({ code: 200, message: 'Email  has  been  sent  successfully'});
      } else {
        res.status(500).json({ code: 500, message: 'Server error' });
      }
    } 
}
const senduserEmail = async (req, res) => {
  console.log(req.body.user,"kkkk")
  let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.OUR_EMAIL,
        pass: process.env.EMAIL_PASSWORD 
      }
  })

  
  // Create the HTML content dynamically
  const htmlContent = `
    <!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>SETC Zone - Welcome</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
        <link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap" rel="stylesheet">
    <style>
      body {
        font-family: 'Roboto', sans-serif;
        line-height: 1.6;
        font-weight: 400;
        margin: 20px;
      }
      .container {
        max-width: 550px;
        margin: 0 auto;
      }
      .message {
        background-color: #f4f4f4;
        border-top: 4px solid  #5AB5E6; 
        border-bottom: 4px solid  #5AB5E6;
        padding: 40px 20px ;
        border-radius: 8px;
        margin-top: 20px;
        font-family: 'Roboto', sans-serif;
        
        font-weight: 400;
      }
      .message p{
        font-family: 'Roboto', sans-serif;
        
        font-weight: 500;
      }
    </style>
  </head>
  <body>
    <div class="container">
      
      <div class="message">
          <div style="text-align:center">
        <!--<img src="logo-set.png" alt="" srcset="" / style="height: 100px;width:-->
        <!--300;">-->
        <img src="http://beta.ccalerc.com/public/storage/logo-set.png" alt="" style="height: 80px; width: 270px;">

       
      </div>
      <div  style="text-align:center"><h2>Welcome to SETC Zone</h2></div>
        <p>
            
          <strong>Hi  ${req.body.user.first_name}' '${req.body.user.first_name}</strong>
        </p>
        <p>
          Thank you for your interest in the Self-employed Tax Credit, and
          congratulations on taking the first step towards claiming your credit!
          This tax credit can be up to $32,220!
        </p>
        <p>
          Our team understands that the process to claim your tax credit can be
          confusing, but we are here to guide you every step of the way. We have
          made our application process simple, with 3 steps:
        </p>
        <ol>
          <li>
            Fill out the online questionnaire at
            <a href="http://www.setczone.com">www.setczone.com</a>.
          </li>
          <li>Upload your documents (Tax returns for 2019, 2020, and 2021).</li>
          <li>Collect your funds $$$</li>
        </ol>
        <p>
          Within the next 72 hours, one of our team members will be reaching out
          to you to discuss the details of your application and to answer any
          questions that you may have.
        </p>
        <p>
          Please do not hesitate to reach out to us at
          <a href="mailto:support@setczone.com">support@setczone.com</a> if you
          have any questions or concerns; we are here to assist you.
        </p>
        <p>Here to help,<br />SETC Zone</p>
        <div style="text-align:center;">
            <a href="https://app.setczone.com/"><button type="button" class="btn btn-primary" style="background-color:#5ab5e6;border:1px #5ab5e6;padding:10px 40px;border-radius:10px" > Login</button></a>
        </div>
      </div>
    </div>
   
    <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.8/dist/umd/popper.min.js" integrity="sha384-I7E8VVD/ismYTF4hNIPjVp/Zjvgyol6VFvRkX/vR+Vc4jQkC+hVqc2pM8ODewa9r" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.min.js" integrity="sha384-BBtl+eGJRgqQAUMxJ7pMwbEyER4l1g+O15P+16Ep7Q9Q+zqX6gSbd85u4mG4QzX+" crossorigin="anonymous"></script>
    <script script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
</body>
  </body>
</html>
  `;

  let info = await transporter.sendMail({
    from: 'afaq58681@gmail.com',
    to: 'afaq58681@gmail.com', // list of receivers
    text: 'uogiiiiiiiisssssssssssss',
    html: htmlContent,
  });
  if (info.messageId) {
      console.log(info, 84)
      if (info.messageId) {
        console.log(info, 84);
   res.status(200).json({ code: 200, message: 'Email  has  been  sent  successfully'});
      } else {
        res.status(500).json({ code: 500, message: 'Server error' });
      }
    } 
}
// const updateUser = async (id, updateData) => {
//   try {

//     console.log(updateData);
//     const user = await User.findByPk(id);
//     if (!user) {
//       return { status: 404, error: 'User not found' };
//     }
//     // Dynamically update user properties based on updateData
//     for (const key in updateData) {
//       if (updateData.hasOwnProperty(key)) {
//         user[key] = updateData[key];
//       }
//     }

//     // Check if the 'step' property is being updated and its value is 0
//     if (updateData.hasOwnProperty('step') && updateData['step'] === 1  || updateData['step'] ===19) {


//       // For simplicity, let's assume there is a function to send an email in your userController
//     sendEmail();
    
//     }

//     // Save the changes to the database
//     await user.save();

//     return { status: 200, user: user.toJSON() };
//   } catch (error) {
//     console.error("Error updating user:", error);
//     return { status: 500, error };
//   }
// };

const updateUser = async (req, res) => {
  try {
      const id = req.user.id;
      let step = req.params.stepNumber;
      const nextstep = req.params.stepNumber;
      const prevstep = req.user.step;
      step = (nextstep >= prevstep) ? nextstep : prevstep;
      // Check if user.applicationStatus is true
      if (req.user.applicationStatus) {
          return res.status(400).json({ error: 'You have already submitted documents. Data cannot be updated.' });
      }
      const updatedUser = await userService.updateUser(id, { ...req.body, step: step });
      // Now it should be defined
      res.status(200).json(updatedUser);
  } catch (err) {
      res.status(500).json(err);
  }
};
const updateApplication = async (req, res) => {
  try {
      // Check if user.applicationStatus is true
      if (req.user.applicationStatus) {
          return res.status(400).json({ error: 'You have already submitted documents. Data cannot be updated.' });
      }
   const id  = req.user.id;
      const updatedUser = await userService.updateApplication(id);
      // Now it should be defined
      res.status(200).json(updatedUser);
  } catch (err) {
      res.status(500).json(err);
  }
};
const verification = async (req, res) => {
  try {
      // Check if user.applicationStatus is trues
     console.log("verification")
   const id  = req.body.id;
      const updatedUser = await userService.verfication(id);
      // Now it should be defined
      res.status(200).json(updatedUser);
  } catch (err) {
      res.status(500).json(err);
  }
};
const updateDocumentStaus = async (req, res) => {
  try {
      // Check if user.applicationStatus is true
      if (req.user.applicationWithDocument) {
          return res.status(400).json({ error: 'You have already submitted documents. Data cannot be updated.' });
      }
   const id  = req.user.id;
      const updatedUser = await userService.updateDocumentStatus(id);
      // Now it should be defined
      res.status(200).json(updatedUser);
  } catch (err) {
      res.status(500).json(err);
  }
};
const updateDocumentStatus = async (req, res) => {
  try {
      // Check if user.applicationStatus is true
      if (req.user.applicationWithDocument) {
          return res.status(400).json({ error: 'You have already submitted documents' });
      }
   const id  = req.user.id;
      const updatedUser = await userService.updateDocumentStaus(id);
      // Now it should be defined
      res.status(200).json(updatedUser);
  } catch (err) {
      res.status(500).json(err);
  }
};
const uploadForm = async (req, res) => {
  try {
const id=req.user.id;
const updatedUserFiles = {};
//Add files to the updatedUserFiles object only if they are present in the request
if (req.files.schedule_pdf) {
  updatedUserFiles.schedule_pdf_name = req.files.schedule_pdf[0].originalname;
  updatedUserFiles.schedule_pdf = req.files.schedule_pdf[0].path
}
console.log("UpdatedUserFiles",req.files.schedule_pdf);
  if (req.files.schedule_pdf) {   
console.log("UpdatedUserFiles 7777",updatedUserFiles);
      const uniqueIdentifier = req.files.schedule_pdf[0].path;
      updatedUserFiles.schedule_pdf = uniqueIdentifier;
    }
console.log("UpdatedUserFiles",updatedUserFiles);
console.log("UpdatedUserFiles",updatedUserFiles.schedule_pdf_name);
if (req.files.driving_licence) {
  updatedUserFiles.driving_licence_name = req.files.driving_licence[0].originalname;
  updatedUserFiles.driving_licence = req.files.driving_licence[0].path;
}
if (req.files.FormA1099) {
  updatedUserFiles.FormA1099_name = req.files.FormA1099[0].originalname;
  updatedUserFiles.FormA1099 = req.files.FormA1099[0].path;
}
if (req.files.FormB1099) {
  updatedUserFiles.FormB1099_name = req.files.FormB1099[0].originalname;
  updatedUserFiles.FormB1099 = req.files.FormB1099[0].path;
}
if (req.files.ks22020) {
  updatedUserFiles.ks22020_name = req.files.ks22020[0].originalname;
  updatedUserFiles.ks22020 = req.files.ks22020[0].path;
}
if (req.files.ks2020) {
  updatedUserFiles.ks2020_name = req.files.ks2020[0].originalname;
  updatedUserFiles.ks2020 = req.files.ks2020[0].path;
}
if (req.files.Tax_Return_2020) {
  updatedUserFiles.Tax_Return_2020_name = req.files.Tax_Return_2020[0].originalname;
  updatedUserFiles.Tax_Return_2020 = req.files.Tax_Return_2020[0].path;
}
if (req.files.Tax_Return_2021) {
  updatedUserFiles.Tax_Return_2021_name = req.files.Tax_Return_2021[0].originalname;
  updatedUserFiles.Tax_Return_2021 = req.files.Tax_Return_2021[0].path;
}
if (req.files.supplemental_attachment_2020) {
  updatedUserFiles.supplemental_attachment_2020_name = req.files.supplemental_attachment_2020[0].originalname;
  updatedUserFiles.supplemental_attachment_2020 = req.files.supplemental_attachment_2020[0].path;
}
if (req.files.supplemental_attachment_2021) {
  updatedUserFiles.supplemental_attachment_2021_name = req.files.supplemental_attachment_2021[0].originalname;
  updatedUserFiles.supplemental_attachment_2021 = req.files.supplemental_attachment_2021[0].path;
}
console.log("updated user files:",updatedUserFiles)
    const updatedUser = await userService.uploadForm(id,{...req.body,...updatedUserFiles,} );
// Now it should be defined
    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json(err);
  }
};
const uploadFormMOre = async (req, res) => {
  try {
    const id = req.user.id;
    const updatedUserFiles = {};
    // Process each field to handle multiple files
    Object.keys(req.files).forEach((field) => {
      const files = req.files[field];
      if (files) {
        updatedUserFiles[field] = files.map((file) => file.originalname);
        updatedUserFiles[`${field}_name`] = files.map((file) => file.path);
      }
    });
  // Create a folder in ShareFile
 // Call the createFolder function and pass req object
 //const folderCreationResult = await createFolder(req);
    console.log(updatedUserFiles,"updatedUserFiles",updatedUserFiles);
    const updatedUser = await userService.uploadForm(id, { ...req.body, ...updatedUserFiles });
    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json(err);
  }
};
// const uploadFormMOre = async (req, res) => {
//   try {
//     const id = req.user.id;
//     const updatedUserFiles = {};
//     // Process each field to handle multiple files
//     Object.keys(req.files).forEach((field) => {
//       const files = req.files[field];
//       if (files) {
//         updatedUserFiles[`${field}_name`] = files.map((file) => file.originalname);
//         updatedUserFiles[field] = files.map((file) => file.path);
//       }
//     });
//     console.log(updatedUserFiles,"updatedUserFiles",updatedUserFiles);
//     const updatedUser = await userService.uploadForm(id, { ...req.body, ...updatedUserFiles });
//     res.status(200).json(updatedUser);
//   } catch (err) {
//     res.status(500).json(err);
//   }
// };
const uploadfordashboard = async (req, res) => {
  try {
    const id = req.params.id;
    const updatedUserFiles = {};
    // Process each field to handle multiple files
    Object.keys(req.files).forEach((field) => {
      const files = req.files[field];
      if (files) {
        updatedUserFiles[`${field}_name`] = files.map((file) => file.originalname);
        updatedUserFiles[field] = files.map((file) => file.path);
      }
    });
    console.log(updatedUserFiles,"updatedUserFiles",updatedUserFiles);
    const updatedUser = await userService.uploadForm(id, { ...req.body, ...updatedUserFiles });
    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json(err);
  }
};
const checkEmail = async (req, res) => { 
  try {
    const { email } = req.body;
    // Check if the user with the provided email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      // If the user already exists, send a custom error response
      return res.status(400).json({ error: 'User with this email already exists.' });
    } else {
      // If the user doesn't exist, send a success message
      return res.status(200).json({ message: 'Email is available.' });
    }
  } catch (error) {
    console.error('Error checking email:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
 const sendotp = async (req, res) => {
  console.log(req.body)
  const _otp = `S-${Math.floor(100000 + Math.random() * 900000)}`
  let user = await User.findOne(  {
    where: {
      email: req.body.email,
    },
  })
  if (!user) {
    return res.status(500).json({ code: 500, message: 'User not found' });
  }
  let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.OUR_EMAIL,
        pass: process.env.EMAIL_PASSWORD 
      }
  })
  let info = await transporter.sendMail({
      from: 'afaq58681@gmail.com',
      to: req.body.email, // list of receivers
      subject: "OTP", // Subject line
      text: String(_otp),
  })
  if (info.messageId) {
      console.log(info, 84)
      if (info.messageId) {
        console.log(info, 84);
        // await user.update({
        //   otp: _otp,
        //   otpUsed: false,
        // });
        // Update the user's OTP and set otpUsed to false
await User.update(
  {
    otp: _otp,
    otpUsed: false,
  },
  {
    where: {
      id: user.id, 
    },
  }
);    res.status(200).json({ code: 200, message: 'OTP sent' });
      } else {
        res.status(500).json({ code: 500, message: 'Server error' });
      }
    } 
}
const submitotp = async (req, res) => {
  try {
   // Assuming you have the password in the request body
    // const result = await User.findOne({  where: {
    //   otp: req.body.otp,
    // }, });
    const result = await User.findOne({
      where: {
        otp: req.body.otp,
      },
    });
    if (!result) {
      return res.status(404).json({ code: 404, message: 'OTP not found' });
    }
    if (result.otpUsed) {
      return res.status(400).json({ code: 400, message: 'OTP already used' });
    }
    // Mark the OTP as used and update the password
   // Update the record where email matches and otpUsed is false
const updatedResult = await User.update(
  { otpUsed: true},
  {
    where: {
      email:result.email,
      otpUsed: false
    }
  }
);
// if (updatedResult[0] === 1) {

//   return res.status(200).json({ code: 200, message: 'Password updated' });
// } else {
//   return res.status(404).json({ code: 404, message: 'Email not found or OTP has already been used' });
// }
    // Call the login function to log in the user
    await userService.login(result.email, async (loginErr, loginResult) => {
      if (loginErr) {
        return res.status(400).json({ code: 400, message: 'Login failed after OTP verification', error: loginErr });
      }
      // Attach the generated token to the login result
      loginResult.token = auth.generateToken(
        loginResult.id.toString(),
        loginResult.email
      );
      // Send the response with the logged-in user details
      return res.status(200).json({
        code: 200,
        message: ' User logged in successfully',
        user: loginResult,
      });
    });
} catch (err) {
console.error(err); // Log the error for debugging
return res.status(500).json({ code: 500, message: 'Server error' });
}
};
const sendInvitation = async (req, res) => {
  console.log(req.body);
const{ email} = req.body
  // Generate a unique invitation token or link for registration.
  // You can use a library like `uuid` or generate a token with some data.
  const invitationToken = auth.generateToken(email); // Implement this function
  console.log(invitationToken);
  const decodedToken = jwt.decode(invitationToken);
  console.log(decodedToken)
  // Create a link for registration. This link should contain the invitation token.
  const registrationLink = ` http://localhost:3000/registerWithInvite?token=${invitationToken}`;
  let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.OUR_EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  let info = await transporter.sendMail({
    from: 'afaq58681@gmail.com',
    to: req.body.email, // List of receivers
    subject: 'Invitation to Register', // Subject line
    text: `Click on the following link to register: ${registrationLink}  `,
    html: `Click on the following link to register: <a href="${registrationLink}">${registrationLink}</a>`,
  });

  if (info.messageId) {
    User
      .update( { invitationToken },{ where:{email: req.body.email} },)
      .then(result => {
        res.send({ code: 200, message: 'Invitation sent' });
      })
      .catch(err => {
        res.send({ code: 500, message: 'Server error' });
      });
  } else {
    res.send({ code: 500, message: 'Server error' });
  }
};

//  const submitotp = (req, res) => {
//   console.log(req.body)


//   userModel.findOne({ otp: req.body.otp }).then(result => {

//       //  update the password 

//       userModel.updateOne({ email: result.email }, { password: req.body.password })
//           .then(result => {
//               res.send({ code: 200, message: 'Password updated' })
//           })
//           .catch(err => {
//               res.send({ code: 500, message: 'Server err' })

//           })


//   }).catch(err => {
//       res.send({ code: 500, message: 'otp is wrong' })

//   })
// }
// 8. Upload Image Controller
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'Images');
  },
  filename: (req, file, cb) => {
      cb(null, Date.now()+path.extname(file.originalname))
  }
})
const upload = multer({
  storage: storage,
  limits: { fileSize: '5000000'},
  fileFilter: (req, file, cb) => {
      const fileTypes = /jpeg|jpg|png|pdf/
      const mimeType = fileTypes.test(file.mimetype)  
      const extname = fileTypes.test(path.extname(file.originalname))
      if(mimeType && extname) {
          return cb(null, true)
      }
      cb('Give proper files formate to upload')
  }
}).fields([
  { name: 'schedule_pdf',maxCount:100000},
  { name: 'driving_licence',maxCount:100000},
  { name: 'FormA1099',maxCount:100000},
  { name: 'FormB1099',maxCount:100000},
  { name: 'ks22020',maxCount:100000},
  { name: 'ks2020',maxCount:100000},
  { name: 'Tax_Return_2020',maxCount:100000},
  { name: 'Tax_Return_2021',maxCount:100000},
  { name: 'supplemental_attachment_2020',maxCount:100000},
  { name: 'supplemental_attachment_2021',maxCount:100000},
  // Add more fields as needed
])
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const destinationPath = path.join(__dirname, 'Images');
//     cb(null, 'Images');
//   },
//   filename: (req, file, cb) => {
//       cb(null, Date.now() + path.extname(file.originalname))
//   }
// })
const uploadOne = multer({
  storage: storage,
  limits: { fileSize: '5000000' },
  fileFilter: (req, file, cb) => {
      const fileTypes = /jpeg|jpg|png|gif|pdf/
      const mimeType = fileTypes.test(file.mimetype)  
      const extname = fileTypes.test(path.extname(file.originalname))
      if(mimeType && extname) {
          return cb(null, true)
      }
      cb('Give proper files formate to upload')
  }
}).single('schedule_pdf')
//.fields([{ name: 'driving_licence', maxCount: 1 }, { name: 'FormA1099_name', maxCount: 1 },, { name: 'FormB1099_name', maxCount: 1 }, { name: 'ks22020', maxCount: 1 }, { name: 'ks2020', maxCount: 1 }, { name: 'Tax_Return_2020', maxCount: 1 }, { name: 'Tax_Return_2021', maxCount: 1 }, { name: 'supplemental_attachment_2020', maxCount: 1 }, { name: 'supplemental_attachment_2021', maxCount: 1 }, { name: 'supplemental_attachment_2021', maxCount: 1 }]);
const updateApplicationStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    // Assuming you have a service method for updating application status
    const updatedStatus = await userService.updateApplicationStatus(userId, req.body.applicationStatus);
    res.status(200).json(updatedStatus);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
// Define the removeFile controller function
// const removeFile = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     console.log("objectnjnjjjjnjjjnjn",userId)
//     const {schedule_pdf,driving_licence} = req.body
//     if(schedule_pdf){
//  req.user.schedule_pdf=null
//  req.user.schedule_pdf_name=null

//     }
//     console.log("schedule_pdf",schedule_pdf,"driving_licence",driving_licence)
   
//     let fileName;
//     if(driving_licence){
   
//      fileName = path.basename(schedule_pdf);
//     }
//     // Construct the file path
//     const filePath = path.join(__dirname, '../Images', fileName); // Adjust the path based on your project structure
//     // Check if the file exists
//     console.log(filePath)
//     if (fs.existsSync(filePath)) {
//      console.log("File Path....",filePath);
//      // Extract the file name from the full path
// const fileName = path.basename(filePath);
// console.log("filenamee",fileName)
//       // Remove the file
//       fs.unlinkSync(filePath);
//        // Update your database to remove the file reference
//       res.status(200).json({ message: 'File removed successfully.' });
//     } else {
//       res.status(404).json({ error: 'File not found.' });
//     }
//   } catch (err) {
//     console.error('Error removing file:', err);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// };
const removeFile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fieldToDelete } = req.body;
console.log(fieldToDelete,"field to delete")
    if (!fieldToDelete) {
      return res.status(400).json({ error: 'Field to delete is required.' });
    }
    // Assuming you are using some kind of database model (e.g., Mongoose)
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    // Check if the specified field exists in the user's document
    console.log("user[fieldToDelete]",user[fieldToDelete])
    if (user[fieldToDelete]) {
      // Extract the file name from the full path
      const fileName = path.basename(user[fieldToDelete]);
      // Construct the file path
      const filePath = path.join(__dirname, '../Images', fileName);
      // Check if the file exists
      if (fs.existsSync(filePath)) {
        // Remove the file
        fs.unlinkSync(filePath);
        // Update the database field
        user[fieldToDelete] = null;
        // Assuming you have a field named schedule_pdf_name in your model
        user[`${fieldToDelete}_name`] = null;
        await user.save(); // Save the changes to the database
        res.status(200).json({ message: 'File removed successfully.' });
      } else {
        res.status(404).json({ error: 'File not found.' });
      }
    } else {
      res.status(400).json({ error: `Field ${fieldToDelete} is  Already deleted or  empty.` });
    }
  } catch (err) {
    console.error('Error removing file:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
// const deleteFileHandler = async (req, res) => {
//   try {
//     const userId = req.params.userId;
//     const fieldName = req.params.fieldName;
//     const fileName = req.params.fileName;

//     const user = await User.findByPk(userId);
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     // Check if the field exists and is an array
//     if (Array.isArray(user[fieldName]) && user[fieldName].length > 0) {
//       // Find the index of the file in the array
//       const fileIndex = user[fieldName].indexOf(fileName);

//       // If the file is found, remove it from the array
//       if (fileIndex !== -1) {
//         user[fieldName].splice(fileIndex, 1);
//         await user.save();
//         return res.status(200).json({ message: 'File deleted successfully' });
//       }
//     }

//     // If the file or field is not found, return an error
//     return res.status(404).json({ error: 'File not found or field is not an array' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };
const deleteFileHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const fieldName = req.body.fieldName;
    const fileName = req.body.fileName;
    const originalFieldName = req.body.originalFieldName;
    const originalName=req.body.originalName
    console.log(userId,"...2...",originalName,"..3....",originalFieldName)
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Check if the field exists and is an array
    if (Array.isArray(user[fieldName]) && user[fieldName].length > 0) {
      // Find the index of the file in the array
      const fileIndex = user[fieldName].indexOf(fileName);
      // If the file is found, remove it from the array
      if (fileIndex !== -1) {
        console.log("fileIndex.......................",fileIndex)
        const filePath = user[fieldName][fileIndex]; // Get the file path
        console.log(filePath,"fileIndexPath")
        // Remove the file from the file system
       // await fs.unlink(filePath);
        await fs.unlink(filePath, (err) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error deleting file' });
          }})
       //  Remove the file reference from the array
        user[fieldName].splice(fileIndex, 1);
        user[fieldName] = user[fieldName].filter((file) => file !== filePath); // Remove the file from the array
               // Assuming you have a field named schedule_pdf_name in your model
        user[originalFieldName] = user[originalFieldName].filter((file) => file !== originalName);
        // Save the changes to the database
        await user.save({ fields: [fieldName, originalFieldName] });
        return res.status(200).json({ message: 'File deleted successfully' });
      }
    }
    // If the file or field is not found, return an error
    return res.status(404).json({ error: 'File not found or field is not an array' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
const setCFormData = async (req, res) => {
  try {
    const formData = req.body;
    const { id } = req.params;
    // Finding greater amounts
    console.log("........................................")
    function findGreaterAmount(...netIncomes) {
      return Math.max(...netIncomes);
    }
    // const greaterAmount2020 = findGreaterAmount(formData.net_income_2019, formData.net_income_2020);
    const greaterAmount2020 = findGreaterAmount(convertToNumeric(formData.net_income_2019), convertToNumeric(formData.net_income_2020));
    console.log("yyyyyyyyyyyyyyyyyy",(formData.net_income_2019))
    // const greaterAmount2021 = findGreaterAmount(formData.net_income_2019, formData.net_income_2020, formData.net_income_2021);
 const greaterAmount2021 = findGreaterAmount(convertToNumeric(formData.net_income_2019), convertToNumeric(formData.net_income_2020), convertToNumeric(formData.net_income_2021));
    // Start Step 1 Calculation Process
    console.log("yyyyyyyyyyyyyyyyyy",convertToNumeric(formData.net_income_2019),convertToNumeric(formData.net_income_2020),convertToNumeric(formData.net_income_2021))
    const netIncomeThresholdStep1 = 132886;
    const maxSickLeaves = 10; // 10 days
    const adwThresholdStep1 = 511.10;
    const maxCreditAmountThresholdStep1 = 5111;
    const remainingNetIncome2020Step1 = (greaterAmount2020 > netIncomeThresholdStep1) ? (greaterAmount2020 - netIncomeThresholdStep1) : 0;
    const remainingNetIncome2021Step1 = (greaterAmount2021 > netIncomeThresholdStep1) ? (greaterAmount2021 - netIncomeThresholdStep1) : 0;
    console.log("remainingNetIncome2020Step1",remainingNetIncome2020Step1,"remainingNetIncome2021Step1",remainingNetIncome2021Step1);
    console.log("1days",formData['1days'])
       console.log("2days",formData['2days'])
    const leaveDays2020Step1 = Math.min(maxSickLeaves, formData['1days']);
    const leaveDays2021Step1 = Math.min(maxSickLeaves, formData['2days']);
       // Assuming you have the values defined for leave_days_2020_step_1, leave_days_2021_step_1, and max_sick_leaves
let remaining_leave_days_2020_step_1 = (leaveDays2020Step1 > maxSickLeaves) ? leaveDays2020Step1 - maxSickLeaves : null;
let remaining_leave_days_2021_step_1 = (leaveDays2021Step1 > maxSickLeaves) ? leaveDays2021Step1 - maxSickLeaves : null;
    const adw2020Step1 = (greaterAmount2020 > netIncomeThresholdStep1) ? netIncomeThresholdStep1 / 260 : greaterAmount2020 / 260 ;
    const adw2021Step1 = (greaterAmount2021 > netIncomeThresholdStep1) ? netIncomeThresholdStep1 / 260 : greaterAmount2021/260;
   console.log("adw2020Step1",adw2020Step1)
    console.log("adw2020Step1",adw2021Step1)
    const creditAmount2020Step1 = parseFloat((adw2020Step1 * leaveDays2020Step1).toFixed(1));
    const creditAmountRemaining2020Step1 = (creditAmount2020Step1 > maxCreditAmountThresholdStep1) ? creditAmount2020Step1 - maxCreditAmountThresholdStep1 : 0;
    const creditAmount2020Step1Final = (creditAmount2020Step1 > maxCreditAmountThresholdStep1) ? maxCreditAmountThresholdStep1 : creditAmount2020Step1;
    const creditAmount2021Step1 = parseFloat((adw2021Step1 * leaveDays2021Step1).toFixed(1));
    const creditAmountRemaining2021Step1 = (creditAmount2021Step1 > maxCreditAmountThresholdStep1) ? creditAmount2021Step1 - maxCreditAmountThresholdStep1 : 0;
    const creditAmount2021Step1Final = (creditAmount2021Step1 > maxCreditAmountThresholdStep1) ? maxCreditAmountThresholdStep1 : creditAmount2021Step1;

console.log("Data of  step  1  ")
console.log("net_income_2019:", formData.net_income_2019);
console.log("net_income_2020:", formData.net_income_2020);
console.log("net_income_2021:", formData.net_income_2021);
console.log("net_income_threshold_step_1:",netIncomeThresholdStep1);
console.log("greater_amount_2020:", greaterAmount2020);
console.log("greater_amount_2021:", greaterAmount2021);
console.log("remaining_net_income_2020_step_1:", creditAmountRemaining2020Step1);
console.log("remaining_net_income_2021_step_1:", creditAmountRemaining2021Step1);
console.log("credit_amount_2020_step_1:", creditAmount2020Step1);
console.log("credit_amount_2021_step_1:", creditAmount2021Step1);
console.log("credit_amount_remaining_2020_step_1:", creditAmountRemaining2020Step1);
console.log("credit_amount_remaining_2021_step_1:", creditAmountRemaining2021Step1);
console.log("adw_2020_step_1:", adw2020Step1);
console.log("adw_2021_step_1:", adw2021Step1);
console.log("max_credit_amount_threshold_step_1:", maxCreditAmountThresholdStep1);
console.log("applied_leave_days_2020_step_1:", formData['1days']);
console.log("applied_leave_days_2021_step_1:", formData['2days']);
console.log("leave_days_2020_step_1:", leaveDays2020Step1);
console.log("leave_days_2021_step_1:", leaveDays2021Step1);


const net_income_threshold_step_2 = 77480;
const adw_threshold_step_2 = 298;
const max_credit_amount_threshold_step_2 = 2000;
const remaining_net_income_2020_step_2 = (greaterAmount2020 > net_income_threshold_step_2) ? (greaterAmount2020 - net_income_threshold_step_2) : 0;
const remaining_net_income_2021_step_2 = (greaterAmount2021 > net_income_threshold_step_2) ? (greaterAmount2021 - net_income_threshold_step_2) : 0;
const leave_days_2020_step_2 = parseInt(formData['3days']);
const leave_days_2021_step_2 = parseInt(formData['4days']);
let step_2_leave_calculate_2020;
if (leaveDays2020Step1 < maxSickLeaves) {
    step_2_leave_calculate_2020 = (leaveDays2020Step1 + leave_days_2020_step_2 >= maxSickLeaves) ?
        maxSickLeaves - leaveDays2020Step1 :
         leave_days_2020_step_2;
} else {
    step_2_leave_calculate_2020 = 0;
}
let step_2_leave_calculate_2021;
if (leaveDays2020Step1 < maxSickLeaves) {
    step_2_leave_calculate_2021 = (leaveDays2021Step1 + leave_days_2021_step_2 >= maxSickLeaves) ?
        maxSickLeaves - leaveDays2021Step1 :
         leave_days_2021_step_2;
} else {
    step_2_leave_calculate_2021 = 0;
}
const adw_2020_step_2 = ((greaterAmount2020 > net_income_threshold_step_2) ? net_income_threshold_step_2 : greaterAmount2020) / 260;
const adw_2021_step_2 = ((greaterAmount2021 > net_income_threshold_step_2) ? net_income_threshold_step_2 : greaterAmount2021) / 260;
const credit_amount_2020_step_2 = Math.min(max_credit_amount_threshold_step_2, parseFloat((0.67 * (adw_2020_step_2 * step_2_leave_calculate_2020)).toFixed(1)));
console.log(credit_amount_2020_step_2,"credit_amount_2020_step_2.........................................")
const credit_amount_2021_step_2 = Math.min(max_credit_amount_threshold_step_2, parseFloat((0.67 * (adw_2021_step_2 * step_2_leave_calculate_2021)).toFixed(1)));
console.log(credit_amount_2021_step_2,"credit_amount_2021_step_2.........................................")
const credit_amount_2020_step_1_and_step_2 = creditAmount2020Step1 + credit_amount_2020_step_2;
const credit_amount_2021_step_1_and_step_2 = creditAmount2021Step1 + credit_amount_2021_step_2;
const credit_amount_step_1_and_step_2 = credit_amount_2020_step_1_and_step_2 + credit_amount_2021_step_1_and_step_2;
// console.log("adw_2020_step_2",adw_2020_step_2)
// console.log("adw_2021_step_2",adw_2021_step_2)
// console.log("credit_amount_2020_step_2",credit_amount_2020_step_2)
// console.log("credit_amount_2021_step_2",credit_amount_2021_step_2)
// console.log("credit_amount_2020_step_1_and_step_2",credit_amount_2020_step_1_and_step_2)
// console.log("credit_amount_2021_step_1_and_step_2",credit_amount_2021_step_1_and_step_2)
// console.log(" credit_amount_step_1_and_step_2", credit_amount_step_1_and_step_2)
console.log("Data of  step  2  ")
console.log("net_income_threshold_step_2:", net_income_threshold_step_2);
console.log("greater_amount_2020:", greaterAmount2020);
console.log("greater_amount_2021:", greaterAmount2021);
console.log("remaining_net_income_2020_step_2:", remaining_net_income_2020_step_2);
console.log("remaining_net_income_2021_step_2:", remaining_net_income_2021_step_2);
console.log(" credit_amount_2020_step_2:", credit_amount_2020_step_2);
console.log(" credit_amount_2021_step_2:",  credit_amount_2021_step_2);
console.log("credit_amount_remaining_2021_step_1:", creditAmountRemaining2021Step1);
console.log("adw_2020_step_2:", adw_2020_step_2);
console.log("adw_2021_step_2:", adw_2021_step_2);
console.log("max_credit_amount_threshold_step_1:", max_credit_amount_threshold_step_2);
console.log("applied_leave_days_2020_step_2:", formData['3days']);
console.log("applied_leave_days_2021_step_2:", formData['4days']);
console.log("step_2_leave_calculate_2020:", step_2_leave_calculate_2020);
console.log("lstep_2_leave_calculate_2021:", step_2_leave_calculate_2021);
console.log(" credit_amount_2020_step_1_and_step_2",credit_amount_2020_step_1_and_step_2)
console.log(" credit_amount_2021_step_1_and_step_2",credit_amount_2021_step_1_and_step_2)
console.log(" credit_amount_step_1_and_step_2",credit_amount_step_1_and_step_2)
// End Step 2 Calculation Process
// Start Step 3 Calculation Process
const net_income_threshold_step_3 = net_income_threshold_step_2;
const adw_threshold_step_3 = adw_threshold_step_2;
const school_leaves_2020_threshold_step_3 = 50;
const school_leaves_2021_threshold_step_3 = 60;
const max_credit_amount_threshold_step_3 = 10000;
const remaining_net_income_2020_step_3 = (greaterAmount2020 > net_income_threshold_step_3) ? (greaterAmount2020 - net_income_threshold_step_3) : 0;
const remaining_net_income_2021_step_3 = (greaterAmount2021 > net_income_threshold_step_3) ? (greaterAmount2021 - net_income_threshold_step_3) : 0;
const leave_days_2020_step_3 = parseInt(formData['5days']);
const leave_days_2021_step_3 = parseInt(formData['6days']);
const step_3_leave_calculate_2020 = (leave_days_2020_step_3 >= school_leaves_2020_threshold_step_3) ? school_leaves_2020_threshold_step_3 : leave_days_2020_step_3;
const step_3_leave_calculate_2021 = (leave_days_2021_step_3 >= school_leaves_2021_threshold_step_3) ? school_leaves_2021_threshold_step_3 : leave_days_2021_step_3;
const adw_2020_step_3 = ((greaterAmount2020 > net_income_threshold_step_3) ? net_income_threshold_step_3 : greaterAmount2020) / 260;
const adw_2021_step_3 = ((greaterAmount2021 > net_income_threshold_step_3) ? net_income_threshold_step_3 : greaterAmount2021) / 260;
const credit_amount_2020_step_3 = Math.min(max_credit_amount_threshold_step_3, parseFloat((0.67 * (adw_2020_step_3 * step_3_leave_calculate_2020)).toFixed(1)));
const credit_amount_2021_step_3 = Math.min(max_credit_amount_threshold_step_3, parseFloat((0.67 * (adw_2021_step_3 * step_3_leave_calculate_2021)).toFixed(1)));
console.log(step_3_leave_calculate_2021,"uoggggggg")
// Assuming credit_amount_step_1_and_step_2 is defined from previous calculations
const total_credit_amount_step_3 = credit_amount_2020_step_3 + credit_amount_2021_step_3;
const final_credit_amount = total_credit_amount_step_3 + credit_amount_step_1_and_step_2;
console.log("Data  of  step  3")
console.log("credit_amount_2020_step_3",credit_amount_2020_step_3)
console.log("credit_amount_2021_step_3",credit_amount_2021_step_3)
console.log("total_credit_amount_step_3",total_credit_amount_step_3,"final_credit_amount",final_credit_amount)
// End Step 3 Calculation Process
function roundToNearestDownThousand(value) {
  return Math.ceil(value / 1000) * 1000;
}
// Example usage:
const inputValue = final_credit_amount;
const roundedValue = roundToNearestDownThousand(inputValue);
console.log("rounded  value.",roundedValue); 
    // ... Continue with the rest of your calculations
    // Assuming you have an AppSetczones model defined
    const updateableData = {
      net_income_2019: formatCurrency(`${formData.net_income_2019}`),
      net_income_2020: formatCurrency(`${formData.net_income_2020}`),
      net_income_2021: formatCurrency(`${formData.net_income_2021}`),
      net_income_threshold_step_1:   formatCurrency(`${netIncomeThresholdStep1}`),
      greater_amount_2020_step_1: formatCurrency(`${greaterAmount2020}`),
      greater_amount_2021_step_1: formatCurrency(`${greaterAmount2021}`),
      remaining_net_income_2020_step_1: formatCurrency(`${remainingNetIncome2020Step1}`),
      remaining_net_income_2021_step_1: formatCurrency(`${remainingNetIncome2021Step1}`) ,
      credit_amount_2020_step_1: formatCurrency(`${creditAmount2020Step1}`) ,
      credit_amount_2021_step_1: formatCurrency(`${creditAmount2021Step1}`),
      credit_amount_remaining_2020_step_1:formatCurrency(`${creditAmountRemaining2020Step1}`),
      credit_amount_remaining_2021_step_1:formatCurrency( `${creditAmountRemaining2021Step1}`),
      adw_2020_step_1:formatCurrency(`${ adw2020Step1}`),
      adw_2021_step_1: formatCurrency(`${ adw2021Step1}`),
      max_credit_amount_threshold_step_1:formatCurrency(`${ maxCreditAmountThresholdStep1}`) ,
      applied_leave_days_2020_step_1: parseInt(formData['1days']),
      applied_leave_days_2021_step_1: parseInt(formData['2days']),
      leave_days_2020_step_1: leaveDays2020Step1,
      leave_days_2021_step_1: leaveDays2021Step1,
      net_income_threshold_step_2: formatCurrency(`${ net_income_threshold_step_2}`) ,
      greater_amount_2020_step_2:formatCurrency(`${ greaterAmount2020}` ),
      greater_amount_2021_step_2: formatCurrency(`${ greaterAmount2021}` ) ,
      remaining_net_income_2020_step_2: formatCurrency(`${ remaining_net_income_2020_step_2}` ),
      remaining_net_income_2021_step_2: formatCurrency(`${ remaining_net_income_2021_step_2}` ) ,
      credit_amount_2020_step_2:formatCurrency(`${ credit_amount_2020_step_2}` ) ,
      credit_amount_2021_step_2:formatCurrency(`${ credit_amount_2021_step_2}` ),
      adw_2020_step_2: formatCurrency(`${ adw_2020_step_2}` ) ,
      adw_2021_step_2:  formatCurrency(`${ adw_2021_step_2}` ),
      applied_leave_days_2020_step_2: parseInt(formData['3days']),
      applied_leave_days_2021_step_2: parseInt(formData['4days']),
      leave_days_2020_step_2: leave_days_2020_step_2,
      leave_days_2021_step_2: leave_days_2021_step_2,
      step_2_leave_calculate_2020: step_2_leave_calculate_2020,
      step_2_leave_calculate_2021: step_2_leave_calculate_2021,
      max_credit_amount_threshold_step_2: formatCurrency(`${ max_credit_amount_threshold_step_2}` ),
      credit_amount_2020_step_2: formatCurrency(`${credit_amount_2020_step_2}` ),
      credit_amount_2021_step_2: formatCurrency(`${ credit_amount_2021_step_2}` ),
      credit_amount_2020_step_1_and_step_2: formatCurrency(`${ credit_amount_2020_step_1_and_step_2}` ) ,
      credit_amount_2021_step_1_and_step_2:  formatCurrency(`${ credit_amount_2021_step_1_and_step_2}` ),
      credit_amount_step_1_and_step_2: formatCurrency(`${ credit_amount_step_1_and_step_2}` ) ,
      net_income_threshold_step_3: formatCurrency(`${ net_income_threshold_step_3}` ) ,
      greater_amount_2020_step_3: formatCurrency(`${ greaterAmount2020}` ) ,
      greater_amount_2021_step_3:  formatCurrency(`${ greaterAmount2021}` ),
      remaining_net_income_2020_step_3: formatCurrency(`${ remaining_net_income_2020_step_3}` ) ,
      remaining_net_income_2021_step_3:  formatCurrency(`${ remaining_net_income_2021_step_3}` ),
      credit_amount_2020_step_3: formatCurrency(`${ credit_amount_2020_step_3}` ) ,
      credit_amount_2021_step_3:  formatCurrency(`${ credit_amount_2021_step_3}` ),
      adw_2020_step_3: formatCurrency(`${adw_2020_step_3}` ) ,
      adw_2021_step_3:  formatCurrency(`${ adw_2021_step_3}` ),
      applied_leave_days_2020_step_3: parseInt(formData['5days']),
      applied_leave_days_2021_step_3: parseInt(formData['6days']),
      leave_days_2020_step_3: leave_days_2020_step_3,
      leave_days_2021_step_3: leave_days_2021_step_3,
      step_3_leave_calculate_2020: step_3_leave_calculate_2020,
      step_3_leave_calculate_2021: step_3_leave_calculate_2021,
      max_credit_amount_threshold_step_3: formatCurrency(`${ max_credit_amount_threshold_step_3}` ) ,
      credit_amount_2020_step_3:  formatCurrency(`${ credit_amount_2020_step_3}` ),
      credit_amount_2021_step_3:  formatCurrency(`${ credit_amount_2021_step_3}` ),
      total_credit_amount_step_3:  formatCurrency(`${ total_credit_amount_step_3}`),
      final_credit_amount: formatCurrency(`${final_credit_amount}` ),
 
      final_roundedValue: formatCurrency(`${roundedValue}`),
    };
const updatedUser = await userService.updateCalculator(req.user.id, updateableData );
// Now it should be defined
    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json(err);
  }
};
async function webhook(req,res){
  console.log(req.body);
}
const dataPosttoHubspot = async (req, res) => {
  try {
    const apiUrl = 'https://api.hubapi.com/crm/v3/objects/contacts';
    const accessToken = 'pat-na1-e0698d65-4c2f-4229-9c32-aadb201ed31d';
    const response = await axios.post(apiUrl, req.body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
 
    console.log(response.data.id)
    console.log("rizwan  sb........................")

    console.log(response.data.properties.amout,"response.data.amout")
    
    const user =await User.findByPk(response.data.properties.amout)
    user.hubspot_record_id=response.data.id;
    console.log(user,"user")
    await user.save();
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
    res.status(500).send('Internal Server Error');
  }
}; 
const deleteUserById = async (userId, authenticatedUserId) => {
  try {
    // Find the user by ID
    const user = await User.findByPk(userId);
    if (user) {
      // Check if the user ID matches the authenticated user ID
      if (user.userId === authenticatedUserId) {
        // Delete the user
        await user.destroy();
        return { success: true, message: 'User has been deleted.' };
      } else {
        return { success: false, message: 'You can delete only your account!' };
      }
    } else {
      return { success: false, message: 'User not found!' };
    }
  } catch (err) {
    // Log the error or handle it as needed
    console.error(err);
    return { success: false, message: 'Internal Server Error' };
  }
};

async function generatePDF(req, res) {
  console.log(".............................")
  const data = req.body;

  try {
    console.log(data);
    const pdfPath = await createPDF(data);
    console.log('PDF saved successfully:', pdfPath);
    res.status(200).send('PDF generated successfully.');
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('Internal Server Error');
  }
}

function createPDF(data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const stream = fs.createWriteStream('receipt.pdf');
      doc.pipe(stream);

      doc.fontSize(14).text(`Receipt for ${data.name}`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Product: ${data.productName}`);
      doc.text(`Price: $${data.price}`);
      doc.moveDown();
      doc.text('Paid', { align: 'center', bold: true });
      doc.end();
      stream.on('finish', () => {
        console.log('PDF saved successfully.');
        resolve('receipt.pdf');
      });
      stream.on('error', (error) => {
        console.error('Error saving PDF:', error);
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}


async function getToken(){
  console.log("get token")
  const url='https://choudhrycom.sharefile.com/oauth/token';
  const headers={
      'Content-Type':'application/x-www-form-urlencoded'
  }
  const cid='9LUPqG5ZgCsyJLrfslQXTLAXwcCwZAgD'
  const cs='FqW44j6xSFYhB8M1ofKBWpOXEBRPpaZY86N24W3RI1EFrowx'
  const body = {
      'grant_type':'refresh_token',
      'refresh_token':'RPWZI34DoTJxbYVLUDu9zdODG0cCjML3$$Q9r0aHuGlgjYpI30ENielhaF7rMda5K79cI2IcAG',
      client_id:cid,
      client_secret:cs
  }
  try {
      const response = await axios.post(url, body, { headers });
      console.log("refresh  token  responw",response)
      return response.data;
    } catch (error) {
      throw error;
    }
  }

const createFolder = async (req, res) => {
  try {
    const folderData = {  
             Name: "wo4pl6272o@gamil.com",
             Parent: {
              Id: 'root',
            },
    };
    const tokenReq= await getToken();
    const accessToken = tokenReq.access_token; 
    console.log(accessToken,'accessToken');

    // Make a request to ShareFile API to create a folder
    const createFolderResponse = await axios.post('https://choudhrycom.sf-api.com/sf/v3/Items(root)/Folder', folderData, {
      headers: {
        Authorization: 'Bearer ' + accessToken,
      },
    });
    // You can handle the response from ShareFile as needed
    console.log('Folder created:', createFolderResponse.data.Id);
    // Check if the folder creation was successful before proceeding to upload the file
    if (createFolderResponse.data.Id) {
      // Call the upload file function with the created folder I
      const uploadFileResponse = await uploadFile({
        accessToken:  accessToken ,
        body: { folderId: createFolderResponse.data.Id }, // Assuming the folder ID is present in the response
      });
      if (uploadFileResponse) {
        console.log('Folder created and file uploaded successfully');
        return {
          message: 'Folder created and file uploaded successfully',
          folderId: createFolderResponse.data.Id,
        };
      } else {
        console.log('File upload failed');
        return 'File upload failed';
      }
   
    } else {
      return 'Folder creation failed';
    }
  } catch (error) {
    console.error('Error creating folder:', error.message);
    return error;
  }
};const uploadFile = async (req, res) => {
  try {
    console.log('file creation strt')
    const folderId = req.body.folderId; 
    // Assuming you're using multer or similar for file uploads
  
    const initialResponse = await axios.post(
      `https://choudhrycom.sf-api.com/sf/v3/Items(${folderId})/Upload`,
      {
        // Your request body if needed
      },
      {
        headers: {
          Authorization: 'Bearer ' + req.accessToken, // Assuming you have the user's access token in req.accessToken
          'Content-Type': 'application/json', // Adjust content type as needed
        },
      }
    );
    // Check if the initial upload was successful
    if (initialResponse) {
      const chunkUri = initialResponse.data.ChunkUri;
      console.log(chunkUri,"uuurrriiiii")
      const token =req.accessToken;
// Create a FormData object
const fileName ="1701232864187.png";
// const fileUrl = 'F:/Erc-System-Angular-Project/Erc-System-Angular/API/Images/1701167991709.png';
const fileUrlArray=["Images\\1701232505551.pdf","Images\\1701232676663.pdf","Images\\1701232807205.pdf"]
const fileNameArray =[
'1701232505551.pdf', '1701263425866.pdf','1701369178133.pdf'
]

const formData = new FormData();

for (let i = 0; i < fileUrlArray.length; i++) {
try {
  // Read the file data for the current iteration
  const fileData = await fs.readFileSync(fileUrlArray[i]);
console.log(fileData);
  // Append the file data to the existing formData
  formData.append(folderId, fileData, { filename: fileNameArray[i] });
} catch (error) {
  console.error('Error reading file:', fileUrlArray[i], error.message);
}
}

try {
// Send formData with axios after appending all files
const chunkResponse = await axios.post(chunkUri, formData, {
  headers: {
    Authorization: `Bearer ${req.accessToken}`,
    ...formData.getHeaders(), // Include form data headers
  },
});

console.log("chunkResponse->", chunkResponse.data);

// Check if the chunk upload was successful
if (chunkResponse.status === 200) {
  console.log('Files uploaded successfully');
  return chunkResponse.data

} else {
  console.error('Error uploading files:', chunkResponse.data);
  return chunkResponse.data
}
} catch (error) {
console.error('Error uploading files:', error.message);
return error
}


    


    } else {
      console.error('Error uploading file:', initialResponse.data);
      return res.status(500).send('Error uploading file');
    }
  } catch (error) {
    console.error('Error uploading file:', error.message);
    return res.status(500).send('Internal Server Error');
  }
};
module.exports = {
  registerViaInvite,
  register,
  login,
  getUser,
  getAllUser,
  getUserWithMail,
  updateUser,
  sendotp,
  submitotp,
  sendInvitation,
  upload,
  uploadOne,
  uploadForm,
  updateApplicationStatus,
  checkEmail,
  removeFile,
  updateApplication,
  getAllFiles,
updateDocumentStaus,
uploadFormMOre,
 deleteFileHandler,
 setCFormData,
 webhook,
 dataPosttoHubspot,
 generatePDF,
 createFolder,
 getById,
 uploadfordashboard,deleteUserById,
  sendEmail,
  senduserEmail,
  sendEmailonFirstStep,
  sendEmailonNinteenStep,
  sendEmailonNinteenStep2,
  verification,
//  uploadFileToHubSpot
};
