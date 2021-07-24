require('dotenv').config()
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");

//mongoose.connect("mongodb://localhost:27017/contactsDB", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});
mongoose.connect(process.env.MONGO_ATLAS_PATH, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});

const contactSchema = {
    fName: String,
    lName: String,
    phone: String
};
const Contact = mongoose.model("Contact", contactSchema);

const messagesSchema = {
    name: String,
    date: String,
    time: String,
    otp: Number,
    messageId: String
}
const MessageLog = mongoose.model("Log", messagesSchema);

const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

var accountSid = process.env.TWILIO_ACCOUNT_SID; 
var authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

app.get("/", (req, res) => {
    res.render("home", {success: null});
});

app.get("/addContact", (req, res) => {
    res.render("addContact");
});

app.post("/", (req, res) => {
    const newContact = new Contact({
        fName: req.body.fName,
        lName: req.body.lName,
        phone: "+91"+req.body.phone
    });
    newContact.save(function(err){
        if(!err){
            res.render("home", {success: "Contact saved successfully"});
        }
        else {
            res.redirect("/addContact");
        }
    });
});

app.get("/listContacts", (req, res) => {
    Contact.find({}, function(err, contacts){
        if(!err){
            res.render("listContacts", {allContacts: contacts});
        }
    });
});

app.get("/info/:contactId", (req, res) => {
    const contactId = req.params.contactId;
    Contact.findOne({_id: contactId}, (err, contact) => {
        if(!err){
            res.render("contactInfo", {contact: contact});
        }
    });
});

app.get("/sendSMS/:contactId", (req, res) => {
    const contactId = req.params.contactId;
    Contact.findOne({_id: contactId}, (err, contact) => {
        if(!err){
            res.render("sendSMS", {contact: contact});
        }
    });
});

app.post("/sendSMS", (req, res) => {
    const date = new Date();
    client.messages
    .create(
        {
            body: req.body.message, 
            from: process.env.TWILIO_FROM_NUM, 
            to: req.body.phone
        })
    .then(message => {
        if(message.errorCode === null){
            const log = new MessageLog({
                name: req.body.name,
                date: date.toLocaleDateString('en-GB'),
                time: date.toLocaleTimeString(),
                otp: req.body.otp,
                messageId: message.sid
            });
            log.save();
            res.render("home", {success: "Message sent successfully"});
        }
        else {
            res.redirect("/listContacts");
        }
    });
});

app.get("/logs", (req, res) => {
    MessageLog.find({}).sort({ date : -1, time: -1 }).exec( function(err, logs){
        if(!err){
            res.render("sentMessages", {logs: logs});
        }
    });
});

app.listen(process.env.PORT || 3000, function () {
    console.log("Server started on port 3000");
});