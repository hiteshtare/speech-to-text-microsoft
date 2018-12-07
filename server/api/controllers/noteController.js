const mongoose = require("mongoose");
const Note = require("../models/noteModel");
const request = require("request-promise");
const _ = require("lodash");

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
      let updated_note = await Note.updateOne({
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

//GET Request for fetching Closed List Entity By Model Id
async function getClosedListEntityByModel(p_model) {
  const get_options = {
    method: 'GET',
    uri: `${luis_wepApiUri}/closedlists/${p_model.id}`,
    headers: luis_wepApiHeaders
  };

  const closedListEntity = await request(get_options)
    .then(function (resp) {
      console.log(`GET - Closed List Entity fetched for ${p_model.name}`);
      let json_resp = JSON.parse(resp);
      return json_resp["subLists"];
    });

  return closedListEntity;
}

//PUT Request for updating Closed List Entity By Model Id
async function updateClosedListEntityByModel(p_model, p_closedListEntity) {
  const put_options = {
    method: 'PUT',
    uri: `${luis_wepApiUri}/closedlists/${p_model.id}`,
    headers: luis_wepApiHeaders,
    body: {
      "name": p_model.name,
      "subLists": p_closedListEntity,
      "roles": []
    },
    json: true
  };

  await request(put_options)
    .then(async function (resp) {
      console.log(`PUT - Closed List Entity updated for ${p_model.name}`);
    });
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

// To train products 
async function productsTraining() {
  let arr_notes = await Note.find({ // Array of Notes
    'entities.products.is_approve': true,
    'entities.products.status': 'pending for luis training'
  }).then((docs) => {
    docs.forEach(function (doc) {
      doc.entities["products"] = doc.entities["products"].filter(function (product) {
        return product.is_approve == true && product.status == 'pending for luis training';
      });
    })
    return docs;
  });

  var arr_products; // Array of Products
  ///////////////////////////TRAINING LUIS///////////////////////////

  //To check if Array of Notes is empty then return with 'No data found' message
  if (arr_notes.length == 0) {
    console.log('MONGO - No Notes for Training');
    return;
  }

  //Else proceed further
  console.log(`MONGO - ${arr_notes.length} Notes fetched for Training`);

  /**********************GET FOR CLOSE LIST ENTITY ARRAY**********************/
  let model_brand = {
    id: '0236cbdd-4d36-4b89-8bfd-a57f935d5dd4',
    name: 'brand',
    has_change: false
  };

  let closedListEntity_brand = await getClosedListEntityByModel(model_brand);
  console.log(`COUNT - ${closedListEntity_brand.length} Closed List Entity for ${model_brand.name}`);
  /**********************GET FOR CLOSE LIST ENTITY ARRAY**********************/

  //Iterate over each note
  arr_notes.forEach((note) => {
    arr_products = note["entities"]["products"]; // Initialise Array of Products

    //Iterate over each product inside entities
    arr_products.forEach((product, index) => {
      if (index == 0) {
        console.log(`LUIS - ${arr_products.length} Products are added for Training`);
      }

      if (product["before"] != null && product["after"] == null) { //For Removal
        _.remove(closedListEntity_brand, {
          canonicalForm: product["before"]
        });
        console.log(`Removed : ${product["before"]}`);
      } else if (product["before"] == null && product["after"] != null) { //For Addition
        closedListEntity_brand.push({
          "canonicalForm": product["after"],
          "list": []
        });
        console.log(`Added : ${product["after"]}`);
      }

      model_brand.has_change = true;
    }); //End of arr_products.forEach
  }); //End of arr_notes.forEach

  /**********************UPDATE FOR CLOSE LIST ENTITY ARRAY**********************/
  if (model_brand.has_change) {
    await updateClosedListEntityByModel(model_brand, closedListEntity_brand);
  }
  /**********************UPDATE FOR CLOSE LIST ENTITY ARRAY**********************/

  /*#####################UPDATING STATUS OF PRODUCT LIST#####################*/
  console.log('MONGO - Updating status of Products Trained');

  arr_notes.forEach(async (note) => {
    arr_products = note["entities"]["products"];

    arr_products.forEach(async (product, index) => {
      if (index == 0) {
        console.log(`MONGO - ${arr_products.length} Products are updated`);
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
    'entities.keymessages.is_approve': true,
    'entities.keymessages.status': 'pending for luis training'
  }).then((docs) => {
    docs.forEach(function (doc) {
      doc.entities["keymessages"] = doc.entities["keymessages"].filter(function (keymessage) {
        return keymessage.is_approve == true && keymessage.status == 'pending for luis training';
      });
    })
    return docs;
  });

  var arr_keymessages; // Array of KeyMessages
  ///////////////////////////TRAINING LUIS///////////////////////////

  //To check if Array of Notes is empty then return with 'No data found' message
  if (arr_notes.length == 0) {
    console.log('MONGO - No Notes for Training');
    return;
  }

  //Else proceed further
  console.log(`MONGO - ${arr_notes.length} Notes fetched for Training`);

  /**********************GET FOR CLOSE LIST ENTITY ARRAY**********************/
  let model_keymessage = {
    id: '9f4ff2a5-edd0-4386-8f54-490941b6d0b1',
    name: 'keymessages',
    has_change: false
  };

  let closedListEntity_keymessage = await getClosedListEntityByModel(model_keymessage);
  console.log(`COUNT - ${closedListEntity_keymessage.length} Closed List Entity for ${model_keymessage.name}`);
  /**********************GET FOR CLOSE LIST ENTITY ARRAY**********************/

  //Iterate over each note
  arr_notes.forEach((note) => {
    arr_keymessages = note["entities"]["keymessages"]; // Initialise Array of Key Messages
    //Iterate over each keymessage inside entities
    arr_keymessages.forEach((keymessage, index) => {
      if (index == 0) {
        console.log(`LUIS - ${arr_keymessages.length} Key Messages are added for Training`);
      }

      if (keymessage["before"] != null && keymessage["after"] == null) { //For Removal
        _.remove(closedListEntity_keymessage, {
          canonicalForm: keymessage["before"]
        });
        console.log(`Removed : ${keymessage["before"]}`);
      } else if (keymessage["before"] == null && keymessage["after"] != null) { //For Addition
        closedListEntity_keymessage.push({
          "canonicalForm": keymessage["after"],
          "list": []
        });
        console.log(`Added : ${keymessage["after"]}`);
      }

      model_keymessage.has_change = true;
    }); //End of arr_keymessages.forEach
  }); //End of arr_notes.forEach

  /**********************UPDATE FOR CLOSE LIST ENTITY ARRAY**********************/
  if (model_keymessage.has_change) {
    await updateClosedListEntityByModel(model_keymessage, closedListEntity_keymessage);
  }
  /**********************UPDATE FOR CLOSE LIST ENTITY ARRAY**********************/

  /*#####################UPDATING STATUS OF PRODUCT LIST#####################*/
  console.log('MONGO - Updating status of Key Messages Trained');

  arr_notes.forEach(async (note) => {
    arr_keymessages = note["entities"]["keymessages"];

    arr_keymessages.forEach(async (product, index) => {
      if (index == 0) {
        console.log(`LUIS - ${arr_keymessages.length} Key Messages are updated`);
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

    console.log('-----------------ProductsTraining-----------------');
    await productsTraining();
    console.log('-----------------KeyMessagesTraining-----------------');
    await keyMessagesTraining();
    console.log('-----------------TrainLuisApp-----------------');
    await trainLuisApp();

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
    'entities.products.is_approve': true,
    'entities.products.status': 'completed luis training'
  }).then((docs) => {
    docs.forEach(function (doc) {
      doc.entities["products"] = doc.entities["products"].filter(function (product) {
        return product.is_approve == true && product.status == 'completed luis training';
      });
    })
    return docs;
  });

  var arr_products; // Array of Products
  ///////////////////////////TRAINING LUIS///////////////////////////

  //To check if Array of Notes is empty then return with 'No data found' message
  if (arr_notes.length == 0) {
    console.log('MONGO - No Product for Publishing');
    return;
  }

  //Else proceed further
  console.log(`MONGO - ${arr_notes.length} Products fetched for Publishing`);

  /*#####################UPDATING STATUS OF PRODUCT LIST#####################*/
  console.log('MONGO - Updating status of Products Published');

  arr_notes.forEach(async (note) => {
    arr_products = note["entities"]["products"];

    arr_products.forEach(async (product, index) => {
      if (index == 0) {
        console.log(`LUIS - ${arr_products.length} Products are updated`);
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
    'entities.keymessages.is_approve': true,
    'entities.keymessages.status': 'completed luis training'
  }).then((docs) => {
    docs.forEach(function (doc) {
      doc.entities["keymessages"] = doc.entities["keymessages"].filter(function (keymessage) {
        return keymessage.is_approve == true && keymessage.status == 'completed luis training';
      });
    })
    return docs;
  });

  var arr_keymessages; // Array of keymessages
  ///////////////////////////TRAINING LUIS///////////////////////////

  //To check if Array of Notes is empty then return with 'No data found' message
  if (arr_notes.length == 0) {
    console.log('MONGO - No Key Message for Publishing');
    return;
  }

  //Else proceed further
  console.log(`MONGO - ${arr_notes.length} Key Messages fetched for Publishing LUIS`);

  /*#####################UPDATING STATUS OF Key Message LIST#####################*/
  console.log('MONGO - Updating status of Key Messages Published');

  arr_notes.forEach(async (note) => {
    arr_keymessages = note["entities"]["keymessages"];

    arr_keymessages.forEach(async (product, index) => {
      if (index == 0) {
        console.log(`LUIS - ${arr_keymessages.length} Key Messages are updated`);
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

    console.log('+++++++++++++++++ProductsPublishing+++++++++++++++++');
    await productsPublishing();
    console.log('+++++++++++++++++KeyMessagesPublishing+++++++++++++++++');
    await keyMessagesPublishing();
    console.log('+++++++++++++++++PublishingChanges+++++++++++++++++');
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
        console.log('POST - Changes successfully Published for LUIS');
      });

    res.status(201).json({
      success: true,
      message: "Published Changes successfully Published for LUIS"
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err
    });
  }
};