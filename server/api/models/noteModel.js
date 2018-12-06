var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var noteSchema = new Schema({
  _id: mongoose.Schema.Types.ObjectId,
  machine_transcript: String,
  transcripts: [{
    before: String,
    after: String,
    is_approve: {
      type: Boolean,
      value: false
    },
    status: String,
  }],
  is_transcript_approve: {
    type: Boolean,
    value: false
  },
  entities: {
    products: [{
      before: String,
      after: String,
      is_approve: {
        type: Boolean,
        value: false
      },
      status: String,
    }],
    keymessages: [{
      before: String,
      after: String,
      is_approve: {
        type: Boolean,
        value: false
      },
      status: String,
    }],
    followups: [{
      before: String,
      after: String,
      is_approve: {
        type: Boolean,
        value: false
      },
      status: String,
    }]
  },
  is_active: {
    type: Boolean,
    value: true
  },
  created_at: {
    date: {
      type: Date,
      default: Date.now
    }
  },
  updated_at: String,
  deleted_at: String
});

module.exports = mongoose.model('Note', noteSchema);