import Mongoose from 'mongoose';

const PollSchema = new Mongoose.Schema({
	id: { type: String, required: true },
	pollChannelId: { type: String, required: true },
	resultsChannelId: { type: String, required: true },
	end: { type: Number, required: true },
	anon: { type: Boolean, default: false },
	locale: { type: String, required: true },
	question: { type: String, required: true },
	answers: {
		type: [String],
		required: true,
		length: { minlength: 2, maxlength: 18 },
	},
	votes: { type: Map, default: () => new Map() },
});

/**
 * @description Describe una encuesta en progreso
 * @deprecated
 */
const Poll = Mongoose.model('Poll', PollSchema);

export default Poll;
