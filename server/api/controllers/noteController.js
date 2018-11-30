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

exports.train_luis_for_entities = (req, res, next) => {
  ///////////////////////////PRODUCTS///////////////////////////
  Note
    .find({
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
    })
    .then((notes) => {
      var arr_notes = notes; // Array of Notes
      var arr_products; // Array of Notes
      ///////////////////////////TRAINING LUIS///////////////////////////

      if (arr_notes.length == 0) {
        console.log('MONGO - No Product List Records');
        res.status(200).json({
          success: true,
          message: "No data found for LUIS trainig"
        });
        return;
      }
      console.log(`MONGO - ${arr_notes.length} Product List fetched for Training`);
      /**********************GET FOR PHRASE LIST FEATURE ARRAY**********************/
      const get_options = {
        method: 'GET',
        uri: `${luis_wepApiUri}/phraselists/1460088`,
        headers: luis_wepApiHeaders
      };

      request(get_options)
        .then(function (resp) {
          console.log('GET - Brands Array fetched');
          let json_resp = JSON.parse(resp);
          let brand_PhraseList = json_resp["phrases"];

          arr_notes.forEach((note) => {
            arr_products = note["entities"]["products"];

            arr_products.forEach((product, index) => {
              if (index == 0) {
                console.log(`brand_PhraseList`);
              }
              brand_PhraseList = brand_PhraseList.replace(`,${product["before"]}`, '');
              brand_PhraseList += ',' + product["after"];
              console.log(`Updated : From ${product["before"]} to ${product["after"]}`);
            });
          });

          /**********************PUT FOR PHRASE LIST FEATURE ARRAY**********************/
          const put_options = {
            method: 'PUT',
            uri: `${luis_wepApiUri}/phraselists/1460088`,
            headers: luis_wepApiHeaders,
            body: {
              "id": 1460088,
              "name": "brand",
              "phrases": brand_PhraseList,
              "isExchangeable": true,
              "isActive": true
            },
            json: true
          };

          request(put_options)
            .then(function (resp) {
              console.log('PUT - Brands Array updated');

              /**********************POST FOR TRAIN APPLICATION VERSION**********************/
              const post_options = {
                method: 'POST',
                uri: `${luis_wepApiUri}/train`,
                headers: luis_wepApiHeaders,
                body: {
                  "id": 1460088,
                  "name": "brand",
                  "phrases": brand_PhraseList,
                  "isExchangeable": true,
                  "isActive": true
                },
                json: true
              };

              request(post_options)
                .then(function (resp) {
                  console.log('POST - LUIS Trained successfully for new changes');

                  /*#####################UPDATING STATUS OF PRODUCT LIST#####################*/
                  console.log('MONGO - Updating status of Product List Trained');

                  arr_notes.forEach((note) => {
                    arr_products = note["entities"]["products"];

                    arr_products.forEach((product, index) => {
                      if (index == 0) {
                        console.log(`Updating arr_products`);
                      }

                      const id = product["_id"];
                      const updateOps = {
                        "entities.products.$.status": "completed luis training"
                      };

                      Note.updateOne({
                          "entities.products._id": id
                        }, {
                          $set: updateOps
                        })
                        .then(note => {
                          console.log(`Mongo - Updated product : ${id} successfully`);
                        })
                        .catch(err => {
                          res.status(500).json({
                            success: false,
                            message: err
                          });
                        });
                    });

                  });
                  /*#####################UPDATING STATUS OF PRODUCT LIST#####################*/

                  res.status(200).json({
                    success: true,
                    message: "LUIS Trained successfully for new changes"
                  });
                })
                .catch(function (err) {
                  // Deal with the error
                });
              /**********************POST FOR TRAIN APPLICATION VERSION**********************/
            })
            .catch(function (err) {
              // Deal with the error
            });
          /**********************PUT FOR PHRASE LIST FEATURE ARRAY**********************/
        })
        .catch(function (err) {
          // Deal with the error
        });
      /**********************GET FOR PHRASE LIST FEATURE ARRAY**********************/

      ///////////////////////////TRAINING LUIS///////////////////////////

      ///////////////////////////UPDATING STATUS///////////////////////////
      // updateOps = {
      //   "entities.products.$.status": 'completed luis traning'
      // };

      // Note.update({
      //     "entities.products._id": ObjectId("5bf52eec1af1ab1a49aa0b9b")
      //   }, {
      //     $set: updateOps
      //   })
      //   .then(note => {
      //     res.status(200).json({
      //       success: true,
      //       message: "Products : LUIS training completed successfully",
      //       payload: note

      //     });
      //   })
      //   .catch(err => {
      //     res.status(500).json({
      //       success: false,
      //       message: err

      //     });
      //   });
      ///////////////////////////UPDATING STATUS///////////////////////////
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        success: false,
        message: err
      });
    });
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

exports.publish_changes_for_luis = async (req, res, next) => {
  try {
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

    request(post_options)
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