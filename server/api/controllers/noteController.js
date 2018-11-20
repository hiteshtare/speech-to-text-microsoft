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
    is_transcript_approve: req.body.is_transcript_approve
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