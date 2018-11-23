const mongoose = require("mongoose");
const Note = require("../models/noteModel");

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
    })
    .then(notes => {
      ///////////////////////////TRAINING LUIS///////////////////////////

      ///////////////////////////TRAINING LUIS///////////////////////////

      ///////////////////////////UPDATING STATUS///////////////////////////
      updateOps = {
        "entities.products.$.status": 'completed luis traning'
      };

      Note.update({
          "entities.products._id": ObjectId("5bf52eec1af1ab1a49aa0b9b")
        }, {
          $set: updateOps
        })
        .then(note => {
          res.status(200).json({
            success: true,
            message: "Products : LUIS training completed successfully",
            payload: note

          });
        })
        .catch(err => {
          res.status(500).json({
            success: false,
            message: err

          });
        });
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