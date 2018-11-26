const mongoose = require("mongoose");
const Note = require("../models/noteModel");
const request = require("request-promise")

var config = require('../../config');

const luis_config = config.luis_config;
const luis_wepApiUri = `https://westus.api.cognitive.microsoft.com/luis/api/v2.0/apps/${luis_config.appId}/versions/${luis_config.versionId}`;
const luis_wepApiHeaders = {
  'Ocp-Apim-Subscription-Key': luis_config.subscriptionKey
};

exports.notes_get_all = (req, res, next) => {
  Note
    .find()
    .sort({ //sorting the fields
      updated_at: -1,
      created_at: -1
    })
    .then(notes => {
      res.status(200).json({
        success: true,
        message: 'List of Notes fetched successfully',
        payload: notes
      });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        success: false,
        message: err
      });
    });
};

exports.notes_create_note = (req, res, next) => {
  const note = new Note({
    _id: new mongoose.Types.ObjectId(),
    machine_transcript: req.body.machine_transcript,
    transcripts: req.body.transcripts,
    is_transcript_approve: req.body.is_transcript_approve,
    entities: req.body.entities
  });

  note
    .save()
    .then(result => {
      console.log(result);
      res.status(201).json({
        success: true,
        message: 'Note created successfully',
        payload: result
      });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        success: false,
        message: err
      });
    });
};

exports.notes_get_note = (req, res, next) => {
  const id = req.params.noteId;
  Note.findById(id)
    .then(note => {
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
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        success: false,
        message: err
      });
    });
};

exports.notes_updates_note = (req, res, next) => {
  const id = req.params.noteId;
  const updateOps = {
    transcripts: req.body.transcripts,
    is_transcript_approve: req.body.is_transcript_approve,
    entities: req.body.entities
  };

  Note.findById(id)
    .then(note => {
      if (note) {
        Note.update({
            _id: id
          }, {
            $set: updateOps
          })
          .then(note => {
            res.status(200).json({
              success: true,
              message: "Note updated successfully",
              payload: note

            });
          })
          .catch(err => {
            res.status(500).json({
              success: false,
              message: err

            });
          });
      } else {
        res.status(404).json({
          success: true,
          message: "No valid entry found for provided noteId"

        });
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        success: false,
        message: err
      });
    });
};

exports.notes_deletes_note = (req, res, next) => {
  const id = req.params.noteId;

  Note.findById(id)
    .then(note => {
      if (note) {
        Note.remove({
            _id: id
          })
          .then(result => {
            res.status(200).json({
              success: true,
              message: "Note deleted successfully",
              payload: id
            });
          })
          .catch(err => {
            res.status(500).json({
              success: false,
              message: err

            });
          });
      } else {
        res.status(404).json({
          success: true,
          message: "No valid entry found for provided noteId"

        });
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        success: false,
        message: err
      });
    });
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
      console.log('MONGO - Product List fetched for Training');
      var arr_notes = notes; // Array of Notes
      ///////////////////////////TRAINING LUIS///////////////////////////

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
            let arr_products = note["entities"]["products"];

            arr_products.forEach((product, index) => {
              if (index == 0) {
                console.log(`brand_PhraseList`);
              }
              brand_PhraseList = brand_PhraseList.replace(`${product["before"]}`, '');
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