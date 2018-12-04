const mongoose = require("mongoose");
const Note = require("../models/noteModel");
const request = require("request-promise")

var config = require('../../config');

const luis_config = config.luis_config;
const luis_wepApiUri = `https://westus.api.cognitive.microsoft.com/luis/api/v2.0/apps/${luis_config.appId}/versions/${luis_config.versionId}`;
const publish_wepApiUri = `https://westus.api.cognitive.microsoft.com/luis/api/v2.0/apps/${luis_config.appId}`;
const luis_wepApiHeaders = {
  'Ocp-Apim-Subscription-Key': luis_config.subscriptionKey
};

exports.notes_get_all = async (req, res, next) => {
  try {
    let notes = await Note.find()
      .sort({ //sorting the fields
        updated_at: -1,
        created_at: -1
      });

    res.status(200).json({
      success: true,
      message: 'List of Notes fetched successfully',
      payload: notes
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err
    });
  }
};

exports.notes_create_note = async (req, res, next) => {
  try {
    const note = new Note({
      _id: new mongoose.Types.ObjectId(),
      machine_transcript: req.body.machine_transcript,
      transcripts: req.body.transcripts,
      is_transcript_approve: req.body.is_transcript_approve,
      entities: req.body.entities
    });

    let result = await note.save();

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      payload: result
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err
    });
  }
};

exports.notes_get_note = async (req, res, next) => {
  try {
    const id = req.params.noteId;

    let note = await Note.findById(id);

    if (note) {
      res.status(200).json({
        success: true,
        message: 'A Note fetched successfully',
        payload: note
      });
    } else {
      res.status(404).json({
        success: true,
        message: "No valid entry found for provided noteId"
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err
    });
  }
};

exports.notes_updates_note = async (req, res, next) => {
  try {
    const id = req.params.noteId;
    const updateOps = {
      transcripts: req.body.transcripts,
      is_transcript_approve: req.body.is_transcript_approve,
      entities: req.body.entities
    };

    let note = await Note.findById(id);

    if (note) {
      let updated_note = await Note.update({
        _id: id
      }, {
        $set: updateOps
      });

      res.status(200).json({
        success: true,
        message: "Note updated successfully",
        payload: note
      });
    } else {
      res.status(404).json({
        success: true,
        message: "No valid entry found for provided noteId"
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err
    });
  }
};

exports.notes_deletes_note = async (req, res, next) => {
  try {
    const id = req.params.noteId;

    let note = await Note.findById(id);

    if (note) {
      let result = await Note.deleteOne({
        _id: id
      });

      res.status(200).json({
        success: true,
        message: "Note deleted successfully",
        payload: id
      });
    } else {
      res.status(404).json({
        success: true,
        message: "No valid entry found for provided noteId"
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err
    });
  }
};

//GET Request for fetching PhraseList associated with id (1460088) for Brands
async function getPhraseArrayFromPhraseListById(p_phrase) {
  const get_options = {
    method: 'GET',
    uri: `${luis_wepApiUri}/phraselists/${p_phrase.id}`,
    headers: luis_wepApiHeaders
  };

  const brand_PhraseList = await request(get_options)
    .then(function (resp) {
      console.log(`GET - Phrase Array fetched for ${p_phrase.name}`);
      let json_resp = JSON.parse(resp);
      return json_resp["phrases"];
    });

  return brand_PhraseList;
}

//PUT Request for updating the string inside PhraseList associated with id (1460088) for Brands
async function updateBrandsFromPhraseListById(p_phrase) {
  const put_options = {
    method: 'PUT',
    uri: `${luis_wepApiUri}/phraselists/${p_phrase.id}`,
    headers: luis_wepApiHeaders,
    body: {
      "id": +`${p_phrase.id}`,
      "name": `${p_phrase.name}`,
      "phrases": `${p_phrase.phrases}`,
      "isExchangeable": true,
      "isActive": true
    },
    json: true
  };

  await request(put_options)
    .then(async function (resp) {
      console.log(`PUT - Phrase Array updated for ${p_phrase.name}`);
    });
}

//GET Request for fetching PhraseList
async function getPhraseArrayFromPhraseList() {
  const get_options = {
    method: 'GET',
    uri: `${luis_wepApiUri}/phraselists?skip=0&take=100`,
    headers: luis_wepApiHeaders
  };

  const brand_PhraseList = await request(get_options)
    .then(function (resp) {
      console.log(`GET - Phrase Array fetched for All`);
      let json_resp = JSON.parse(resp);
      return json_resp;
    });

  return brand_PhraseList;
}

//POST Request for training luis application
async function trainLuisApp() {
  const post_options = {
    method: 'POST',
    uri: `${luis_wepApiUri}/train`,
    headers: luis_wepApiHeaders,
    body: {},
    json: true
  };

  await request(post_options)
    .then(function (resp) {
      console.log('POST - LUIS Trained successfully for new changes');
    });
}


async function productsTraining() {
  let arr_notes = await Note.find({ // Array of Notes
    'entities.products': {
      $elemMatch: {
        'is_approve': true,
        'status': 'pending for luis training'
      }
    }
  }, {
    "entities.products.$": 1
  }, {
    lean: true
  });

  var arr_products; // Array of Products
  ///////////////////////////TRAINING LUIS///////////////////////////

  //To check if Array of Notes is empty then return with 'No data found' message
  if (arr_notes.length == 0) {
    console.log('MONGO - No Product List Records');
    // res.status(200).json({
    //   success: true,
    //   message: "No data found for LUIS trainig"
    // });
    return;
  }

  //Else proceed further
  console.log(`MONGO - ${arr_notes.length} Product List fetched for Training`);

  /**********************GET FOR PHRASE LIST FEATURE ARRAY**********************/
  let phrase = {
    id: '1460088',
    name: 'brand',
    phrases: '',
    has_change: false
  };

  let brand_PhraseList = await getPhraseArrayFromPhraseListById(phrase);
  /**********************GET FOR PHRASE LIST FEATURE ARRAY**********************/

  //Iterate over each note
  arr_notes.forEach((note) => {
    arr_products = note["entities"]["products"]; // Initialise Array of Products

    //Iterate over each product inside entities
    arr_products.forEach((product, index) => {
      if (index == 0) {
        console.log(`${phrase.name}`);
      }
      //Replace 'before' sub-string inside string with empty
      //Concatinate the string with 'after' sub-string
      if (product["before"] != null && product["after"] != null) {
        brand_PhraseList = brand_PhraseList.replace(`,${product["before"]}`, '');
        brand_PhraseList += ',' + product["after"];
        console.log(`Updated : From ${product["before"]} to ${product["after"]}`);
      } else if (product["before"] != null && product["after"] == null) {
        brand_PhraseList = brand_PhraseList.replace(`,${product["before"]}`, '');
        brand_PhraseList += ',' + product["after"];
        console.log(`Removed : ${product["before"]}`);
      } else if (product["before"] == null && product["after"] != null) {
        brand_PhraseList += ',' + product["after"];
        console.log(`Added : ${product["after"]}`);
      }

      phrase.has_change = true;
    }); //End of arr_products.forEach
  }); //End of arr_notes.forEach

  /**********************UPDATE FOR PHRASE LIST FEATURE ARRAY**********************/
  if (phrase.has_change) {
    phrase['phrases'] = brand_PhraseList;
    await updateBrandsFromPhraseListById(phrase);
  }
  /**********************UPDATE FOR PHRASE LIST FEATURE ARRAY**********************/

  /*#####################UPDATING STATUS OF PRODUCT LIST#####################*/
  console.log('MONGO - Updating status of Product List Trained');

  arr_notes.forEach(async (note) => {
    arr_products = note["entities"]["products"];

    arr_products.forEach(async (product, index) => {
      if (index == 0) {
        console.log(`Updating arr_products`);
      }

      const id = product["_id"];
      const updateOps = {
        "entities.products.$.status": "completed luis training"
      };

      //Update the note with 'completed luis training' status using ObjectId
      await Note.updateOne({
        "entities.products._id": id
      }, {
        $set: updateOps
      });

      console.log(`Mongo - Updated product : ${id} successfully`);
    }); //End of arr_products.forEach
  }); //End of arr_notes.forEach
  /*#####################UPDATING STATUS OF PRODUCT LIST#####################*/
}

async function keyMessagesTraining() {
  let arr_notes = await Note.find({ // Array of Notes
    'entities.keymessages': {
      $elemMatch: {
        'is_approve': true,
        'status': 'pending for luis training'
      }
    }
  }, {
    "entities.keymessages.$": 1
  }, {
    lean: true
  });

  var arr_keymessages; // Array of KeyMessages
  ///////////////////////////TRAINING LUIS///////////////////////////

  //To check if Array of Notes is empty then return with 'No data found' message
  if (arr_notes.length == 0) {
    console.log('MONGO - No Key Messages List Records');
    // res.status(200).json({
    //   success: true,
    //   message: "No data found for LUIS trainig"
    // });
    return;
  }

  //Else proceed further
  console.log(`MONGO - ${arr_notes.length} Key Messages List fetched for Training`);

  /**********************GET FOR PHRASE LIST FEATURE ARRAY**********************/
  var arr_allPhraseList = await getPhraseArrayFromPhraseList();
  /**********************GET FOR PHRASE LIST FEATURE ARRAY**********************/

  //Iterate over each note
  arr_notes.forEach((note) => {
    arr_keymessages = note["entities"]["keymessages"]; // Initialise Array of Products

    //Iterate over each keymessage inside entities
    arr_keymessages.forEach((keymessage, index) => {
      //Iterate over each phrase inside phrase array
      arr_allPhraseList.forEach((phrase, p_index) => {
        phrase['has_change'] = false;
        if (phrase['id'] == keymessage['phrase_id']) {
          console.log(`${phrase['name']} >> is going to be updated.`);

          current_PhraseList = phrase['phrases'];

          //Replace 'before' sub-string inside string with empty
          //Concatinate the string with 'after' sub-string
          if (keymessage["before"] != null && keymessage["after"] != null) {
            current_PhraseList = current_PhraseList.replace(`,${keymessage["before"]}`, '');
            current_PhraseList += ',' + keymessage["after"];
            console.log(`Updated : From ${keymessage["before"]} to ${keymessage["after"]}`);
          } else if (keymessage["before"] != null && keymessage["after"] == null) {
            current_PhraseList = current_PhraseList.replace(`,${keymessage["before"]}`, '');
            current_PhraseList += ',' + keymessage["after"];
            console.log(`Removed : ${keymessage["before"]}`);
          } else if (keymessage["before"] == null && keymessage["after"] != null) {
            current_PhraseList += ',' + keymessage["after"];
            console.log(`Added : ${keymessage["after"]}`);
          }

          arr_allPhraseList[p_index]['phrases'] = current_PhraseList;
          phrase['has_change'] = true;
        } //End of if
      }); //End of arr_allPhraseList.forEach
    }); //End of arr_keymessages.forEach
  }); //End of arr_notes.forEach

  /**********************UPDATE FOR PHRASE LIST FEATURE ARRAY**********************/
  arr_allPhraseList.forEach(async (phrase, p_index) => {
    if (phrase['has_change']) {
      console.log(`${phrase['name']} has changed`)
      await updateBrandsFromPhraseListById(phrase);
    }
  });
  /**********************UPDATE FOR PHRASE LIST FEATURE ARRAY**********************/

  /*#####################UPDATING STATUS OF PRODUCT LIST#####################*/
  console.log('MONGO - Updating status of Product List Trained');

  arr_notes.forEach(async (note) => {
    arr_keymessages = note["entities"]["keymessages"];

    arr_keymessages.forEach(async (product, index) => {
      if (index == 0) {
        console.log(`Updating arr_keymessages`);
      }

      const id = product["_id"];
      const updateOps = {
        "entities.keymessages.$.status": "completed luis training"
      };

      //Update the note with 'completed luis training' status using ObjectId
      await Note.updateOne({
        "entities.keymessages._id": id
      }, {
        $set: updateOps
      });

      console.log(`Mongo - Updated keymessage : ${id} successfully`);
    }); //End of arr_products.forEach
  }); //End of arr_notes.forEach
  /*#####################UPDATING STATUS OF PRODUCT LIST#####################*/
}


exports.train_luis_for_entities = async (req, res, next) => {
  ///////////////////////////PRODUCTS///////////////////////////
  try {
    await productsTraining();

    await keyMessagesTraining();

    //await trainLuisApp();

    res.status(200).json({
      success: true,
      message: "LUIS Trained successfully for new changes"
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err
    });
  }
};

async function productsPublishing() {
  ///////////////////////////PRODUCTS///////////////////////////
  let arr_notes = await Note.find({ // Array of Notes
    'entities.products': {
      $elemMatch: {
        'is_approve': true,
        'status': 'completed luis training'
      }
    }
  }, {
    "entities.products.$": 1
  }, {
    lean: true
  });

  var arr_products; // Array of Products
  ///////////////////////////TRAINING LUIS///////////////////////////

  //To check if Array of Notes is empty then return with 'No data found' message
  if (arr_notes.length == 0) {
    console.log('MONGO - No Product List Records');
    return;
  }

  //Else proceed further
  console.log(`MONGO - ${arr_notes.length} Product List fetched for Publishing LUIS`);

  /*#####################UPDATING STATUS OF PRODUCT LIST#####################*/
  console.log('MONGO - Updating status of Product List - Published');

  arr_notes.forEach(async (note) => {
    arr_products = note["entities"]["products"];

    arr_products.forEach(async (product, index) => {
      if (index == 0) {
        console.log(`Updating arr_products`);
      }

      const id = product["_id"];
      const updateOps = {
        "entities.products.$.status": "published"
      };

      //Update the note with 'published' status using ObjectId
      await Note.updateOne({
        "entities.products._id": id
      }, {
        $set: updateOps
      });

      console.log(`Mongo - Updated product : ${id} successfully`);
    }); //End of arr_products.forEach
  }); //End of arr_notes.forEach
  /*#####################UPDATING STATUS OF PRODUCT LIST#####################*/

}

async function keyMessagesPublishing() {
  ///////////////////////////PRODUCTS///////////////////////////
  let arr_notes = await Note.find({ // Array of Notes
    'entities.keymessages': {
      $elemMatch: {
        'is_approve': true,
        'status': 'completed luis training'
      }
    }
  }, {
    "entities.keymessages.$": 1
  }, {
    lean: true
  });

  var arr_keymessages; // Array of keymessages
  ///////////////////////////TRAINING LUIS///////////////////////////

  //To check if Array of Notes is empty then return with 'No data found' message
  if (arr_notes.length == 0) {
    console.log('MONGO - No Key Message List Records');
    return;
  }

  //Else proceed further
  console.log(`MONGO - ${arr_notes.length} Key Message List fetched for Publishing LUIS`);

  /*#####################UPDATING STATUS OF Key Message LIST#####################*/
  console.log('MONGO - Updating status of Key Message List - Published');

  arr_notes.forEach(async (note) => {
    arr_keymessages = note["entities"]["keymessages"];

    arr_keymessages.forEach(async (product, index) => {
      if (index == 0) {
        console.log(`Updating arr_keymessages`);
      }

      const id = product["_id"];
      const updateOps = {
        "entities.keymessages.$.status": "published"
      };

      //Update the note with 'published' status using ObjectId
      await Note.updateOne({
        "entities.keymessages._id": id
      }, {
        $set: updateOps
      });

      console.log(`Mongo - Updated keymessage : ${id} successfully`);
    }); //End of arr_products.forEach
  }); //End of arr_notes.forEach
  /*#####################UPDATING STATUS OF PRODUCT LIST#####################*/

}


exports.publish_changes_for_luis = async (req, res, next) => {
  try {

    await productsPublishing();

    await keyMessagesPublishing();

    /**********************POST FOR TRAIN APPLICATION VERSION**********************/
    const post_options = {
      method: 'POST',
      uri: `${publish_wepApiUri}/publish`,
      headers: luis_wepApiHeaders,
      body: {
        "versionId": "0.1",
        "isStaging": false,
        "region": "westus"
      },
      json: true
    };

    await request(post_options)
      .then(function (resp) {
        console.log('POST - Published Changes successfully on LUIS');
      });

    res.status(201).json({
      success: true,
      message: "Published Changes successfully on LUIS"
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err
    });
  }
};