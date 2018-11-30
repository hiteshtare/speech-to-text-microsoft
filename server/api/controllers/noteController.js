const mongoose = require("mongoose");
const Note = require("../models/noteModel");
const request = require("request-promise")

var config = require('../../config');

const luis_config = config.luis_config;
const luis_wepApiUri = `https://westus.api.cognitive.microsoft.com/luis/api/v2.0/apps/${luis_config.appId}/versions/${luis_config.versionId}`;
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
async function getBrandsFromPhraseList() {
  const get_options = {
    method: 'GET',
    uri: `${luis_wepApiUri}/phraselists/1460088`,
    headers: luis_wepApiHeaders
  };

  const brand_PhraseList = await request(get_options)
    .then(function (resp) {
      console.log('GET - Brands Array fetched');
      let json_resp = JSON.parse(resp);
      return json_resp["phrases"];
    });

  return brand_PhraseList;
}

//PUT Request for updating the string inside PhraseList associated with id (1460088) for Brands
async function updateBrandsFromPhraseList(p_brand_PhraseList) {
  const put_options = {
    method: 'PUT',
    uri: `${luis_wepApiUri}/phraselists/1460088`,
    headers: luis_wepApiHeaders,
    body: {
      "id": 1460088,
      "name": "brand",
      "phrases": p_brand_PhraseList,
      "isExchangeable": true,
      "isActive": true
    },
    json: true
  };

  await request(put_options)
    .then(async function (resp) {
      console.log('PUT - Brands Array updated');

      await trainLuisApp();
    });
}

//POST Request for training luis application
async function trainLuisApp(p_brand_PhraseList) {
  const post_options = {
    method: 'POST',
    uri: `${luis_wepApiUri}/train`,
    headers: luis_wepApiHeaders,
    body: {
      "id": 1460088,
      "name": "brand",
      "phrases": p_brand_PhraseList,
      "isExchangeable": true,
      "isActive": true
    },
    json: true
  };

  await request(post_options)
    .then(function (resp) {
      console.log('POST - LUIS Trained successfully for new changes');
    });
}

exports.train_luis_for_entities = async (req, res, next) => {
  ///////////////////////////PRODUCTS///////////////////////////
  try {
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
      res.status(200).json({
        success: true,
        message: "No data found for LUIS trainig"
      });
      return;
    }

    //Else proceed further
    console.log(`MONGO - ${arr_notes.length} Product List fetched for Training`);

    /**********************GET FOR PHRASE LIST FEATURE ARRAY**********************/
    let brand_PhraseList = await getBrandsFromPhraseList();
    /**********************GET FOR PHRASE LIST FEATURE ARRAY**********************/

    //Iterate over each note
    arr_notes.forEach((note) => {
      arr_products = note["entities"]["products"]; // Initialise Array of Products

      //Iterate over each product inside entities
      arr_products.forEach((product, index) => {
        if (index == 0) {
          console.log(`brand_PhraseList`);
        }
        //Replace 'before' sub-string inside string with empty
        brand_PhraseList = brand_PhraseList.replace(`,${product["before"]}`, '');
        //Concatinate the string with 'after' sub-string
        brand_PhraseList += ',' + product["after"];
        console.log(`Updated : From ${product["before"]} to ${product["after"]}`);
      }); //End of arr_products.forEach
    }); //End of arr_notes.forEach

    /**********************UPDATE FOR PHRASE LIST FEATURE ARRAY**********************/
    await updateBrandsFromPhraseList(brand_PhraseList);
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

  // ///////////////////////////KEYMESSAGES///////////////////////////
  // Note
  //   .find({
  //     'entities.keymessages': {
  //       $elemMatch: {
  //         'is_approve': true,
  //         'status': 'pending for luis training'
  //       }
  //     }
  //   }, {
  //     "entities.keymessages.$": 1
  //   })
  //   .then(notes => {

  //   })
  //   .catch(err => {
  //     console.log(err);
  //     res.status(500).json({
  //       success: false,
  //       message: err
  //     });
  //   });
  // ///////////////////////////FOLLOWUPS///////////////////////////
  // Note
  //   .find({
  //     'entities.followups': {
  //       $elemMatch: {
  //         'is_approve': true,
  //         'status': 'pending for luis training'
  //       }
  //     }
  //   }, {
  //     "entities.followups.$": 1
  //   })
  //   .then(notes => {

  //   })
  //   .catch(err => {
  //     console.log(err);
  //     res.status(500).json({
  //       success: false,
  //       message: err
  //     });
  //   });
};