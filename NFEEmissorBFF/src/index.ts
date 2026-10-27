import express from "express";
import { AppDataSource } from "./data-source.js";
import { User } from "./entities/User.js";


const app = express();

app.get("/", (_req, res) => {
    res.send("Hello from TypeScript!");
});

app.listen(3000, () => console.log("Running on http://localhost:3000"));

await AppDataSource.initialize();

const userRepo = AppDataSource.getRepository(User);

// Create
const user = userRepo.create({ name: "Igor", email: "igor@example.com" });
await userRepo.save(user);

// Read
const found = await userRepo.findOneBy({ email: "igor@example.com" });
const all = await userRepo.find({ where: { name: "Igor" }, order: { createdAt: "DESC" } });

// Update / delete
await userRepo.update({ id: user.id }, { name: "Igor M." });
await userRepo.delete({ id: user.id });