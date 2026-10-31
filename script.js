// =====================================
// SAVORA - RECIPE FINDER
// =====================================

// API URL
const API_URL = "https://www.themealdb.com/api/json/v1/1";
const DUMMY_API_URL = "https://dummyjson.com/recipes";

// HTML ELEMENTS
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const recipeGrid = document.getElementById("recipeGrid");
const categoryList = document.getElementById("categoryList");
const recipeStatus = document.getElementById("recipeStatus");
const randomBtn = document.getElementById("randomBtn");

const recipeModal = document.getElementById("recipeModal");
const modalBody = document.getElementById("modalBody");
const closeModal = document.getElementById("closeModal");


// =====================================
// DISPLAY RECIPES
// =====================================

function displayRecipes(meals) {
    recipeGrid.innerHTML = "";

    if (!meals || meals.length === 0) {
        recipeStatus.textContent =
            "Sorry! No recipes found. Try another search.";
        return;
    }

    recipeStatus.textContent = `${meals.length} recipe(s) found.`;

    meals.forEach(meal => {
        const card = document.createElement("div");

        card.className = "recipe-card";

        card.innerHTML = `
            <img 
                src="${meal.strMealThumb}" 
                alt="${meal.strMeal}" 
                loading="lazy"
            >

            <div class="recipe-info">

                <span class="recipe-category">
                    ${meal.strCategory || "Delicious Recipe"}
                </span>

                <h3>${meal.strMeal}</h3>

                <p>${meal.strArea || "International"} Cuisine</p>

                <button 
                    class="view-btn"
                    data-id="${meal.idMeal}"
                    data-source="${meal.source || "themealdb"}"
                >
                    View Recipe →
                </button>

            </div>
        `;

        recipeGrid.appendChild(card);
    });
}


// =====================================
// SEARCH RECIPES
// THEMEALDB + DUMMYJSON
// =====================================

async function searchRecipes(query) {

    if (!query.trim()) {
        recipeStatus.textContent = "Please enter a recipe name.";
        recipeGrid.innerHTML = "";
        return;
    }

    recipeStatus.textContent = "Searching recipes...";
    recipeGrid.innerHTML = "";

    const [mealResult, dummyResult] = await Promise.allSettled([

        fetch(
            `${API_URL}/search.php?s=${encodeURIComponent(query)}`
        ).then(response => response.json()),

        fetch(
            `${DUMMY_API_URL}/search?q=${encodeURIComponent(query)}`
        ).then(response => response.json())

    ]);

    let allRecipes = [];

    // THEMEALDB RESULTS
    if (mealResult.status === "fulfilled") {
        const mealData = mealResult.value;

        if (mealData.meals) {
            allRecipes.push(...mealData.meals);
        }
    }

    // DUMMYJSON RESULTS
    if (dummyResult.status === "fulfilled") {
        const dummyData = dummyResult.value;

        const dummyRecipes = (dummyData.recipes || []).map(recipe => ({

            idMeal: `dummy-${recipe.id}`,

            strMeal: recipe.name,

            strMealThumb: recipe.image,

            strCategory: recipe.mealType?.[0] || "Recipe",

            strArea: "International",

            source: "dummyjson"

        }));

        allRecipes.push(...dummyRecipes);
    }

    if (
        mealResult.status === "rejected" &&
        dummyResult.status === "rejected"
    ) {
        recipeStatus.textContent =
            "Unable to connect to recipe APIs. Please try again.";

        return;
    }

    displayRecipes(allRecipes);
}


// =====================================
// SEARCH BUTTON AND ENTER KEY
// =====================================

searchBtn.addEventListener("click", () => {
    searchRecipes(searchInput.value);
});

searchInput.addEventListener("keydown", event => {

    if (event.key === "Enter") {
        searchRecipes(searchInput.value);
    }

});


// =====================================
// LOAD CATEGORIES
// =====================================

async function loadCategories() {

    try {

        const response = await fetch(
            `${API_URL}/categories.php`
        );

        const data = await response.json();

        categoryList.innerHTML = "";

        // ALL RECIPES BUTTON
        const allButton = document.createElement("button");

        allButton.textContent = "All Recipes";
        allButton.className = "category-btn active";

        allButton.addEventListener("click", () => {

            document.querySelectorAll(".category-btn").forEach(btn => {
                btn.classList.remove("active");
            });

            allButton.classList.add("active");

            searchRecipes("chicken");

        });

        categoryList.appendChild(allButton);


        // CATEGORY BUTTONS
        data.categories.forEach(category => {

            const button = document.createElement("button");

            button.textContent = category.strCategory;
            button.className = "category-btn";

            button.addEventListener("click", () => {

                document.querySelectorAll(".category-btn").forEach(btn => {
                    btn.classList.remove("active");
                });

                button.classList.add("active");

                filterByCategory(category.strCategory);

            });

            categoryList.appendChild(button);

        });

    } catch (error) {

        console.error("Category API Error:", error);

    }

}


// =====================================
// FILTER RECIPES BY CATEGORY
// =====================================

async function filterByCategory(category) {

    recipeStatus.textContent = "Loading recipes...";
    recipeGrid.innerHTML = "";

    try {

        const response = await fetch(
            `${API_URL}/filter.php?c=${encodeURIComponent(category)}`
        );

        const data = await response.json();

        displayRecipes(data.meals);

    } catch (error) {

        recipeStatus.textContent = "Unable to load this category.";

        console.error(error);

    }

}


// =====================================
// GET THEMEALDB RECIPE DETAILS
// =====================================

async function getRecipeDetails(id) {

    modalBody.innerHTML = "<p>Loading recipe details...</p>";

    recipeModal.classList.add("show");

    try {

        const response = await fetch(
            `${API_URL}/lookup.php?i=${encodeURIComponent(id)}`
        );

        const data = await response.json();

        if (!data.meals) {
            throw new Error("Recipe not found.");
        }

        displayRecipeDetails(data.meals[0]);

    } catch (error) {

        modalBody.innerHTML =
            "<p>Unable to load recipe details.</p>";

        console.error(error);

    }

}


// =====================================
// GET DUMMYJSON RECIPE DETAILS
// =====================================

async function getDummyRecipeDetails(id) {

    modalBody.innerHTML = "<p>Loading recipe details...</p>";

    recipeModal.classList.add("show");

    try {

        const response = await fetch(
            `${DUMMY_API_URL}/${id}`
        );

        const recipe = await response.json();

        const ingredients = recipe.ingredients
            .map(item => `<li>${item}</li>`)
            .join("");

        const instructions = recipe.instructions
            .map((item, index) => `
                <p>${index + 1}. ${item}</p>
            `)
            .join("");

        modalBody.innerHTML = `

            <img 
                src="${recipe.image}" 
                alt="${recipe.name}"
            >

            <span class="recipe-category">
                ${recipe.mealType?.[0] || "Recipe"}
            </span>

            <h2>${recipe.name}</h2>

            <p>Cuisine: International</p>

            <h3>Ingredients</h3>

            <ul>
                ${ingredients}
            </ul>

            <h3>Cooking Instructions</h3>

            ${instructions}

        `;

    } catch (error) {

        modalBody.innerHTML =
            "<p>Unable to load recipe details.</p>";

        console.error(error);

    }

}


// =====================================
// DISPLAY FULL THEMEALDB RECIPE DETAILS
// =====================================

function displayRecipeDetails(meal) {

    let ingredients = "";

    // GET INGREDIENTS
    for (let i = 1; i <= 20; i++) {

        const ingredient = meal[`strIngredient${i}`];

        const measure = meal[`strMeasure${i}`];

        if (ingredient && ingredient.trim() !== "") {

            ingredients += `
                <li>
                    ${measure || ""} ${ingredient}
                </li>
            `;

        }

    }


    modalBody.innerHTML = `

        <img 
            src="${meal.strMealThumb}" 
            alt="${meal.strMeal}"
        >

        <span class="recipe-category">
            ${meal.strCategory || "Recipe"}
        </span>

        <h2>${meal.strMeal}</h2>

        <p>
            ${meal.strArea || "International"} Cuisine
        </p>

        <h3>Ingredients</h3>

        <ul>
            ${ingredients}
        </ul>

        <h3>Cooking Instructions</h3>

        <p class="recipe-instructions">
            ${(meal.strInstructions || "").replace(/\r?\n/g, "<br>")}
        </p>

        ${
            meal.strYoutube
                ? `<a href="${meal.strYoutube}" target="_blank">
                    Watch Cooking Video
                   </a>`
                : ""
        }

    `;

}


// =====================================
// VIEW RECIPE BUTTON
// =====================================

recipeGrid.addEventListener("click", event => {

    const button = event.target.closest(".view-btn");

    if (!button) return;

    const recipeId = button.dataset.id;

    const source = button.dataset.source;

    if (source === "dummyjson") {

        const id = recipeId.replace("dummy-", "");

        getDummyRecipeDetails(id);

    } else {

        getRecipeDetails(recipeId);

    }

});


// =====================================
// RANDOM RECIPE
// =====================================

async function getRandomRecipe() {

    recipeStatus.textContent = "Finding a random recipe...";

    try {

        const response = await fetch(
            `${API_URL}/random.php`
        );

        const data = await response.json();

        displayRecipes(data.meals);

    } catch (error) {

        recipeStatus.textContent =
            "Unable to get a random recipe.";

        console.error(error);

    }

}

randomBtn.addEventListener("click", getRandomRecipe);


// =====================================
// CLOSE RECIPE MODAL
// =====================================

closeModal.addEventListener("click", () => {

    recipeModal.classList.remove("show");

});


// CLOSE MODAL WHEN CLICKING OUTSIDE
recipeModal.addEventListener("click", event => {

    if (event.target === recipeModal) {

        recipeModal.classList.remove("show");

    }

});


// CLOSE MODAL USING ESCAPE KEY
document.addEventListener("keydown", event => {

    if (event.key === "Escape") {

        recipeModal.classList.remove("show");

    }

});


// =====================================
// START WEBSITE
// =====================================

loadCategories();

searchRecipes("chicken");
```

