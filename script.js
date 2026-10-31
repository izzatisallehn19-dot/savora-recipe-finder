




/* =====================================
   SAVORA - RECIPE FINDER
   3 RECIPE APIS
===================================== */

// API URLS

const THEMEALDB =
    "https://www.themealdb.com/api/json/v1/1";

const DUMMYJSON =
    "https://dummyjson.com/recipes";

const PAKISTANI =
    "https://pakistani.recipes/api/recipes.json";


// HTML ELEMENTS

const recipeGrid = document.getElementById("recipeGrid");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const apiStatus = document.getElementById("apiStatus");


// VARIABLES

let allRecipes = [];
let filteredRecipes = [];
let currentIndex = 0;

const recipesPerPage = 12;


// =====================================
// HELPER FUNCTIONS
// =====================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}


async function getJSON(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
    }

    return await response.json();
}


// =====================================
// API 1 - THEMEALDB
// =====================================

async function getThemealDB(query = "") {

    const url = query
        ? `${THEMEALDB}/search.php?s=${encodeURIComponent(query)}`
        : `${THEMEALDB}/search.php?s=`;

    const data = await getJSON(url);

    return (data.meals || []).map(meal => ({

        id: `meal-${meal.idMeal}`,

        name: meal.strMeal,

        image: meal.strMealThumb,

        category: meal.strCategory || "General",

        area: meal.strArea || "International",

        source: "themealdb",

        original: meal

    }));
}


// =====================================
// API 2 - DUMMYJSON
// =====================================

async function getDummyJSON(query = "") {

    const url = query
        ? `${DUMMYJSON}/search?q=${encodeURIComponent(query)}`
        : `${DUMMYJSON}?limit=30`;

    const data = await getJSON(url);

    return (data.recipes || []).map(recipe => ({

        id: `dummy-${recipe.id}`,

        name: recipe.name,

        image: recipe.image,

        category: recipe.mealType?.[0] || "General",

        area: recipe.cuisine || "International",

        source: "dummyjson",

        original: recipe

    }));
}


// =====================================
// API 3 - PAKISTANI RECIPES
// =====================================

async function getPakistaniRecipes(query = "") {

    const data = await getJSON(PAKISTANI);

    if (!Array.isArray(data)) {
        throw new Error("Pakistani API did not return a recipe list.");
    }

    const searchTerm = query.toLowerCase().trim();

    const recipes = data.filter(recipe => {

        const searchableText = [
            recipe.title,
            recipe.description,
            recipe.dishName,
            recipe.regionName,
            recipe.category
        ].filter(Boolean).join(" ").toLowerCase();

        return !searchTerm || searchableText.includes(searchTerm);

    });

    return recipes.map(recipe => ({

        id: `pak-${recipe.slug}`,

        name: recipe.title,

        image: recipe.image,

        category: recipe.dishName || recipe.category || "Pakistani Food",

        area: recipe.regionName || "Pakistan",

        source: "pakistani",

        original: recipe

    }));
}


// =====================================
// LOAD RECIPES FROM ALL APIS
// =====================================

async function loadRecipes(query = "") {

    recipeGrid.innerHTML = `
        <div class="loading-message">
            <p>Loading delicious recipes...</p>
        </div>
    `;

    apiStatus.textContent = "Connecting to 3 recipe APIs...";

    const apiCalls = await Promise.allSettled([

        getThemealDB(query),

        getDummyJSON(query),

        getPakistaniRecipes(query)

    ]);

    allRecipes = [];

    let successfulAPIs = 0;

    apiCalls.forEach((result, index) => {

        if (result.status === "fulfilled") {

            successfulAPIs++;

            allRecipes.push(...result.value);

        } else {

            console.error(
                `API ${index + 1} failed:`,
                result.reason
            );

        }

    });


    // REMOVE INVALID RECIPES

    allRecipes = allRecipes.filter(recipe =>
        recipe.name &&
        recipe.image &&
        recipe.image.startsWith("http")
    );


    // REMOVE DUPLICATES

    const uniqueRecipes = [];

    const recipeNames = new Set();

    allRecipes.forEach(recipe => {

        const name = recipe.name.toLowerCase().trim();

        if (!recipeNames.has(name)) {

            recipeNames.add(name);

            uniqueRecipes.push(recipe);

        }

    });

    allRecipes = uniqueRecipes;

    filteredRecipes = [...allRecipes];

    currentIndex = 0;

    apiStatus.textContent =
        `${successfulAPIs} of 3 APIs connected • ${allRecipes.length} recipes found`;

    displayRecipes();

}


// =====================================
// DISPLAY RECIPE CARDS
// =====================================

function createRecipeCard(recipe) {

    return `

        <div class="recipe-card">

            <div class="recipe-image">

                <img
                    src="${escapeHTML(recipe.image)}"
                    alt="${escapeHTML(recipe.name)}"
                    loading="lazy"
                    onerror="this.onerror=null;this.src='https://placehold.co/600x400?text=Recipe';"
                >

            </div>

            <div class="recipe-info">

                <span class="recipe-category">
                    ${escapeHTML(recipe.category)}
                </span>

                <h3>
                    ${escapeHTML(recipe.name)}
                </h3>

                <p>
                    ${escapeHTML(recipe.area)}
                </p>

                <button
                    class="view-recipe-btn"
                    data-id="${escapeHTML(recipe.id)}"
                >
                    View Recipe
                </button>

            </div>

        </div>

    `;

}


function displayRecipes() {

    if (filteredRecipes.length === 0) {

        recipeGrid.innerHTML = `
            <div class="empty-message">
                No recipes found. Try another search.
            </div>
        `;

        updateLoadMore();

        return;

    }

    const recipes = filteredRecipes.slice(
        0,
        currentIndex + recipesPerPage
    );

    recipeGrid.innerHTML = recipes
        .map(createRecipeCard)
        .join("");

    currentIndex = recipes.length;

    updateLoadMore();

}


// =====================================
// LOAD MORE
// =====================================

function loadMoreRecipes() {

    const nextRecipes = filteredRecipes.slice(
        currentIndex,
        currentIndex + recipesPerPage
    );

    if (nextRecipes.length === 0) return;

    recipeGrid.insertAdjacentHTML(
        "beforeend",
        nextRecipes.map(createRecipeCard).join("")
    );

    currentIndex += nextRecipes.length;

    updateLoadMore();

}


function updateLoadMore() {

    const button = document.getElementById("loadMoreBtn");

    if (!button) return;

    button.style.display =
        currentIndex >= filteredRecipes.length
            ? "none"
            : "inline-block";

}


document.getElementById("loadMoreBtn")
    .addEventListener("click", loadMoreRecipes);


// =====================================
// SEARCH RECIPES
// =====================================

function searchRecipes() {

    const query = searchInput.value.trim();

    loadRecipes(query);

}


searchBtn.addEventListener("click", searchRecipes);

searchInput.addEventListener("keydown", event => {

    if (event.key === "Enter") {

        searchRecipes();

    }

});


// =====================================
// CATEGORY FILTER
// =====================================

function filterCategory(category) {

    if (category === "All") {

        filteredRecipes = [...allRecipes];

    } else {

        filteredRecipes = allRecipes.filter(recipe => {

            const type = recipe.original.mealType || [];

            const searchable = [
                recipe.category,
                recipe.area,
                ...type
            ].join(" ").toLowerCase();

            return searchable.includes(category.toLowerCase());

        });

    }

    currentIndex = 0;

    displayRecipes();

}


document.querySelectorAll(".category-btn").forEach(button => {

    button.addEventListener("click", () => {

        document.querySelectorAll(".category-btn").forEach(btn =>
            btn.classList.remove("active")
        );

        button.classList.add("active");

        filterCategory(button.dataset.category);

    });

});


// =====================================
// VIEW RECIPE DETAILS
// =====================================

function openRecipe(id) {

    const recipe = allRecipes.find(item => item.id === id);

    if (!recipe) return;

    showRecipeDetails(recipe);

}


recipeGrid.addEventListener("click", event => {

    const button = event.target.closest(".view-recipe-btn");

    if (!button) return;

    openRecipe(button.dataset.id);

});


// =====================================
// RECIPE MODAL
// =====================================

function showRecipeDetails(recipe) {

    const modal = document.getElementById("recipeModal");

    const content = document.getElementById("modalContent");

    const details = recipe.original;

    let ingredients = [];

    let instructions = "";

    let extra = "";

    let sourceLink = "";


    // THEMEALDB

    if (recipe.source === "themealdb") {

        for (let i = 1; i <= 20; i++) {

            const ingredient = details[`strIngredient${i}`];

            const measure = details[`strMeasure${i}`];

            if (ingredient && ingredient.trim()) {

                ingredients.push(
                    `${measure || ""} ${ingredient}`.trim()
                );

            }

        }

        instructions = details.strInstructions || "";

        sourceLink = details.strSource || "";

        extra = `
            <p><strong>Area:</strong> ${escapeHTML(details.strArea)}</p>
            <p><strong>Category:</strong> ${escapeHTML(details.strCategory)}</p>
        `;

    }


    // DUMMYJSON

    else if (recipe.source === "dummyjson") {

        ingredients = details.ingredients || [];

        instructions = Array.isArray(details.instructions)
            ? details.instructions.join("\n\n")
            : details.instructions || "";

        extra = `
            <p><strong>Cuisine:</strong> ${escapeHTML(details.cuisine)}</p>
            <p><strong>Prep Time:</strong> ${escapeHTML(details.prepTimeMinutes)} minutes</p>
            <p><strong>Cook Time:</strong> ${escapeHTML(details.cookTimeMinutes)} minutes</p>
            <p><strong>Servings:</strong> ${escapeHTML(details.servings)}</p>
        `;

    }


    // PAKISTANI RECIPES

    else if (recipe.source === "pakistani") {

        instructions = details.description || "";

        extra = `
            <p><strong>Region:</strong> ${escapeHTML(details.regionName)}</p>
            <p><strong>Dish:</strong> ${escapeHTML(details.dishName)}</p>
            <p><strong>Prep Time:</strong> ${escapeHTML(details.prepTime)} minutes</p>
            <p><strong>Cook Time:</strong> ${escapeHTML(details.cookTime)} minutes</p>
            <p><strong>Servings:</strong> ${escapeHTML(details.servings)}</p>
            <p><strong>Difficulty:</strong> ${escapeHTML(details.difficulty)}</p>
        `;

        sourceLink = details.url || "https://pakistani.recipes/";

    }


    const ingredientHTML = ingredients.length

        ? ingredients.map(item =>
            `<li>${escapeHTML(item)}</li>`
          ).join("")

        : "<li>Visit the original recipe page for ingredients.</li>";


    content.innerHTML = `

        <div class="modal-recipe">

            <img
                class="modal-recipe-image"
                src="${escapeHTML(recipe.image)}"
                alt="${escapeHTML(recipe.name)}"
            >

            <h2>${escapeHTML(recipe.name)}</h2>

            <p class="modal-category">
                ${escapeHTML(recipe.category)}
            </p>

            ${extra}

            <h3>Ingredients</h3>

            <ul>
                ${ingredientHTML}
            </ul>

            <h3>Instructions / Description</h3>

            <p class="recipe-instructions">
                ${escapeHTML(instructions || "No instructions available.")}
            </p>

            ${
                sourceLink
                    ? `<p><a href="${escapeHTML(sourceLink)}" target="_blank" rel="noopener noreferrer">View Original Recipe →</a></p>`
                    : ""
            }

            ${
                recipe.source === "pakistani"
                    ? `<p class="api-credit">Data provided by Pakistani Recipes API (CC BY 4.0).</p>`
                    : ""
            }

        </div>

    `;

    modal.style.display = "block";

}


// =====================================
// CLOSE MODAL
// =====================================

function closeModal() {

    document.getElementById("recipeModal").style.display = "none";

}


document.getElementById("closeModal")
    .addEventListener("click", closeModal);


document.getElementById("recipeModal")
    .addEventListener("click", event => {

        if (event.target.id === "recipeModal") {

            closeModal();

        }

    });


document.addEventListener("keydown", event => {

    if (event.key === "Escape") {

        closeModal();

    }

});


// =====================================
// START SAVORA
// =====================================

loadRecipes();
