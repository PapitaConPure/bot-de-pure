const Mongoose = require('mongoose');

/**Describe una encuesta en progreso*/
const PollSchema = new Mongoose.Schema({
    id: { type: String, required: true },
    pollChannelId: { type: String, required: true },
    resultsChannelId: { type: String, required: true },
    end: { type: Number, required: true },
    anon: { type: Boolean, default: false },
    locale: { type: String, required: true },
    question: { type: String, required: true },
    answers: {
        type: Array,
        required: true,
        length: { minlength: 2, maxlength: 18 },
    },
    votes: { type: Map, default: () => new Map() },
});

module.exports = Mongoose.model('Poll', PollSchema);
