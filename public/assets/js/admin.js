/**
 * Summary.     Handles the listing of audio files and metadata on the admin side, 
 *              the admin is able to publicise audio and delete audio. 
 *              The page currently lists only private files. 
 * 
 * Description. Calls getRecordings() to list all audio files from /saved route 
 *              then sets up html to display files neatly.
 *
 */


const prompts = new Set();
let recordings = [];
let filteredRecordings = [];
let collections = [];

getRecordings();
getCollections();


/**
 * Grab recording records in the database 
 *  
 */
async function getRecordings() {
  fetch('/saved', { method: 'POST' })
    .then((object) => object.json())
    .then((object) => {
      if (object.success && object.filed) {
        // for all objects set up cards and add to various arrays
        for (i = 0; i < object.filed.length; i++) {
          recordings.push(object.filed[i]);
          createCard(object.filed[i]);
          prompts.add(object.filed[i].adminData.Prompt)
        }
      }
    })
    .then((object) => {prompts.forEach(createListElement)})
    .catch((err) => console.error(err));
};

/**
 * Grab collection names 
 *  
 */
async function getCollections() {
  fetch('/collections', { method: 'GET' })
    .then((object) => object.json())
    .then((object) => {
      if (object.success && object.filed) {
        object.filed.forEach(collection => {
          if (collection.current) {
            document.getElementById("current").innerHTML = "Current Collection: <i>" +  collection.name + "</i>";
          }
          collections.push(collection.name)
        });
      }
    })
    .then((object) => {collections.forEach(createCollectionDropdownItem)})
    .catch((err) => console.error(err));
};


/**
 * Updates the input#collectionsUpdate's value to whatever the user clicked on in the dropdown
 * @param htmlElement the onclick passes the html element clicked
 */
function currentCollectionUpdate(htmlElement){
  document.getElementById("collectionsUpdate").value = htmlElement.innerText
}

/**
 * Updates the input#promptUpdate's value to whatever the user clicked on in the dropdown
 * @param htmlElement the onclick passes the html element clicked
 */
function currentPromptUpdate(htmlElement){
  document.getElementById("promptUpdate").value = htmlElement.innerText
}


/**
 * Handles the creation of both the dropdown on the update prompt box and the option list in the filter box
 * called multiple times for each item in the lists
 * @param {String} collectionPrompt 
 */
function createListElement(collectionPrompt){
  //update prompt dropdown
  const dropdownhtmlList = document.createElement("li");
  const dropdownhtmlA = document.createElement("a");
  dropdownhtmlA.setAttribute("class", "dropdown-item")
  dropdownhtmlA.setAttribute("onclick", "currentPromptUpdate(this)")
  dropdownhtmlA.innerText = collectionPrompt
  dropdownhtmlList.append(dropdownhtmlA)
  document.getElementById("dropdown-menu").append(dropdownhtmlList)

  //update filter dropdown
  const htmlNode = document.createElement("option");
  htmlNode.setAttribute('value', collectionPrompt)
  htmlNode.innerText = collectionPrompt
  document.getElementById("selectPrompt").append(htmlNode)
}

/**
 * Handles the creation of the dropdown on the collection prompt box
 * called multiple times for each item in the lists
 * @param {String} collectionName 
 */
function createCollectionDropdownItem(collectionName){
  //update collection dropdown
  const dropdownhtmlList = document.createElement("li");
  const dropdownhtmlA = document.createElement("a");
  dropdownhtmlA.setAttribute("class", "dropdown-item")
  dropdownhtmlA.setAttribute("onclick", "currentCollectionUpdate(this)")
  dropdownhtmlA.innerText = collectionName
  dropdownhtmlList.append(dropdownhtmlA)
  document.getElementById("collections-dropdown-menu").append(dropdownhtmlList)
}

/**
 * Takes the selected value and filters the list of recordings.
 * Called when filter by collection select onchange.
 * 
 * @param selected item  
 */
function filterPrompt(selected){
  // if no filter show all
  if (selected.value == "") {
    $(".item").remove();
    recordings.forEach(recording => {
      createCard(recording)
    });
    return;
  }

  filteredRecordings = [];
  recordings.forEach(recording => {
    if (recording.adminData.Prompt == selected.value) {
      filteredRecordings.push(recording)
    }
  });
  $(".item").remove();

  filteredRecordings.forEach(recording => {
    createCard(recording)
  });

}

/**
 * takes a database item and creates necessary html in order to display a card 
 * @param object -- single db object from getCollection
 */
function createCard(object) {
  //setup some initial card details
  const htmlNode = document.createElement("div");
  htmlNode.setAttribute('id', object._id)
  htmlNode.setAttribute('class', "col item")
  //Clone the hidden template from the html
  var newCard = $('#cardTemplate').clone().attr("id", object._id);

  //append new info from object
  newCard.find(".card-title").text(object.metaData.Title)
  newCard.find(".timestamp").text(object.adminData.TimeStamp)
  newCard.find(".card-text").text(object.metaData.Comments)
  newCard.find(".cardID").text("_id: " + object._id)

  let num = 6;
  newCard.find("#prompt").text("Prompt: " + object.adminData.Prompt)
  if (object.metaData.PostalCode) {
    newCard.find("#postal").text("Postal Code: " + object.metaData.PostalCode)
  } else {
    newCard.find("#postal").remove();
    num--;
  }

  if (object.metaData.Name) {
    newCard.find("#name").text("Name: " + object.metaData.Name)
  } else {
    newCard.find("#name").remove();
    num--;
  }

  if (object.metaData.Email) {
    newCard.find("#email").text("Email: " + object.metaData.Email)
  } else {
    newCard.find("#email").remove();
    num--;
  }

  if (object.metaData.Phone) {
    newCard.find("#phone").text("Phone: " + object.metaData.Phone)
  } else {
    newCard.find("#phone").remove();
    num--;
  }
  newCard.find(".badge").text("" + num)

  newCard.find("#url").attr("href", object.Audio.url)
  newCard.find("#audio-player").attr("src", object.Audio.url);



  newCard.find("#collapseButton").attr("href", "#collapse" + object._id);
  newCard.find("#collapseButton").attr("aria-controls", "collapse" + object._id);
  newCard.find("#collapse").attr("id", "collapse" + object._id);

  //wire up buttons, delete and public/unpublic
  //if object is public, then button says unpublic
  var publicButton = newCard.find("#publicButton")
  if (object.Public) {
    publicButton.attr("class", "btn btn-danger public")
    publicButton.text("Make Private")
    publicButton.attr("onclick", "makePrivate('" + object._id + "')")
  } else {
    publicButton.attr("class", "btn btn-success public")
    publicButton.text("Make Public")
    publicButton.attr("onclick", "makePublic('" + object._id + "')")
  }

  newCard.find("#trashButton").attr("onclick", "deleteRecording('" + object._id + "')")
  //append the new html to the container
  htmlNode.innerHTML = newCard[0].innerHTML;
  document.getElementById("collectionContainer").appendChild(htmlNode);
}

/* update the pull from the db after a admin updates or deletes from the db */
function updatePageView() {
  window.location.reload(true);
}

/**
 * sets the recording to public using its id
 * get request to /updatePublic with name updatePublic and a value of the id
 * if we dont get 200 back, then we have a problem and should not switch the button to public 
 * @param  id  
 */
function makePublic(id) {
  console.log(id);
  let promise = fetch("/updatePublic?updatePublic=" + id);
  promise.then(response => {
    if (response.status !== 200) {
      console.log('Looks like there was a problem. Status Code: ' +
        response.status);
      err = new Error("Not 200")
      throw err;
    } else {
      var publicButton = $('#' + id + " #publicButton")
      publicButton.attr("class", "btn btn-danger public")
      publicButton.text("Make Private")
      //set the onclick
      publicButton.attr("onclick", "makePrivate('" + id + "')")
    }
  }).catch(function (err) {
    throw err;
  });
}

/**
 * sets the recording to private using its id
 * get request to /removePublic with name takeOffSite and value of the id
 * if we dont get 200 back, then we have a problem and should not switch the button to public 
 * @param  id  
 */
function makePrivate(id) {
  console.log(id);
  let promise = fetch("/removePublic?takeOffSite=" + id);

  promise.then(response => {
    if (response.status !== 200) {
      console.log('Looks like there was a problem. Status Code: ' +
        response.status);
      err = new Error("Not 200")
      throw err;
    } else {
      console.log("Button says public");
      var publicButton = $('#' + id + " #publicButton")
      publicButton.attr("class", "btn btn-success public")
      publicButton.text("Make Public")
      //set the onclick
      publicButton.attr("onclick", "makePublic('" + id + "')")
    }
  }).catch(function (err) {
    throw err;
  });
}

/**
 * Deletes recording from the database
 * TODO: add a confirmation screen?
 * @param  id 
 */
function deleteRecording(id) {
  console.log(id);
  let promise = fetch("/deleteRecord?deletePublic=" + id);

  promise.then(response => {
    if (response.status !== 200) {
      console.log('Looks like there was a problem. Status Code: ' +
        response.status);
      err = new Error("Not 200")
      throw err;
    } else {
      console.log("Recording Deleted");
      var card = $('#' + id)
      card.fadeOut(300, function () { $(this).remove(); });
    }
  }).catch(function (err) {
    throw err;
  });
}