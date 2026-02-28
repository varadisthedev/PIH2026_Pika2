import express from "express";
import { clerkMiddleware, requireAuth } from "@clerk/express";

const app = express();

app.use(clerkMiddleware());

app.get("/protected", requireAuth(), (req, res) => {
    res.json({
        message: "Authorized",
        clerkId: req.auth.userId
    });
});