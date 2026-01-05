const express = require("express");
const cors = require("cors");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const dotenv = require("dotenv");

const app = express();
app.use(express.json());
app.use(cors());
dotenv.config();

const razorpay = new Razorpay({
    key_id: process.env.key_id,
    key_secret: process.env.key_secret
});

app.get("/", (req, res) => {
    res.json({message: "Hello from server"});
})

app.post("/create-order", async (req, res) => {
    const {amount} = req.body;
    try {
        const order = await razorpay.orders.create({
            amount: amount*100,
            currency: "INR",
            receipt: "order_rcptid_11"
        })
        res.status(200).json(order);
    } catch(err) {
        res.status(500).json({error: "Something went wrong while creating order"});
    }
})

app.post("/validate-payment", (req, res) => {
    try {
        const {razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature} = req.body;
    
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: "Missing payment details" });
        }   
    
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
        .createHmac('sha256', process.env.key_secret)
        .update(body)
        .digest("hex");


        if(expectedSignature === razorpay_signature) {
            res.status(200).json({message: "Payment successful"});
        } else {
            res.status(400).json({error: "Payment failed"});
        }
    } catch(err) {
        console.error(err);
        res.status(500).json({error: "Something went wrong while validating payment", error: err});
    }
})

app.listen(5000, () => {
    console.log("Server started on port 5000");
})