"use strict";

// NOTE: search params for each API are all seperated by the '&' char, convenient
var DELIM = '&';

// food search will return the info used by food report, basically
// converting what the recipe's ingredients are into something food
// report can understand
// link: https://ndb.nal.usda.gov/ndb/doc/apilist/API-SEARCH.md
var FOOD_SEARCH_URL = "https://api.nal.usda.gov/ndb/search/?format=json";
     
// food report will be the API responsible for returning nutritional
// analysis of each ingrediant
// link: https://ndb.nal.usda.gov/ndb/doc/apilist/API-FOOD-REPORTV2.md
var FOOD_REPORT_URL = "https://api.nal.usda.gov/ndb/reports/V2?";
  
// Edamam recipe API will be responsible for finding us recipes based on
// calorie count as well as querying params
// link: https://developer.edamam.com/edamam-docs-recipe-api
var RECIPE_SEARCH_URL = "https://api.edamam.com/search?";

// keys and ID's for each API, since both food search and report are run
// by the USDA, the same key works for both
var USDA_API_KEY = "0NJxJHv190Y3J6RlxxeL1s1kAkCaKdCczjDkaZMy";
var EDAMAM_API_ID = "2119c2b0";
var EDAMAM_API_KEY = "602d1695505efeb70f274e7882fc5f4b";

// this will represent the previous results
var resultsString = "No data yet!";
var objList = [];
window.onload = init;

function init(){
	document.querySelector("#search").onclick = getData;
    //document.querySelector("#back").onclick = goBack;
}
	
// MY FUNCTIONS
function getData(){
	// build up our URL string
	var url = RECIPE_SEARCH_URL; 
    url += DELIM;
    //url += "q=";
	
	// get value of form field
	var value = document.querySelector("#searchterm").value;
    var calories = parseInt(document.querySelector("#calories").value, 10);
    var protein = parseInt(document.querySelector("#protein").value, 10);
    var carbs = parseInt(document.querySelector("#carbs").value, 10);
    var fat = parseInt(document.querySelector("#fat").value, 10);
	
    //if (calories < 1) calories = null;
    
	// get rid of any leading and trailing spaces
	value = value.trim();
    
    // check the values to make sure the user gave us good input
    if (fat > 100) { 
        document.querySelector("#dynamicContent").innerHTML = "<p>Error: Fat cannot be greater than 100.</p>";
        return;
    }
    if (protein > 100) {
        document.querySelector("#dynamicContent").innerHTML = "<p>Error: Protein cannot be greater than 100.</p>";
        return;
    }
    if (carbs > 100) {
        document.querySelector("#dynamicContent").innerHTML = "<p>Error: Carbs cannot be greater than 100.</p>";
        return;
    }
    if (carbs + protein + fat != 100) {  
        console.log(carbs + protein + fat);
        document.querySelector("#dynamicContent").innerHTML = "<p>Error: All               Macronutrient fields must add up to 100%</p>";
        return;
    }
    
    var highProtein = false;
    var lowCarb = false;
    var lowFat = false;
    
    // organize search based on calories, and macro nutrients
    if (protein >= 50) highProtein = true;
    if (carbs <= 20 && !highProtein) lowCarb = true;
    if (fat <= 15 && (!highProtein && !lowCarb)) lowFat = true;
    
	// if there's no band to search then bail out of the function
	if(value.length < 1) return;
	
	document.querySelector("#dynamicContent").innerHTML = "<b>Searching for " + value + "</b>";
	
	// concatenate the string
    url += "q=";
	url += value;
    
    url += DELIM;
    url += "api_id="
    url += EDAMAM_API_ID;
       
    url += DELIM;
    url += "api_key=";
	url += USDA_API_KEY;
    
    if (highProtein) {
        url += DELIM;
        url += "diet=high-protein";
    }
    if (lowCarb) {
        url += DELIM;
        url += "diet=low-carb";
    }
    if (lowFat) {
        url += DELIM;
        url += "diet=low-fat";
    }
    if (!isNaN(calories)){
        url += DELIM;
        url += "calories=gte%20";
        url += Math.abs(calories - 200);
        url += ",%20lte%20";
        url += Math.abs(calories + 200);
    }
    
    // replace spaces the user typed in the middle of the term with %20
	// %20 is the hexadecimal value for a space
	value = encodeURI(value); 
    
	// call the web service, and download the file
	console.log("loading " + url);
	//$("#dynamicContent").fadeOut(1000);
	$.ajax({
	  dataType: "json",
	  url: url,
	  data: null,
	  success: jsonLoaded
	});
       
       
}
    
function goBack() {
    document.querySelector("#dynamicContent").innerHTML = resultsString;
}


function jsonLoaded(recipeResults){
    // reset object list
    objList = [];
	
	// if there's an error, print a message and return
	if(recipeResults.error){
		var status = recipeResults.status;
		var description = recipeResults.description;
		document.querySelector("#dynamicContent").innerHTML = "<h3><b>Error!</b></h3>" + "<p><i>" + status + "</i><p>" + "<p><i>" + description + "</i><p>";
		$("#dynamicContent").fadeIn(500);
		return; // Bail out
	}
	
	// if there are no results, print a message and return
	if(recipeResults.count == 0){
		var status = "No results found";
		document.querySelector("#dynamicContent").innerHTML = "<p><i>" + status + "</i><p>" + "<p><i>";
		$("#dynamicContent").fadeIn(500);
		return; // Bail out
	}
	
	// If there is an array of results, loop through them
	var allRecipes = recipeResults.hits;
    
    // keep track of how many recipes to display
    var start = recipeResults.from;
    var end = recipeResults.to;
    
	resultsString = "<p><b>There are " + recipeResults.count + "</b></p>";
	//bigString += "<hr />";
	
	// loop through events here
	// concatenate HTML to bigString as necessary
    for (var i = 0; i < end; i++) {
        var recipe = allRecipes[i].recipe;
        
        var line = "<div class='recipe'>";
        line += "<b>" + recipe.label + "</b> <span class='expand'><button type='button' class='expandButton' id='" + recipe.label + "'>Expand</button></span><br>";
        line += "</div>";
        resultsString += line;
    }
    
    document.querySelector("#dynamicContent").innerHTML = resultsString;
	$("#dynamicContent").fadeIn(500);
    
    for (var i = 0; i < end; i++) {
        var recipe = allRecipes[i].recipe;
        
        (function () {
            
                var element = document.getElementById(recipe.label);
                element.addEventListener("click", expandDelegate(recipe), false);
            }());
    }
}	

function expandDelegate(recipe) {
    return function() {
        expandF(recipe);
    }
}

/// will display more info about a recipe
function expandF(recipe) {
    // Display Title in title bar
    document.getElementById("title").innerHTML ="<h1>" + recipe.label + "</h1>";
    
    // gather data abput the recipe for display
    var image = recipe.image;
    var servings = recipe.yield;
    var cals = recipe.calories;
    var link = recipe.url;
    var totalNutrients = recipe.totalNutrients;
    var ingredients = recipe.ingredients;
    
    
    var recipeString = "<div class='recipeItem'>";
    if (image) recipeString += "<img src='" + image + "' alt='image not found'>";
    recipeString += "<h2>Basic Information</h2><hr><span class='block'><ul>";
    recipeString += "<li>Servings: " + servings + "</li>";
    recipeString += "<li>Total Calories: " + cals + "</li>";
    recipeString += "<li>Link: <a href='" + link +"'>Recipe</a></li>";
    recipeString += "</ul></span><h2>Total Nutrients</h2><hr><span class='block'><ul>";
    recipeString += "<li>" + totalNutrients.CHOCDF.label + ": " + totalNutrients.CHOCDF.quantity + totalNutrients.CHOCDF.unit + "</li>";
    recipeString += "<li>" + totalNutrients.PROCNT.label + ": " + totalNutrients.PROCNT.quantity + totalNutrients.PROCNT.unit + "</li>";
    recipeString += "<li>" + totalNutrients.FAT.label + ": " + totalNutrients.FAT.quantity + totalNutrients.FAT.unit + "</li>";
    recipeString += "</ul></span>s";
    recipeString += "</ul></span><h2>Ingredient Suggestions</h2><hr><span class='block'><ul>";
    
    
    // begin passing ingredients into USDA API to get nutrient values
    for (var i = 0; i < ingredients.length; i++) {
        var ingredient = ingredients[i];
        
        var url = FOOD_SEARCH_URL;
        
        url += DELIM;
        url += "q=" + encodeURI(ingredient.food) + "&sort=r&max=3&offset=0";
        url += DELIM;
        url += "api_key="
        url += USDA_API_KEY;
        
        $.ajax({
	         dataType: "json",
	         url: url,
	         data: null,
	         success: function(json) {
                 foodSearch(json, recipeString);
             }
	       });
    }
    
    console.log(objList);
    
    for (var i = 0; i < objList.length; i++) {
        //for (var j = 0; j < 3; j++) {
            recipeString += "<li> Ingredient: " + objList[i].name + "</li>";
        //}
    }
    
    //recipeString += "</ul></span></div>";
    //document.querySelector("#dynamicContent").innerHTML = recipeString;
    
}
    
function foodSearch(obj, recipeString) {
    //console.log(recipeString);
    
    // pass the value into the USDA food lookup, sadly, not working :(
    if (obj.errors == null || obj != undefined) {
        var url = FOOD_REPORT_URL;
        url += "ndbno=" + obj.list.item[0].ndbno + "&type=b&format=json&api_key=";
        url += USDA_API_KEY;
        
        for (var i = 0; i < 3; i++) {
            objList.push(obj.list.item[i]);
        }
        
        recipeString += "<li> Ingredient: " + obj.list.item[0].name + "</li>";
        recipeString += "<li> Ingredient: " + obj.list.item[1].name + "</li>";
        recipeString += "<li> Ingredient: " + obj.list.item[2].name + "</li>";
        
        recipeString += "</ul></span></div>";
    document.querySelector("#dynamicContent").innerHTML = recipeString;
    }
    
    
}
 