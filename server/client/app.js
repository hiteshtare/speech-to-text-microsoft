var startBtn, stopBtn, hypothesisDiv, phraseDiv, statusDiv;
var key, languageOptions, formatOptions, recognitionMode, inputSource, filePicker;
var SDK;
var recognizer;
var previousSubscriptionKey;

var key_value = '25061b8c43ac4cb5a13512edf7cfdac3';
var languageOptions_value = 'en-US'; // For English Speech Recognition
//var languageOptions_value = 'es-ES'; // For Spanish Speech Recognition
var formatOptions_value = 'Simple';
var recognitionMode_value = 'Conversation';
var inputSource_value = 'Mic';

var type = '';
var id = '';

var arrPredefinedTags = ['plavix', 'efficacy'];

//JSON object to pass to API
var objJSON = {};
var objNote = {};
objNote = {
    'machine_transcript': [],
    'transcripts': [],
    'is_transcript_approve': false,
    'entities': {
        'products': [],
        'keymessages': [],
        'followups': []
    }
};


document.addEventListener("DOMContentLoaded", function () {
    createBtn = document.getElementById("createBtn");
    startBtn = document.getElementById("startBtn");
    stopBtn = document.getElementById("stopBtn");
    phraseDiv = document.getElementById("phraseDiv");
    hypothesisDiv = document.getElementById("hypothesisDiv");
    statusDiv = document.getElementById("statusDiv");

    phraseTextArea = document.getElementById("phraseTextArea");
    submitBtn = document.getElementById("submitBtn");
    editBtn = document.getElementById("editBtn");

    productName = document.getElementById("productName");
    keywords = document.getElementById("keywords");
    followup = document.getElementById("followup");

    // key = document.getElementById("key");
    // languageOptions = document.getElementById("languageOptions");
    // formatOptions = document.getElementById("formatOptions");
    // inputSource = document.getElementById("inputSource");
    // recognitionMode = document.getElementById("recognitionMode");

    filePicker = document.getElementById('filePicker');

    //languageOptions.addEventListener("change", Setup);
    //formatOptions.addEventListener("change", Setup);
    //recognitionMode.addEventListener("change", Setup);

    startBtn.addEventListener("click", function () {
        if (key_value == "" || key_value == "YOUR_BING_SPEECH_API_KEY") {
            alert("Please enter your Bing Speech subscription key!");
            return;
        }
        // if (inputSource.value === "File") {
        //     filePicker.click();
        // } else {
        if (!recognizer || previousSubscriptionKey != key_value) {
            previousSubscriptionKey = key_value;
            Setup();
        }

        document.getElementById('success').style.display = "none";
        document.getElementById("phraseTextArea").style.display = 'none';

        hypothesisDiv.innerHTML = "";
        phraseDiv.innerHTML = "";

        document.getElementById("dvSubmit").style.display = "none";
        document.getElementById('dvEdit').style.display = "none";
        document.getElementById('dvSave').style.display = "none";
        document.getElementById('dvCancel').style.display = "none";

        document.getElementById("productName").innerHTML = "";
        document.getElementById("keywords").innerHTML = "";
        document.getElementById("followup").innerHTML = "";

        document.getElementById("entities").style.display = "none";
        document.getElementById("product").style.display = "none";
        document.getElementById('keywordsM').style.display = 'none';
        document.getElementById('followupM').style.display = 'none';

        RecognizerStart(SDK, recognizer);
        startBtn.disabled = true;
        stopBtn.disabled = false;
        //}
    });

    // key.addEventListener("focus", function () {
    //     if (key_value == "YOUR_BING_SPEECH_API_KEY") {
    //         key_value = "";
    //     }
    // });

    // key.addEventListener("focusout", function () {
    //     if (key_value == "") {
    //         key_value = "YOUR_BING_SPEECH_API_KEY";
    //     }
    // });

    // filePicker.addEventListener("change", function () {
    //     Setup();
    //     hypothesisDiv.innerHTML = "";
    //     phraseDiv.innerHTML = "";
    //     RecognizerStart(SDK, recognizer);
    //     startBtn.disabled = true;
    //     stopBtn.disabled = false;
    //     filePicker.value = "";
    // });

    stopBtn.addEventListener("click", function () {
        RecognizerStop(SDK, recognizer);
        startBtn.disabled = false;
        stopBtn.disabled = true;

        // extractInLUIS(phraseDiv.innerHTML); //Send phrase to LUIS for intent/entity extraction.
    });

    Initialize(function (speechSdk) {
        SDK = speechSdk;
        startBtn.disabled = false;
    });

    bindKeyMessageSelect();
});

function Setup() {
    if (recognizer != null) {
        RecognizerStop(SDK, recognizer);
    }
    recognizer = RecognizerSetup(SDK, recognitionMode_value, languageOptions_value, SDK.SpeechResultFormat[
        formatOptions_value], key_value);
}

function UpdateStatus(status) {

    if (status != "Idle") {
        document.getElementById("listening").innerHTML =
            '<img src="./horizontal.gif">';
    } else {
        document.getElementById("listening").innerHTML = '';
    }

    statusDiv.innerHTML = status;
}

function UpdateRecognizedHypothesis(text, append) {
    if (append)
        hypothesisDiv.innerHTML += text + " ";
    else
        hypothesisDiv.innerHTML = text;

    var length = hypothesisDiv.innerHTML.length;
    if (length > 403) {
        hypothesisDiv.innerHTML = "..." + hypothesisDiv.innerHTML.substr(length - 400, length);
    }
}

function OnSpeechEndDetected() {
    stopBtn.disabled = true;
}

function UpdateRecognizedPhrase(json) {
    hypothesisDiv.innerHTML = "";
    let objJson = JSON.parse(json); //Parse json string into json object
    let displayText = objJson.DisplayText;
    //Check if the displayText is not undefined
    if (displayText) {
        console.log(`displayText`);
        console.log(displayText);
        phraseDiv.innerHTML += displayText + "\n";
    }
}

//Called when RecognationEnded event is raised. 
function OnComplete() {
    startBtn.disabled = false;
    stopBtn.disabled = true;
    editBtn.disabled = false;

    //Testing
    // phraseDiv.innerHTML = `Would you please provide with the details about Plavix or Xarelto, 
    // and also its side effects or any efficacy study by today or tomorrow or Sunday`;

    if (phraseDiv.innerHTML) {

        objNote["machine_transcript"] = phraseDiv.innerHTML;

        document.getElementById("dvSubmit").style.display = "block";
        document.getElementById('dvEdit').style.display = "block";
        phraseTextArea.value = phraseDiv.innerHTML;

        //Testing
        //submitToLUIS();
    }
}

//Intent/Entity Extraction using LUIS
function extractInLUIS(phrase) {
    console.log(`phrase`);
    console.log(phrase);

    //Luis Configurtion
    var luis_config = {
        appId: '00f2c5cb-7861-4b1e-9378-3b53859f4a1e', // call_notes_poc_v1
        //appId: '723bdb51-386b-4eed-91e6-36d25739b1ac', // ES_call_notes_poc_v1
        versionId: '0.1',
        subscriptionKey: '10ddb0b870ea4e7fb06245e99559c248'
    }

    const luis_wepApiUri = `https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/${luis_config.appId}?subscription-key=${luis_config.subscriptionKey}`;

    var url =
        `${luis_wepApiUri}&timezoneOffset=-360&q=` +
        phrase;

    console.log(url);
    document.getElementById("loading").innerHTML =
        '<img src="http://preloaders.net/preloaders/287/Filling%20broken%20ring.gif">loading...';

    var a = new XMLHttpRequest();
    a.open("GET", url);
    a.send("");
    a.onload = function () {
        document.getElementById("loading").innerHTML = '';
        var token = JSON.parse(this.responseText);
        var tokenSearch = JSON.stringify(this.responseText);
        console.log(`this.responseText`);
        console.log(this.responseText);
        console.log(`token`);
        console.log(token);
        //console.log(token.entities[0].entity);
        console.log(`token.entities.length`);
        console.log(token.entities.length);
        if (token.entities.length > 0) {
            document.getElementById("entities").style.display = "block";
            document.getElementById("product").style.display = "block";
            document.getElementById('keywordsM').style.display = "block";

            objJSON['products'] = [];
            objJSON['keymessages'] = [];
            objJSON['followups'] = [];
            objNote['entities']['products'] = [];
            objNote['entities']['keymessages'] = [];
            objNote['entities']['followups'] = [];

            // var buttonOK = `Approval: <input type="radio" name="approve" value="yes"> Yes  <input type="radio" name="approve" value="no"> No | `;
            var buttonOK = ``;

            /*############################PRODUCT############################*/
            var objProducts = findObjectByKey(token.entities, "type", "brand");
            objProducts.forEach((objProduct, index) => {
                productName = objProduct.entity;
                objJSON['products'].push(productName);

                /*==========================object_product==========================*/
                object_product = {
                    "before": productName,
                    "after": null,
                    "is_approve": null,
                    "status": null
                };
                objNote['entities']['products'].push(object_product);
                /*==========================object_product==========================*/

                score = objProduct.score;
                console.log(`objProduct`);
                console.log(objProduct);

                if (index === 0) {
                    document.getElementById("productName").innerHTML += "<i>score : " + score + "</i>" + "\n";
                    document.getElementById("productName").innerHTML += "<u>name</u>" + "\t" + "<u>status</u>" + "\t" + "<u>action</u>" + "\t" + "\n";
                }
                highlightTextInsideDiv(productName);

                var productId = objJSON['products'].length - 1;
                var buttonEDIT_PRODUCT = `<button type="button" data-toggle="tooltip" title="Edit Product" style="background-color: aqua;" class = "btn btn-default btn-sm"
                onclick = "openPopup('products',${productId})" ><span class="glyphicon glyphicon-pencil"></span></button>`;
                var buttonREMOVE_PRODUCT = `<button type="button" data-toggle="tooltip" title="Remove Product" style="background-color: #ff6464c2;" class="btn btn-default btn-sm"
                onclick = "removeEntitesPopup('remove-product-overlay',${productId})"> <span class = "glyphicon glyphicon-trash"> </span></button> `;

                // var buttonSHOW_PRODUCT = ` | <button type="button" onclick="showChange('products',${productId})">Show</button>`;

                document.getElementById("productName").innerHTML += productName + "\t" + "\t" + buttonREMOVE_PRODUCT + "\n";
                document.getElementById('product').style.display = 'block';
            });
            /*############################PRODUCT############################*/

            /*#########################KEY MESSAGES#########################*/
            var objKeyMessages = findObjectByKey(token.entities, "type", "keymessages")
            objKeyMessages.forEach((objKeyMessage, index) => {
                keyMessages = objKeyMessage.entity;
                objJSON['keymessages'].push(keyMessages);

                /*==========================object_keymessage==========================*/
                object_keymessage = {
                    "before": keyMessages,
                    "after": null,
                    "is_approve": null,
                    "status": null
                };
                objNote['entities']['keymessages'].push(object_keymessage);
                /*==========================object_keymessage==========================*/

                score = objKeyMessage.score;
                console.log(`objKeyMessage`);
                console.log(objKeyMessage);
                if (index === 0) {
                    document.getElementById("keywords").innerHTML += "<i>score : " + score + "</i>" + "\n";
                    document.getElementById("keywords").innerHTML += "<u>name</u>" + "\t" + "<u>status</u>" + "\t" + "<u>action</u>" + "\t" + "\n";
                }
                highlightTextInsideDiv(keyMessages);

                var productId = objJSON['keymessages'].length - 1;
                var buttonEDIT_KEYMESSAGE = `<button type="button" onclick="openPopup('keymessages',${productId})">Edit</button>`;
                var buttonREMOVE_PRODUCT = `<button type="button" data-toggle="tooltip" title="Remove Product" style="background-color: #ff6464c2;" class="btn btn-default btn-sm"
                onclick = "removeEntitesPopup('remove-keymessage-overlay',${productId})"> <span class = "glyphicon glyphicon-trash"></span></button> `;

                document.getElementById("keywords").innerHTML += keyMessages + "\t" + "\t" + buttonREMOVE_PRODUCT + "\n";
                document.getElementById('keywordsM').style.display = 'block';
            });
            /*#########################KEY MESSAGES#########################*/

            /*##########################Follow Ups##########################*/
            var objFollowUps = findObjectByKey(token.entities, "type", "builtin.datetimeV2.datetime")
            objFollowUps.forEach((objFollowUp) => {
                followup = objFollowUp.entity;
                objJSON['followups'].push(followup);

                /*==========================object_followup==========================*/
                object_followup = {
                    "before": followup,
                    "after": null,
                    "is_approve": null,
                    "status": null
                };
                objNote['entities']['followups'].push(object_followup);
                /*==========================object_followup==========================*/


                console.log(`followup : datetime`);
                console.log(objFollowUp);
                highlightTextInsideDiv(followup);

                var productId = objJSON['followups'].length - 1;
                var buttonEDIT_FOLLOWUP = `<button type="button" onclick="openPopup('followups',${productId})">Edit</button>`;
                var buttonSHOW_FOLLOWUP = ` | <button type="button" onclick="showChange('followups',${productId})">Show</button>`;

                document.getElementById("followup").innerHTML += "\t" + "<br />";
                document.getElementById('followupM').style.display = 'block';
            });
            var objFollowUps = findObjectByKey(token.entities, "type", "builtin.datetimeV2.daterange")
            objFollowUps.forEach((objFollowUp) => {
                followup = objFollowUp.entity;
                objJSON['followups'].push(followup);

                /*==========================object_followup==========================*/
                object_followup = {
                    "before": followup,
                    "after": null,
                    "is_approve": null,
                    "status": null
                };
                objNote['entities']['followups'].push(object_followup);
                /*==========================object_followup==========================*/

                console.log(`followup : daterange`);
                console.log(objFollowUp);
                highlightTextInsideDiv(followup);

                var productId = objJSON['followups'].length - 1;
                var buttonEDIT_FOLLOWUP = `<button type="button" onclick="openPopup('followups',${productId})">Edit</button>`;
                var buttonSHOW_FOLLOWUP = ` | <button type="button" onclick="showChange('followups',${productId})">Show</button>`;

                document.getElementById("followup").innerHTML += followup + "\t" + "<br />";
                document.getElementById('followupM').style.display = 'block';
            });
            var objFollowUps = findObjectByKey(token.entities, "type", "builtin.datetimeV2.date")
            objFollowUps.forEach((objFollowUp) => {
                followup = objFollowUp.entity;
                objJSON['followups'].push(followup);

                /*==========================object_followup==========================*/
                object_followup = {
                    "before": followup,
                    "after": null,
                    "is_approve": null,
                    "status": null
                };
                objNote['entities']['followups'].push(object_followup);
                /*==========================object_followup==========================*/

                console.log(`followup : date`);
                console.log(objFollowUp);
                highlightTextInsideDiv(followup);

                var productId = objJSON['followups'].length - 1;
                var buttonEDIT_FOLLOWUP = `<button type="button" onclick="openPopup('followups',${productId})">Edit</button>`;
                var buttonSHOW_FOLLOWUP = ` | <button type="button" onclick="showChange('followups',${productId})">Show</button>`;

                document.getElementById("followup").innerHTML += followup + "\t" + "<br />";
                document.getElementById('followupM').style.display = 'block';
            });
            /*##########################FOLLOW UPS##########################*/

            /*##########################HIGHLIGHT PredefinedTags##########################*/
            highlightPredefinedTags(arrPredefinedTags);
            /*##########################HIGHLIGHT PredefinedTags##########################*/

            /*##########################SHOW SAVE BUTTON##########################*/
            document.getElementById('dvSave').style.display = "block";
            document.getElementById('dvCancel').style.display = "block";
            /*##########################SHOW SAVE BUTTON##########################*/

        } else {
            objJSON = {};

            document.getElementById("entities").style.display = "block";
            document.getElementById("product").style.display = "block";
            document.getElementById('keywordsM').style.display = "block";
            document.getElementById('followupM').style.display = 'block';

            document.getElementById('dvSave').style.display = "block";
            document.getElementById('dvCancel').style.display = "block";
        }
    }
    // }
}

//Object Extraction using key
function findObjectByKey(array, key, value) {
    var ArrobjectByKey = [];
    for (var i = 0; i < array.length; i++) {
        if (array[i][key] === value) {
            ArrobjectByKey.push(array[i]);
        }
    }
    return ArrobjectByKey;
}

// To highlight text inside the specified div using particular color 
function highlightTextInsideDiv(text) {
    var inputText = document.getElementById("phraseDiv");
    var innerHTML = inputText.innerHTML;
    var index = innerHTML.indexOf(text); //For Lowercase only

    if (index >= 0) {
        innerHTML = innerHTML.substring(0, index) + "<span class='highlight'>" + innerHTML.substring(index, index + text.length) + "</span>" + innerHTML.substring(index + text.length);
        inputText.innerHTML = innerHTML;
    } else { //For Camelcase i.e First Character is in Upper Case
        var capitalizeFirstLetter = text.charAt(0).toUpperCase() + text.slice(1);
        var newIndex = innerHTML.indexOf(capitalizeFirstLetter);

        if (newIndex >= 0) {
            innerHTML = innerHTML.substring(0, newIndex) + "<span class='highlight'>" + innerHTML.substring(newIndex, newIndex + capitalizeFirstLetter.length) + "</span>" + innerHTML.substring(newIndex + capitalizeFirstLetter.length);
            inputText.innerHTML = innerHTML;
        }
    }
}

// To highlight text inside the specified div using particular color 
function highlightPredefinedTags(a_arrPredefinedTags) {

    a_arrPredefinedTags.forEach((predefinedTag) => {

        var inputText = document.getElementById("productName");
        var innerHTML = inputText.innerHTML;
        var index = innerHTML.indexOf(predefinedTag); //For Lowercase only

        if (index >= 0) {
            innerHTML = innerHTML.substring(0, index) + "<span class='highlight-pre'>" + innerHTML.substring(index, index + predefinedTag.length) + "</span>" + innerHTML.substring(index + predefinedTag.length);
            inputText.innerHTML = innerHTML;
        }

        var inputText = document.getElementById("keywords");
        var innerHTML = inputText.innerHTML;
        var index = innerHTML.indexOf(predefinedTag); //For Lowercase only

        if (index >= 0) {
            innerHTML = innerHTML.substring(0, index) + "<span class='highlight-pre'>" + innerHTML.substring(index, index + predefinedTag.length) + "</span>" + innerHTML.substring(index + predefinedTag.length);
            inputText.innerHTML = innerHTML;
        }
    });
}

// To open Edit Popup  
function openPopup(a_type, a_id, ) {

    type = a_type;
    id = a_id;

    el = document.getElementById("edit-overlay");
    el.style.visibility = "visible";

    var input = document.getElementById("result");

    let current_value = '';
    if (objNote['entities'][type][id]["after"]) {
        current_value = objNote['entities'][type][id]["after"];
    } else {
        current_value = objNote['entities'][type][id]["before"];
    }

    input.value = current_value;

    document.getElementById("change").innerHTML = current_value;
}

function closeAllPopups() {
    el = document.getElementById('add-product-overlay');
    el.style.visibility = "hidden";
    el = document.getElementById('add-keymessage-overlay');
    el.style.visibility = "hidden";
    el = document.getElementById('remove-product-overlay');
    el.style.visibility = "hidden";
    el = document.getElementById('remove-keymessage-overlay');
    el.style.visibility = "hidden";
}

// To open Add Popup  
function addEntitesPopup(a_type) {
    closeAllPopups();

    type = a_type;

    el = document.getElementById(a_type);
    el.style.visibility = "visible";
}
// To open Remove Popup  
function removeEntitesPopup(a_type, a_id) {
    closeAllPopups();

    if (a_type == 'remove-product-overlay') {
        type = 'products';
    } else {
        type = 'keymessages';
    }
    id = a_id;

    el = document.getElementById(a_type);
    el.style.visibility = "visible";

    var current_value = '';
    if (objNote['entities'][type][id]["after"]) {
        current_value = objNote['entities'][type][id]["after"];
    } else {
        current_value = objNote['entities'][type][id]["before"];
    }

    if (a_type == 'remove-product-overlay') {
        document.getElementById("remove-product-change").innerHTML = current_value;

    } else {
        document.getElementById("remove-keymessage-change").innerHTML = current_value;
    }

}

// To close Edit Popup  
function closePopup(p_overlay_name) {
    type = '';
    id = '';

    el = document.getElementById(p_overlay_name);
    el.style.visibility = "hidden";
}

// To save changes in objJSON          
function saveChanges() {
    if (type != '' || id != '') {
        var input = document.getElementById("result");
        objNote['entities'][type][id]["after"] = input.value;

        objNote['entities'][type][id]["is_approve"] = false;
        objNote['entities'][type][id]["status"] = "pending for moderator approval";

        document.getElementById("change").innerHTML = objNote['entities'][type][id]["after"];

        document.getElementById("productName").innerHTML += objNote['entities'][type][id]["before"] + ' | ' + input.value + "\t" + '<span style="background-color: #00ffff42;">Updated</span>' + "\t";

        closePopup('edit-overlay');
    }
}

// To save changes in objJSON          
function addChanges(p_type) {
    if (p_type != '') {

        var newObj = {
            'before': null,
            'is_approve': false,
            'status': "pending for moderator approval"
        };
        var buttonREMOVE_PRODUCT = ``;

        if (p_type === 'products') {
            var input = document.getElementById("add-result");
            let input_value = input.value.toLowerCase();
            newObj['after'] = input_value;

            document.getElementById("productName").innerHTML += input_value + "\t" + '<span style="background-color: springgreen;">Added</span>' + "\t" + buttonREMOVE_PRODUCT + "\n";

        } else {
            var select = document.getElementById("select-keymessage-result");

            var input = document.getElementById("add-keymessage-result");
            let input_value = input.value.toLowerCase();

            newObj['phrase_id'] = select.value;
            newObj['after'] = input_value;

            document.getElementById("keywords").innerHTML += select.options[select.selectedIndex].text + ' >> ' + input_value + "\t" + '<span style="background-color: springgreen;">Added</span>' + "\t" + buttonREMOVE_PRODUCT + "\n";
        }

        objNote['entities'][p_type].push(newObj);

        var Id = objNote['entities'][p_type].length - 1;
        // buttonREMOVE_PRODUCT = `<button type="button" style="background-color: #ff6464c2;" class="btn btn-default btn-sm"
        //         onclick = "removeEntitesPopup('products',${Id})"> <span class="glyphicon glyphicon-trash"></span></button>`;



        closePopup('add-product-overlay');
        closePopup('add-keymessage-overlay');

        document.getElementById("add-result").value = '';
        document.getElementById("add-keymessage-result").value = '';
    }
}

// To save changes in objJSON          
function removeChanges(p_type) {
    if (p_type != '') {

        if (type != '' || id != '') {


            objNote['entities'][type][id]["is_approve"] = false;
            objNote['entities'][type][id]["status"] = "pending for moderator approval";

            if (p_type === 'products') {
                var value = document.getElementById("remove-product-change").innerHTML;
                document.getElementById("productName").innerHTML += value + "\t" + '<span style="background-color: #ff64647a;">Removed</span>' + "\t";

            } else {
                var value = document.getElementById("remove-keymessage-change").innerHTML;
                document.getElementById("keywords").innerHTML += value + "\t" + '<span style="background-color: #ff64647a;">Removed</span>' + "\t";
            }

            closePopup('remove-product-overlay');
            closePopup('remove-keymessage-overlay');
        }
    }
}

// To submit results for LUIS processing
function submitToLUIS() {
    editBtn.disabled = false;
    document.getElementById("phraseTextArea").style.display = 'none';

    phraseDiv.innerHTML = phraseTextArea.value;

    document.getElementById("productName").innerHTML = "";
    document.getElementById("keywords").innerHTML = "";
    document.getElementById("followup").innerHTML = "";

    document.getElementById("entities").style.display = "none";
    document.getElementById("product").style.display = "none";
    document.getElementById('keywordsM').style.display = 'none';
    document.getElementById('followupM').style.display = 'none';

    extractInLUIS(phraseDiv.innerHTML); //Send phrase to LUIS for intent/entity extraction.
}

// To edit result before Submission
function editResult() {


    document.getElementById("phraseTextArea").style.display = 'block';

    editBtn.disabled = true;

    document.getElementById('dvSave').style.display = "none";
    document.getElementById('dvCancel').style.display = "none";
}

// To save result in db
function saveResult() {
    document.getElementById("phraseTextArea").style.display = 'block';

    editBtn.disabled = true;

    var xhr = new XMLHttpRequest();
    var url = "http://localhost:5000/notes";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.status === 201) {
            document.getElementById('success').style.display = "block";
            clearResult();
        }
    };
    var data = JSON.stringify(objNote);
    xhr.send(data);

    //Reset objNote after note is saved
    objNote = {
        'machine_transcript': [],
        'transcripts': [],
        'is_transcript_approve': false,
        'entities': {
            'products': [],
            'keymessages': [],
            'followups': []
        }
    };
}

// To clear result
function clearResult() {

    hypothesisDiv.innerHTML = "";
    phraseDiv.innerHTML = "";

    document.getElementById("phraseTextArea").style.display = 'none';

    document.getElementById("dvSubmit").style.display = "none";
    document.getElementById('dvEdit').style.display = "none";
    document.getElementById('dvSave').style.display = "none";
    document.getElementById('dvCancel').style.display = "none";


    document.getElementById("productName").innerHTML = "";
    document.getElementById("keywords").innerHTML = "";
    document.getElementById("followup").innerHTML = "";

    document.getElementById("entities").style.display = "none";
    document.getElementById("product").style.display = "none";
    document.getElementById('keywordsM').style.display = 'none';
    document.getElementById('followupM').style.display = 'none';

}

// To navigate user to Moderator view 
function navigateToModeraterView() {
    window.location.href = '/#/list';
}

// To bind Key Message Dropdown
function bindKeyMessageSelect() {
    var xhr = new XMLHttpRequest();
    var url = "https://westus.api.cognitive.microsoft.com/luis/api/v2.0/apps/00f2c5cb-7861-4b1e-9378-3b53859f4a1e/versions/0.1/phraselists?skip=0&take=100";
    xhr.open("GET", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Ocp-Apim-Subscription-Key", "10ddb0b870ea4e7fb06245e99559c248");
    xhr.onreadystatechange = function () {
        if (xhr.readyState == XMLHttpRequest.DONE) {
            console.log(`GET - bindKeyMessageSelect`);
            var response = JSON.parse(xhr.response);
            console.log(response);

            var option = '';
            var select = document.getElementById("select-keymessage-result");

            response.forEach((phrase, index) => {
                if (phrase['id'] != '1460088') {
                    select.options[index - 1] = new Option(phrase['name'], phrase['id']);
                }
            });

            // el = document.getElementById('add-keymessage-overlay');
            // el.style.visibility = "visible";

        }
    };
    xhr.send();
}