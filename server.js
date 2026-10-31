
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const API_KEY = process.env.SPOONACULAR_API_KEY;

app.get("/api/spoonacular", async (req, res) => {
    try {
        const query = req.query.query || "chicken";

        const response = await fetch(
            `https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(query)}&number=12&addRecipeInformation=true&apiKey=${API_KEY}`
        );

        const data = await response.json();

        res.status(response.status).json(data);

    } catch (error) {
        res.status(500).json({
            message: "Unable to fetch recipes"
        });
    }
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Savora running at http://localhost:${PORT}`);
});
