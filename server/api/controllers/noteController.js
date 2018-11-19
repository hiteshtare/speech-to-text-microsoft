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
      resp.status(200).json({
        success: true,
        message: 'List of notes',
        payload: notes
        //"status": "string",
      });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        success: false,
        message: err
        //"status": "string",
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
        //"status": "string",
      });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        success: false,
        message: err
        //"status": "string",
      });
    });
};

exports.notes_get_note = (req, res, next) => {
  const id = req.params.noteId;
  Note.findById(id)
    .then(note => {
      if (note) {
        resp.status(200).json({
          success: true,
          message: 'Note found for provided ID',
          payload: note
          //"status": "string",
        });
      } else {
        resp.status(404).json({
          success: false,
          message: "No valid entry found for provided ID"
          //"status": "string",
        });
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        success: false,
        message: err
        //"status": "string",
      });
    });
};

exports.notes_updates_note = (req, res, next) => {
  const id = req.params.noteId;
  Note.update({
      _id: id
    })
    .then(note => {
      res.status(200).json({
        success: true,
        message: "Note updated successfully",
        payload: note
        //"status": "string",
      });
    })
    .catch(err => {
      res.status(500).json({
        success: false,
        message: err
        //"status": "string",
      });
    });
};

exports.notes_deletes_note = (req, res, next) => {
  const id = req.params.noteId;
  Product.remove({
      _id: id
    })
    .exec()
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
        //"status": "string",
      });
    });
};